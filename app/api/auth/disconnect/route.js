import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
        return NextResponse.json({ error: 'Missing provider' }, { status: 400 });
    }

    // Delete the account
    await prisma.account.deleteMany({
        where: {
            userId: user.id,
            provider: provider,
        },
    });

    return NextResponse.json({ success: true });
}
