/**
 * Use Cases API Routes
 * =====================
 * 
 * GET  - Fetch all use cases for the current user
 * POST - Create a new use case
 */

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';
import { textSchema, cuidSchema } from '@/lib/validators/common.js';

/**
 * Create use case schema
 */
const createUseCaseSchema = z.object({
    title: textSchema('Title', 200),
    content: z.string()
        .min(1, 'Content is required')
        .max(10000, 'Content must be less than 10000 characters'),
    icon: z.string().max(50).optional(),
    color: z.string().max(50).optional(),
    groupId: z.string().max(50).nullable().optional(),
});

/**
 * Helper to format file size
 */
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Helper to truncate description
 */
function truncateText(text, maxLength = 100) {
    if (!text) return null;
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Helper to truncate description by words
 */
function truncateByWords(text, maxWords = 20) {
    if (!text) return null;
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * GET /api/use-cases
 * Fetch all use cases for the current user
 */
export const GET = createApiHandler(
    async (request, { session }) => {
        // Optimized query: limit fields and add pagination
        const useCases = await prisma.knowledgeBaseCategory.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                title: true,
                content: true,
                icon: true,
                color: true,
                groupId: true,
                order: true,
                createdAt: true,
                updatedAt: true,
                pdfs: {
                    select: {
                        id: true,
                        title: true,
                        size: true,
                        url: true,
                        createdAt: true,
                    },
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: { pdfs: true },
                },
            },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            take: 50,
        });

        if (!useCases) {
            return { useCases: [] };
        }

        // Transform the response to include formatted data
        const transformedUseCases = useCases.map(uc => ({
            id: uc.id,
            title: uc.title,
            content: uc.content,
            icon: uc.icon,
            color: uc.color,
            groupId: uc.groupId || null,
            group: null,
            order: uc.order || 0,
            createdAt: uc.createdAt,
            updatedAt: uc.updatedAt,
            fullContent: uc.content,
            shortContent: truncateText(uc.content, 100),
            shortDescription: truncateByWords(uc.content, 20),
            pdfs: (uc.pdfs || []).map(pdf => ({
                ...pdf,
                formattedSize: formatFileSize(pdf.size),
            })),
            pdfCount: uc._count?.pdfs || 0,
            totalSize: (uc.pdfs || []).reduce((sum, pdf) => sum + (pdf.size || 0), 0),
            formattedTotalSize: formatFileSize((uc.pdfs || []).reduce((sum, pdf) => sum + (pdf.size || 0), 0)),
        }));

        return { useCases: transformedUseCases };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'use-cases:get',
        },
    }
);

/**
 * POST /api/use-cases
 * Create a new use case
 */
export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        const { title, content, icon, color, groupId } = body;

        const useCase = await prisma.knowledgeBaseCategory.create({
            data: {
                title,
                content,
                icon: icon || 'File',
                color: color || 'default',
                groupId: groupId || null,
                userId: user.id,
            },
        });

        return { useCase };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: createUseCaseSchema,
        rateLimit: {
            limit: 20,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'use-cases:create',
        },
    }
);
