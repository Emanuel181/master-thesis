import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { securityHeaders } from '@/lib/api-security';
import { requireProductionMode } from '@/lib/api-middleware';
import { withCircuitBreaker } from '@/lib/distributed-circuit-breaker';

function truncateDescription(description, maxLength = 50) {
    if (!description) return null;
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + '...';
}

export async function GET(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    
    // SECURITY: Block demo mode from accessing production GitHub API
    const demoBlock = requireProductionMode(request, { requestId });
    if (demoBlock) return demoBlock;
    
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
        const rl = await rateLimit({
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

        // Use distributed circuit breaker for GitHub API calls
        const octokit = new Octokit({ auth: githubAccount.access_token });
        const repos = await withCircuitBreaker('github-api', async () => {
            const { data } = await octokit.repos.listForAuthenticatedUser({
                sort: 'updated',
                per_page: 100,
            });
            return data;
        });

        const transformedRepos = repos.map(repo => ({
            ...repo,
            shortDescription: truncateDescription(repo.description, 50),
        }));

        return NextResponse.json(transformedRepos, { headers: { ...securityHeaders, 'x-request-id': requestId } });
    } catch (error) {
        // Handle circuit breaker open state
        if (error.code === 'CIRCUIT_OPEN') {
            return NextResponse.json(
                { error: 'GitHub API is temporarily unavailable. Please try again later.', retryAfter: error.retryAfter, requestId },
                { status: 503, headers: { ...securityHeaders, 'x-request-id': requestId, 'Retry-After': Math.ceil((error.retryAfter || 30000) / 1000) } }
            );
        }
        if (process.env.NODE_ENV === 'development') {
            console.error('[github/repos] Unexpected error:', error);
        }
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
}
