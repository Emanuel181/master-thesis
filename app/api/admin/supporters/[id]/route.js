/**
 * Admin Supporters by ID API Routes
 * ===================================
 * 
 * PUT /api/admin/supporters/[id] - Update a supporter
 * DELETE /api/admin/supporters/[id] - Delete a supporter
 * 
 * Security features:
 * - Uses createAdminApiHandler for consistent auth/validation
 * - Zod validation on all inputs
 * - Rate limiting enabled
 */

import { createAdminApiHandler } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ApiErrors } from '@/lib/api-handler';
import { cuidSchema } from '@/lib/validators/common';

// Route params schema
const paramsSchema = z.object({
    id: cuidSchema,
});

// PUT body schema
const updateSupporterSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
    occupation: z.string().min(1).max(100).optional(),
    company: z.string().max(100).optional().nullable().or(z.literal('')),
    companyUrl: z.string().url().optional().nullable().or(z.literal('')),
    contributionBio: z.string().min(1).max(500).optional(),
    personalBio: z.string().max(500).optional().nullable().or(z.literal('')),
    linkedinUrl: z.string().url().optional().nullable().or(z.literal('')),
    websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
    tier: z.enum(['sponsor', 'contributor', 'supporter']).optional(),
    featured: z.boolean().optional(),
    order: z.number().int().min(0).max(1000).optional(),
    visible: z.boolean().optional(),
}).strict();

/**
 * PUT /api/admin/supporters/[id] - Update a supporter
 */
export const PUT = createAdminApiHandler(
    async (request, { params, body, requestId }) => {
        const { id } = params;

        // Check if supporter exists
        const existing = await prisma.supporter.findUnique({
            where: { id },
        });

        if (!existing) {
            return ApiErrors.notFound('Supporter', requestId);
        }

        // Build update data (only include provided fields, convert empty strings to null)
        const updateData = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl || null;
        if (body.occupation !== undefined) updateData.occupation = body.occupation;
        if (body.company !== undefined) updateData.company = body.company || null;
        if (body.companyUrl !== undefined) updateData.companyUrl = body.companyUrl || null;
        if (body.contributionBio !== undefined) updateData.contributionBio = body.contributionBio;
        if (body.personalBio !== undefined) updateData.personalBio = body.personalBio || null;
        if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl || null;
        if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl || null;
        if (body.tier !== undefined) updateData.tier = body.tier;
        if (body.featured !== undefined) updateData.featured = body.featured;
        if (body.order !== undefined) updateData.order = body.order;
        if (body.visible !== undefined) updateData.visible = body.visible;

        const updatedSupporter = await prisma.supporter.update({
            where: { id },
            data: updateData,
        });

        return { 
            supporter: updatedSupporter, 
            message: 'Supporter updated successfully' 
        };
    },
    {
        paramsSchema,
        bodySchema: updateSupporterSchema,
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'admin:supporters:update' },
    }
);

/**
 * DELETE /api/admin/supporters/[id] - Delete a supporter
 */
export const DELETE = createAdminApiHandler(
    async (request, { params, requestId }) => {
        const { id } = params;

        // Check if supporter exists
        const existing = await prisma.supporter.findUnique({
            where: { id },
        });

        if (!existing) {
            return ApiErrors.notFound('Supporter', requestId);
        }

        await prisma.supporter.delete({
            where: { id },
        });

        return { message: 'Supporter deleted successfully' };
    },
    {
        paramsSchema,
        rateLimit: { limit: 30, windowMs: 60 * 1000, keyPrefix: 'admin:supporters:delete' },
    }
);
