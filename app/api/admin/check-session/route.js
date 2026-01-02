import { NextResponse } from "next/server";
import { securityHeaders, readJsonBody } from "@/lib/api-security";
import { hasValidAdminSession } from "@/lib/admin-verification-store";

/**
 * POST /api/admin/check-session
 * Check if the admin has a valid session
 */
export async function POST(request) {
    try {
        const bodyResult = await readJsonBody(request);
        if (!bodyResult.ok) {
            return NextResponse.json(
                { valid: false, error: 'Invalid request' },
                { status: 400, headers: securityHeaders }
            );
        }

        const { email } = bodyResult.body;

        if (!email) {
            return NextResponse.json(
                { valid: false, error: 'Email required' },
                { status: 400, headers: securityHeaders }
            );
        }

        const isValid = hasValidAdminSession(email);

        return NextResponse.json(
            { valid: isValid },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Admin Check Session Error]', error);
        return NextResponse.json(
            { valid: false, error: 'Failed to check session' },
            { status: 500, headers: securityHeaders }
        );
    }
}

