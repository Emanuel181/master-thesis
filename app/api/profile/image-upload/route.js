import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPresignedUploadUrl } from "@/lib/s3";
import { rateLimit } from "@/lib/rate-limit";

// Security constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_KEY_LENGTH = 500;

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting - 10 image uploads per hour
    const rl = rateLimit({
      key: `profile:image-upload:${session.user.id}`,
      limit: 10,
      windowMs: 60 * 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { s3Key, contentType } = body;

    if (!s3Key || !contentType) {
      return NextResponse.json(
        { error: "s3Key and contentType are required" },
        { status: 400 }
      );
    }

    // SECURITY: Validate s3Key length
    if (typeof s3Key !== 'string' || s3Key.length > MAX_KEY_LENGTH) {
      return NextResponse.json(
        { error: "Invalid s3Key" },
        { status: 400 }
      );
    }

    // SECURITY: Validate contentType is an allowed image type
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type. Only JPEG, PNG, GIF, and WebP images are allowed" },
        { status: 400 }
      );
    }

    // SECURITY: Ensure s3Key belongs to the current user
    const expectedPrefix = `users/${session.user.id}/`;
    if (!s3Key.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: "Invalid s3Key path" },
        { status: 403 }
      );
    }

    // SECURITY: Prevent path traversal
    if (s3Key.includes('..') || s3Key.includes('//')) {
      return NextResponse.json(
        { error: "Invalid s3Key path" },
        { status: 400 }
      );
    }

    // Generate presigned URL for upload
    const uploadUrl = await getPresignedUploadUrl(s3Key, contentType, 3600); // 1 hour expiration

    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
