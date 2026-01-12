import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { securityHeaders } from "@/lib/api-security";
import { validateSessionToken, SESSION_COOKIE_NAME } from "@/lib/admin-verification-store";
import { prisma } from "@/lib/prisma";
import { createApiHandler, ApiErrors } from '@/lib/api-handler';

/**
 * Admin Authentication Helper
 *
 * Provides server-side authentication and authorization for admin API routes.
 * Admin authorization is checked against the AdminAccount database table only.
 * Master admin is identified by isMasterAdmin field in database.
 */

/**
 * Check if an email is an admin (async, checks database only)
 * @param {string} email - Email to check
 * @returns {Promise<{isAdmin: boolean, isMasterAdmin: boolean}>}
 */
export async function checkAdminStatus(email) {
    if (!email) return { isAdmin: false, isMasterAdmin: false };
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
        const adminAccount = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail },
            select: { emailVerified: true, isMasterAdmin: true }
        });
        
        if (!adminAccount || !adminAccount.emailVerified) {
            return { isAdmin: false, isMasterAdmin: false };
        }
        
        return { 
            isAdmin: true, 
            isMasterAdmin: adminAccount.isMasterAdmin === true 
        };
    } catch (error) {
        console.error('[Admin Auth] Database check error:', error);
        return { isAdmin: false, isMasterAdmin: false };
    }
}

/**
 * Check if an email is an admin (async, checks database)
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email is an admin
 */
export async function isAdminEmailAsync(email) {
    const { isAdmin } = await checkAdminStatus(email);
    return isAdmin;
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
        // First, try NextAuth session
        const session = await auth();

        if (session?.user?.email) {
            const email = session.user.email.toLowerCase().trim();
            
            // Check if user is an admin via NextAuth session
            const adminStatus = await checkAdminStatus(email);
            if (adminStatus.isAdmin) {
                return { session, email, isMasterAdmin: adminStatus.isMasterAdmin };
            }
        }

        // If no valid NextAuth session, check for secure admin session via HTTP-only cookie
        // This is the secure approach - cookie cannot be accessed by JavaScript
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        
        if (sessionToken) {
            // Validate token and get the authenticated email from server session
            const sessionData = validateSessionToken(sessionToken);
            
            if (sessionData.valid && sessionData.email) {
                const email = sessionData.email;
                
                // Verify email is in admin list (from database)
                const adminStatus = await checkAdminStatus(email);
                if (adminStatus.isAdmin) {
                    return { 
                        session: { user: { email } }, 
                        email,
                        isMasterAdmin: adminStatus.isMasterAdmin
                    };
                }
            }
        }

        // No valid authentication found
        return {
            error: NextResponse.json(
                { error: 'Authentication required' },
                { status: 401, headers: securityHeaders }
            )
        };

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



/**
 * Creates an admin-only API handler with all security middleware
 * 
 * Features:
 * - Automatic admin verification from database
 * - Master admin privilege checking
 * - Default rate limiting for admin routes
 * - Consistent error handling
 * 
 * Usage:
 * ```js
 * import { createAdminApiHandler } from '@/lib/admin-auth';
 * import { z } from 'zod';
 * 
 * const querySchema = z.object({ page: z.coerce.number().default(1) });
 * 
 * export const GET = createAdminApiHandler(
 *     async (request, context) => {
 *         // context.session - authenticated admin session
 *         // context.isAdmin - always true
 *         // context.isMasterAdmin - true if master admin
 *         return { data: 'admin only data' };
 *     },
 *     {
 *         querySchema,
 *         rateLimit: { limit: 100, windowMs: 60 * 1000, keyPrefix: 'admin:custom' },
 *     }
 * );
 * ```
 * 
 * @param {Function} handler - Async handler function (request, context) => data | Response
 * @param {Object} config - Handler configuration
 * @param {boolean} [config.requireMasterAdmin=false] - Require master admin privileges
 * @param {Object} [config.rateLimit] - Rate limit configuration (defaults provided)
 * @param {import('zod').ZodSchema} [config.bodySchema] - Zod schema for request body
 * @param {import('zod').ZodSchema} [config.querySchema] - Zod schema for query parameters
 * @param {import('zod').ZodSchema} [config.paramsSchema] - Zod schema for route params
 * @returns {Function} Wrapped handler
 */
export function createAdminApiHandler(handler, config = {}) {
    const { requireMasterAdmin = false, ...restConfig } = config;

    // Wrap the handler to add admin check after auth
    const adminHandler = async (request, context) => {
        const { session, requestId } = context;

        // Verify admin status from database
        const adminStatus = await checkAdminStatus(session?.user?.email);

        if (!adminStatus.isAdmin) {
            return ApiErrors.forbidden(requestId, 'Admin access required');
        }

        if (requireMasterAdmin && !adminStatus.isMasterAdmin) {
            return ApiErrors.forbidden(requestId, 'Master admin access required');
        }

        // Add admin status to context
        return handler(request, {
            ...context,
            isAdmin: true,
            isMasterAdmin: adminStatus.isMasterAdmin,
            adminEmail: session?.user?.email?.toLowerCase()?.trim(),
        });
    };

    // Use createApiHandler with admin-specific defaults
    return createApiHandler(adminHandler, {
        requireAuth: true,
        csrfProtection: true,
        // Default rate limit for admin routes - stricter than user routes
        rateLimit: config.rateLimit || { 
            limit: 60, 
            windowMs: 60 * 1000, 
            keyPrefix: 'admin:default' 
        },
        ...restConfig,
    });
}
