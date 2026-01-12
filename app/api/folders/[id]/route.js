/**
 * Folder [id] API Routes
 * =======================
 * 
 * GET    - Get a single folder with its contents
 * PATCH  - Update folder (rename, move)
 * DELETE - Delete folder and all its contents
 */

import prisma from '@/lib/prisma';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';
import { updateFolderSchema, folderIdParamsSchema } from '@/lib/validators/folders.js';

/**
 * BFS check if targetId is a descendant of rootId
 */
async function isDescendantBfs(db, { rootId, targetId, maxNodes = 2000 }) {
    if (!rootId || !targetId) return false;
    if (rootId === targetId) return true;

    const queue = [rootId];
    const visited = new Set([rootId]);
    let processed = 0;

    while (queue.length) {
        const parentId = queue.shift();
        processed += 1;
        if (processed > maxNodes) {
            // Defensive: avoid unbounded traversal; treat as unsafe
            return true;
        }

        const children = await db.folder.findMany({
            where: { parentId },
            select: { id: true },
        });

        for (const child of children) {
            if (!child?.id) continue;
            if (child.id === targetId) return true;
            if (!visited.has(child.id)) {
                visited.add(child.id);
                queue.push(child.id);
            }
        }
    }

    return false;
}

/**
 * GET /api/folders/[id]
 * Get a single folder with its contents
 */
export const GET = createApiHandler(
    async (request, { session, params, requestId }) => {
        const { id } = params;

        const folder = await prisma.folder.findFirst({
            where: { id },
            include: {
                useCase: true,
                children: {
                    orderBy: { order: 'asc' },
                },
                pdfs: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!folder) {
            return ApiErrors.notFound('Folder', requestId);
        }

        // Verify user owns this folder
        if (folder.useCase.userId !== session.user.id) {
            return ApiErrors.forbidden(requestId);
        }

        return { folder };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        paramsSchema: folderIdParamsSchema,
        rateLimit: {
            limit: 120,
            windowMs: 60 * 1000,
            keyPrefix: 'folders:id:get',
        },
    }
);

/**
 * PATCH /api/folders/[id]
 * Update folder (rename, move)
 */
export const PATCH = createApiHandler(
    async (request, { session, body, params, requestId }) => {
        const { id } = params;
        const { name, parentId, order } = body;

        const folder = await prisma.folder.findFirst({
            where: { id },
            include: {
                useCase: true,
            },
        });

        if (!folder) {
            return ApiErrors.notFound('Folder', requestId);
        }

        // Verify user owns this folder
        if (folder.useCase.userId !== session.user.id) {
            return ApiErrors.forbidden(requestId);
        }

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name;
        }

        if (order !== undefined) {
            updateData.order = order;
        }

        // Handle moving to a different parent
        if (parentId !== undefined) {
            // Prevent moving a folder into itself
            if (parentId === id) {
                return errorResponse('Cannot move folder into itself', {
                    status: 400,
                    code: 'VALIDATION_ERROR',
                    requestId,
                });
            }

            if (parentId !== null) {
                const newParent = await prisma.folder.findFirst({
                    where: {
                        id: parentId,
                        useCaseId: folder.useCaseId,
                    },
                    select: { id: true },
                });

                if (!newParent) {
                    return ApiErrors.notFound('Parent folder', requestId);
                }

                const isDesc = await isDescendantBfs(prisma, { rootId: id, targetId: parentId });
                if (isDesc) {
                    return errorResponse('Cannot move folder into its descendant', {
                        status: 400,
                        code: 'VALIDATION_ERROR',
                        requestId,
                    });
                }
            }

            updateData.parentId = parentId;
        }

        const updatedFolder = await prisma.folder.update({
            where: { id },
            data: updateData,
        });

        return { folder: updatedFolder };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: updateFolderSchema,
        paramsSchema: folderIdParamsSchema,
        rateLimit: {
            limit: 120,
            windowMs: 60 * 1000,
            keyPrefix: 'folders:id:patch',
        },
    }
);

/**
 * DELETE /api/folders/[id]
 * Delete folder and all its contents
 */
export const DELETE = createApiHandler(
    async (request, { session, params, requestId }) => {
        const { id } = params;

        const folder = await prisma.folder.findFirst({
            where: { id },
            include: {
                useCase: true,
            },
        });

        if (!folder) {
            return ApiErrors.notFound('Folder', requestId);
        }

        // Verify user owns this folder
        if (folder.useCase.userId !== session.user.id) {
            return ApiErrors.forbidden(requestId);
        }

        // Delete folder (cascade will handle children and PDF relations)
        await prisma.folder.delete({
            where: { id },
        });

        return { success: true };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        paramsSchema: folderIdParamsSchema,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'folders:id:delete',
        },
    }
);
