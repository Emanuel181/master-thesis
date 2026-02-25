/**
 * PUT /api/use-case-groups/reorder
 * =================================
 * Batch-update the order of groups.
 *
 * Body: { orderedIds: string[] }
 * Each group's order is set to its index in the array.
 */

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, errorResponse } from '@/lib/api-handler';
import { cuidSchema } from '@/lib/validators/common.js';

const reorderSchema = z.object({
    orderedIds: z.array(cuidSchema).min(1).max(200),
});

export const PUT = createApiHandler(
    async (request, { session, body, requestId }) => {
        if (!prisma.useCaseGroup) {
            return errorResponse('Feature not available', {
                status: 503,
                code: 'SERVICE_UNAVAILABLE',
                requestId,
            });
        }

        const { orderedIds } = body;

        // Verify all groups belong to this user
        const groups = await prisma.useCaseGroup.findMany({
            where: { id: { in: orderedIds }, userId: session.user.id },
            select: { id: true },
        });

        const ownedIds = new Set(groups.map(g => g.id));
        const validIds = orderedIds.filter(id => ownedIds.has(id));

        if (validIds.length === 0) {
            return errorResponse('No valid groups found', {
                status: 400,
                code: 'VALIDATION_ERROR',
                requestId,
            });
        }

        // Batch update order
        await prisma.$transaction(
            validIds.map((id, index) =>
                prisma.useCaseGroup.update({
                    where: { id },
                    data: { order: index },
                })
            )
        );

        return { reordered: validIds.length };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: reorderSchema,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'use-case-groups:reorder',
        },
    }
);

