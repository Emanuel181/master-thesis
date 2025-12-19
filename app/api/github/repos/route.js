import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
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
        console.log('[github/repos] auth session:', !!session, session?.user?.email ?? null);

        if (!session) {
            console.warn('[github/repos] No session');
            return NextResponse.json({ error: 'Unauthorized', debug: { session: false } }, { status: 401 });
        }

        // Get the user from database
        let user = null;
        if (session.user?.email) {
            user = await prisma.user.findUnique({ where: { email: session.user.email } });
            console.log('[github/repos] looked up user by email:', session.user.email, 'found:', !!user);
        }
        if (!user && session.user?.id) {
            user = await prisma.user.findUnique({ where: { id: session.user.id } });
            console.log('[github/repos] looked up user by id:', session.user.id, 'found:', !!user);
        }

        if (!user) {
            console.warn('[github/repos] User not found. session.user:', session.user);
            return NextResponse.json({ error: 'User not found', debug: { sessionUser: session.user } }, { status: 401 });
        }

        // Fetch GitHub access token from database
        const githubAccount = await prisma.account.findFirst({
            where: {
                userId: user.id,
                provider: 'github',
            },
        });

        console.log('[github/repos] githubAccount found:', !!githubAccount, githubAccount ? { provider: githubAccount.provider, providerAccountId: githubAccount.providerAccountId, scope: githubAccount.scope, tokenMask: maskToken(githubAccount.access_token) } : null);

        if (!githubAccount || !githubAccount.access_token) {
            console.warn('[github/repos] No github account or access token stored in DB');
        }

        // Try tokens in order: session.accessToken (fresh), then DB token
        const tokenCandidates = [];
        if (session.accessToken) tokenCandidates.push({ source: 'session', token: session.accessToken });
        if (githubAccount && githubAccount.access_token) tokenCandidates.push({ source: 'db', token: githubAccount.access_token });

        if (tokenCandidates.length === 0) {
            return NextResponse.json({ error: 'GitHub account not linked', debug: { hasAccount: !!githubAccount, accessTokenMask: maskToken(githubAccount?.access_token) } }, { status: 401 });
        }

        let lastError = null;
        for (const candidate of tokenCandidates) {
            try {
                console.log('[github/repos] trying token from', candidate.source, 'tokenMask:', maskToken(candidate.token));
                const octokit = new Octokit({ auth: candidate.token });
                const { data: repos } = await octokit.repos.listForAuthenticatedUser({
                    sort: 'updated',
                    per_page: 100,
                });

                console.log('[github/repos] fetched repos count:', Array.isArray(repos) ? repos.length : 0, `in ${Date.now() - start}ms`, 'usedTokenFrom:', candidate.source);
                return NextResponse.json(repos);
            } catch (err) {
                console.error('[github/repos] Octokit error with', candidate.source, 'token:', err.message || err);
                lastError = err;
                // if 401, try next candidate
                const statusCode = err.status || err.statusCode || (err.response && err.response.status) || 500;
                if (statusCode === 401 || statusCode === 403) {
                    console.warn('[github/repos] token from', candidate.source, 'was rejected (status', statusCode, '), trying next if available');
                    continue;
                }
                // for other errors, return immediately with debug
                const message = err.message || 'Octokit request failed';
                return NextResponse.json({ error: 'Failed to fetch repositories', debug: { message, statusCode, tokenMask: maskToken(candidate.token) } }, { status: statusCode });
            }
        }

        // if we got here, all candidates failed (likely 401)
        const statusCode = (lastError && (lastError.status || lastError.statusCode || (lastError.response && lastError.response.status))) || 401;
        const message = lastError?.message || 'All token attempts failed';
        return NextResponse.json({ error: 'Failed to fetch repositories', debug: { message, statusCode, tokenMask: maskToken(tokenCandidates[0].token) } }, { status: statusCode });
    } catch (error) {
        console.error('[github/repos] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error', debug: { message: error.message } }, { status: 500 });
    }
}
