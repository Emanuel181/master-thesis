import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path');
    const ref = searchParams.get('ref') || 'HEAD';
    const decode = searchParams.get('decode');

    if (!owner || !repo || !path) {
        return NextResponse.json({ error: 'Missing owner, repo, or path' }, { status: 400 });
    }

    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - 120 requests per minute
    const rl = rateLimit({
        key: `github:contents:${session.user?.id}`,
        limit: 120,
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
    // Only use session token if it's from GitHub login
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
            const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path,
                ref,
            });

            if (decode === '1' && data && !Array.isArray(data) && data.encoding === 'base64' && typeof data.content === 'string') {
                const cleaned = data.content.replace(/[\r\n]+/g, '');
                const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
                return NextResponse.json({
                    ...data,
                    content: decoded,
                    encoding: 'utf-8',
                });
            }
            return NextResponse.json(data);
        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('[github/contents] Octokit error:', err.message || err);
            }
            lastError = err;
            // if 401, try next candidate
            const statusCode = err.status || err.statusCode || (err.response && err.response.status) || 500;
            if (statusCode === 401 || statusCode === 403) {
                continue;
            }
            // for other errors, return immediately
            return NextResponse.json({ error: 'Failed to fetch file content' }, { status: statusCode });
        }
    }

    // if we got here, all candidates failed (likely 401)
    const statusCode = (lastError && (lastError.status || lastError.statusCode || (lastError.response && lastError.response.status))) || 401;
    return NextResponse.json({ error: 'Failed to fetch file content' }, { status: statusCode });
}
