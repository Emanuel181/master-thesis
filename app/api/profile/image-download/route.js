import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPresignedDownloadUrl } from "@/lib/s3";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { s3Key } = body;

    if (!s3Key) {
      return NextResponse.json(
        { error: "s3Key is required" },
        { status: 400 }
      );
    }

    // SECURITY: Validate that the S3 key belongs to this user's namespace
    // S3 keys follow the pattern: users/{userId}/...
    const expectedPrefix = `users/${user.id}/`;
    if (!s3Key.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Generate presigned URL for download (1 hour expiration for security)
    // SECURITY: Shorter expiration reduces exposure if URL is leaked
    const downloadUrl = await getPresignedDownloadUrl(s3Key, 3600); // 1 hour expiration

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
