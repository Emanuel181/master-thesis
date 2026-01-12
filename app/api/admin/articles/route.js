/**
 * Admin Articles API Routes
 * ==========================
 * 
 * GET /api/admin/articles - Get all articles for admin review
 * 
 * Security features:
 * - Uses createAdminApiHandler for consistent auth/validation
 * - Zod validation on all query parameters
 * - Rate limiting enabled
 * - Proper error handling without information leakage
 */

import { createAdminApiHandler } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { paginationSchema, articleStatusSchema } from '@/lib/validators/common';

// Query schema with strict validation
const adminArticlesQuerySchema = paginationSchema.extend({
    status: articleStatusSchema,
    search: z.string()
        .max(200, 'Search query too long')
        .optional()
        .default('')
        // Sanitize search input to prevent injection
        .transform(v => v.replace(/[<>]/g, '')),
});

/**
 * GET /api/admin/articles - Get all articles for admin review
 */
export const GET = createAdminApiHandler(
    async (request, { query }) => {
        const { page, limit, status, search } = query;
        const skip = (page - 1) * limit;

        // Build where clause safely
        const where = {
            ...(status && { status }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { authorName: { contains: search, mode: 'insensitive' } },
                    { authorEmail: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        // Parallel queries for better performance
        const [articles, total, statusCounts] = await Promise.all([
            prisma.article.findMany({
                where,
                orderBy: [
                    { submittedAt: 'desc' },
                    { createdAt: 'desc' },
                ],
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    content: true,
                    contentJson: true,
                    contentMarkdown: true,
                    category: true,
                    iconName: true,
                    iconColor: true,
                    iconPosition: true,
                    gradient: true,
                    coverImage: true,
                    coverType: true,
                    status: true,
                    adminFeedback: true,
                    readTime: true,
                    authorId: true,
                    authorName: true,
                    authorEmail: true,
                    featured: true,
                    showInMoreArticles: true,
                    featuredOrder: true,
                    submittedAt: true,
                    reviewedAt: true,
                    publishedAt: true,
                    rejectedAt: true,
                    scheduledForDeletionAt: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { reactions: true },
                    },
                },
                skip,
                take: limit,
            }),
            prisma.article.count({ where }),
            prisma.article.groupBy({
                by: ['status'],
                _count: true,
            }),
        ]);

        // Transform status counts to object
        const counts = statusCounts.reduce(
            (acc, { status: s, _count }) => {
                acc[s] = _count;
                return acc;
            },
            { 
                DRAFT: 0, 
                PENDING_REVIEW: 0, 
                IN_REVIEW: 0, 
                PUBLISHED: 0, 
                REJECTED: 0, 
                SCHEDULED_FOR_DELETION: 0 
            }
        );

        return {
            articles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            counts,
        };
    },
    {
        querySchema: adminArticlesQuerySchema,
        rateLimit: { 
            limit: 100, 
            windowMs: 60 * 1000, 
            keyPrefix: 'admin:articles:list' 
        },
    }
);
