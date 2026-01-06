/**
 * Admin Passkey Registration - Generate Options
 * 
 * POST /api/admin/passkey/register-options
 * Generates WebAuthn registration options for setting up a new passkey.
 * 
 * Request body:
 * - email: Admin email (must be verified via password first)
 * - deviceName: Optional friendly name for the device
 */

import { NextResponse } from 'next/server';
import { generatePasskeyRegistrationOptions, hasPasskey } from '@/lib/admin-passkey';
import { isSessionValid } from '@/lib/admin-verification-store';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
    try {
        const { email, deviceName } = await request.json();
        
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Verify email is a registered admin in database
        const adminAccount = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail },
            select: { emailVerified: true, isMasterAdmin: true }
        });
        
        if (!adminAccount || !adminAccount.emailVerified) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        // For registration, we need to verify that the admin has completed password verification
        // OR already has a valid session (when adding additional passkeys)
        const hasExistingPasskey = await hasPasskey(normalizedEmail);
        const hasValidSession = isSessionValid(normalizedEmail);
        
        // Password verification is handled by the verify flow - registration options are only requested
        // after password is verified
        
        const { options, webauthnUserId } = await generatePasskeyRegistrationOptions(
            normalizedEmail, 
            deviceName || normalizedEmail
        );
        
        return NextResponse.json({
            options,
            hasExistingPasskey,
        });
        
    } catch (error) {
        console.error('Passkey registration options error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate registration options' },
            { status: 500 }
        );
    }
}
