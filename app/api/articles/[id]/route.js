/**
 * Article by ID API Routes
 * =========================
 * 
 * GET /api/articles/[id] - Get a specific article
 * PATCH /api/articles/[id] - Update article metadata
 * DELETE /api/articles/[id] - Delete an article
 */

import { createApiHandler, ApiErrors } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { articleIdSchema, articleUpdateSchema } from '@/lib/validators/articles';

/**
 * Generate a unique slug from title
 */
async function generateUniqueSlug(title, excludeId) {
    const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existingArticles = await prisma.article.findMany({
        where: {
            slug: { startsWith: baseSlug },
            id: { not: excludeId },
        },
        select: { slug: true },
    });

    let slug = baseSlug;
    if (existingArticles.length > 0) {
        const slugs = new Set(existingArticles.map((a) => a.slug));
        let counter = 1;
        while (slugs.has(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    return slug;
}

/**
 * GET /api/articles/[id] - Get a specific article
 */
export const GET = createApiHandler(
    async (request, { session, params, requestId }) => {
        const { id } = params;

        const article = await prisma.article.findUnique({
            where: { id },
        });

        if (!article) {
            return ApiErrors.notFound('Article', requestId);
        }

        // Only allow author to see non-published articles
        if (article.authorId !== session.user.id && article.status !== 'APPROVED') {
            return ApiErrors.forbidden(requestId);
        }

        return { article };
    },
    {
        requireAuth: true,
        paramsSchema: articleIdSchema,
        rateLimit: { limit: 100, windowMs: 60 * 1000, keyPrefix: 'articles:get' },
    }
);

/**
 * PATCH /api/articles/[id] - Update article metadata
 */
export const PATCH = createApiHandler(
    async (request, { session, params, body, requestId }) => {
        const { id } = params;

        // Verify ownership
        const existingArticle = await prisma.article.findUnique({
            where: { id },
            select: { authorId: true, status: true },
        });

        if (!existingArticle) {
            return ApiErrors.notFound('Article', requestId);
        }

        if (existingArticle.authorId !== session.user.id) {
            return ApiErrors.forbidden(requestId);
        }

        // Don't allow editing approved articles
        if (existingArticle.status === 'APPROVED') {
            return ApiErrors.forbidden(requestId, 'Cannot edit published articles');
        }

        const {
            title,
            excerpt,
            category,
            iconName,
            iconPosition,
            iconColor,
            gradient,
            coverImage,
            coverType,
            readTime,
        } = body;

        // Build update data
        const updateData = {
            ...(title !== undefined && { title }),
            ...(excerpt !== undefined && { excerpt }),
            ...(category !== undefined && { category }),
            ...(iconName !== undefined && { iconName }),
            ...(iconPosition !== undefined && { iconPosition }),
            ...(iconColor !== undefined && { iconColor }),
            ...(gradient !== undefined && { gradient }),
            ...(coverImage !== undefined && { coverImage }),
            ...(coverType !== undefined && { coverType }),
            ...(readTime !== undefined && { readTime }),
        };

        // Generate new slug if title changed
        if (title) {
            updateData.slug = await generateUniqueSlug(title, id);
        }

        const article = await prisma.article.update({
            where: { id },
            data: updateData,
        });

        return { article };
    },
    {
        requireAuth: true,
        paramsSchema: articleIdSchema,
        bodySchema: articleUpdateSchema,
        csrfProtection: true,
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'articles:update' },
    }
);

/**
 * DELETE /api/articles/[id] - Delete an article
 */
export const DELETE = createApiHandler(
    async (request, { session, params, requestId }) => {
        const { id } = params;

        // Verify ownership
        const existingArticle = await prisma.article.findUnique({
            where: { id },
            select: { authorId: true, status: true },
        });

        if (!existingArticle) {
            return ApiErrors.notFound('Article', requestId);
        }

        if (existingArticle.authorId !== session.user.id) {
            return ApiErrors.forbidden(requestId);
        }

        // Don't allow deleting approved articles
        if (existingArticle.status === 'APPROVED') {
            return ApiErrors.forbidden(requestId, 'Cannot delete published articles');
        }

        await prisma.article.delete({
            where: { id },
        });

        return { deleted: true };
    },
    {
        requireAuth: true,
        paramsSchema: articleIdSchema,
        csrfProtection: true,
        rateLimit: { limit: 30, windowMs: 60 * 1000, keyPrefix: 'articles:delete' },
    }
);
