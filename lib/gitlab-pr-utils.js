/**
 * GitLab Merge Request utilities — mirror of lib/github-pr-utils.js.
 * Uses @gitbeaker/rest (maintained, typed GitLab SDK).
 */

import { Gitlab } from '@gitbeaker/rest';
import { applyFix, groupFixesByFile, generatePRDescription } from '@/lib/github-pr-utils';

/**
 * Extract GitLab project id/path from workflow metadata.
 * Accepts either `currentRepo.projectId` (preferred) or owner/repo which we
 * join to "{owner}/{repo}" (GitLab treats the encoded path as the project id).
 */
export function extractGitlabProject(metadata) {
    if (metadata?.currentRepo?.projectId) {
        return { projectId: String(metadata.currentRepo.projectId) };
    }
    if (metadata?.currentRepo?.owner && metadata?.currentRepo?.repo) {
        return { projectId: `${metadata.currentRepo.owner}/${metadata.currentRepo.repo}` };
    }
    if (typeof metadata?.code?.projectName === 'string' && metadata.code.projectName.includes('/')) {
        return { projectId: metadata.code.projectName };
    }
    return { projectId: null };
}

/**
 * Fetch, patch and commit a single file on `branchName`.
 */
async function applyFixesToFileGitlab(api, projectId, filePath, fileFixes, branchName) {
    const file = await api.RepositoryFiles.show(projectId, filePath, branchName);
    let content = Buffer.from(file.content, 'base64').toString('utf-8');

    const sorted = [...fileFixes].sort((a, b) => (b.startLine || 0) - (a.startLine || 0));
    for (const fix of sorted) content = applyFix(content, fix);

    const commitMessage = `fix: Security fixes for ${filePath}\n\n` +
        fileFixes.map(f => `- ${f.vulnerability?.title || f.explanation || 'Security fix'}`).join('\n');

    await api.Commits.create(projectId, branchName, commitMessage, [
        { action: 'update', filePath, content },
    ]);
}

/**
 * Create a branch, commit all fixes and open a merge request.
 * Returns { prUrl, prNumber, branchName, commitSha }.
 */
export async function createFixBranchAndMR(accessToken, projectId, runId, fixes) {
    const api = new Gitlab({ token: accessToken });

    const project = await api.Projects.show(projectId);
    const defaultBranch = project.default_branch || 'main';
    const branchName = `fix/security-${runId.substring(0, 8)}`;

    await api.Branches.create(projectId, branchName, defaultBranch);

    const grouped = groupFixesByFile(fixes);
    for (const [filePath, fileFixes] of Object.entries(grouped)) {
        await applyFixesToFileGitlab(api, projectId, filePath, fileFixes, branchName);
    }

    const mr = await api.MergeRequests.create(
        projectId,
        branchName,
        defaultBranch,
        `Security Fixes - ${fixes.length} vulnerabilities`,
        { description: generatePRDescription(fixes, { owner: '', repo: '' }) },
    );

    // Latest commit on the new branch
    let commitSha = null;
    try {
        const head = await api.Branches.show(projectId, branchName);
        commitSha = head?.commit?.id || null;
    } catch { /* non-fatal */ }

    return {
        prUrl: mr.web_url,
        prNumber: mr.iid,
        branchName,
        commitSha,
    };
}

