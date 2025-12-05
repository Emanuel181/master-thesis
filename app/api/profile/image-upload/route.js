import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPresignedUploadUrl } from "@/lib/s3";

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
    const { s3Key, contentType } = body;

    if (!s3Key || !contentType) {
      return NextResponse.json(
        { error: "s3Key and contentType are required" },
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
