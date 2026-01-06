/**
 * Admin Passkey Authentication - Generate Options
 * 
 * POST /api/admin/passkey/auth-options
 * Generates WebAuthn authentication options for signing in with a passkey.
 * 
 * Request body:
 * - email: Admin email
 */

import { NextResponse } from 'next/server';
import { generatePasskeyAuthenticationOptions, hasPasskey } from '@/lib/admin-passkey';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
    try {
        const { email } = await request.json();
        
        console.log('[Auth-Options] Request for email:', email);
        
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        console.log('[Auth-Options] Normalized email:', normalizedEmail);
        
        // Verify email is a registered admin in database
        const adminAccount = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail },
            select: { emailVerified: true, isMasterAdmin: true }
        });
        
        console.log('[Auth-Options] Admin found:', !!adminAccount);
        
        if (!adminAccount || !adminAccount.emailVerified) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        // Check if admin has passkeys
        const hasExistingPasskey = await hasPasskey(normalizedEmail);
        console.log('[Auth-Options] Has passkey:', hasExistingPasskey);
        
        if (!hasExistingPasskey) {
            return NextResponse.json({ 
                error: 'No passkey registered',
                hasPasskey: false 
            }, { status: 400 });
        }
        
        const options = await generatePasskeyAuthenticationOptions(normalizedEmail);
        console.log('[Auth-Options] Generated options, allowCredentials count:', options?.allowCredentials?.length);
        
        return NextResponse.json({
            options,
            hasPasskey: true,
        });
        
    } catch (error) {
        console.error('Passkey auth options error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate authentication options' },
            { status: 500 }
        );
    }
}
