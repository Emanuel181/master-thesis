/**
 * Admin Verification Store
 *
 * Standalone OTP verification for admin access.
 * Completely separate from login session - admin must enter email and verify OTP.
 * In production with multiple instances, use Redis or database instead.
 */

import { randomInt } from 'crypto';

// Store verification codes temporarily
// Key: email (lowercase), Value: { code, expiresAt, attempts }
export const verificationCodes = new Map();

// Store verified admin sessions (browser-based, tracked by email)
// Key: email (lowercase), Value: { verifiedAt, expiresAt }
export const verifiedAdminSessions = new Map();

// Code expiration time (5 minutes)
export const CODE_EXPIRY_MS = 5 * 60 * 1000;

// Admin session validity (30 minutes)
export const SESSION_VALIDITY_MS = 30 * 60 * 1000;

/**
 * Clean up expired codes
 */
export function cleanupExpiredCodes() {
    const now = Date.now();
    for (const [key, data] of verificationCodes.entries()) {
        if (now > data.expiresAt) {
            verificationCodes.delete(key);
        }
    }
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions() {
    const now = Date.now();
    for (const [key, data] of verifiedAdminSessions.entries()) {
        if (now > data.expiresAt) {
            verifiedAdminSessions.delete(key);
        }
    }
}

/**
 * Generate a 6-digit verification code
 */
export function generateCode() {
    return randomInt(100000, 1000000).toString();
}

/**
 * Store a verification code for an email
 */
export function storeVerificationCode(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const code = generateCode();
    const expiresAt = Date.now() + CODE_EXPIRY_MS;

    verificationCodes.set(normalizedEmail, {
        code,
        expiresAt,
        attempts: 0
    });

    return { code, expiresAt };
}

/**
 * Verify a code and grant admin session
 * Returns: { valid: boolean, error?: string }
 */
export function verifyCodeAndGrantSession(email, providedCode) {
    const normalizedEmail = email.toLowerCase().trim();
    const storedData = verificationCodes.get(normalizedEmail);

    if (!storedData) {
        return { valid: false, error: 'No verification code found. Please request a new code.' };
    }

    // Check if code expired
    if (Date.now() > storedData.expiresAt) {
        verificationCodes.delete(normalizedEmail);
        return { valid: false, error: 'Verification code expired. Please request a new code.' };
    }

    // Check attempts (max 5)
    if (storedData.attempts >= 5) {
        verificationCodes.delete(normalizedEmail);
        return { valid: false, error: 'Too many failed attempts. Please request a new code.' };
    }

    // Verify code
    if (providedCode !== storedData.code) {
        storedData.attempts++;
        return { valid: false, error: `Invalid code. ${5 - storedData.attempts} attempts remaining.` };
    }

    // Code is valid - grant admin session
    verificationCodes.delete(normalizedEmail);
    verifiedAdminSessions.set(normalizedEmail, {
        verifiedAt: Date.now(),
        expiresAt: Date.now() + SESSION_VALIDITY_MS
    });

    return { valid: true };
}

/**
 * Check if email has a valid admin session
 */
export function hasValidAdminSession(email) {
    if (!email) return false;
    cleanupExpiredSessions();
    const normalizedEmail = email.toLowerCase().trim();
    const session = verifiedAdminSessions.get(normalizedEmail);
    return session && Date.now() < session.expiresAt;
}

/**
 * Invalidate admin session for email
 */
export function invalidateAdminSession(email) {
    if (!email) return;
    const normalizedEmail = email.toLowerCase().trim();
    verifiedAdminSessions.delete(normalizedEmail);
}
