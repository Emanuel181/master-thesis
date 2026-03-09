import prisma from '@/lib/prisma';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';

/**
 * GET /api/gitlab/branches?owner=xxx&repo=xxx
 * Fetch branches for a GitLab repository.
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

        const gitlabAccount = await prisma.account.findFirst({
            where: { userId: user.id, provider: 'gitlab' },
        });

        if (!gitlabAccount?.access_token) {
            return ApiErrors.unauthorized(requestId);
        }

        const baseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
        const projectPath = encodeURIComponent(`${owner}/${repo}`);

        const response = await fetch(
            `${baseUrl}/api/v4/projects/${projectPath}/repository/branches?per_page=100`,
            {
                headers: { 'Authorization': `Bearer ${gitlabAccount.access_token}` },
            }
        );

        if (!response.ok) {
            return ApiErrors.badRequest('Failed to fetch branches from GitLab', requestId);
        }

        const data = await response.json();
        return data.map(b => ({ name: b.name, protected: b.protected }));
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'gitlab:branches' },
    }
);

