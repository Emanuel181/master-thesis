import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/fixes
 * Get all fixes for a workflow run
 */
export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { searchParams } = new URL(request.url);
        const runId = searchParams.get('runId');
        
        if (!runId) {
            return NextResponse.json({ error: 'runId is required' }, { status: 400 });
        }
        
        const fixes = await prisma.codeFix.findMany({
            where: {
                vulnerability: {
                    workflowRunId: runId
                }
            },
            include: {
                vulnerability: {
                    select: {
                        id: true,
                        title: true,
                        severity: true,
                        type: true,
                        details: true,
                        fileName: true,
                        lineNumber: true
                    }
                }
            },
            orderBy: [
                { status: 'asc' }, // PENDING first
                { createdAt: 'desc' }
            ]
        });
        
        return NextResponse.json({ fixes });
    } catch (error) {
        console.error('Error fetching fixes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch fixes' },
            { status: 500 }
        );
    }
}
