import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { extractRepoInfo, createFixBranchAndPR } from '@/lib/github-pr-utils';

/**
 * POST /api/fixes/create-pr
 * Create a pull request with accepted fixes (manual trigger from UI)
 */
export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { runId, fixIds } = await request.json();

        if (!runId || !fixIds || fixIds.length === 0) {
            return NextResponse.json(
                { error: 'runId and fixIds are required' },
                { status: 400 }
            );
        }

        // Get accepted fixes
        const fixes = await prisma.codeFix.findMany({
            where: {
                id: { in: fixIds },
                status: 'ACCEPTED'
            },
            include: {
                vulnerability: {
                    include: {
                        workflowRun: true
                    }
                }
            }
        });

        if (fixes.length === 0) {
            return NextResponse.json(
                { error: 'No accepted fixes found' },
                { status: 400 }
            );
        }

        // Verify ownership: all fixes must belong to the authenticated user
        const unauthorized = fixes.some(
            fix => fix.vulnerability?.workflowRun?.userId !== session.user.id
        );
        if (unauthorized) {
            return NextResponse.json({ error: 'Fix not found' }, { status: 404 });
        }

        // Get user's GitHub token
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'github'
            }
        });

        if (!account?.access_token) {
            return NextResponse.json(
                { error: 'GitHub account not connected. Please connect your GitHub account.' },
                { status: 400 }
            );
        }

        // Get repo info from workflow run metadata
        const metadata = fixes[0].vulnerability.workflowRun.metadata;
        const repoInfo = extractRepoInfo(metadata);

        if (!repoInfo.owner || !repoInfo.repo) {
            return NextResponse.json(
                { error: 'Repository information not found in workflow metadata' },
                { status: 400 }
            );
        }

        try {
            const result = await createFixBranchAndPR(
                account.access_token,
                repoInfo.owner,
                repoInfo.repo,
                runId,
                fixes
            );

            // Update fixes with PR info
            await prisma.codeFix.updateMany({
                where: { id: { in: fixIds } },
                data: {
                    status: 'PR_CREATED',
                    prUrl: result.prUrl,
                    prNumber: result.prNumber,
                    branchName: result.branchName
                }
            });

            return NextResponse.json({
                success: true,
                prUrl: result.prUrl,
                prNumber: result.prNumber,
                branchName: result.branchName
            });

        } catch (githubError) {
            console.error('GitHub API error:', githubError);
            return NextResponse.json(
                { error: 'Failed to create pull request via GitHub' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Error creating PR:', error);
        return NextResponse.json(
            { error: 'Failed to create pull request' },
            { status: 500 }
        );
    }
}
