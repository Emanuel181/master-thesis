/**
 * Use Case Move API Route
 * ========================
 * 
 * PUT - Move a use case to a group (or ungroup it)
 */

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';
import { cuidSchema } from '@/lib/validators/common.js';

/**
 * Use case ID params schema
 */
const useCaseIdParamsSchema = z.object({
    id: cuidSchema,
});

/**
 * Move use case schema
 */
const moveUseCaseSchema = z.object({
    groupId: z.string().max(50).nullable(),
});

/**
 * PUT /api/use-cases/[id]/move
 * Move a use case to a group (or ungroup it)
 */
export const PUT = createApiHandler(
    async (request, { session, body, params, requestId }) => {
        const { id } = params;
        const { groupId } = body;

        // Verify use case belongs to user
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!useCase) {
            return ApiErrors.notFound('Use case', requestId);
        }

        // Verify group belongs to user if provided
        if (groupId) {
            if (prisma.useCaseGroup) {
                const group = await prisma.useCaseGroup.findFirst({
                    where: { id: groupId, userId: session.user.id },
                });
                if (!group) {
                    return ApiErrors.notFound('Group', requestId);
                }
            } else {
                console.warn('UseCaseGroup model not available - skipping group verification');
            }
        }

        const updatedUseCase = await prisma.knowledgeBaseCategory.update({
            where: { id },
            data: { groupId: groupId || null },
        });

        return { useCase: updatedUseCase };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: moveUseCaseSchema,
        paramsSchema: useCaseIdParamsSchema,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'use-cases:move',
        },
    }
);
