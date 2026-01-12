/**
 * PDF [id] API Routes
 * ====================
 * 
 * GET    - Get a fresh presigned URL for viewing a PDF
 * PATCH  - Update PDF (move to folder, update order, rename)
 * DELETE - Delete a PDF from S3 and database
 */

import prisma from '@/lib/prisma';
import { deleteFromS3, getPresignedDownloadUrl } from '@/lib/s3-env';
import { z } from 'zod';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';
import { cuidSchema } from '@/lib/validators/common.js';
import { isDemoRequest } from '@/lib/demo-mode';

/**
 * PDF ID params schema
 */
const pdfIdParamsSchema = z.object({
    id: cuidSchema,
});

/**
 * Patch PDF schema
 */
const patchPdfSchema = z.object({
    folderId: z.union([cuidSchema, z.null()]).optional(),
    order: z.number().int().min(0).max(100000).optional(),
    title: z.string().min(1).max(255).optional(),
}).strict();

/**
 * GET /api/pdfs/[id]
 * Get a fresh presigned URL for viewing a PDF
 */
export const GET = createApiHandler(
    async (request, { session, params, requestId }) => {
        const { id } = params;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        // Find the PDF and verify it belongs to a use case owned by the user
        const pdf = await prisma.pdf.findUnique({
            where: { id },
            include: {
                useCase: true,
            },
        });

        if (!pdf || pdf.useCase.userId !== user.id) {
            return ApiErrors.notFound('PDF', requestId);
        }

        // Generate a fresh presigned URL (env-aware)
        const env = isDemoRequest(request) ? 'demo' : 'prod';
        const url = await getPresignedDownloadUrl(env, pdf.s3Key);

        return {
            pdf: {
                ...pdf,
                url,
            },
        };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        paramsSchema: pdfIdParamsSchema,
        rateLimit: {
            limit: 100,
            windowMs: 60 * 1000,
            keyPrefix: 'pdfs:get',
        },
    }
);

/**
 * PATCH /api/pdfs/[id]
 * Update PDF (move to folder, update order, rename)
 */
export const PATCH = createApiHandler(
    async (request, { session, body, params, requestId }) => {
        const { id } = params;
        const { folderId, order, title } = body;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        // Find the PDF and verify it belongs to a use case owned by the user
        const pdf = await prisma.pdf.findUnique({
            where: { id },
            include: {
                useCase: true,
            },
        });

        if (!pdf || pdf.useCase.userId !== user.id) {
            return ApiErrors.notFound('PDF', requestId);
        }

        const updateData = {};

        if (title !== undefined) {
            updateData.title = title;
        }

        if (order !== undefined) {
            updateData.order = order;
        }

        // Handle moving to a folder (null means move to root)
        if (folderId !== undefined) {
            if (folderId !== null) {
                // Verify the folder exists and belongs to the same use case
                const folder = await prisma.folder.findFirst({
                    where: {
                        id: folderId,
                        useCaseId: pdf.useCaseId,
                    },
                });

                if (!folder) {
                    return ApiErrors.notFound('Folder', requestId);
                }
            }
            updateData.folderId = folderId;
        }

        const updatedPdf = await prisma.pdf.update({
            where: { id },
            data: updateData,
        });

        return { pdf: updatedPdf };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: patchPdfSchema,
        paramsSchema: pdfIdParamsSchema,
        rateLimit: {
            limit: 120,
            windowMs: 60 * 1000,
            keyPrefix: 'pdfs:patch',
        },
    }
);

/**
 * DELETE /api/pdfs/[id]
 * Delete a PDF from S3 and database
 */
export const DELETE = createApiHandler(
    async (request, { session, params, requestId }) => {
        const { id } = params;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        // Find the PDF and verify it belongs to a use case owned by the user
        const pdf = await prisma.pdf.findUnique({
            where: { id },
            include: {
                useCase: true,
            },
        });

        // If PDF doesn't exist, return success (idempotent)
        if (!pdf) {
            return { message: 'PDF already deleted' };
        }

        if (pdf.useCase.userId !== user.id) {
            return ApiErrors.notFound('PDF', requestId);
        }

        // Delete from S3 (env-aware)
        const env = isDemoRequest(request) ? 'demo' : 'prod';
        try {
            await deleteFromS3(env, pdf.s3Key);
        } catch (s3Error) {
            console.error('Failed to delete PDF from S3:', s3Error);
            // Continue with database deletion even if S3 delete fails
        }

        // Delete from database using deleteMany to avoid errors if already deleted
        await prisma.pdf.deleteMany({
            where: { id },
        });

        return { message: 'PDF deleted successfully' };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        paramsSchema: pdfIdParamsSchema,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'pdfs:delete',
        },
    }
);
