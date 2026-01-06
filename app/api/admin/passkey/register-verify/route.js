/**
 * Admin Passkey Registration - Verify Response
 * 
 * POST /api/admin/passkey/register-verify
 * Verifies the WebAuthn registration response and saves the passkey.
 * Sets HTTP-only cookie with session token for secure auth.
 * 
 * Request body:
 * - email: Admin email
 * - response: WebAuthn registration response from browser
 * - deviceName: Optional friendly name for the device
 */

import { NextResponse } from 'next/server';
import { verifyPasskeyRegistration } from '@/lib/admin-passkey';
import { grantSession, SESSION_COOKIE_NAME, SESSION_VALIDITY_MS } from '@/lib/admin-verification-store';
import { prisma } from '@/lib/prisma';

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

export async function POST(request) {
    try {
        const { email, response, deviceName } = await request.json();
        
        console.log('[Register-Verify] Received request for:', email);
        
        if (!email || !response) {
            return NextResponse.json({ error: 'Email and response are required' }, { status: 400 });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Get request origin for WebAuthn configuration
        const requestOrigin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/');
        console.log('[Register-Verify] Request origin:', requestOrigin);
        
        // Verify email is a registered admin in database
        const adminAccount = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail },
            select: { emailVerified: true }
        });
        
        if (!adminAccount || !adminAccount.emailVerified) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        console.log('[Register-Verify] Calling verifyPasskeyRegistration...');
        const result = await verifyPasskeyRegistration(normalizedEmail, response, deviceName, requestOrigin);
        console.log('[Register-Verify] Result:', result);
        if (result.verified) {
            // Grant admin session after successful passkey registration
            const sessionToken = grantSession(normalizedEmail);
            
            // Create response with HTTP-only cookie
            const res = NextResponse.json({
                verified: true,
                message: 'Passkey registered successfully',
                // Return email so client can store for UI purposes
                email: normalizedEmail
            });
            
            // Set HTTP-only cookie with session token
            res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                path: '/', // Must be '/' to cover both /admin pages and /api/admin routes
                maxAge: SESSION_VALIDITY_MS / 1000,
            });
            
            return res;
        }
        
        return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 });
        
    } catch (error) {
        console.error('Passkey registration verify error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify registration' },
            { status: 500 }
        );
    }
}
