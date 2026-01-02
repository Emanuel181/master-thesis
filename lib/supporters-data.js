/**
 * Supporters Configuration
 *
 * Supporters data is now stored in the database (Supporter model).
 * This file only contains admin configuration.
 */

/**
 * Admin emails that can manage supporters
 * Set ADMIN_EMAILS in .env as comma-separated list: admin1@example.com,admin2@example.com
 * Or use ADMIN_EMAIL for a single admin
 */
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

/**
 * Check if an email is an admin (case-insensitive)
 */
export function isAdminEmail(email) {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return ADMIN_EMAILS.includes(normalizedEmail);
}
