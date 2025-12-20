// Small helper to fetch GitHub/GitLab repo tree and file contents via existing API routes
export async function fetchRepoTree(owner, repo, provider = 'github') {
    const endpoint = provider === 'gitlab' ? '/api/gitlab/tree' : '/api/github/tree';
    const response = await fetch(`${endpoint}?owner=${owner}&repo=${repo}`);
    if (!response.ok) throw new Error(`Failed to fetch repo tree from ${provider}`);
    const treeData = await response.json();

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

    return root;
}

export async function fetchFileContent(owner, repo, path, provider = 'github') {
    const endpoint = provider === 'gitlab' ? '/api/gitlab/contents' : '/api/github/contents';
    const response = await fetch(`${endpoint}?owner=${owner}&repo=${repo}&path=${encodeURIComponent(path)}`);
    if (!response.ok) throw new Error(`Failed to fetch file content from ${provider}`);
    const data = await response.json();

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

