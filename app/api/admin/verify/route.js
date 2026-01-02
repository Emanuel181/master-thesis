import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders, readJsonBody } from "@/lib/api-security";
import { isAdminEmail } from "@/lib/supporters-data";
import {
    hasValidAdminSession,
    verifyCodeAndGrantSession,
    SESSION_VALIDITY_MS,
    cleanupExpiredSessions
} from "@/lib/admin-verification-store";

/**
 * POST /api/admin/verify
 * Verifies admin OTP code and grants session access
 * No login session required - standalone OTP flow
 *
 * Body: { email: string, code?: string }
 * - If only email: checks if session exists
 * - If email + code: verifies code and grants session
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
        const code = bodyResult.body.code?.toString().trim();

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

        // Check if email is in admin list
        if (!isAdminEmail(email)) {
            return NextResponse.json(
                { verified: false, error: 'This email is not authorized for admin access.' },
                { status: 403, headers: securityHeaders }
            );
        }

        // Check if already verified (has valid session)
        if (hasValidAdminSession(email)) {
            return NextResponse.json(
                {
                    verified: true,
                    email,
                    sessionExpiresIn: SESSION_VALIDITY_MS / 1000
                },
                { status: 200, headers: securityHeaders }
            );
        }

        // If no code provided, user needs to request one
        if (!code) {
            return NextResponse.json(
                {
                    verified: false,
                    requiresCode: true,
                    message: 'Verification code required'
                },
                { status: 200, headers: securityHeaders }
            );
        }

        // Verify code and grant session
        const result = verifyCodeAndGrantSession(email, code);

        if (!result.valid) {
            return NextResponse.json(
                {
                    verified: false,
                    error: result.error
                },
                { status: 400, headers: securityHeaders }
            );
        }

        // Code is valid - session granted
        return NextResponse.json(
            {
                verified: true,
                email,
                sessionExpiresIn: SESSION_VALIDITY_MS / 1000
            },
            { status: 200, headers: securityHeaders }
        );

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
