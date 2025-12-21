import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

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
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const ref = searchParams.get('ref');
    const shape = searchParams.get('shape');

    if (!owner || !repo) {
        return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
    }

    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user
    let user = null;
    if (session.user?.email) {
        user = await prisma.user.findUnique({ where: { email: session.user.email } });
    }
    if (!user && session.user?.id) {
        user = await prisma.user.findUnique({ where: { id: session.user.id } });
    }

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Fetch GitLab access token
    const gitlabAccount = await prisma.account.findFirst({
        where: { userId: user.id, provider: 'gitlab' },
    });

    const tokenCandidates = [];
    // Only use session token if it's from GitLab login
    if (session.accessToken && session.provider === 'gitlab') {
        tokenCandidates.push({ source: 'session', token: session.accessToken });
    }
    if (gitlabAccount && gitlabAccount.access_token) {
        tokenCandidates.push({ source: 'db', token: gitlabAccount.access_token });
    }

    if (tokenCandidates.length === 0) {
        return NextResponse.json({ error: 'GitLab account not linked' }, { status: 401 });
    }

    const baseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
    const projectPath = encodeURIComponent(`${owner}/${repo}`); // owner is namespace

    for (const candidate of tokenCandidates) {
        try {
            const perPage = 100;
            let page = 1;
            const allItems = [];

            while (true) {
                let apiUrl = `${baseUrl}/api/v4/projects/${projectPath}/repository/tree?recursive=true&per_page=${perPage}&page=${page}`;
                if (ref && ref !== 'HEAD') {
                    apiUrl += `&ref=${ref}`;
                }

                const response = await fetch(apiUrl, {
                    headers: { 'Authorization': `Bearer ${candidate.token}` },
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) break;
                    throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
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

            if (allItems.length === 0) continue;

            if (shape === 'hierarchy') {
                return NextResponse.json({ root: buildHierarchyTree(allItems, repo) });
            }

            return NextResponse.json({ tree: allItems });

        } catch (error) {
            console.error('[gitlab/tree] Error:', error);
            // continue to next token if possible, or fail at end
        }
    }

    return NextResponse.json({ error: 'Failed to fetch repository tree' }, { status: 500 });
}
