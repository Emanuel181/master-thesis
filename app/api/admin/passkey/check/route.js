/**
 * Admin Passkey Status Check
 * 
 * POST /api/admin/passkey/check
 * Checks if an admin has registered passkeys.
 * 
 * Request body:
 * - email: Admin email
 */

import { NextResponse } from 'next/server';
import { hasPasskey, getPasskeys } from '@/lib/admin-passkey';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
    try {
        const { email } = await request.json();
        
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Verify email is a registered admin in database
        const adminAccount = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail },
            select: { emailVerified: true }
        });
        
        if (!adminAccount || !adminAccount.emailVerified) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        const hasRegisteredPasskey = await hasPasskey(normalizedEmail);
        
        // Get passkey info (without sensitive data)
        let passkeys = [];
        if (hasRegisteredPasskey) {
            const allPasskeys = await getPasskeys(normalizedEmail);
            passkeys = allPasskeys.map(p => ({
                id: p.id,
                deviceName: p.deviceName || 'Unknown Device',
                deviceType: p.deviceType,
                backedUp: p.backedUp,
                lastUsedAt: p.lastUsedAt,
                createdAt: p.createdAt,
            }));
        }
        
        return NextResponse.json({
            hasPasskey: hasRegisteredPasskey,
            passkeys,
        });
        
    } catch (error) {
        console.error('Passkey check error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check passkey status' },
            { status: 500 }
        );
    }
}
