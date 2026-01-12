/**
 * Notifications API Routes
 * =========================
 * 
 * GET /api/notifications - Get user's notifications
 * POST /api/notifications - Mark all notifications as read
 */

import { createApiHandler, ApiErrors } from '@/lib/api-handler';
import { getUserNotifications, markAllNotificationsAsRead } from '@/lib/notifications';
import { z } from 'zod';
import { paginationSchema } from '@/lib/validators/common';

// Query schema for GET /api/notifications
const notificationsQuerySchema = paginationSchema.extend({
    unreadOnly: z.coerce.boolean().default(false),
});

// Body schema for POST /api/notifications
const notificationsActionSchema = z.object({
    action: z.enum(['markAllRead']),
}).strict();

/**
 * GET /api/notifications - Get user's notifications
 */
export const GET = createApiHandler(
    async (request, { session, query }) => {
        const { page, limit, unreadOnly } = query;

        const result = await getUserNotifications(session.user.id, {
            page,
            limit,
            unreadOnly,
        });

        return result;
    },
    {
        requireAuth: true,
        querySchema: notificationsQuerySchema,
        rateLimit: { limit: 100, windowMs: 60 * 1000, keyPrefix: 'notifications:list' },
    }
);

/**
 * POST /api/notifications - Mark all notifications as read
 */
export const POST = createApiHandler(
    async (request, { session, body }) => {
        const { action } = body;

        if (action === 'markAllRead') {
            const result = await markAllNotificationsAsRead(session.user.id);
            return { count: result.count };
        }

        // This shouldn't happen due to schema validation, but just in case
        return ApiErrors.badRequest('Invalid action');
    },
    {
        requireAuth: true,
        bodySchema: notificationsActionSchema,
        csrfProtection: true,
        rateLimit: { limit: 30, windowMs: 60 * 1000, keyPrefix: 'notifications:action' },
    }
);
