import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPresignedUploadUrl, generateProfileImageS3Key } from "@/lib/s3-env";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders, getClientIp, isSameOrigin, readJsonBody, validateS3Key } from "@/lib/api-security";
import { requireProductionMode } from "@/lib/api-middleware";
import { isDemoRequest } from "@/lib/demo-mode";

// Security constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILENAME_LENGTH = 255;

function sanitizeFileName(fileName) {
  if (typeof fileName !== 'string') return 'image';
  const trimmed = fileName.trim().slice(0, MAX_FILENAME_LENGTH);
  // keep alnum + dot + dash + underscore
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image';
}

function pickExtension(contentType) {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

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

    const clientIp = getClientIp(request);
    const rl = await rateLimit({
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

    const { contentType, fileName, fileSize } = parsed.body ?? {};

    if (!contentType) {
      return NextResponse.json(
        { error: "contentType is required" },
        { status: 400, headers: securityHeaders }
      );
    }

    if (typeof contentType !== 'string' || !ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type. Only JPEG, PNG, GIF, and WebP images are allowed" },
        { status: 400, headers: securityHeaders }
      );
    }

    if (fileSize !== undefined) {
      const n = Number(fileSize);
      if (!Number.isFinite(n) || n <= 0 || n > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Image size must be between 1 byte and ${MAX_IMAGE_SIZE_BYTES} bytes` },
          { status: 400, headers: securityHeaders }
        );
      }
    }

    // Server-minted, user-scoped key (client doesn't get to pick paths)
    const safeName = sanitizeFileName(fileName);
    const ext = pickExtension(contentType);

    // Environment-aware S3 key generation and upload
    const env = isDemoRequest(request) ? 'demo' : 'prod';
    const s3Key = generateProfileImageS3Key(env, session.user.id, safeName, ext);

    const expectedPrefix = env === 'demo' ? `demo/users/${session.user.id}/` : `users/${session.user.id}/`;
    const s3KeyValidation = validateS3Key(s3Key, { requiredPrefix: expectedPrefix, maxLen: 500 });
    if (!s3KeyValidation.ok) {
      const status = s3KeyValidation.error === 'Access denied' ? 403 : 400;
      return NextResponse.json(
        { error: s3KeyValidation.error },
        { status, headers: securityHeaders }
      );
    }

    const uploadUrl = await getPresignedUploadUrl(env, s3Key, contentType, 3600);

    return NextResponse.json({ uploadUrl, s3Key }, { headers: securityHeaders });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500, headers: securityHeaders }
    );
  }
}
