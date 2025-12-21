import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path');
    const ref = searchParams.get('ref') || 'main'; // GitLab defaults to default branch if not specified, but usually main/master
    const decode = searchParams.get('decode');

    if (!owner || !repo || !path) {
        return NextResponse.json({ error: 'Missing owner, repo, or path' }, { status: 400 });
    }

    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user
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

    // Fetch GitLab access token
    const gitlabAccount = await prisma.account.findFirst({
        where: { userId: user.id, provider: 'gitlab' },
    });

    const tokenCandidates = [];
    // Only use session token if it's from GitLab login
    if (session.accessToken && session.provider === 'gitlab') {
        tokenCandidates.push({ source: 'session', token: session.accessToken });
    }
    if (gitlabAccount && gitlabAccount.access_token) {
        tokenCandidates.push({ source: 'db', token: gitlabAccount.access_token });
    }

    if (tokenCandidates.length === 0) {
        return NextResponse.json({ error: 'GitLab account not linked' }, { status: 401 });
    }

    const baseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
    const projectPath = encodeURIComponent(`${owner}/${repo}`);
    const filePath = encodeURIComponent(path);

    for (const candidate of tokenCandidates) {
        try {
            // Check if looking for default branch ref
            let targetRef = ref;
            if (targetRef === 'HEAD') {
                // If HEAD, we might need to find the default branch or just omit ref.
                // Safest to omit ref if possible or use 'main'/'master' if we knew it.
                // However, GitLab API without ref defaults to default branch.
                targetRef = null;
            }

            let apiUrl = `${baseUrl}/api/v4/projects/${projectPath}/repository/files/${filePath}`;
            if (targetRef) {
                apiUrl += `?ref=${targetRef}`;
            } else {
                apiUrl += `?ref=main`; // Fallback to main if HEAD, or maybe fetch project info to get default branch? 
                // Actually, let's try to not pass ref if it's null, but GitLab files API REQUIRED 'ref' param in some versions.
                // Documentation says: `ref` (required) - The name of branch, tag or commit.
            }

            // Note: If ref was HEAD and we defaulted to main, it might fail if default is master.
            // Better strategy: If HEAD, fetch project info to get default_branch.
            if (ref === 'HEAD') {
                const projectUrl = `${baseUrl}/api/v4/projects/${projectPath}`;
                const projectRes = await fetch(projectUrl, {
                    headers: { 'Authorization': `Bearer ${candidate.token}` }
                });
                if (projectRes.ok) {
                    const projectData = await projectRes.json();
                    targetRef = projectData.default_branch;
                    apiUrl = `${baseUrl}/api/v4/projects/${projectPath}/repository/files/${filePath}?ref=${targetRef}`;
                } else {
                    // Fallback
                    apiUrl = `${baseUrl}/api/v4/projects/${projectPath}/repository/files/${filePath}?ref=main`;
                }
            }


            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${candidate.token}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) continue;
                // If 404, maybe file doesn't exist
                if (response.status === 404) {
                    return NextResponse.json({ error: 'File not found' }, { status: 404 });
                }
                throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (decode === '1' && data && data.encoding === 'base64' && typeof data.content === 'string') {
                const cleaned = data.content.replace(/[\r\n]+/g, '');
                const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
                return NextResponse.json({
                    ...data,
                    content: decoded,
                    encoding: 'utf-8',
                });
            }
            return NextResponse.json(data);

        } catch (error) {
            console.error('[gitlab/contents] Error:', error);
        }
    }

    return NextResponse.json({ error: 'Failed to fetch file content' }, { status: 500 });
}
