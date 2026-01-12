/**
 * PDFs API Routes
 * ================
 * 
 * POST - Generate presigned URL for PDF upload
 */

import prisma from '@/lib/prisma';
import { getPresignedUploadUrl, generateS3Key } from '@/lib/s3-env';
import { z } from 'zod';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';
import { isDemoRequest } from '@/lib/demo-mode';

// Security constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max
const ALLOWED_EXTENSIONS = ['.pdf'];
const ALLOWED_MIME_TYPE = 'application/pdf';
const MAX_FILENAME_LENGTH = 255;

/**
 * Upload schema for generating presigned URL
 */
const uploadSchema = z.object({
    fileName: z.string().min(1).max(MAX_FILENAME_LENGTH),
    fileSize: z.number().finite().positive().max(MAX_FILE_SIZE),
    useCaseId: z.string().min(1).max(50),
    folderId: z.string().max(50).nullable().optional(),
}).strict();

/**
 * POST /api/pdfs
 * Generate presigned URL for PDF upload
 */
export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        const { fileName, fileSize, useCaseId } = body;

        // Validate file extension
        const fileExtension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
            return errorResponse('Only PDF files are allowed', {
                status: 400,
                code: 'VALIDATION_ERROR',
                requestId,
            });
        }

        // Sanitize filename to prevent path traversal
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Verify the use case belongs to the user
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id: useCaseId,
                userId: user.id,
            },
        });

        if (!useCase) {
            return ApiErrors.notFound('Use case', requestId);
        }

        // Environment-aware S3 key generation
        const env = isDemoRequest(request) ? 'demo' : 'prod';
        const s3Key = generateS3Key(env, user.id, useCaseId, sanitizedFileName);
        const uploadUrl = await getPresignedUploadUrl(env, s3Key, ALLOWED_MIME_TYPE);

        return { uploadUrl, s3Key };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: uploadSchema,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'pdfs:upload',
        },
    }
);
