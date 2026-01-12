import { fetchWithTimeout } from './fetch-with-timeout';

// API request timeouts
const TREE_TIMEOUT_MS = 30000; // 30s for tree requests (can be large)
const FILE_TIMEOUT_MS = 15000; // 15s for file content requests

// Small helper to fetch GitHub/GitLab repo tree and file contents via existing API routes
export async function fetchRepoTree(owner, repo, provider = 'gitlab') {
    const endpoint = provider === 'gitlab' ? '/api/gitlab/tree' : '/api/github/tree';
    const response = await fetchWithTimeout(
        `${endpoint}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&shape=hierarchy`,
        {},
        TREE_TIMEOUT_MS
    );
    if (!response.ok) throw new Error(`Failed to fetch repo tree from ${provider}`);
    const jsonResponse = await response.json();
    
    // Handle wrapped response from createApiHandler
    const treeData = jsonResponse.data || jsonResponse;
    console.log('[fetchRepoTree] Response:', jsonResponse);
    console.log('[fetchRepoTree] Extracted treeData:', treeData);
    console.log('[fetchRepoTree] treeData.root:', treeData?.root);

    if (treeData?.root && treeData.root.type === 'folder' && Array.isArray(treeData.root.children)) {
        console.log('[fetchRepoTree] Returning root with', treeData.root.children?.length, 'children');
        return treeData.root;
    }

    const root = {
        name: repo,
        path: '',
        type: 'folder',
        children: []
    };

    const pathMap = { '': root };

    // GitLab returns { tree: [...] }, GitHub returns { tree: [...] } (after our route normalized it)
    // or checks generic "tree" property
    const items = treeData.tree || [];
    console.log('[fetchRepoTree] Building tree from', items.length, 'items');

    items.forEach(item => {
        const parts = item.path.split('/');
        const parentPath = parts.slice(0, -1).join('/') || '';
        const parent = pathMap[parentPath];

        if (parent) {
            const node = {
                name: item.path.split('/').pop(),
                path: item.path,
                type: item.type === 'tree' ? 'folder' : 'file',
                children: item.type === 'tree' ? [] : undefined
            };
            parent.children.push(node);
            if (item.type === 'tree') {
                pathMap[item.path] = node;
            }
        }
    });

    console.log('[fetchRepoTree] Built root with', root.children?.length, 'children');
    return root;
}

export async function fetchFileContent(owner, repo, path, provider = 'github') {
    const endpoint = provider === 'gitlab' ? '/api/gitlab/contents' : '/api/github/contents';
    const response = await fetchWithTimeout(
        `${endpoint}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}&decode=1`,
        {},
        FILE_TIMEOUT_MS
    );
    if (!response.ok) throw new Error(`Failed to fetch file content from ${provider}`);
    const jsonResponse = await response.json();
    
    // Handle wrapped response from createApiHandler
    const data = jsonResponse.data || jsonResponse;

    let content = data.content;
    try {
        if (data.encoding === 'base64' && content) {
            const cleaned = content.replace(/[\r\n]+/g, '');
            if (typeof window !== 'undefined' && typeof window.atob === 'function') {
                content = atob(cleaned);
            } else {
                content = Buffer.from(cleaned, 'base64').toString('utf-8');
            }
        }
    } catch (err) {
        console.warn('Failed to decode base64 file content, leaving raw content:', err);
    }

    return {
        name: path.split('/').pop(),
        path,
        content,
        encoding: data.encoding,
        size: data.size,
    };
}

