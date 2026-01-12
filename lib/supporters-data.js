/**
 * Supporters Configuration
 *
 * Supporters data is now stored in the database (Supporter model).
 * Admin checks are performed against the AdminAccount database table.
 * 
 * DEPRECATED: The ADMIN_EMAILS env var approach is deprecated.
 * Use the AdminAccount table for admin management instead.
 */

import { prisma } from '@/lib/prisma';

/**
 * Legacy admin emails from environment (deprecated - for backward compatibility only)
 * @deprecated Use checkAdminStatus from lib/admin-auth.js instead
 */
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

/**
 * Check if an email is an admin (synchronous, legacy - checks env vars only)
 * @deprecated Use checkAdminStatus from lib/admin-auth.js for database-backed checks
 */
export function isAdminEmail(email) {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return ADMIN_EMAILS.includes(normalizedEmail);
}

/**
 * Check if an email is an admin (async, checks database)
 * This is the preferred method for admin checks.
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email is an admin
 */
export async function isAdminEmailAsync(email) {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
        const adminAccount = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail },
            select: { emailVerified: true }
        });
        
        return adminAccount?.emailVerified === true;
    } catch (error) {
        console.error('[Supporters] Admin check error:', error);
        // Fail closed - if we can't verify, deny access
        return false;
    }
}
