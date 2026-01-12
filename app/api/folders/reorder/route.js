/**
 * Folders Reorder API Route
 * ==========================
 * 
 * PATCH - Reorder folders and PDFs within a use case
 */

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';
import { cuidSchema } from '@/lib/validators/common.js';

/**
 * Reorder items schema
 */
const reorderItemsSchema = z.object({
    useCaseId: cuidSchema,
    items: z.array(z.object({
        id: cuidSchema,
        type: z.enum(['folder', 'pdf']),
        order: z.number().int().min(0).max(100000),
        parentId: cuidSchema.nullable().optional(),
    })).min(1).max(500),
});

/**
 * PATCH /api/folders/reorder
 * Reorder folders and PDFs within a use case
 */
export const PATCH = createApiHandler(
    async (request, { session, body, requestId }) => {
        const { useCaseId, items } = body;

        // Verify user owns this use case
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id: useCaseId,
                userId: session.user.id,
            },
            select: { id: true },
        });

        if (!useCase) {
            return ApiErrors.notFound('Use case', requestId);
        }

        // Process reorder updates in a transaction
        try {
            await prisma.$transaction(async (tx) => {
                for (const item of items) {
                    const { id, type, order, parentId } = item;

                    if (parentId) {
                        const parentFolder = await tx.folder.findFirst({
                            where: { id: parentId, useCaseId },
                            select: { id: true },
                        });
                        if (!parentFolder) {
                            throw new Error('validation:invalid-parent');
                        }
                    }

                    if (type === 'folder') {
                        const updated = await tx.folder.updateMany({
                            where: { id, useCaseId },
                            data: {
                                order,
                                parentId: parentId || null,
                            },
                        });

                        if (updated.count === 0) {
                            throw new Error('validation:invalid-folder');
                        }
                    } else {
                        const updated = await tx.pdf.updateMany({
                            where: { id, useCaseId },
                            data: {
                                order,
                                folderId: parentId || null,
                            },
                        });

                        if (updated.count === 0) {
                            throw new Error('validation:invalid-pdf');
                        }
                    }
                }
            });
        } catch (error) {
            const msg = typeof error?.message === 'string' ? error.message : '';
            if (msg.startsWith('validation:')) {
                return errorResponse('Validation failed', {
                    status: 400,
                    code: 'VALIDATION_ERROR',
                    requestId,
                });
            }
            throw error;
        }

        return { success: true };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: reorderItemsSchema,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'folders:reorder',
        },
    }
);
