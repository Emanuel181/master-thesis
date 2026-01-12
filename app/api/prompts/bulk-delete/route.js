/**
 * Prompts Bulk Delete API Route
 * ==============================
 * 
 * POST - Delete multiple prompts at once
 */

import prisma from '@/lib/prisma';
import { deleteFromS3 } from '@/lib/s3';
import { bulkDeletePrompts } from '@/lib/prompts/bulk-delete-service';
import { createApiHandler, errorResponse } from '@/lib/api-handler';
import { bulkDeletePromptsSchema } from '@/lib/validators/prompts.js';

/**
 * POST /api/prompts/bulk-delete
 * Delete multiple prompts at once
 */
export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        const { ids } = body;

        if (ids.length > 500) {
            return errorResponse('Too many IDs', {
                status: 413,
                code: 'PAYLOAD_TOO_LARGE',
                requestId,
                details: { max: 500 },
            });
        }

        const result = await bulkDeletePrompts({
            prisma,
            userId: session.user.id,
            ids,
            deleteFromS3,
            logger: console,
        });

        return { ...result };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: bulkDeletePromptsSchema,
        rateLimit: {
            limit: 10,
            windowMs: 60 * 1000,
            keyPrefix: 'prompts:bulk-delete',
        },
    }
);
