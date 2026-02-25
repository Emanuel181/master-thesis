/**
 * Vectorization Status API Route
 * ================================
 *
 * GET /api/pdfs/vectorization-status?ids=id1,id2,...
 *
 * Returns the vectorization status of the requested PDF documents.
 * Used by the UI to show real-time status indicators (pending / processing / completed / failed).
 */

import prisma from '@/lib/prisma';
import { createApiHandler, errorResponse } from '@/lib/api-handler';
import { z } from 'zod';

const querySchema = z.object({
    ids: z.string().min(1, 'At least one PDF ID is required'),
});

export const GET = createApiHandler(
    async (request, { session, query, requestId }) => {
        const { ids } = query;

        // Parse comma-separated IDs
        const pdfIds = ids.split(',').map(id => id.trim()).filter(Boolean);

        if (pdfIds.length === 0) {
            return errorResponse('No valid PDF IDs provided', {
                status: 400,
                code: 'VALIDATION_ERROR',
                requestId,
            });
        }

        if (pdfIds.length > 100) {
            return errorResponse('Maximum 100 PDF IDs per request', {
                status: 400,
                code: 'VALIDATION_ERROR',
                requestId,
            });
        }

        // Fetch vectorization status — only for PDFs the user owns
        const pdfs = await prisma.pdf.findMany({
            where: {
                id: { in: pdfIds },
                useCase: { userId: session.user.id },
            },
            select: {
                id: true,
                title: true,
                vectorized: true,
                embeddingStatus: true,
                vectorizedAt: true,
                chunkCount: true,
                virusScanStatus: true,
                virusScannedAt: true,
            },
        });

        return {
            documents: pdfs,
            summary: {
                total: pdfs.length,
                completed: pdfs.filter(p => p.embeddingStatus === 'completed').length,
                processing: pdfs.filter(p => p.embeddingStatus === 'processing').length,
                pending: pdfs.filter(p => p.embeddingStatus === 'pending').length,
                failed: pdfs.filter(p => p.embeddingStatus === 'failed').length,
            },
        };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        querySchema,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'pdfs:vectorization-status',
        },
    }
);

