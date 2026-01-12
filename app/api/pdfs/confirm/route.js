/**
 * PDFs Confirm API Route
 * =======================
 * 
 * POST - Confirm PDF upload (save to database after successful S3 upload)
 */

import prisma from '@/lib/prisma';
import { getPresignedDownloadUrl } from '@/lib/s3-env';
import { z } from 'zod';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';
import { validateS3Key } from '@/lib/api-security';
import { isDemoRequest } from '@/lib/demo-mode';
import { cuidSchema } from '@/lib/validators/common.js';

// Security constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max
const MAX_FILENAME_LENGTH = 255;
const MAX_S3_KEY_LENGTH = 1024;

/**
 * Confirm upload schema
 */
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
    folderId: cuidSchema.optional().nullable(),
});

/**
 * POST /api/pdfs/confirm
 * Confirm PDF upload (save to database after successful S3 upload)
 */
export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        // Ensure user exists
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        const { s3Key, fileName, fileSize, useCaseId, folderId } = body;

        // Environment-aware s3Key validation
        const env = isDemoRequest(request) ? 'demo' : 'prod';
        const expectedPrefix = env === 'demo'
            ? `demo/users/${user.id}/use-cases/`
            : `users/${user.id}/use-cases/`;
        const keyCheck = validateS3Key(s3Key, { requiredPrefix: expectedPrefix, maxLen: MAX_S3_KEY_LENGTH });
        if (!keyCheck.ok) {
            return errorResponse(keyCheck.error || 'Invalid s3Key', {
                status: keyCheck.error === 'Access denied' ? 403 : 400,
                code: keyCheck.error === 'Access denied' ? 'FORBIDDEN' : 'VALIDATION_ERROR',
                requestId,
            });
        }

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

        // If folderId is provided, verify it exists and belongs to the same use case
        if (folderId) {
            const folder = await prisma.folder.findFirst({
                where: {
                    id: folderId,
                    useCaseId,
                },
            });

            if (!folder) {
                return ApiErrors.notFound('Folder', requestId);
            }
        }

        // Idempotency: if the same s3Key is confirmed twice, return existing record
        const existing = await prisma.pdf.findFirst({
            where: {
                s3Key,
                useCase: { userId: user.id },
            },
        });

        if (existing) {
            const url = await getPresignedDownloadUrl(env, existing.s3Key);
            return { pdf: { ...existing, url } };
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
        return { pdf: { ...pdf, url } };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: confirmUploadSchema,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'pdfs:confirm',
        },
    }
);
