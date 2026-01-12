/**
 * Prompts Reorder API Route
 * ==========================
 * 
 * POST - Reorder prompts for a specific agent
 */

import prisma from '@/lib/prisma';
import { createApiHandler, errorResponse } from '@/lib/api-handler';
import { reorderPromptsSchema } from '@/lib/validators/prompts.js';

/**
 * POST /api/prompts/reorder
 * Reorder prompts for a specific agent
 */
export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        const { agent, orderedIds } = body;
        const userId = session.user.id;

        // Verify all prompts belong to the user and the agent
        const existingPrompts = await prisma.prompt.findMany({
            where: {
                id: { in: orderedIds },
                userId,
                agent,
            },
            select: { id: true },
        });

        if (existingPrompts.length !== orderedIds.length) {
            return errorResponse('Validation failed', {
                status: 400,
                code: 'VALIDATION_ERROR',
                requestId,
            });
        }

        // Update order for each prompt in a transaction
        const updates = orderedIds.map((id, index) =>
            prisma.prompt.updateMany({
                where: { id, userId, agent },
                data: { order: index },
            })
        );

        await prisma.$transaction(updates);

        return { success: true };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: reorderPromptsSchema,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 1000,
            keyPrefix: 'prompts:reorder',
        },
    }
);
