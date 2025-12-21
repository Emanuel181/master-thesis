import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

function maskToken(token) {
    if (!token) return null;
    if (token.length <= 10) return token.replace(/.(?=.{4})/g, '*');
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export async function GET(request) {
    const start = Date.now();
    try {
        const session = await auth();
        console.log('[gitlab/repos] auth session:', !!session, session?.user?.email ?? null);

        if (!session) {
            console.warn('[gitlab/repos] No session');
            return NextResponse.json({ error: 'Unauthorized', debug: { session: false } }, { status: 401 });
        }

        // Get the user from database
        let user = null;
        if (session.user?.email) {
            user = await prisma.user.findUnique({ where: { email: session.user.email } });
            console.log('[gitlab/repos] looked up user by email:', session.user.email, 'found:', !!user);
        }
        if (!user && session.user?.id) {
            user = await prisma.user.findUnique({ where: { id: session.user.id } });
            console.log('[gitlab/repos] looked up user by id:', session.user.id, 'found:', !!user);
        }

        if (!user) {
            console.warn('[gitlab/repos] User not found. session.user:', session.user);
            return NextResponse.json({ error: 'User not found', debug: { sessionUser: session.user } }, { status: 401 });
        }

        // Fetch GitLab access token from database
        const gitlabAccount = await prisma.account.findFirst({
            where: {
                userId: user.id,
                provider: 'gitlab',
            },
        });

        console.log('[gitlab/repos] gitlabAccount found:', !!gitlabAccount, gitlabAccount ? { provider: gitlabAccount.provider, providerAccountId: gitlabAccount.providerAccountId, scope: gitlabAccount.scope, tokenMask: maskToken(gitlabAccount.access_token) } : null);

        if (!gitlabAccount || !gitlabAccount.access_token) {
            console.warn('[gitlab/repos] No gitlab account or access token stored in DB');
        }

        // Try tokens in order: session.accessToken (only if from gitlab), then DB token
        const tokenCandidates = [];
        // Only use session token if it's from GitLab login and account exists
        if (gitlabAccount && session.accessToken && session.provider === 'gitlab') {
            tokenCandidates.push({ source: 'session', token: session.accessToken });
        }
        if (gitlabAccount && gitlabAccount.access_token) {
            tokenCandidates.push({ source: 'db', token: gitlabAccount.access_token });
        }

        if (tokenCandidates.length === 0) {
            return NextResponse.json({ error: 'GitLab account not linked', debug: { hasAccount: !!gitlabAccount, accessTokenMask: maskToken(gitlabAccount?.access_token) } }, { status: 401 });
        }

        let lastError = null;
        for (const candidate of tokenCandidates) {
            try {
                console.log('[gitlab/repos] trying token from', candidate.source, 'tokenMask:', maskToken(candidate.token));

                const baseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
                const apiUrl = `${baseUrl}/api/v4/projects?membership=true&per_page=100&order_by=updated_at&sort=desc`;

                console.log('[gitlab/repos] making request to:', apiUrl);

                const response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${candidate.token}`
                    }
                });

                console.log('[gitlab/repos] response status:', response.status, response.statusText);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.log('[gitlab/repos] error response:', errorText);
                    throw new Error(`GitLab API error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const projects = await response.json();

                // Map GitLab projects to GitHub-like repo format
                const repos = projects.map(project => ({
                    id: project.id,
                    name: project.name,
                    full_name: project.path_with_namespace,
                    description: project.description,
                    html_url: project.web_url,
                    private: project.visibility === 'private',
                    fork: project.forked_from_project ? true : false,
                    updated_at: project.last_activity_at,
                    language: project.language || null,
                    owner: {
                        login: project.namespace.path,
                        id: project.namespace.id,
                        type: project.namespace.kind,
                    },
                }));

                console.log('[gitlab/repos] fetched projects count:', Array.isArray(projects) ? projects.length : 0, `in ${Date.now() - start}ms`, 'usedTokenFrom:', candidate.source);
                return NextResponse.json(repos);
            } catch (err) {
                console.error('[gitlab/repos] Fetch error with', candidate.source, 'token:', err.message || err);
                lastError = err;
                // For simplicity, try next candidate
                continue;
            }
        }

        // if we got here, all candidates failed
        const message = lastError?.message || 'All token attempts failed';
        return NextResponse.json({ error: 'Failed to fetch repositories', debug: { message } }, { status: 500 });
    } catch (error) {
        console.error('[gitlab/repos] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error', debug: { message: error.message } }, { status: 500 });
    }
}
