/**
 * Folders API Routes
 * ===================
 * 
 * GET  - List all folders for a use case (as tree structure)
 * POST - Create a new folder
 */

import prisma from '@/lib/prisma';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';
import { createFolderSchema, folderQuerySchema } from '@/lib/validators/folders.js';

/**
 * Build tree structure from flat folder list
 */
function buildTree(folders, rootPdfs, parentId = null) {
    return folders
        .filter(f => f.parentId === parentId)
        .map(folder => ({
            ...folder,
            type: 'folder',
            children: [
                ...buildTree(folders, [], folder.id),
                ...folder.pdfs.map(pdf => ({ ...pdf, type: 'pdf' })),
            ].sort((a, b) => a.order - b.order),
        }));
}

/**
 * GET /api/folders
 * List all folders for a use case as a tree structure
 */
export const GET = createApiHandler(
    async (request, { session, query, requestId }) => {
        const { useCaseId } = query;

        if (!useCaseId) {
            return errorResponse('useCaseId is required', {
                status: 400,
                code: 'VALIDATION_ERROR',
                requestId,
            });
        }

        // Verify user owns this use case
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id: useCaseId,
                userId: session.user.id,
            },
        });

        if (!useCase) {
            return ApiErrors.notFound('Use case', requestId);
        }

        // Get all folders for this use case
        const folders = await prisma.folder.findMany({
            where: { useCaseId },
            orderBy: { order: 'asc' },
            include: {
                pdfs: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        // Get root-level PDFs (not in any folder)
        const rootPdfs = await prisma.pdf.findMany({
            where: {
                useCaseId,
                folderId: null,
            },
            orderBy: { order: 'asc' },
        });

        // Build tree structure
        const tree = [
            ...buildTree(folders, rootPdfs, null),
            ...rootPdfs.map(pdf => ({ ...pdf, type: 'pdf' })),
        ].sort((a, b) => a.order - b.order);

        return { folders: tree };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        querySchema: folderQuerySchema.partial(),
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'folders:get',
        },
    }
);

/**
 * POST /api/folders
 * Create a new folder
 */
export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        const { name, useCaseId, parentId } = body;

        // Verify user owns this use case
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id: useCaseId,
                userId: session.user.id,
            },
        });

        if (!useCase) {
            return ApiErrors.notFound('Use case', requestId);
        }

        // If parentId is provided, verify it exists and belongs to same use case
        if (parentId) {
            const parentFolder = await prisma.folder.findFirst({
                where: {
                    id: parentId,
                    useCaseId,
                },
            });

            if (!parentFolder) {
                return ApiErrors.notFound('Parent folder', requestId);
            }

            // Check depth limit (max 5 levels)
            let depth = 1;
            let currentParent = parentFolder;
            while (currentParent?.parentId && depth < 6) {
                currentParent = await prisma.folder.findUnique({
                    where: { id: currentParent.parentId },
                    select: { parentId: true },
                });
                if (!currentParent) {
                    return ApiErrors.notFound('Parent folder', requestId);
                }
                depth++;
            }

            if (depth >= 5) {
                return errorResponse('Maximum folder depth (5) exceeded', {
                    status: 400,
                    code: 'VALIDATION_ERROR',
                    requestId,
                });
            }
        }

        // Get the max order in the target location
        const maxOrderResult = await prisma.folder.aggregate({
            where: {
                useCaseId,
                parentId: parentId || null,
            },
            _max: { order: true },
        });

        const maxPdfOrderResult = await prisma.pdf.aggregate({
            where: {
                useCaseId,
                folderId: parentId || null,
            },
            _max: { order: true },
        });

        const newOrder = Math.max(
            (maxOrderResult._max.order || 0) + 1,
            (maxPdfOrderResult._max.order || 0) + 1
        );

        const folder = await prisma.folder.create({
            data: {
                name,
                useCaseId,
                parentId: parentId || null,
                order: newOrder,
            },
        });

        return { folder };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: createFolderSchema,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'folders:create',
        },
    }
);
