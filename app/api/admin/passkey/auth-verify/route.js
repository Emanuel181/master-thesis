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
import { rateLimit } from '@/lib/rate-limit';

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

export async function POST(request) {
    try {
        const { email, response } = await request.json();
        
        if (!email || !response) {
            return NextResponse.json({ error: 'Email and response are required' }, { status: 400 });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Rate limit by email: 5 verification attempts per minute (stricter than options)
        const rateLimitResult = await rateLimit({
            key: `passkey-auth-verify:${normalizedEmail}`,
            limit: 5,
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
            select: { emailVerified: true }
        });
        
        if (!adminAccount || !adminAccount.emailVerified) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        const result = await verifyPasskeyAuthentication(normalizedEmail, response, requestOrigin);
        
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
                path: '/', // Must be '/' to cover both /admin pages and /api/admin routes
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
