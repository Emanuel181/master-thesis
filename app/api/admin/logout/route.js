import { NextResponse } from "next/server";
import { securityHeaders } from "@/lib/api-security";
import { invalidateSessionByToken, SESSION_COOKIE_NAME } from "@/lib/admin-verification-store";

/**
 * POST /api/admin/logout
 * Invalidate admin session and clear HTTP-only cookie
 */
export async function POST(request) {
    try {
        // Get session token from HTTP-only cookie
        const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        
        // Invalidate session on server
        if (sessionToken) {
            invalidateSessionByToken(sessionToken);
        }
        
        // Create response and clear the cookie
        const res = NextResponse.json(
            { success: true, message: 'Logged out successfully' },
            { status: 200, headers: securityHeaders }
        );
        
        // Delete the session cookie
        res.cookies.delete({
            name: SESSION_COOKIE_NAME,
            path: '/', // Must match the path used when setting the cookie
        });
        
        return res;

    } catch (error) {
        console.error('[Admin Logout Error]', error);
        return NextResponse.json(
            { success: false, error: 'Failed to logout' },
            { status: 500, headers: securityHeaders }
        );
    }
}
