import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// Security constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max
const MAX_FILENAME_LENGTH = 255;
const MAX_S3_KEY_LENGTH = 1024;

// Input validation schema
const confirmUploadSchema = z.object({
    s3Key: z.string()
        .min(1, 's3Key is required')
        .max(MAX_S3_KEY_LENGTH, `s3Key must be less than ${MAX_S3_KEY_LENGTH} characters`)
        .regex(/^users\/[^\/]+\/use-cases\/[^\/]+\/[^\/]+$/, 'Invalid s3Key format'),
    fileName: z.string()
        .min(1, 'fileName is required')
        .max(MAX_FILENAME_LENGTH, `fileName must be less than ${MAX_FILENAME_LENGTH} characters`),
    fileSize: z.number()
        .int()
        .positive('fileSize must be positive')
        .max(MAX_FILE_SIZE, `fileSize must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`),
    useCaseId: z.string()
        .min(1, 'useCaseId is required')
        .max(50, 'useCaseId must be less than 50 characters'),
    folderId: z.string()
        .max(50, 'folderId must be less than 50 characters')
        .optional()
        .nullable(),
});

// POST - Confirm PDF upload (save to database after successful S3 upload)
export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting - 30 confirmations per hour
    const rl = rateLimit({
      key: `pdfs:confirm:${session.user.id}`,
      limit: 30,
      windowMs: 60 * 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt },
        { status: 429 }
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

    // Validate input with Zod
    const validationResult = confirmUploadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { s3Key, fileName, fileSize, useCaseId, folderId } = validationResult.data;

    // SECURITY: Verify the s3Key contains the correct userId to prevent path traversal
    const expectedKeyPrefix = `users/${user.id}/use-cases/`;
    if (!s3Key.startsWith(expectedKeyPrefix)) {
      return NextResponse.json(
        { error: "Invalid s3Key: access denied" },
        { status: 403 }
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

    // If folderId is provided, verify it exists and belongs to the same use case
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          useCaseId,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
      }
    }

    // Get the max order in the target location
    const maxOrderResult = await prisma.pdf.aggregate({
      where: {
        useCaseId,
        folderId: folderId || null,
      },
      _max: { order: true },
    });

    const maxFolderOrderResult = await prisma.folder.aggregate({
      where: {
        useCaseId,
        parentId: folderId || null,
      },
      _max: { order: true },
    });

    const newOrder = Math.max(
      (maxOrderResult._max.order || 0) + 1,
      (maxFolderOrderResult._max.order || 0) + 1
    );

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
        folderId: folderId || null,
        order: newOrder,
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
