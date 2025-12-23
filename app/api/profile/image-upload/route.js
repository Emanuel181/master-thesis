import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPresignedUploadUrl } from "@/lib/s3";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders, getClientIp, isSameOrigin, readJsonBody, validateS3Key } from "@/lib/api-security";

// Security constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request) {
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

    const clientIp = getClientIp(request);
    const rl = rateLimit({
      key: `profile:image-upload:${session.user.id}:${clientIp}`,
      limit: 10,
      windowMs: 60 * 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt },
        { status: 429, headers: securityHeaders }
      );
    }

    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: securityHeaders }
      );
    }

    const { s3Key, contentType } = parsed.body ?? {};

    if (!s3Key || !contentType) {
      return NextResponse.json(
        { error: "s3Key and contentType are required" },
        { status: 400, headers: securityHeaders }
      );
    }

    if (typeof contentType !== 'string' || !ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type. Only JPEG, PNG, GIF, and WebP images are allowed" },
        { status: 400, headers: securityHeaders }
      );
    }

    const expectedPrefix = `users/${session.user.id}/`;
    const s3KeyValidation = validateS3Key(s3Key, { requiredPrefix: expectedPrefix, maxLen: 500 });
    if (!s3KeyValidation.ok) {
      const status = s3KeyValidation.error === 'Access denied' ? 403 : 400;
      return NextResponse.json(
        { error: s3KeyValidation.error },
        { status, headers: securityHeaders }
      );
    }

    const uploadUrl = await getPresignedUploadUrl(s3Key, contentType, 3600);

    return NextResponse.json({ uploadUrl }, { headers: securityHeaders });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500, headers: securityHeaders }
    );
  }
}
