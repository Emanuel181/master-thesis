import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { securityHeaders } from '@/lib/api-security';
import { requireProductionMode } from '@/lib/api-middleware';

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

export async function GET(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    
    // SECURITY: Block demo mode from accessing production GitHub API
    const demoBlock = requireProductionMode(request, { requestId });
    if (demoBlock) return demoBlock;
    
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const ref = searchParams.get('ref') || 'HEAD';
    const shape = searchParams.get('shape');

    if (!owner || !repo) {
        return NextResponse.json({ error: 'Missing owner or repo', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    // Input validation - prevent injection and malformed inputs
    const ownerRepoPattern = /^[a-zA-Z0-9_.-]+$/;
    if (!ownerRepoPattern.test(owner) || owner.length > 100) {
        return NextResponse.json({ error: 'Invalid owner format', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
    if (!ownerRepoPattern.test(repo) || repo.length > 100) {
        return NextResponse.json({ error: 'Invalid repo format', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    // Rate limiting - 60 requests per minute
    const rl = rateLimit({
        key: `github:tree:${session.user?.id}`,
        limit: 60,
        windowMs: 60 * 1000
    });
    if (!rl.allowed) {
        return NextResponse.json(
            { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
            { status: 429, headers: { ...securityHeaders, 'x-request-id': requestId } }
        );
    }

    // Get the user from database (prefer id)
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user) {
        return NextResponse.json({ error: 'User not found', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    // Fetch GitHub access token from database
    const githubAccount = await prisma.account.findFirst({
        where: {
            userId: user.id,
            provider: 'github',
        },
    });

    if (!githubAccount?.access_token) {
        return NextResponse.json({ error: 'GitHub account not linked', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
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
            return NextResponse.json({ root: buildHierarchyTree(treeData.tree, repo) }, { headers: { ...securityHeaders, 'x-request-id': requestId } });
        }
        return NextResponse.json({ tree: treeData.tree }, { headers: { ...securityHeaders, 'x-request-id': requestId } });
    } catch (err) {
        if (isDev) console.error('[github/tree] Octokit error:', err.message || err);
        const statusCode = err.status || err.statusCode || (err.response && err.response.status) || 500;
        return NextResponse.json({ error: 'Failed to fetch repository tree', requestId }, { status: statusCode, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
}
