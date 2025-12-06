import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path');
    const ref = searchParams.get('ref') || 'HEAD';

    if (!owner || !repo || !path) {
        return NextResponse.json({ error: 'Missing owner, repo, or path' }, { status: 400 });
    }

    const session = await auth();
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const octokit = new Octokit({ auth: session.accessToken });
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path,
            ref,
        });

        if (Array.isArray(data)) {
            return NextResponse.json({ error: 'Path is a directory' }, { status: 400 });
        }

        // Decode base64 content
        const content = Buffer.from(data.content, 'base64').toString('utf-8');

        return NextResponse.json({
            content,
            encoding: data.encoding,
            size: data.size,
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        return NextResponse.json({ error: 'Failed to fetch file content' }, { status: 500 });
    }
}
