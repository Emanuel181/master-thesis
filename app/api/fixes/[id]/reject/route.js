import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/fixes/[id]/reject
 * Reject a fix
 */
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { id } = params;
        
        await prisma.codeFix.update({
            where: { id },
            data: {
                status: 'REJECTED',
                reviewedAt: new Date(),
                reviewedBy: session.user.id
            }
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error rejecting fix:', error);
        return NextResponse.json(
            { error: 'Failed to reject fix' },
            { status: 500 }
        );
    }
}
