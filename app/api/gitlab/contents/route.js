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
    ref: z.string().default('main'),
    decode: z.string().optional(),
});

export const GET = createApiHandler(
    async (request, { session, query, requestId }) => {
        const { owner, repo, path, ref, decode } = query;

        // Get the user (prefer id)
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });

        if (!user) {
            return ApiErrors.unauthorized(requestId);
        }

        // Fetch GitLab access token
        const gitlabAccount = await prisma.account.findFirst({
            where: { userId: user.id, provider: 'gitlab' },
        });

        if (!gitlabAccount?.access_token) {
            return ApiErrors.unauthorized(requestId);
        }

        const baseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
        const projectPath = encodeURIComponent(`${owner}/${repo}`);
        const filePath = encodeURIComponent(path);

        try {
            // Check if looking for default branch ref
            let targetRef = ref;
            if (targetRef === 'HEAD') {
                // GitLab "files" API wants a ref; fetch project default branch.
                const projectUrl = `${baseUrl}/api/v4/projects/${projectPath}`;
                const projectRes = await fetch(projectUrl, {
                    headers: { 'Authorization': `Bearer ${gitlabAccount.access_token}` }
                });
                if (projectRes.ok) {
                    const projectData = await projectRes.json();
                    targetRef = projectData.default_branch;
                } else {
                    targetRef = 'main';
                }
            }

            const apiUrl = `${baseUrl}/api/v4/projects/${projectPath}/repository/files/${filePath}?ref=${encodeURIComponent(targetRef)}`;

            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${gitlabAccount.access_token}` }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return ApiErrors.notFound('File', requestId);
                }
                const status = Number.isInteger(response.status) ? response.status : 502;
                return errorResponse('Failed to fetch file content', { status, requestId });
            }

            const data = await response.json();
            if (decode === '1' && data && data.encoding === 'base64' && typeof data.content === 'string') {
                const cleaned = data.content.replace(/[\r\n]+/g, '');
                const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
                return {
                    ...data,
                    content: decoded,
                    encoding: 'utf-8',
                };
            }
            return data;

        } catch (error) {
            console.error('[gitlab/contents] Error:', error);
            throw error;
        }
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        querySchema,
        rateLimit: { limit: 120, windowMs: 60 * 1000, keyPrefix: 'gitlab:contents' },
    }
);
