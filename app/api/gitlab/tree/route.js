import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { securityHeaders, getClientIp } from '@/lib/api-security';
import { rateLimit } from '@/lib/rate-limit';
import { requireProductionMode } from '@/lib/api-middleware';

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

export async function GET(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    
    // SECURITY: Block demo mode from accessing production GitLab tree API
    const demoBlock = requireProductionMode(request, { requestId });
    if (demoBlock) return demoBlock;
    
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const ref = searchParams.get('ref');
    const shape = searchParams.get('shape');

    if (!owner || !repo) {
        return NextResponse.json({ error: 'Missing owner or repo', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    // Input validation - prevent injection/malformed inputs
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
    const clientIp = getClientIp(request);
    const rl = rateLimit({ key: `gitlab:tree:${session.user.id}:${clientIp}`, limit: 60, windowMs: 60_000 });
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId }, { status: 429, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    // Get the user (prefer id)
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user) {
        return NextResponse.json({ error: 'User not found', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    // Fetch GitLab access token
    const gitlabAccount = await prisma.account.findFirst({
        where: { userId: user.id, provider: 'gitlab' },
    });

    if (!gitlabAccount?.access_token) {
        return NextResponse.json({ error: 'GitLab account not linked', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
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
                return NextResponse.json({ error: 'Failed to fetch repository tree', requestId }, { status, headers: { ...securityHeaders, 'x-request-id': requestId } });
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
            return NextResponse.json({ root: buildHierarchyTree(allItems, repo), requestId }, { headers: { ...securityHeaders, 'x-request-id': requestId } });
        }

        return NextResponse.json({ tree: allItems, requestId }, { headers: { ...securityHeaders, 'x-request-id': requestId } });

    } catch (error) {
        console.error('[gitlab/tree] Error:', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
}
