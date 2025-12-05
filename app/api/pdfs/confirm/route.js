import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getPresignedDownloadUrl } from "@/lib/s3";

// POST - Confirm PDF upload (save to database after successful S3 upload)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

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
    const { s3Key, fileName, fileSize, useCaseId } = body;

    if (!s3Key || !fileName || !fileSize || !useCaseId) {
      return NextResponse.json(
        { error: "s3Key, fileName, fileSize, and useCaseId are required" },
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

    // Generate a presigned URL for viewing the PDF
    const url = await getPresignedDownloadUrl(s3Key);

    // Save PDF record to database
    const pdf = await prisma.pdf.create({
      data: {
        url,
        title: fileName,
        size: fileSize,
        s3Key,
        useCaseId,
      },
    });

    return NextResponse.json({ pdf }, { status: 201 });
  } catch (error) {
    console.error("Error confirming PDF upload:", error);
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 }
    );
  }
}
