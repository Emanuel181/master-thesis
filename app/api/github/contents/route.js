import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { securityHeaders } from '@/lib/api-security';

export async function GET(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path');
    const ref = searchParams.get('ref') || 'HEAD';
    const decode = searchParams.get('decode');

    if (!owner || !repo || !path) {
        return NextResponse.json({ error: 'Missing owner, repo, or path', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    // Input validation - prevent injection and malformed inputs
    const ownerRepoPattern = /^[a-zA-Z0-9_.-]+$/;
    if (!ownerRepoPattern.test(owner) || owner.length > 100) {
        return NextResponse.json({ error: 'Invalid owner format', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
    if (!ownerRepoPattern.test(repo) || repo.length > 100) {
        return NextResponse.json({ error: 'Invalid repo format', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
    // Path validation - disallow traversal and limit length
    if (path.includes('..') || path.includes('\\') || path.length > 500) {
        return NextResponse.json({ error: 'Invalid path format', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    // Rate limiting - 120 requests per minute
    const rl = rateLimit({
        key: `github:contents:${session.user?.id}`,
        limit: 120,
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

    try {
        const octokit = new Octokit({ auth: githubAccount.access_token });
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
            }, { headers: { ...securityHeaders, 'x-request-id': requestId } });
        }
        return NextResponse.json(data, { headers: { ...securityHeaders, 'x-request-id': requestId } });
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[github/contents] Octokit error:', err.message || err);
        }
        const statusCode = err.status || err.statusCode || (err.response && err.response.status) || 500;
        return NextResponse.json({ error: 'Failed to fetch file content', requestId }, { status: statusCode, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
}
