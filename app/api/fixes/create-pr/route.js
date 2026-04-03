import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Octokit } from '@octokit/rest';

/**
 * POST /api/fixes/create-pr
 * Create a pull request with accepted fixes
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
        
        const octokit = new Octokit({ auth: account.access_token });
        
        try {
            // Create branch
            const branchName = `fix/security-${runId.substring(0, 8)}`;
            
            // Get default branch
            const { data: repoData } = await octokit.repos.get({
                owner: repoInfo.owner,
                repo: repoInfo.repo
            });
            const defaultBranch = repoData.default_branch || 'main';
            
            // Get reference to default branch
            const { data: ref } = await octokit.git.getRef({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                ref: `heads/${defaultBranch}`
            });
            
            // Create new branch
            await octokit.git.createRef({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                ref: `refs/heads/${branchName}`,
                sha: ref.object.sha
            });
            
            // Group fixes by file
            const fixesByFile = groupFixesByFile(fixes);
            
            // Apply fixes to each file
            for (const [fileName, fileFixes] of Object.entries(fixesByFile)) {
                await applyFixesToFile(
                    octokit,
                    repoInfo.owner,
                    repoInfo.repo,
                    fileName,
                    fileFixes,
                    branchName
                );
            }
            
            // Create pull request
            const prBody = generatePRDescription(fixes, repoInfo);
            const { data: pr } = await octokit.pulls.create({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                title: `🔒 Security Fixes - ${fixes.length} vulnerabilities`,
                head: branchName,
                base: defaultBranch,
                body: prBody
            });
            
            // Update fixes with PR info
            await prisma.codeFix.updateMany({
                where: { id: { in: fixIds } },
                data: {
                    status: 'PR_CREATED',
                    prUrl: pr.html_url,
                    prNumber: pr.number,
                    branchName: branchName
                }
            });
            
            return NextResponse.json({
                success: true,
                prUrl: pr.html_url,
                prNumber: pr.number,
                branchName: branchName
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

function extractRepoInfo(metadata) {
    // Try to extract repo info from metadata
    if (metadata?.code?.projectName) {
        // Format: "owner/repo" or just "repo"
        const parts = metadata.code.projectName.split('/');
        if (parts.length === 2) {
            return { owner: parts[0], repo: parts[1] };
        }
    }
    
    // Try from currentRepo if available
    if (metadata?.currentRepo) {
        return {
            owner: metadata.currentRepo.owner,
            repo: metadata.currentRepo.repo
        };
    }
    
    return { owner: null, repo: null };
}

function groupFixesByFile(fixes) {
    const grouped = {};
    for (const fix of fixes) {
        if (!grouped[fix.fileName]) {
            grouped[fix.fileName] = [];
        }
        grouped[fix.fileName].push(fix);
    }
    return grouped;
}

async function applyFixesToFile(octokit, owner, repo, fileName, fileFixes, branchName) {
    try {
        // Get current file content
        const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path: fileName,
            ref: branchName
        });
        
        // Decode content
        let content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        
        // Sort fixes by line number (descending) to apply from bottom to top
        const sortedFixes = fileFixes.sort((a, b) => (b.startLine || 0) - (a.startLine || 0));
        
        // Apply each fix
        for (const fix of sortedFixes) {
            content = applyFix(content, fix);
        }
        
        // Commit the fixed file
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: fileName,
            message: `fix: Security fixes for ${fileName}\n\n${fileFixes.map(f => `- ${f.vulnerability.title}`).join('\n')}`,
            content: Buffer.from(content).toString('base64'),
            branch: branchName,
            sha: fileData.sha
        });
        
    } catch (error) {
        console.error(`Error applying fixes to ${fileName}:`, error);
        throw error;
    }
}

function applyFix(content, fix) {
    const lines = content.split('\n');
    
    if (fix.startLine && fix.endLine) {
        const startIdx = fix.startLine - 1;
        const endIdx = fix.endLine;
        
        // Replace vulnerable lines with fixed code
        const fixedLines = fix.fixedCode.split('\n');
        lines.splice(startIdx, endIdx - startIdx, ...fixedLines);
    } else {
        // If no line numbers, try to find and replace the original code
        const originalLines = fix.originalCode.split('\n');
        const contentStr = lines.join('\n');
        const fixedContent = contentStr.replace(fix.originalCode, fix.fixedCode);
        return fixedContent;
    }
    
    return lines.join('\n');
}

function generatePRDescription(fixes, repoInfo) {
    const vulnCount = fixes.length;
    const fileCount = Object.keys(groupFixesByFile(fixes)).length;
    
    const severityCounts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0
    };
    
    fixes.forEach(fix => {
        const severity = fix.vulnerability.severity;
        if (severityCounts[severity] !== undefined) {
            severityCounts[severity]++;
        }
    });
    
    let description = `## 🔒 Automated Security Fixes\n\n`;
    description += `This PR contains automated fixes for **${vulnCount} security vulnerabilities** across **${fileCount} files**.\n\n`;
    
    description += `### Severity Breakdown\n\n`;
    description += `- 🔴 Critical: ${severityCounts.Critical}\n`;
    description += `- 🟠 High: ${severityCounts.High}\n`;
    description += `- 🟡 Medium: ${severityCounts.Medium}\n`;
    description += `- 🟢 Low: ${severityCounts.Low}\n\n`;
    
    description += `### Fixed Vulnerabilities\n\n`;
    
    const fixesByFile = groupFixesByFile(fixes);
    for (const [fileName, fileFixes] of Object.entries(fixesByFile)) {
        description += `#### \`${fileName}\`\n\n`;
        for (const fix of fileFixes) {
            description += `**${fix.vulnerability.title}** (${fix.vulnerability.severity})\n`;
            description += `- **Type**: ${fix.vulnerability.type}\n`;
            description += `- **Line**: ${fix.startLine || 'N/A'}\n`;
            description += `- **Fix**: ${fix.explanation}\n\n`;
        }
    }
    
    description += `### Review Checklist\n\n`;
    description += `- [ ] All tests pass\n`;
    description += `- [ ] No breaking changes introduced\n`;
    description += `- [ ] Security improvements verified\n`;
    description += `- [ ] Code review completed\n\n`;
    
    description += `---\n\n`;
    description += `*🤖 Generated by [VulnIQ](https://vulniq.org) - Automated Security Analysis*\n`;
    description += `*Review the changes carefully before merging.*`;
    
    return description;
}
