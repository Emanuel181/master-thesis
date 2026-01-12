/**
 * Admin Article by ID API Routes
 * ===============================
 * 
 * GET /api/admin/articles/[id] - Get a single article for admin review
 * PATCH /api/admin/articles/[id] - Update article (master admin only)
 * PUT /api/admin/articles/[id] - Full article update (master admin only)
 * 
 * Security features:
 * - Uses createAdminApiHandler for consistent auth/validation
 * - Zod validation on all inputs
 * - Rate limiting enabled
 * - Master admin checks for modifications
 */

import { createAdminApiHandler } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { cuidSchema, textSchema } from '@/lib/validators/common';
import { ApiErrors } from '@/lib/api-handler';

// Route params schema
const paramsSchema = z.object({
    id: cuidSchema,
});

// PATCH body schema
const patchBodySchema = z.object({
    title: textSchema('Title', 200).optional(),
    excerpt: textSchema('Excerpt', 500, { allowNewlines: true }).optional(),
    category: z.string().max(50).optional(),
    iconName: z.string().max(50).optional(),
    gradient: z.string().max(100).nullable().optional(),
    coverImage: z.string().url().max(2048).nullable().optional(),
    coverType: z.enum(['gradient', 'image']).optional(),
    content: z.string().max(500000).optional(),
    contentJson: z.any().optional(),
    contentMarkdown: z.string().max(500000).optional(),
}).strict();

// PUT body schema (full update)
const putBodySchema = patchBodySchema.extend({
    iconColor: z.string().max(50).optional(),
    authorId: cuidSchema.optional(),
    authorName: z.string().max(100).optional(),
    authorEmail: z.string().email().max(254).optional(),
    readTime: z.number().int().min(1).max(120).optional(),
    featured: z.boolean().optional(),
    showInMoreArticles: z.boolean().optional(),
    featuredOrder: z.number().int().min(0).max(1000).optional(),
});

/**
 * Generate unique slug from title
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
 * GET /api/admin/articles/[id] - Get a single article for admin review
 */
export const GET = createAdminApiHandler(
    async (request, { params, requestId }) => {
        const { id } = params;

        const article = await prisma.article.findUnique({
            where: { id },
            include: {
                reactions: {
                    select: {
                        id: true,
                        type: true,
                        userId: true,
                        createdAt: true,
                    },
                },
                media: {
                    select: {
                        id: true,
                        type: true,
                        fileName: true,
                        url: true,
                    },
                },
            },
        });

        if (!article) {
            return ApiErrors.notFound('Article', requestId);
        }

        return { article };
    },
    {
        paramsSchema,
        rateLimit: { limit: 100, windowMs: 60 * 1000, keyPrefix: 'admin:articles:get' },
    }
);

/**
 * PATCH /api/admin/articles/[id] - Update article (master admin only)
 */
export const PATCH = createAdminApiHandler(
    async (request, { params, body, requestId, isMasterAdmin, adminEmail }) => {
        const { id } = params;

        // Only master admins can modify article content
        if (!isMasterAdmin) {
            return ApiErrors.forbidden(requestId, 'Only master admins can modify articles');
        }

        const existingArticle = await prisma.article.findUnique({
            where: { id },
        });

        if (!existingArticle) {
            return ApiErrors.notFound('Article', requestId);
        }

        // Build update data from validated body
        const updateData = { ...body };

        // Generate new slug if title changed
        if (body.title && body.title !== existingArticle.title) {
            updateData.slug = await generateUniqueSlug(body.title, id);
        }

        const article = await prisma.article.update({
            where: { id },
            data: updateData,
        });

        // Audit log
        console.log(`[Admin Audit] Article ${id} modified (PATCH) by ${adminEmail} (master admin) at ${new Date().toISOString()}`);

        return { article };
    },
    {
        paramsSchema,
        bodySchema: patchBodySchema,
        requireMasterAdmin: false, // We check manually for better error message
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'admin:articles:patch' },
    }
);

/**
 * PUT /api/admin/articles/[id] - Full article update (master admin only)
 */
export const PUT = createAdminApiHandler(
    async (request, { params, body, requestId, isMasterAdmin, adminEmail }) => {
        const { id } = params;

        // Only master admins can perform full updates
        if (!isMasterAdmin) {
            return ApiErrors.forbidden(requestId, 'Only master admins can fully modify articles');
        }

        const existingArticle = await prisma.article.findUnique({
            where: { id },
        });

        if (!existingArticle) {
            return ApiErrors.notFound('Article', requestId);
        }

        // Build update data from validated body
        const updateData = { ...body };

        // Generate new slug if title changed
        if (body.title && body.title !== existingArticle.title) {
            updateData.slug = await generateUniqueSlug(body.title, id);
        }

        const article = await prisma.article.update({
            where: { id },
            data: updateData,
        });

        // Audit log
        console.log(`[Admin Audit] Article ${id} fully updated by ${adminEmail} (master admin) at ${new Date().toISOString()}`);

        return { article };
    },
    {
        paramsSchema,
        bodySchema: putBodySchema,
        requireMasterAdmin: false, // We check manually for better error message
        rateLimit: { limit: 30, windowMs: 60 * 1000, keyPrefix: 'admin:articles:put' },
    }
);
