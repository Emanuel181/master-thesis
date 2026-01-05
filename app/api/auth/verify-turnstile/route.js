import { NextResponse } from 'next/server';
import { verifyTurnstileToken, getClientIp } from '@/lib/turnstile';

/**
 * POST /api/auth/verify-turnstile
 *
 * Server-side Turnstile token verification endpoint.
 * Used before sensitive operations like email sign-in.
 *
 * Request body:
 * - turnstileToken: string (required)
 *
 * Response:
 * - 200: { success: true }
 * - 400: { error: 'Missing turnstile token' }
 * - 403: { error: 'Verification failed message', code: 'TURNSTILE_VERIFICATION_FAILED' }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { turnstileToken } = body;

        if (!turnstileToken) {
            return NextResponse.json(
                { error: 'Missing security token' },
                { status: 400 }
            );
        }

        // Get client IP for enhanced verification
        const clientIp = getClientIp(request.headers);

        // Verify the token with Cloudflare
        const result = await verifyTurnstileToken(turnstileToken, clientIp);

        if (!result.success) {
            return NextResponse.json(
                {
                    error: result.error,
                    code: 'TURNSTILE_VERIFICATION_FAILED',
                },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[verify-turnstile] Error:', error);
        return NextResponse.json(
            { error: 'Verification service unavailable' },
            { status: 500 }
        );
    }
}

