import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';

const ownerRepoPattern = /^[a-zA-Z0-9_.-]+$/;

const querySchema = z.object({
    owner: z.string().min(1).max(100).regex(ownerRepoPattern, 'Invalid owner format'),
    repo: z.string().min(1).max(100).regex(ownerRepoPattern, 'Invalid repo format'),
    path: z.string().min(1).max(500).refine(
        (val) => !val.includes('..') && !val.includes('\\'),
        'Invalid path format'
    ),
    ref: z.string().default('HEAD'),
    decode: z.string().optional(),
});

export const GET = createApiHandler(
    async (request, { session, query, requestId }) => {
        const { owner, repo, path, ref, decode } = query;

        // Get the user from database (prefer id)
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });

        if (!user) {
            return ApiErrors.unauthorized(requestId);
        }

        // Fetch GitHub access token from database
        const githubAccount = await prisma.account.findFirst({
            where: {
                userId: user.id,
                provider: 'github',
            },
        });

        if (!githubAccount?.access_token) {
            return ApiErrors.unauthorized(requestId);
        }

        try {
            const octokit = new Octokit({ auth: githubAccount.access_token });
            const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path,
                ref,
            });

            if (decode === '1' && data && !Array.isArray(data) && data.encoding === 'base64' && typeof data.content === 'string') {
                const cleaned = data.content.replace(/[\r\n]+/g, '');
                const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
                return {
                    ...data,
                    content: decoded,
                    encoding: 'utf-8',
                };
            }
            return data;
        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('[github/contents] Octokit error:', err.message || err);
            }
            const statusCode = err.status || err.statusCode || (err.response && err.response.status) || 500;
            return errorResponse('Failed to fetch file content', { status: statusCode, requestId });
        }
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        querySchema,
        rateLimit: { limit: 120, windowMs: 60 * 1000, keyPrefix: 'github:contents' },
    }
);
