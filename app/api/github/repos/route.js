import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { withCircuitBreaker } from '@/lib/distributed-circuit-breaker';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';

function truncateDescription(description, maxLength = 50) {
    if (!description) return null;
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + '...';
}

export const GET = createApiHandler(
    async (request, { session, requestId }) => {
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

        // Temporarily bypass circuit breaker due to database error
        const octokit = new Octokit({ auth: githubAccount.access_token });
        const { data } = await octokit.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 100,
        });

        const transformedRepos = data.map(repo => ({
            ...repo,
            shortDescription: truncateDescription(repo.description, 50),
        }));

        return transformedRepos;
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'github:repos' },
    }
);
