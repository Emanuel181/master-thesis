import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

function maskToken(token) {
    if (!token) return null;
    if (token.length <= 10) return token.replace(/.(?=.{4})/g, '*');
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function truncateDescription(description, maxLength = 50) {
    if (!description) return null;
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + '...';
}

export async function GET(request) {
    const start = Date.now();
    try {
        const session = await auth();
        // SECURITY: Only log in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[github/repos] auth session:', !!session, session?.user?.email ?? null);
        }

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limiting - 60 requests per minute
        const rl = rateLimit({
            key: `github:repos:${session.user?.id}`,
            limit: 60,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429 }
            );
        }

        // Get the user from database
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

        // Fetch GitHub access token from database
        const githubAccount = await prisma.account.findFirst({
            where: {
                userId: user.id,
                provider: 'github',
            },
        });

        // Try tokens in order: session.accessToken (only if from github), then DB token
        const tokenCandidates = [];
        // Only use session token if it's from GitHub login and account exists
        if (githubAccount && session.accessToken && session.provider === 'github') {
            tokenCandidates.push({ source: 'session', token: session.accessToken });
        }
        if (githubAccount && githubAccount.access_token) {
            tokenCandidates.push({ source: 'db', token: githubAccount.access_token });
        }

        if (tokenCandidates.length === 0) {
            return NextResponse.json({ error: 'GitHub account not linked' }, { status: 401 });
        }

        let lastError = null;
        for (const candidate of tokenCandidates) {
            try {
                const octokit = new Octokit({ auth: candidate.token });
                const { data: repos } = await octokit.repos.listForAuthenticatedUser({
                    sort: 'updated',
                    per_page: 100,
                });

                // Transform repos to include shortDescription
                const transformedRepos = repos.map(repo => ({
                    ...repo,
                    shortDescription: truncateDescription(repo.description, 50),
                }));

                return NextResponse.json(transformedRepos);
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('[github/repos] Octokit error with', candidate.source, 'token:', err.message || err);
                }
                lastError = err;
                // if 401, try next candidate
                const statusCode = err.status || err.statusCode || (err.response && err.response.status) || 500;
                if (statusCode === 401 || statusCode === 403) {
                    continue;
                }
                // for other errors, return immediately
                return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: statusCode });
            }
        }

        // if we got here, all candidates failed (likely 401)
        const statusCode = (lastError && (lastError.status || lastError.statusCode || (lastError.response && lastError.response.status))) || 401;
        return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: statusCode });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[github/repos] Unexpected error:', error);
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
