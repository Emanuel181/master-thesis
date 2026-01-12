import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';

// SECURITY: Only log in development
const isDev = process.env.NODE_ENV === 'development';

function buildHierarchyTree(items, repo) {
    const root = {
        name: repo,
        path: '',
        type: 'folder',
        children: [],
    };

    const pathMap = { '': root };
    for (const item of items) {
        if (!item?.path) continue;
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
    ref: z.string().default('HEAD'),
    shape: z.string().optional(),
});

export const GET = createApiHandler(
    async (request, { session, query, requestId }) => {
        const { owner, repo, ref, shape } = query;

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

        const octokit = new Octokit({ auth: githubAccount.access_token });

        try {
            let commitSha;
            if (ref === 'HEAD') {
                // Get the default branch
                const { data: repoData } = await octokit.repos.get({ owner, repo });
                const defaultBranch = repoData.default_branch;
                const { data: refData } = await octokit.git.getRef({
                    owner,
                    repo,
                    ref: `heads/${defaultBranch}`,
                });
                commitSha = refData.object.sha;
            } else {
                // Assume ref is a commit SHA or branch/tag
                try {
                    const { data: refData } = await octokit.git.getRef({
                        owner,
                        repo,
                        ref: `heads/${ref}`,
                    });
                    commitSha = refData.object.sha;
                } catch {
                    // If not a branch, assume it's a commit SHA
                    commitSha = ref;
                }
            }

            // Fetch the tree
            const { data: treeData } = await octokit.git.getTree({
                owner,
                repo,
                tree_sha: commitSha,
                recursive: 'true',
            });

            if (isDev) console.log('[github/tree] fetched tree with', treeData.tree.length, 'items');
            if (shape === 'hierarchy') {
                return { root: buildHierarchyTree(treeData.tree, repo) };
            }
            return { tree: treeData.tree };
        } catch (err) {
            if (isDev) console.error('[github/tree] Octokit error:', err.message || err);
            const statusCode = err.status || err.statusCode || (err.response && err.response.status) || 500;
            return errorResponse('Failed to fetch repository tree', { status: statusCode, requestId });
        }
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        querySchema,
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'github:tree' },
    }
);
