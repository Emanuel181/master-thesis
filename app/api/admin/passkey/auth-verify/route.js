/**
 * Admin Passkey Authentication - Verify Response
 * 
 * POST /api/admin/passkey/auth-verify
 * Verifies the WebAuthn authentication response and grants session.
 * Sets HTTP-only cookie with session token for secure auth.
 * 
 * Request body:
 * - email: Admin email
 * - response: WebAuthn authentication response from browser
 */

import { NextResponse } from 'next/server';
import { verifyPasskeyAuthentication } from '@/lib/admin-passkey';
import { grantSession, SESSION_COOKIE_NAME, SESSION_VALIDITY_MS } from '@/lib/admin-verification-store';
import { prisma } from '@/lib/prisma';

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

export async function POST(request) {
    try {
        const { email, response } = await request.json();
        
        if (!email || !response) {
            return NextResponse.json({ error: 'Email and response are required' }, { status: 400 });
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
        
        const result = await verifyPasskeyAuthentication(normalizedEmail, response);
        
        if (result.verified) {
            // Grant admin session after successful passkey authentication
            const sessionToken = grantSession(normalizedEmail);
            
            // Create response with HTTP-only cookie
            const res = NextResponse.json({
                verified: true,
                message: 'Passkey authentication successful',
                // Return email so client can store for UI purposes
                // (but NOT for auth - that's handled by the cookie)
                email: normalizedEmail
            });
            
            // Set HTTP-only cookie with session token
            res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                path: '/admin',
                maxAge: SESSION_VALIDITY_MS / 1000, // Convert to seconds
            });
            
            return res;
        }
        
        return NextResponse.json({ error: 'Authentication verification failed' }, { status: 400 });
        
    } catch (error) {
        console.error('Passkey auth verify error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify authentication' },
            { status: 500 }
        );
    }
}
