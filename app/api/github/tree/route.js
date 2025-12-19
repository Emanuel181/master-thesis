import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';

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
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

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

    if (!githubAccount || !githubAccount.access_token) {
        return NextResponse.json({ error: 'GitHub account not linked' }, { status: 401 });
    }

    try {
        const octokit = new Octokit({ auth: githubAccount.access_token });

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
            const { data: refData } = await octokit.git.getRef({
                owner,
                repo,
                ref: `heads/${ref}`,
            });
            commitSha = refData.object.sha;
        }

        // Get the tree
        const { data: tree } = await octokit.git.getTree({
            owner,
            repo,
            tree_sha: commitSha,
            recursive: 'true',
        });

        return NextResponse.json(tree);
    } catch (error) {
        console.error('Error fetching tree:', error);
        return NextResponse.json({ error: 'Failed to fetch repository tree' }, { status: 500 });
    }
}
