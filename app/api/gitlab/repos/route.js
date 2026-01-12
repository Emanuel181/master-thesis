import prisma from '@/lib/prisma';
import { withCircuitBreaker } from '@/lib/distributed-circuit-breaker';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';

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

export const GET = createApiHandler(
    async (request, { session, requestId }) => {
        const start = Date.now();
        const isDev = process.env.NODE_ENV === 'development';

        // Get the user from database (prefer id; email is mutable)
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });

        if (!user) {
            return ApiErrors.unauthorized(requestId);
        }

        // Fetch GitLab access token from database
        const gitlabAccount = await prisma.account.findFirst({
            where: {
                userId: user.id,
                provider: 'gitlab',
            },
        });

        if (!gitlabAccount?.access_token) {
            return ApiErrors.unauthorized(requestId);
        }

        let currentToken = gitlabAccount.access_token;

        const fetchProjects = async () => {
            const baseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
            const perPage = 100;
            let page = 1;
            const projects = [];

            while (true) {
                const apiUrl = `${baseUrl}/api/v4/projects?membership=true&per_page=${perPage}&page=${page}&order_by=updated_at&sort=desc`;

                let response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${currentToken}`
                    }
                });

                // Handle 401 Unauthorized by attempting refresh
                if (response.status === 401 && gitlabAccount?.refresh_token) {
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
                        
                        // Update current token and retry request
                        currentToken = newTokens.access_token;
                        response = await fetch(apiUrl, {
                            headers: {
                                'Authorization': `Bearer ${currentToken}`
                            }
                        });
                    }
                }

                if (!response.ok) {
                    // Throw to trigger circuit breaker
                    throw new Error(`GitLab API error: ${response.status}`);
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
            return projects;
        };

        try {
            // Execute with circuit breaker
            const fetchedProjects = await withCircuitBreaker('gitlab-api', fetchProjects);

            const repos = fetchedProjects.map(project => ({
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

            if (isDev) {
                console.log('[gitlab/repos] fetched projects:', fetchedProjects.length, `in ${Date.now() - start}ms`);
            }

            return repos;
        } catch (err) {
            if (isDev) {
                console.error('[gitlab/repos] error:', err?.message || err);
            }
            return errorResponse('Failed to fetch repositories', { 
                status: 502, 
                requestId,
                details: err?.message || 'Unknown error'
            });
        }
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'gitlab:repos' },
    }
);
