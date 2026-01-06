import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available' }, { status: 403 });
    }
    
    const passkeys = await prisma.adminPasskey.findMany();
    const admins = await prisma.adminAccount.findMany();
    
    return NextResponse.json({
        passkeys: passkeys.map(p => ({
            email: p.email,
            credentialId: p.credentialId,
            credentialIdLength: p.credentialId?.length,
            transports: p.transports,
            deviceType: p.deviceType,
            deviceName: p.deviceName,
            counter: p.counter?.toString(),
            createdAt: p.createdAt,
        })),
        admins: admins.map(a => ({
            email: a.email,
            emailVerified: a.emailVerified,
        })),
        passkeyCount: passkeys.length,
    });
}

// DELETE all passkeys (dev only)
export async function DELETE() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available' }, { status: 403 });
    }
    
    const deleted = await prisma.adminPasskey.deleteMany();
    
    // Also delete all challenges
    await prisma.adminPasskeyChallenge.deleteMany();
    
    return NextResponse.json({
        success: true,
        deletedCount: deleted.count,
        message: 'All passkeys and challenges deleted. Ready for fresh registration.'
    });
}
