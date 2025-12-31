import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { securityHeaders, getClientIp } from '@/lib/api-security';
import { rateLimit } from '@/lib/rate-limit';
import { requireProductionMode } from '@/lib/api-middleware';

export async function GET(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    
    // SECURITY: Block demo mode from accessing production GitLab contents API
    const demoBlock = requireProductionMode(request, { requestId });
    if (demoBlock) return demoBlock;
    
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path');
    const ref = searchParams.get('ref') || 'main'; // GitLab defaults to default branch if not specified, but usually main/master
    const decode = searchParams.get('decode');

    if (!owner || !repo || !path) {
        return NextResponse.json({ error: 'Missing owner, repo, or path', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    // Input validation - prevent injection/malformed inputs
    const ownerRepoPattern = /^[a-zA-Z0-9_.-]+$/;
    if (!ownerRepoPattern.test(owner) || owner.length > 100) {
        return NextResponse.json({ error: 'Invalid owner format', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
    if (!ownerRepoPattern.test(repo) || repo.length > 100) {
        return NextResponse.json({ error: 'Invalid repo format', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
    if (path.includes('..') || path.includes('\\') || path.length > 500) {
        return NextResponse.json({ error: 'Invalid path format', requestId }, { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    // Rate limiting - 120 requests per minute
    const clientIp = getClientIp(request);
    const rl = await rateLimit({ key: `gitlab:contents:${session.user.id}:${clientIp}`, limit: 120, windowMs: 60_000 });
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
    const projectPath = encodeURIComponent(`${owner}/${repo}`);
    const filePath = encodeURIComponent(path);

    try {
        // Check if looking for default branch ref
        let targetRef = ref;
        if (targetRef === 'HEAD') {
            // GitLab "files" API wants a ref; fetch project default branch.
            const projectUrl = `${baseUrl}/api/v4/projects/${projectPath}`;
            const projectRes = await fetch(projectUrl, {
                headers: { 'Authorization': `Bearer ${gitlabAccount.access_token}` }
            });
            if (projectRes.ok) {
                const projectData = await projectRes.json();
                targetRef = projectData.default_branch;
            } else {
                targetRef = 'main';
            }
        }

        const apiUrl = `${baseUrl}/api/v4/projects/${projectPath}/repository/files/${filePath}?ref=${encodeURIComponent(targetRef)}`;

        const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${gitlabAccount.access_token}` }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'File not found', requestId }, { status: 404, headers: { ...securityHeaders, 'x-request-id': requestId } });
            }
            const status = Number.isInteger(response.status) ? response.status : 502;
            return NextResponse.json({ error: 'Failed to fetch file content', requestId }, { status, headers: { ...securityHeaders, 'x-request-id': requestId } });
        }

        const data = await response.json();
        if (decode === '1' && data && data.encoding === 'base64' && typeof data.content === 'string') {
            const cleaned = data.content.replace(/[\r\n]+/g, '');
            const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
            return NextResponse.json({
                ...data,
                content: decoded,
                encoding: 'utf-8',
                requestId,
            }, { headers: { ...securityHeaders, 'x-request-id': requestId } });
        }
        return NextResponse.json({ ...data, requestId }, { headers: { ...securityHeaders, 'x-request-id': requestId } });

    } catch (error) {
        console.error('[gitlab/contents] Error:', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
}
