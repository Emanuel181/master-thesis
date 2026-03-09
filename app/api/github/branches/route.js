import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';

/**
 * GET /api/github/branches?owner=xxx&repo=xxx
 * Fetch branches for a GitHub repository.
 */
export const GET = createApiHandler(
    async (request, { session, requestId }) => {
        const { searchParams } = new URL(request.url);
        const owner = searchParams.get('owner');
        const repo = searchParams.get('repo');

        if (!owner || !repo) {
            return ApiErrors.badRequest('owner and repo are required', requestId);
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
        if (!user) return ApiErrors.unauthorized(requestId);

        const githubAccount = await prisma.account.findFirst({
            where: { userId: user.id, provider: 'github' },
        });

        if (!githubAccount?.access_token) {
            return ApiErrors.unauthorized(requestId);
        }

        const octokit = new Octokit({ auth: githubAccount.access_token });
        const { data } = await octokit.repos.listBranches({
            owner,
            repo,
            per_page: 100,
        });

        return data.map(b => ({ name: b.name, protected: b.protected }));
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'github:branches' },
    }
);

