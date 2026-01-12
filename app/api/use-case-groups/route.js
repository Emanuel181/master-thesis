/**
 * Use Case Groups API Routes
 * ===========================
 * 
 * GET  - Fetch all use case groups for the current user
 * POST - Create a new use case group
 */

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors, errorResponse, successResponse } from '@/lib/api-handler';
import { textSchema, cuidSchema } from '@/lib/validators/common.js';

/**
 * Create group schema
 */
const createGroupSchema = z.object({
    name: textSchema('Name', 100),
    icon: z.string().max(50).optional(),
    color: z.string().max(50).optional(),
    parentId: z.string().max(50).nullable().optional(),
});

/**
 * GET /api/use-case-groups
 * Fetch all use case groups for the current user
 */
export const GET = createApiHandler(
    async (request, { session }) => {
        // Check if useCaseGroup model is available
        if (!prisma.useCaseGroup) {
            console.warn('UseCaseGroup model not available - Prisma client may need regeneration');
            return { groups: [] };
        }

        const groups = await prisma.useCaseGroup.findMany({
            where: { userId: session.user.id },
            include: {
                useCases: {
                    select: {
                        id: true,
                        title: true,
                        icon: true,
                        color: true,
                    },
                },
                children: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        color: true,
                    },
                },
            },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });

        return { groups };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'use-case-groups:get',
        },
    }
);

/**
 * POST /api/use-case-groups
 * Create a new use case group
 */
export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        // Check if useCaseGroup model is available
        if (!prisma.useCaseGroup) {
            return errorResponse('Feature not available', {
                status: 503,
                code: 'SERVICE_UNAVAILABLE',
                requestId,
            });
        }

        const { name, icon, color, parentId } = body;

        // Verify parent belongs to user if provided
        if (parentId) {
            const parentGroup = await prisma.useCaseGroup.findFirst({
                where: { id: parentId, userId: session.user.id },
            });
            if (!parentGroup) {
                return ApiErrors.notFound('Parent group', requestId);
            }
        }

        // Get max order for positioning
        const maxOrder = await prisma.useCaseGroup.aggregate({
            where: { userId: session.user.id, parentId: parentId || null },
            _max: { order: true },
        });

        const group = await prisma.useCaseGroup.create({
            data: {
                name,
                icon: icon || 'Folder',
                color: color || 'default',
                parentId: parentId || null,
                order: (maxOrder._max.order ?? -1) + 1,
                userId: session.user.id,
            },
        });

        return { group };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: createGroupSchema,
        rateLimit: {
            limit: 20,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'use-case-groups:create',
        },
    }
);
