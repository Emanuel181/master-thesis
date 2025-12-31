import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { getPresignedDownloadUrl } from "@/lib/s3-env";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { isSameOrigin, readJsonBody, securityHeaders, validateS3Key } from "@/lib/api-security";
import { requireProductionMode } from "@/lib/api-middleware";
import { isDemoRequest } from "@/lib/demo-mode";

// Security constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max
const MAX_FILENAME_LENGTH = 255;
const MAX_S3_KEY_LENGTH = 1024;

// CUID validation pattern (starts with 'c', 25 chars, lowercase alphanumeric)
const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format');

// Input validation schema
const confirmUploadSchema = z.object({
    s3Key: z.string()
        .min(1, 's3Key is required')
        .max(MAX_S3_KEY_LENGTH, `s3Key must be less than ${MAX_S3_KEY_LENGTH} characters`)
        .regex(/^(demo\/)?users\/[^/]+\/use-cases\/[^/]+\/[^/]+$/, 'Invalid s3Key format'),
    fileName: z.string()
        .min(1, 'fileName is required')
        .max(MAX_FILENAME_LENGTH, `fileName must be less than ${MAX_FILENAME_LENGTH} characters`)
        .refine((n) => n.toLowerCase().endsWith('.pdf'), 'Only PDF files are allowed'),
    fileSize: z.number()
        .finite()
        .int()
        .positive('fileSize must be positive')
        .max(MAX_FILE_SIZE, `fileSize must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`),
    useCaseId: cuidSchema,
    folderId: cuidSchema
        .optional()
        .nullable(),
});

function formatZodErrors(zodError) {
  const fieldErrors = {};
  for (const issue of zodError.issues || []) {
    const key = issue.path?.[0] ? String(issue.path[0]) : 'form';
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

// POST - Confirm PDF upload (save to database after successful S3 upload)
export async function POST(request) {
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const headers = { ...securityHeaders, 'x-request-id': requestId };
  const demoBlock = requireProductionMode(request, { requestId });
  if (demoBlock) return demoBlock;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401, headers }
      );
    }

    // CSRF protection for state-changing operations
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden', requestId }, { status: 403, headers });
    }

    // Rate limiting - 30 confirmations per hour
    const rl = await rateLimit({
      key: `pdfs:confirm:${session.user.id}`,
      limit: 30,
      windowMs: 60 * 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
        { status: 429, headers }
      );
    }

    // Ensure user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", requestId },
        { status: 404, headers }
      );
    }

    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return NextResponse.json({ error: 'Invalid JSON body', requestId }, { status: 400, headers });
    }

    // Validate input with Zod
    const validationResult = confirmUploadSchema.safeParse(parsed.body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: formatZodErrors(validationResult.error), requestId },
        { status: 400, headers }
      );
    }

    const { s3Key, fileName, fileSize, useCaseId, folderId } = validationResult.data;

    // Environment-aware s3Key validation
    const env = isDemoRequest(request) ? 'demo' : 'prod';
    const expectedPrefix = env === 'demo'
      ? `demo/users/${user.id}/use-cases/`
      : `users/${user.id}/use-cases/`;
    const keyCheck = validateS3Key(s3Key, { requiredPrefix: expectedPrefix, maxLen: MAX_S3_KEY_LENGTH });
    if (!keyCheck.ok) {
      return NextResponse.json(
        { error: keyCheck.error || 'Invalid s3Key', requestId },
        { status: keyCheck.error === 'Access denied' ? 403 : 400, headers }
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
        { error: "Use case not found", requestId },
        { status: 404, headers }
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
          { error: "Folder not found", requestId },
          { status: 404, headers }
        );
      }
    }

    // Idempotency: if the same s3Key is confirmed twice, return existing record.
    const existing = await prisma.pdf.findFirst({
      where: {
        s3Key,
        useCase: { userId: user.id },
      },
    });

    if (existing) {
      const url = await getPresignedDownloadUrl(env, existing.s3Key);
      return NextResponse.json({ pdf: { ...existing, url }, requestId }, { status: 200, headers });
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

    // Generate a presigned URL for viewing the PDF (env-aware)
    const url = await getPresignedDownloadUrl(env, s3Key);

    // Save PDF record to database
    const pdf = await prisma.pdf.create({
      data: {
        // Keep a stable, non-sensitive placeholder in DB (schema requires url).
        // Real access is always via freshly-minted presigned URLs.
        url: '',
        title: fileName,
        size: fileSize,
        s3Key,
        useCaseId,
        folderId: folderId || null,
        order: newOrder,
      },
    });

    // Return fresh URL for immediate use in UI
    return NextResponse.json({ pdf: { ...pdf, url }, requestId }, { status: 201, headers });
  } catch (error) {
    console.error("Error confirming PDF upload:", error);
    return NextResponse.json(
      { error: "Failed to confirm upload", requestId },
      { status: 500, headers }
    );
  }
}
