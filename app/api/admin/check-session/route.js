import { NextResponse } from "next/server";
import { securityHeaders } from "@/lib/api-security";
import { validateSessionToken, SESSION_COOKIE_NAME } from "@/lib/admin-verification-store";
import { checkAdminStatus } from "@/lib/admin-auth";

/**
 * GET /api/admin/check-session
 * Check if the admin has a valid session using HTTP-only cookie
 * Returns the authenticated admin email from the server session (not from client)
 */
export async function GET(request) {
    try {
        // Get session token from HTTP-only cookie
        const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        
        if (!sessionToken) {
            return NextResponse.json(
                { valid: false, error: 'No session' },
                { status: 200, headers: securityHeaders }
            );
        }
        
        // Validate token and get the authenticated email from server
        const session = validateSessionToken(sessionToken);
        
        if (!session.valid) {
            // Clear the invalid cookie
            const res = NextResponse.json(
                { valid: false, error: 'Session expired' },
                { status: 200, headers: securityHeaders }
            );
            res.cookies.delete(SESSION_COOKIE_NAME);
            return res;
        }
        
        // Check admin status from database
        const adminStatus = await checkAdminStatus(session.email);
        
        return NextResponse.json(
            { 
                valid: true, 
                // Return the authenticated email from server session
                // This is the SOURCE OF TRUTH for admin identity
                email: session.email,
                expiresAt: session.expiresAt,
                isMasterAdmin: adminStatus.isMasterAdmin
            },
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

/**
 * POST /api/admin/check-session (legacy - deprecated)
 * Maintained for backward compatibility but clients should use GET
 */
export async function POST(request) {
    // Redirect to GET-based session check
    return GET(request);
}

