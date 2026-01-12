/**
 * Profile API Routes
 * ===================
 * 
 * GET  - Fetch current user's profile
 * PUT  - Update current user's profile
 */

import prisma from '@/lib/prisma';
import { createApiHandler, successResponse, ApiErrors } from '@/lib/api-handler';
import { updateProfileSchema, profileSelectFields } from '@/lib/validators/profile.js';

/**
 * GET /api/profile
 * Fetch the authenticated user's profile
 */
export const GET = createApiHandler(
    async (request, { session, requestId }) => {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: profileSelectFields,
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        return { user };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'profile:get',
        },
    }
);

/**
 * PUT /api/profile
 * Update the authenticated user's profile
 */
export const PUT = createApiHandler(
    async (request, { session, body, requestId }) => {
        // Verify user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true },
        });

        if (!existingUser) {
            return ApiErrors.notFound('User', requestId);
        }

        // Build update data object with only provided fields
        const updateData = {};
        const fields = ['firstName', 'lastName', 'phone', 'jobTitle', 'company', 'bio', 'location', 'image'];
        
        for (const field of fields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field] || null;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: profileSelectFields,
        });

        return { user: updatedUser };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: updateProfileSchema,
        rateLimit: {
            limit: 20,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'profile:put',
        },
    }
);
