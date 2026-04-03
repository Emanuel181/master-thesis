/**
 * Admin Supporters API Routes
 * ============================
 *
 * GET /api/admin/supporters - Get all supporters
 * POST /api/admin/supporters - Create a new supporter
 *
 * Security features:
 * - Uses createAdminApiHandler for consistent auth/validation
 * - Zod validation on all inputs
 * - Rate limiting enabled
 */

import { createAdminApiHandler } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const supporterSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
    occupation: z.string().min(1, 'Occupation is required').max(100),
    company: z.string().max(100).optional().nullable().or(z.literal('')),
    companyUrl: z.string().url().optional().nullable().or(z.literal('')),
    contributionBio: z.string().min(1, 'Contribution is required').max(500),
    personalBio: z.string().max(500).optional().nullable().or(z.literal('')),
    linkedinUrl: z.string().url().optional().nullable().or(z.literal('')),
    websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
    tier: z.enum(['sponsor', 'contributor', 'supporter']).optional().default('supporter'),
    featured: z.boolean().default(false),
    order: z.number().int().min(0).max(1000).default(0),
});

/**
 * GET /api/admin/supporters
 * Get all supporters from database
 */
export const GET = createAdminApiHandler(
    async (request, { requestId }) => {
        const supporters = await prisma.supporter.findMany({
            orderBy: [
                { tier: 'asc' },
                { featured: 'desc' },
                { order: 'asc' },
            ],
        });

        return { supporters };
    },
    {
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'admin:supporters:list' },
    }
);

/**
 * POST /api/admin/supporters
 * Create a new supporter in database
 */
export const POST = createAdminApiHandler(
    async (request, { body, requestId }) => {
        const newSupporter = await prisma.supporter.create({
            data: {
                name: body.name,
                avatarUrl: body.avatarUrl || null,
                occupation: body.occupation,
                company: body.company || null,
                companyUrl: body.companyUrl || null,
                contributionBio: body.contributionBio,
                personalBio: body.personalBio || null,
                linkedinUrl: body.linkedinUrl || null,
                websiteUrl: body.websiteUrl || null,
                tier: body.tier,
                featured: body.featured,
                order: body.order,
                visible: true,
            },
        });

        return { supporter: newSupporter, message: 'Supporter created successfully' };
    },
    {
        bodySchema: supporterSchema,
        rateLimit: { limit: 30, windowMs: 60 * 1000, keyPrefix: 'admin:supporters:create' },
    }
);
