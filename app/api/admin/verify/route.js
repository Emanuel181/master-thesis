import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders, readJsonBody } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import {
    grantSession,
    SESSION_VALIDITY_MS,
    cleanupExpiredSessions
} from "@/lib/admin-verification-store";
import { hasPasskey } from "@/lib/admin-passkey";

/**
 * POST /api/admin/verify
 * Verifies admin credentials (email + password), then checks WebAuthn passkey requirement
 *
 * Flow:
 * 1. User enters email -> API checks if email is a registered admin in database
 * 2. User enters password -> API verifies password
 *    - If password valid and NO passkey: returns { passwordVerified: true, requiresPasskeySetup: true }
 *    - If password valid and passkey EXISTS: returns { passwordVerified: true, requiresPasskeyAuth: true }
 * 3. UI handles passkey setup or authentication via separate endpoints
 *
 * Body: { email: string, password?: string }
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

        // Rate limiting for verification attempts
        const rl = await rateLimit({
            key: `admin:verify:${email}`,
            limit: 10,
            windowMs: 60 * 1000
        });

        if (!rl.allowed) {
            return NextResponse.json(
                { verified: false, error: 'Too many attempts. Please try again later.' },
                { status: 429, headers: securityHeaders }
            );
        }

        // NOTE: We no longer auto-verify based on hasValidAdminSession(email)
        // The client should use check-session with the HTTP-only cookie instead.
        // This ensures proper session invalidation on logout.

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

        if (!adminAccount) {
            return NextResponse.json(
                { verified: false, error: 'This email is not registered as an admin.' },
                { status: 403, headers: securityHeaders }
            );
        }

        // Check if email is verified
        if (!adminAccount.emailVerified) {
            return NextResponse.json(
                { verified: false, error: 'Email address not verified. Please check your inbox for the verification link.' },
                { status: 403, headers: securityHeaders }
            );
        }

        const isMasterAdmin = adminAccount.isMasterAdmin === true;

        // If no password provided, user needs to enter it
        if (!password) {
            return NextResponse.json(
                {
                    verified: false,
                    emailValid: true,
                    requiresPassword: true,
                    message: 'Please enter your password'
                },
                { status: 200, headers: securityHeaders }
            );
        }

        // Verify password
        if (!adminAccount.passwordHash) {
            return NextResponse.json(
                { verified: false, error: 'Password not set. Please contact an administrator.' },
                { status: 401, headers: securityHeaders }
            );
        }

        const passwordValid = await bcrypt.compare(password, adminAccount.passwordHash);

        if (!passwordValid) {
            return NextResponse.json(
                {
                    verified: false,
                    error: 'Invalid password'
                },
                { status: 401, headers: securityHeaders }
            );
        }

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
