/**
 * Admin Featured Articles API Routes
 * ====================================
 * 
 * GET /api/admin/articles/featured - Get all published articles with featured status
 * POST /api/admin/articles/featured - Update featured article settings
 * 
 * Security features:
 * - Uses createAdminApiHandler for consistent auth/validation
 * - Zod validation on all inputs
 * - Rate limiting enabled
 */

import { createAdminApiHandler } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { cuidSchema } from '@/lib/validators/common';
import { ApiErrors } from '@/lib/api-handler';

// POST body schema
const featuredActionSchema = z.object({
    articleId: cuidSchema,
    action: z.enum(['setFeatured', 'toggleMoreArticles', 'updateOrder']),
    value: z.boolean().optional(),
    featuredOrder: z.number().int().min(0).max(1000).optional(),
}).strict();

/**
 * GET /api/admin/articles/featured - Get all published articles with featured status
 */
export const GET = createAdminApiHandler(
    async () => {
        // Get all published articles
        const articles = await prisma.article.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: [
                { featured: 'desc' },
                { featuredOrder: 'asc' },
                { publishedAt: 'desc' },
            ],
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                category: true,
                iconName: true,
                gradient: true,
                coverImage: true,
                coverType: true,
                authorName: true,
                readTime: true,
                featured: true,
                showInMoreArticles: true,
                featuredOrder: true,
                publishedAt: true,
            },
        });

        // Get the main featured article
        const mainFeatured = articles.find(a => a.featured) || null;

        // Get articles shown in "More Articles"
        const moreArticles = articles.filter(a => 
            a.showInMoreArticles && (!a.featured || articles.filter(x => x.featured).length === 0)
        );

        return {
            articles,
            mainFeatured,
            moreArticlesCount: moreArticles.length,
        };
    },
    {
        rateLimit: { limit: 100, windowMs: 60 * 1000, keyPrefix: 'admin:articles:featured:list' },
    }
);

/**
 * POST /api/admin/articles/featured - Update featured article settings
 */
export const POST = createAdminApiHandler(
    async (request, { body, requestId }) => {
        const { articleId, action, value, featuredOrder } = body;

        const article = await prisma.article.findUnique({
            where: { id: articleId },
        });

        if (!article) {
            return ApiErrors.notFound('Article', requestId);
        }

        if (article.status !== 'PUBLISHED') {
            return ApiErrors.forbidden(requestId, 'Only published articles can be featured');
        }

        let updateData = {};

        switch (action) {
            case 'setFeatured':
                // If setting as featured, unset all other featured articles first
                if (value === true) {
                    await prisma.article.updateMany({
                        where: { featured: true },
                        data: { featured: false },
                    });
                }
                updateData = { featured: value === true };
                break;

            case 'toggleMoreArticles':
                updateData = { showInMoreArticles: value === true };
                break;

            case 'updateOrder':
                if (typeof featuredOrder !== 'number') {
                    return ApiErrors.forbidden(requestId, 'featuredOrder must be a number');
                }
                updateData = { featuredOrder };
                break;
        }

        const updatedArticle = await prisma.article.update({
            where: { id: articleId },
            data: updateData,
            select: {
                id: true,
                title: true,
                featured: true,
                showInMoreArticles: true,
                featuredOrder: true,
            },
        });

        return { article: updatedArticle };
    },
    {
        bodySchema: featuredActionSchema,
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'admin:articles:featured:update' },
    }
);
