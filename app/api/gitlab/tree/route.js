import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const ref = searchParams.get('ref');

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

    const baseUrl = process.env.GITLAB_URL || 'https://gitlab.com';
    const projectPath = encodeURIComponent(`${owner}/${repo}`); // owner is namespace

    for (const candidate of tokenCandidates) {
        try {
            let apiUrl = `${baseUrl}/api/v4/projects/${projectPath}/repository/tree?recursive=true&per_page=100`;
            if (ref && ref !== 'HEAD') {
                apiUrl += `&ref=${ref}`;
            }

            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${candidate.token}` }
            });

            if (!response.ok) {
                // If 401/403, try next token
                if (response.status === 401 || response.status === 403) continue;
                throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Transform to match GitHub tree format expected by frontend
            // GitLab returns array of { id, name, type, path, mode }
            // GitHub returns { tree: [ { path, mode, type, sha, size, url } ] }
            // Expected type: 'tree' or 'blob'

            // GitLab type: 'tree' or 'blob'. Compatible.

            return NextResponse.json({ tree: data });

        } catch (error) {
            console.error('[gitlab/tree] Error:', error);
            // continue to next token if possible, or fail at end
        }
    }

    return NextResponse.json({ error: 'Failed to fetch repository tree' }, { status: 500 });
}
