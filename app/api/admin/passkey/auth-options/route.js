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
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
    try {
        const { email } = await request.json();
        
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Rate limit by email: 10 attempts per minute
        const rateLimitResult = await rateLimit({
            key: `passkey-auth-options:${normalizedEmail}`,
            limit: 10,
            windowMs: 60 * 1000,
        });
        
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Too many authentication attempts. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
            );
        }
        
        // Get request origin for WebAuthn configuration
        const requestOrigin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/');
        
        // Verify email is a registered admin in database
        const adminAccount = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail },
            select: { emailVerified: true, isMasterAdmin: true }
        });
        
        if (!adminAccount || !adminAccount.emailVerified) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        // Check if admin has passkeys
        const hasExistingPasskey = await hasPasskey(normalizedEmail);
        
        if (!hasExistingPasskey) {
            return NextResponse.json({ 
                error: 'No passkey registered',
                hasPasskey: false 
            }, { status: 400 });
        }
        
        const options = await generatePasskeyAuthenticationOptions(normalizedEmail, requestOrigin);
        
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
