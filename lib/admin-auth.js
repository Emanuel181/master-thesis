import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { securityHeaders } from "@/lib/api-security";

/**
 * Admin Authentication Helper
 *
 * Provides server-side authentication and authorization for admin API routes.
 * Uses NextAuth session validation - never trusts client-provided headers.
 */

/**
 * Get admin emails from environment variables
 * Supports both ADMIN_EMAILS (comma-separated) and ADMIN_EMAIL (single)
 */
function getAdminEmails() {
    const emails = [];

    if (process.env.ADMIN_EMAILS) {
        const parsed = process.env.ADMIN_EMAILS
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(Boolean);
        emails.push(...parsed);
    }

    if (process.env.ADMIN_EMAIL) {
        const single = process.env.ADMIN_EMAIL.trim().toLowerCase();
        if (single && !emails.includes(single)) {
            emails.push(single);
        }
    }

    return emails;
}

/**
 * Check if an email is an admin (case-insensitive)
 * @param {string} email - Email to check
 * @returns {boolean} True if email is in admin list
 */
export function isAdminEmail(email) {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return getAdminEmails().includes(normalizedEmail);
}

/**
 * Require admin authentication for an API route
 *
 * Usage:
 * ```js
 * export async function GET() {
 *     const adminCheck = await requireAdmin();
 *     if (adminCheck.error) return adminCheck.error;
 *     const { session, email } = adminCheck;
 *     // ... your handler logic
 * }
 * ```
 *
 * @returns {Promise<{error: NextResponse} | {session: object, email: string}>}
 */
export async function requireAdmin() {
    try {
        const session = await auth();

        // Check if user is authenticated
        if (!session?.user) {
            return {
                error: NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401, headers: securityHeaders }
                )
            };
        }

        // Check if user has an email
        if (!session.user.email) {
            return {
                error: NextResponse.json(
                    { error: 'Authentication required - no email in session' },
                    { status: 401, headers: securityHeaders }
                )
            };
        }

        const email = session.user.email.toLowerCase().trim();

        // Check if user is an admin
        if (!isAdminEmail(email)) {
            return {
                error: NextResponse.json(
                    { error: 'Forbidden - admin privileges required' },
                    { status: 403, headers: securityHeaders }
                )
            };
        }

        // Return session and email for use in handler
        return { session, email };

    } catch (error) {
        console.error('[Admin Auth Error]', error);
        return {
            error: NextResponse.json(
                { error: 'Authentication failed' },
                { status: 500, headers: securityHeaders }
            )
        };
    }
}

/**
 * Higher-order function to wrap an API handler with admin authentication
 *
 * Usage:
 * ```js
 * export const GET = withAdminAuth(async (request, context, { session, email }) => {
 *     // ... your handler logic
 *     return NextResponse.json({ data });
 * });
 * ```
 *
 * @param {Function} handler - The API handler function
 * @returns {Function} Wrapped handler with admin auth
 */
export function withAdminAuth(handler) {
    return async (request, context) => {
        const adminCheck = await requireAdmin();
        if (adminCheck.error) return adminCheck.error;

        return handler(request, context, {
            session: adminCheck.session,
            email: adminCheck.email
        });
    };
}

