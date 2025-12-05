import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPresignedDownloadUrl } from "@/lib/s3";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    // Generate presigned URL for download (long expiration for profile images)
    const downloadUrl = await getPresignedDownloadUrl(s3Key, 31536000); // 1 year expiration

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
