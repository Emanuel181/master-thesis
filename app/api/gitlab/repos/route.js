import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { securityHeaders, getClientIp } from '@/lib/api-security';
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

async function refreshGitLabToken(refreshToken) {
    try {
        const params = new URLSearchParams({
            client_id: process.env.AUTH_GITLAB_ID,
            client_secret: process.env.AUTH_GITLAB_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/gitlab`
        });

        const response = await fetch('https://gitlab.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[gitlab/refresh] failed to refresh token:', response.status, error);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('[gitlab/refresh] network error:', error);
        return null;
    }
}

export async function GET(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const start = Date.now();
    try {
        const session = await auth();
        if (process.env.NODE_ENV === 'development') {
            console.log('[gitlab/repos] auth session:', !!session);
        }

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
        }

        const clientIp = getClientIp(request);
        const rl = rateLimit({ key: `gitlab:repos:${session.user.id}:${clientIp}`, limit: 60, windowMs: 60_000 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
                { status: 429, headers: { ...securityHeaders, 'x-request-id': requestId } }
            );
        }

        // Get the user from database (prefer id; email is mutable)
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });

        if (!user) {
            return NextResponse.json({ error: 'User not found', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
        }

        // Fetch GitLab access token from database
        const gitlabAccount = await prisma.account.findFirst({
            where: {
                userId: user.id,
                provider: 'gitlab',
            },
        });

        // Try DB token only (do not expose OAuth tokens to the browser session)
        const tokenCandidates = [];
        if (gitlabAccount?.access_token) {
            tokenCandidates.push({ source: 'db', token: gitlabAccount.access_token });
        }

        if (tokenCandidates.length === 0) {
            return NextResponse.json({ error: 'GitLab account not linked', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
        }

        let lastError = null;
        for (const candidate of tokenCandidates) {
            try {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[gitlab/repos] trying token from', candidate.source, 'tokenMask:', maskToken(candidate.token));
                }

                const baseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
                const perPage = 100;
                let page = 1;
                const projects = [];

                while (true) {
                    const apiUrl = `${baseUrl}/api/v4/projects?membership=true&per_page=${perPage}&page=${page}&order_by=updated_at&sort=desc`;

                    let response = await fetch(apiUrl, {
                        headers: {
                            'Authorization': `Bearer ${candidate.token}`
                        }
                    });

                    // Handle 401 Unauthorized by attempting refresh
                    if (response.status === 401 && candidate.source === 'db' && gitlabAccount?.refresh_token) {
                        console.log('[gitlab/repos] 401 received, attempting token refresh...');
                        const newTokens = await refreshGitLabToken(gitlabAccount.refresh_token);
                        
                        if (newTokens?.access_token) {
                            // Update database with new tokens
                            await prisma.account.update({
                                where: { id: gitlabAccount.id },
                                data: {
                                    access_token: newTokens.access_token,
                                    refresh_token: newTokens.refresh_token || gitlabAccount.refresh_token,
                                    expires_at: Math.floor(Date.now() / 1000) + newTokens.expires_in,
                                    token_type: newTokens.token_type
                                }
                            });
                            
                            console.log('[gitlab/repos] token refreshed successfully');
                            
                            // Update current candidate token and retry request
                            candidate.token = newTokens.access_token;
                            response = await fetch(apiUrl, {
                                headers: {
                                    'Authorization': `Bearer ${candidate.token}`
                                }
                            });
                        }
                    }

                    if (!response.ok) {
                        // Avoid reflecting upstream error bodies back to clients (may include sensitive info)
                        lastError = new Error(`GitLab API error: ${response.status}`);
                        break;
                    }

                    const batch = await response.json();
                    if (Array.isArray(batch) && batch.length > 0) {
                        projects.push(...batch);
                    }

                    const nextPage = response.headers.get('x-next-page');
                    if (nextPage) {
                        page = Number(nextPage);
                        if (!Number.isFinite(page) || page <= 0) break;
                        continue;
                    }

                    if (!Array.isArray(batch) || batch.length < perPage) break;
                    page += 1;
                }

                // If we broke out due to error, try next token candidate.
                if (lastError) {
                    continue;
                }

                const repos = projects.map(project => ({
                    id: project.id,
                    name: project.name,
                    full_name: project.path_with_namespace,
                    description: project.description,
                    shortDescription: truncateDescription(project.description, 50),
                    html_url: project.web_url,
                    private: project.visibility === 'private',
                    fork: Boolean(project.forked_from_project),
                    updated_at: project.last_activity_at,
                    language: project.language || null,
                    owner: {
                        login: project.namespace?.path,
                        id: project.namespace?.id,
                        type: project.namespace?.kind,
                    },
                }));

                if (process.env.NODE_ENV === 'development') {
                    console.log('[gitlab/repos] fetched projects:', projects.length, `in ${Date.now() - start}ms`, 'usedTokenFrom:', candidate.source);
                }

                return NextResponse.json(repos, { headers: { ...securityHeaders, 'x-request-id': requestId } });
            } catch (err) {
                lastError = err;
                if (process.env.NODE_ENV === 'development') {
                    console.error('[gitlab/repos] error with', candidate.source, err?.message || err);
                }
            }
        }

        return NextResponse.json({ 
            error: 'Failed to fetch repositories', 
            details: lastError?.message || 'Unknown error',
            requestId 
        }, { status: 502, headers: { ...securityHeaders, 'x-request-id': requestId } });
    } catch (error) {
        console.error('[gitlab/repos] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }
}
