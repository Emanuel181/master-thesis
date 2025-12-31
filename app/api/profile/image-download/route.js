import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPresignedDownloadUrl } from "@/lib/s3-env";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders, getClientIp, isSameOrigin, readJsonBody, validateS3Key } from "@/lib/api-security";
import { z } from "zod";
import { requireProductionMode } from "@/lib/api-middleware";
import { isDemoRequest } from "@/lib/demo-mode";

const bodySchema = z.object({
  s3Key: z.string().min(1).max(500),
}).strict();

export async function POST(request) {
  const demoBlock = requireProductionMode(request);
  if (demoBlock) return demoBlock;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: securityHeaders }
      );
    }

    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: securityHeaders }
      );
    }

    // Rate limiting - 60 downloads per hour
    const clientIp = getClientIp(request);
    const rl = await rateLimit({
      key: `profile:image-download:${session.user.id}:${clientIp}`,
      limit: 60,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAt: rl.resetAt },
        { status: 429, headers: securityHeaders }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: securityHeaders }
      );
    }

    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: securityHeaders }
      );
    }

    const validation = bodySchema.safeParse(parsed.body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400, headers: securityHeaders }
      );
    }

    const { s3Key } = validation.data;

    // Environment-aware prefix validation
    const env = isDemoRequest(request) ? 'demo' : 'prod';
    const expectedPrefix = env === 'demo' 
      ? `demo/users/${user.id}/profile-images/`
      : `users/${user.id}/profile-images/`;
    const s3KeyValidation = validateS3Key(s3Key, { requiredPrefix: expectedPrefix, maxLen: 500 });
    if (!s3KeyValidation.ok) {
      const status = s3KeyValidation.error === 'Access denied' ? 403 : 400;
      return NextResponse.json(
        { error: s3KeyValidation.error },
        { status, headers: securityHeaders }
      );
    }

    const downloadUrl = await getPresignedDownloadUrl(env, s3Key, 3600);

    return NextResponse.json({ downloadUrl }, { headers: securityHeaders });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500, headers: securityHeaders }
    );
  }
}
