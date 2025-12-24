import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { securityHeaders } from '@/lib/api-security';

function truncateDescription(description, maxLength = 50) {
    if (!description) return null;
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + '...';
}

export async function GET() {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    try {
        const session = await auth();
        // SECURITY: Only log in development (avoid PII)
        if (process.env.NODE_ENV === 'development') {
            console.log('[github/repos] auth session:', !!session);
        }

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
        }

        // Rate limiting - 60 requests per minute
        const rl = rateLimit({
            key: `github:repos:${session.user?.id}`,
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
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 100,
        });

        const transformedRepos = repos.map(repo => ({
            ...repo,
            shortDescription: truncateDescription(repo.description, 50),
        }));

        return NextResponse.json(transformedRepos, { headers: { ...securityHeaders, 'x-request-id': requestId } });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[github/repos] Unexpected error:', error);
        }
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
}
