import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders, readJsonBody, getClientIp } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import {
    grantSession,
    SESSION_VALIDITY_MS,
    cleanupExpiredSessions
} from "@/lib/admin-verification-store";
import { hasPasskey } from "@/lib/admin-passkey";

// Generic error message to prevent enumeration attacks
const GENERIC_AUTH_ERROR = 'Invalid email or password. Please check your credentials and try again.';

/**
 * POST /api/admin/verify
 * Verifies admin credentials (email + password), then checks WebAuthn passkey requirement
 *
 * SECURITY: Uses generic error messages to prevent admin email enumeration.
 * All authentication failures return the same error message regardless of:
 * - Whether the email exists
 * - Whether the email is verified
 * - Whether the password is correct
 *
 * Flow:
 * 1. User enters email + password
 * 2. API verifies both, returns generic error if either fails
 * 3. If valid: returns passkey requirement status
 *
 * Body: { email: string, password: string }
 */
export async function POST(request) {
    try {
        cleanupExpiredSessions();

        // Parse request body
        const bodyResult = await readJsonBody(request);

        if (!bodyResult.ok || !bodyResult.body?.email) {
            return NextResponse.json(
                { verified: false, error: 'Email address is required' },
                { status: 400, headers: securityHeaders }
            );
        }

        const email = bodyResult.body.email.toLowerCase().trim();
        const password = bodyResult.body.password?.toString();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { verified: false, error: 'Invalid email format' },
                { status: 400, headers: securityHeaders }
            );
        }

        // SECURITY: Rate limit by IP AND email to prevent distributed enumeration
        const clientIp = getClientIp(request);
        
        // Rate limit per IP (prevents single source enumeration)
        const ipRl = await rateLimit({
            key: `admin:verify:ip:${clientIp}`,
            limit: 20,
            windowMs: 60 * 1000
        });

        if (!ipRl.allowed) {
            return NextResponse.json(
                { verified: false, error: 'Too many attempts. Please try again later.' },
                { status: 429, headers: securityHeaders }
            );
        }

        // Rate limit per email (prevents targeted brute force)
        const emailRl = await rateLimit({
            key: `admin:verify:email:${email}`,
            limit: 5,
            windowMs: 60 * 1000
        });

        if (!emailRl.allowed) {
            return NextResponse.json(
                { verified: false, error: 'Too many attempts. Please try again later.' },
                { status: 429, headers: securityHeaders }
            );
        }

        // SECURITY: Require password upfront to prevent email enumeration
        // Don't reveal whether email exists until password is also provided
        if (!password) {
            return NextResponse.json(
                {
                    verified: false,
                    requiresPassword: true,
                    message: 'Please enter your email and password'
                },
                { status: 200, headers: securityHeaders }
            );
        }

        // Check if email is a registered admin in database
        const adminAccount = await prisma.adminAccount.findUnique({
            where: { email },
            select: { 
                id: true, 
                email: true, 
                passwordHash: true, 
                emailVerified: true, 
                isMasterAdmin: true 
            }
        });

        // SECURITY: Use constant-time-like flow to prevent timing attacks
        // Always perform a bcrypt compare even if account doesn't exist
        let passwordValid = false;
        
        if (adminAccount && adminAccount.passwordHash && adminAccount.emailVerified) {
            passwordValid = await bcrypt.compare(password, adminAccount.passwordHash);
        } else {
            // Perform dummy bcrypt compare to maintain consistent timing
            // This prevents attackers from detecting non-existent accounts via response time
            await bcrypt.compare(password, '$2a$12$dummy.hash.for.timing.attack.prevention');
        }

        // SECURITY: Generic error for all authentication failures
        // Don't reveal whether email exists, is verified, or password is wrong
        if (!adminAccount || !adminAccount.emailVerified || !adminAccount.passwordHash || !passwordValid) {
            return NextResponse.json(
                { verified: false, error: GENERIC_AUTH_ERROR },
                { status: 401, headers: securityHeaders }
            );
        }

        const isMasterAdmin = adminAccount.isMasterAdmin === true;

        // Password is valid - update last login
        await prisma.adminAccount.update({
            where: { id: adminAccount.id },
            data: { lastLoginAt: new Date() }
        });

        // Check WebAuthn passkey status
        try {
            const adminHasPasskey = await hasPasskey(email);

            if (adminHasPasskey) {
                // Passkey exists - require WebAuthn authentication
                return NextResponse.json(
                    {
                        verified: false,
                        passwordVerified: true,
                        requiresPasskeyAuth: true,
                        message: 'Please authenticate with your passkey'
                    },
                    { status: 200, headers: securityHeaders }
                );
            } else {
                // No passkey - require passkey setup
                return NextResponse.json(
                    {
                        verified: false,
                        passwordVerified: true,
                        requiresPasskeySetup: true,
                        message: 'Please set up your passkey to continue'
                    },
                    { status: 200, headers: securityHeaders }
                );
            }
        } catch (passkeyError) {
            console.error('[Admin Verify] Passkey check error:', passkeyError);
            // If passkey check fails, require passkey setup as fallback
            return NextResponse.json(
                {
                    verified: false,
                    passwordVerified: true,
                    requiresPasskeySetup: true,
                    message: 'Please set up your passkey to continue'
                },
                { status: 200, headers: securityHeaders }
            );
        }

    } catch (error) {
        console.error('[Admin Verify Error]', error);
        return NextResponse.json(
            { verified: false, error: 'Verification failed' },
            { status: 500, headers: securityHeaders }
        );
    }
}

// Block other methods
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405, headers: securityHeaders }
    );
}
