import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { getPresignedUploadUrl, generateS3Key } from "@/lib/s3";

// POST - Get presigned URL for uploading a PDF
export async function POST(request) {
  try {
    const session = await getServerSession();

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
    const { fileName, fileSize, useCaseId } = body;

    if (!fileName || !fileSize || !useCaseId) {
      return NextResponse.json(
        { error: "fileName, fileSize, and useCaseId are required" },
        { status: 400 }
      );
    }

    // Verify the use case belongs to the user
    const useCase = await prisma.knowledgeBaseCategory.findFirst({
      where: {
        id: useCaseId,
        userId: user.id,
      },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: "Use case not found" },
        { status: 404 }
      );
    }

    // Generate S3 key and presigned URL
    const s3Key = generateS3Key(user.id, useCaseId, fileName);
    const uploadUrl = await getPresignedUploadUrl(s3Key, "application/pdf");

    return NextResponse.json({
      uploadUrl,
      s3Key,
      fileName,
      fileSize,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

