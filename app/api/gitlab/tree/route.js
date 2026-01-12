import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';

function buildHierarchyTree(items, repo) {
    const root = {
        name: repo,
        path: '',
        type: 'folder',
        children: [],
    };

    const pathMap = { '': root };
    for (const item of items) {
        const parts = item.path.split('/');
        const parentPath = parts.slice(0, -1).join('/') || '';
        const parent = pathMap[parentPath];
        if (!parent) continue;

        const node = {
            name: parts[parts.length - 1],
            path: item.path,
            type: item.type === 'tree' ? 'folder' : 'file',
            children: item.type === 'tree' ? [] : undefined,
        };

        parent.children.push(node);
        if (item.type === 'tree') pathMap[item.path] = node;
    }

    return root;
}

const ownerRepoPattern = /^[a-zA-Z0-9_.-]+$/;

const querySchema = z.object({
    owner: z.string().min(1).max(100).regex(ownerRepoPattern, 'Invalid owner format'),
    repo: z.string().min(1).max(100).regex(ownerRepoPattern, 'Invalid repo format'),
    ref: z.string().optional(),
    shape: z.string().optional(),
});

export const GET = createApiHandler(
    async (request, { session, query, requestId }) => {
        const { owner, repo, ref, shape } = query;

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
        const projectPath = encodeURIComponent(`${owner}/${repo}`); // owner is namespace

        try {
            const perPage = 100;
            let page = 1;
            const allItems = [];

            while (true) {
                let apiUrl = `${baseUrl}/api/v4/projects/${projectPath}/repository/tree?recursive=true&per_page=${perPage}&page=${page}`;
                if (ref && ref !== 'HEAD') {
                    apiUrl += `&ref=${encodeURIComponent(ref)}`;
                }

                const response = await fetch(apiUrl, {
                    headers: { 'Authorization': `Bearer ${gitlabAccount.access_token}` },
                });

                if (!response.ok) {
                    const status = Number.isInteger(response.status) ? response.status : 502;
                    return errorResponse('Failed to fetch repository tree', { status, requestId });
                }

                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    allItems.push(...data);
                }

                const nextPage = response.headers.get('x-next-page');
                if (nextPage) {
                    page = Number(nextPage);
                    if (!Number.isFinite(page) || page <= 0) break;
                    continue;
                }

                if (!Array.isArray(data) || data.length < perPage) break;
                page += 1;
            }

            if (shape === 'hierarchy') {
                return { root: buildHierarchyTree(allItems, repo) };
            }

            return { tree: allItems };

        } catch (error) {
            console.error('[gitlab/tree] Error:', error);
            throw error;
        }
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        querySchema,
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'gitlab:tree' },
    }
);
