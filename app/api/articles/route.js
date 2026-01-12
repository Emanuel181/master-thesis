/**
 * Articles API Routes
 * ====================
 * 
 * GET /api/articles - List articles for current user
 * POST /api/articles - Create a new article
 */

import { createApiHandler } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { articleStatusSchema } from '@/lib/validators/common';
import { articleCreateSchema } from '@/lib/validators/articles';
import { checkAdminStatus } from '@/lib/admin-auth';

// Query schema for GET /api/articles
const listArticlesQuerySchema = z.object({
    status: articleStatusSchema,
    limit: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/articles - Get all articles for the current user
 */
export const GET = createApiHandler(
    async (request, { session, query }) => {
        const { status, limit, skip } = query;

        const where = {
            authorId: session.user.id,
            ...(status && { status }),
        };

        // Get total count and stats
        const [total, publishedCount, draftCount, articles] = await Promise.all([
            prisma.article.count({ where }),
            prisma.article.count({ where: { authorId: session.user.id, status: 'PUBLISHED' } }),
            prisma.article.count({ where: { authorId: session.user.id, status: 'DRAFT' } }),
            prisma.article.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
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
                    status: true,
                    adminFeedback: true,
                    readTime: true,
                    submittedAt: true,
                    reviewedAt: true,
                    publishedAt: true,
                    rejectedAt: true,
                    scheduledForDeletionAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);

        return { articles, total, publishedCount, draftCount };
    },
    {
        requireAuth: true,
        querySchema: listArticlesQuerySchema,
        rateLimit: { limit: 100, windowMs: 60 * 1000, keyPrefix: 'articles:list' },
    }
);

/**
 * Generate a unique slug from title
 */
async function generateUniqueSlug(title, excludeId = null) {
    const baseSlug = (title || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existingArticles = await prisma.article.findMany({
        where: {
            slug: { startsWith: baseSlug },
            ...(excludeId && { id: { not: excludeId } }),
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
 * POST /api/articles - Create a new article
 */
export const POST = createApiHandler(
    async (request, { session, body }) => {
        const { title, category, iconName, gradient, coverImage, coverType } = body;

        const slug = await generateUniqueSlug(title);

        // Check admin status from database for author name
        const adminStatus = await checkAdminStatus(session.user.email);

        const article = await prisma.article.create({
            data: {
                title: title || 'Untitled Article',
                slug,
                excerpt: '',
                category: category || 'General',
                iconName: iconName || 'Shield',
                gradient: gradient || null,
                coverImage: coverImage || null,
                coverType: coverType || 'gradient',
                content: '',
                contentJson: null,
                contentMarkdown: null,
                authorId: session.user.id,
                authorName: adminStatus.isAdmin ? 'VulnIQ security' : session.user.name || 'Anonymous',
                authorEmail: session.user.email || '',
                status: 'DRAFT',
            },
        });

        return { article };
    },
    {
        requireAuth: true,
        bodySchema: articleCreateSchema,
        rateLimit: { limit: 30, windowMs: 60 * 60 * 1000, keyPrefix: 'articles:create' },
    }
);
