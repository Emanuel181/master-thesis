/**
 * Use Case Group [id] API Routes
 * ===============================
 * 
 * GET    - Fetch a single group
 * PUT    - Update a group
 * DELETE - Delete a group (use cases will be ungrouped)
 */

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';
import { textSchema, cuidSchema } from '@/lib/validators/common.js';

/**
 * Group ID params schema
 */
const groupIdParamsSchema = z.object({
    id: cuidSchema,
});

/**
 * Update group schema
 */
const updateGroupSchema = z.object({
    name: textSchema('Name', 100).optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(50).optional(),
    parentId: z.string().max(50).nullable().optional(),
    order: z.number().int().min(0).optional(),
});

/**
 * GET /api/use-case-groups/[id]
 * Fetch a single group
 */
export const GET = createApiHandler(
    async (request, { session, params, requestId }) => {
        // Check if useCaseGroup model is available
        if (!prisma.useCaseGroup) {
            return errorResponse('Feature not available', {
                status: 503,
                code: 'SERVICE_UNAVAILABLE',
                requestId,
            });
        }

        const { id } = params;

        const group = await prisma.useCaseGroup.findFirst({
            where: { id, userId: session.user.id },
            include: {
                useCases: {
                    select: {
                        id: true,
                        title: true,
                        content: true,
                        icon: true,
                        color: true,
                    },
                },
                children: true,
            },
        });

        if (!group) {
            return ApiErrors.notFound('Group', requestId);
        }

        return { group };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        paramsSchema: groupIdParamsSchema,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'use-case-groups:get',
        },
    }
);

/**
 * PUT /api/use-case-groups/[id]
 * Update a group
 */
export const PUT = createApiHandler(
    async (request, { session, body, params, requestId }) => {
        // Check if useCaseGroup model is available
        if (!prisma.useCaseGroup) {
            return errorResponse('Feature not available', {
                status: 503,
                code: 'SERVICE_UNAVAILABLE',
                requestId,
            });
        }

        const { id } = params;
        const { name, icon, color, parentId, order } = body;

        // Verify ownership
        const existingGroup = await prisma.useCaseGroup.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existingGroup) {
            return ApiErrors.notFound('Group', requestId);
        }

        // Prevent setting self as parent
        if (parentId === id) {
            return errorResponse('Cannot set group as its own parent', {
                status: 400,
                code: 'VALIDATION_ERROR',
                requestId,
            });
        }

        // Verify new parent belongs to user if provided
        if (parentId) {
            const parentGroup = await prisma.useCaseGroup.findFirst({
                where: { id: parentId, userId: session.user.id },
            });
            if (!parentGroup) {
                return ApiErrors.notFound('Parent group', requestId);
            }
        }

        const updatedGroup = await prisma.useCaseGroup.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(icon && { icon }),
                ...(color && { color }),
                ...(parentId !== undefined && { parentId }),
                ...(order !== undefined && { order }),
            },
        });

        return { group: updatedGroup };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: updateGroupSchema,
        paramsSchema: groupIdParamsSchema,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'use-case-groups:update',
        },
    }
);

/**
 * DELETE /api/use-case-groups/[id]
 * Delete a group (use cases will be ungrouped, not deleted)
 */
export const DELETE = createApiHandler(
    async (request, { session, params, requestId }) => {
        // Check if useCaseGroup model is available
        if (!prisma.useCaseGroup) {
            return errorResponse('Feature not available', {
                status: 503,
                code: 'SERVICE_UNAVAILABLE',
                requestId,
            });
        }

        const { id } = params;

        const group = await prisma.useCaseGroup.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!group) {
            return ApiErrors.notFound('Group', requestId);
        }

        // Ungroup all use cases belonging to this user
        await prisma.knowledgeBaseCategory.updateMany({
            where: { groupId: id, userId: session.user.id },
            data: { groupId: null },
        });

        // Move child groups to parent (or root if no parent)
        await prisma.useCaseGroup.updateMany({
            where: { parentId: id, userId: session.user.id },
            data: { parentId: group.parentId },
        });

        // Delete the group
        await prisma.useCaseGroup.delete({
            where: { id },
        });

        return { message: 'Group deleted successfully' };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        paramsSchema: groupIdParamsSchema,
        rateLimit: {
            limit: 10,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'use-case-groups:delete',
        },
    }
);
