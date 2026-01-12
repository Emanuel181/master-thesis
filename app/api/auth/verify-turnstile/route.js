import { verifyTurnstileToken, getClientIp } from '@/lib/turnstile';
import { z } from 'zod';
import { successResponse, errorResponse, generateRequestId } from '@/lib/api-handler';

const bodySchema = z.object({
    turnstileToken: z.string().min(1),
});

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
    const requestId = generateRequestId();
    
    try {
        const body = await request.json();
        
        // Validate body
        const parseResult = bodySchema.safeParse(body);
        if (!parseResult.success) {
            return errorResponse('Missing security token', { status: 400, requestId });
        }
        
        const { turnstileToken } = parseResult.data;

        // Get client IP for enhanced verification
        const clientIp = getClientIp(request.headers);

        // Verify the token with Cloudflare
        const result = await verifyTurnstileToken(turnstileToken, clientIp);

        if (!result.success) {
            return errorResponse(result.error, { 
                status: 403, 
                code: 'TURNSTILE_VERIFICATION_FAILED',
                requestId 
            });
        }

        return successResponse({ success: true }, { requestId });

    } catch (error) {
        console.error('[verify-turnstile] Error:', error);
        return errorResponse('Verification service unavailable', { status: 500, requestId });
    }
}

