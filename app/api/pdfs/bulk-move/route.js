/**
 * POST /api/pdfs/bulk-move
 * =========================
 * Move PDFs from one use case to another.
 *
 * Body: { pdfIds: string[], targetUseCaseId: string }
 * Auth: session required
 */

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';
import { cuidSchema } from '@/lib/validators/common.js';

const bulkMoveSchema = z.object({
    pdfIds: z.array(cuidSchema).min(1).max(200),
    targetUseCaseId: cuidSchema,
});

export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        const { pdfIds, targetUseCaseId } = body;

        // Verify the target use case belongs to the user
        const targetUseCase = await prisma.knowledgeBaseCategory.findFirst({
            where: { id: targetUseCaseId, userId: session.user.id },
        });

        if (!targetUseCase) {
            return ApiErrors.notFound('Target category', requestId);
        }

        // Verify all PDFs belong to the user
        const pdfs = await prisma.pdf.findMany({
            where: {
                id: { in: pdfIds },
                useCase: { userId: session.user.id },
            },
            select: { id: true, useCaseId: true },
        });

        if (pdfs.length === 0) {
            return ApiErrors.notFound('PDFs', requestId);
        }

        // Move PDFs to the target use case (unset folderId since folders are use-case-scoped)
        await prisma.pdf.updateMany({
            where: {
                id: { in: pdfs.map(p => p.id) },
                useCase: { userId: session.user.id },
            },
            data: {
                useCaseId: targetUseCaseId,
                folderId: null, // Folders are scoped to a use case, so reset
            },
        });

        return {
            moved: pdfs.length,
            targetUseCaseId,
        };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: bulkMoveSchema,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 1000,
            keyPrefix: 'pdfs:bulk-move',
        },
    }
);

