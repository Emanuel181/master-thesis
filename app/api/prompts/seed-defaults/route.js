/**
 * Seed Default Prompts API Route
 * ================================
 *
 * POST - Seeds default prompts for the current user if they don't have any
 *
 * This endpoint allows users to get their default prompts seeded if they
 * created their account before the auto-seeding feature was added.
 */

import { seedDefaultPromptsForUser, userHasPrompts } from '@/lib/user-seeding';
import { createApiHandler } from '@/lib/api-handler';

/**
 * POST /api/prompts/seed-defaults
 * Seed default prompts for the authenticated user
 */
export const POST = createApiHandler(
    async (request, { session }) => {
        const userId = session.user.id;

        // Check if user already has prompts
        const hasPrompts = await userHasPrompts(userId);
        if (hasPrompts) {
            return {
                success: true,
                message: 'User already has prompts, skipping seed',
                promptsCreated: 0,
                skipped: true,
            };
        }

        // Seed default prompts
        const result = await seedDefaultPromptsForUser(userId);

        if (!result.success) {
            return {
                success: false,
                message: 'Failed to seed default prompts',
                error: result.error,
            };
        }

        return {
            success: true,
            message: `Successfully created ${result.promptsCreated} default prompts`,
            promptsCreated: result.promptsCreated,
        };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: {
            limit: 5,
            windowMs: 60 * 60 * 1000, // 5 requests per hour
            keyPrefix: 'prompts:seed',
        },
    }
);

