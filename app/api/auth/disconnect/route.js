import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';

const ALLOWED_PROVIDERS = new Set(['github', 'google', 'gitlab', 'microsoft-entra-id']);

const querySchema = z.object({
    provider: z.string().refine(
        (val) => ALLOWED_PROVIDERS.has(val),
        'Invalid provider'
    ),
});

export const POST = createApiHandler(
    async (request, { session, query }) => {
        const { provider } = query;

        // Delete the linked OAuth account scoped to the authenticated user
        await prisma.account.deleteMany({
            where: {
                userId: session.user.id,
                provider,
            },
        });

        return { success: true };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        csrfProtection: true,
        querySchema,
        rateLimit: { limit: 10, windowMs: 60 * 1000, keyPrefix: 'auth:disconnect' },
    }
);
