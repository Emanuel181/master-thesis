import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

function maskToken(token) {
    if (!token) return null;
    if (token.length <= 10) return token.replace(/.(?=.{4})/g, '*');
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const ref = searchParams.get('ref') || 'HEAD';

    if (!owner || !repo) {
        return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
    }

    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    if (session.accessToken && session.provider === 'github') {
        tokenCandidates.push({ source: 'session', token: session.accessToken });
    }
    if (githubAccount && githubAccount.access_token) {
        tokenCandidates.push({ source: 'db', token: githubAccount.access_token });
    }

    if (tokenCandidates.length === 0) {
        return NextResponse.json({ error: 'GitHub account not linked', debug: { hasAccount: !!githubAccount, accessTokenMask: maskToken(githubAccount?.access_token) } }, { status: 401 });
    }

    let lastError = null;
    for (const candidate of tokenCandidates) {
        try {
            console.log('[github/tree] trying token from', candidate.source, 'tokenMask:', maskToken(candidate.token));
            const octokit = new Octokit({ auth: candidate.token });

            let commitSha;
            if (ref === 'HEAD') {
                // Get the default branch
                const { data: repoData } = await octokit.repos.get({ owner, repo });
                const defaultBranch = repoData.default_branch;
                const { data: refData } = await octokit.git.getRef({
                    owner,
                    repo,
                    ref: `heads/${defaultBranch}`,
                });
                commitSha = refData.object.sha;
            } else {
                // Assume ref is a commit SHA or branch/tag
                try {
                    const { data: refData } = await octokit.git.getRef({
                        owner,
                        repo,
                        ref: `heads/${ref}`,
                    });
                    commitSha = refData.object.sha;
                } catch {
                    // If not a branch, assume it's a commit SHA
                    commitSha = ref;
                }
            }

            // Fetch the tree
            const { data: treeData } = await octokit.git.getTree({
                owner,
                repo,
                tree_sha: commitSha,
                recursive: 'true',
            });

            console.log('[github/tree] fetched tree with', treeData.tree.length, 'items', `usedTokenFrom: ${candidate.source}`);
            return NextResponse.json({ tree: treeData.tree });
        } catch (err) {
            console.error('[github/tree] Octokit error with', candidate.source, 'token:', err.message || err);
            lastError = err;
            // if 401, try next candidate
            const statusCode = err.status || err.statusCode || (err.response && err.response.status) || 500;
            if (statusCode === 401 || statusCode === 403) {
                console.warn('[github/tree] token from', candidate.source, 'was rejected (status', statusCode, '), trying next if available');
                continue;
            }
            // for other errors, return immediately
            const message = err.message || 'Octokit request failed';
            return NextResponse.json({ error: 'Failed to fetch repo tree', debug: { message, statusCode, tokenMask: maskToken(candidate.token) } }, { status: statusCode });
        }
    }

    // if we got here, all candidates failed (likely 401)
    const statusCode = (lastError && (lastError.status || lastError.statusCode || (lastError.response && lastError.response.status))) || 401;
    const message = lastError?.message || 'All token attempts failed';
    return NextResponse.json({ error: 'Failed to fetch repo tree', debug: { message, statusCode, tokenMask: maskToken(tokenCandidates[0].token) } }, { status: statusCode });
}
