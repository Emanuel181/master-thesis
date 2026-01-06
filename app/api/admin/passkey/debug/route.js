/**
 * Debug Passkey Storage - Development only
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    try {
        const passkeys = await prisma.adminPasskey.findMany({
            where: email ? { email: email.toLowerCase() } : undefined,
            select: {
                id: true,
                email: true,
                credentialId: true,
                deviceName: true,
                createdAt: true,
                transports: true,
            }
        });
        
        return NextResponse.json({
            count: passkeys.length,
            passkeys: passkeys.map(p => ({
                ...p,
                credentialIdLength: p.credentialId?.length,
                credentialIdSample: p.credentialId?.substring(0, 30) + '...',
            })),
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
