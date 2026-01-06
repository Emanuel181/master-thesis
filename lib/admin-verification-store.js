/**
 * Admin Verification Store
 *
 * Secure session management for admin access.
 * Uses cryptographic session tokens stored in HTTP-only cookies.
 * In production with multiple instances, use Redis or database instead.
 */

import { randomInt, randomBytes } from 'crypto';

// Store verification codes temporarily
// Key: email (lowercase), Value: { code, expiresAt, attempts }
export const verificationCodes = new Map();

// Store verified admin sessions by TOKEN (not email)
// Key: session token, Value: { email, verifiedAt, expiresAt }
export const verifiedAdminSessions = new Map();

// Reverse lookup: email -> token (for invalidation)
// Key: email (lowercase), Value: session token
const emailToToken = new Map();

// Code expiration time (5 minutes)
export const CODE_EXPIRY_MS = 5 * 60 * 1000;

// Admin session validity (30 minutes)
export const SESSION_VALIDITY_MS = 30 * 60 * 1000;

// Session cookie name
export const SESSION_COOKIE_NAME = 'admin_session';

/**
 * Generate a cryptographically secure session token
 */
export function generateSessionToken() {
    return randomBytes(32).toString('base64url');
}

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
    for (const [token, data] of verifiedAdminSessions.entries()) {
        if (now > data.expiresAt) {
            verifiedAdminSessions.delete(token);
            emailToToken.delete(data.email);
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
 * Verify a code only (without granting session)
 * Used when passkey is also required
 * Returns: { valid: boolean, error?: string }
 */
export function verifyCodeOnly(email, providedCode) {
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

    // Code is valid - but don't delete it yet, we need it for the passkey step
    // Mark it as code-verified
    storedData.codeVerified = true;
    return { valid: true };
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

    // Verify code (or check if already verified)
    if (!storedData.codeVerified && providedCode !== storedData.code) {
        storedData.attempts++;
        return { valid: false, error: `Invalid code. ${5 - storedData.attempts} attempts remaining.` };
    }

    // Code is valid - grant admin session with token
    verificationCodes.delete(normalizedEmail);
    const token = generateSessionToken();
    
    // Invalidate any existing session for this email
    const existingToken = emailToToken.get(normalizedEmail);
    if (existingToken) {
        verifiedAdminSessions.delete(existingToken);
    }
    
    verifiedAdminSessions.set(token, {
        email: normalizedEmail,
        verifiedAt: Date.now(),
        expiresAt: Date.now() + SESSION_VALIDITY_MS
    });
    emailToToken.set(normalizedEmail, token);

    return { valid: true, token };
}

/**
 * Validate a session token and return the associated email
 * This is the ONLY way to get the authenticated admin identity
 * @param {string} token - Session token from HTTP-only cookie
 * @returns {{ valid: boolean, email?: string, expiresAt?: number }}
 */
export function validateSessionToken(token) {
    if (!token) return { valid: false };
    cleanupExpiredSessions();
    
    const session = verifiedAdminSessions.get(token);
    if (!session || Date.now() >= session.expiresAt) {
        if (session) {
            verifiedAdminSessions.delete(token);
            emailToToken.delete(session.email);
        }
        return { valid: false };
    }
    
    return { 
        valid: true, 
        email: session.email,
        expiresAt: session.expiresAt
    };
}

/**
 * Check if email has a valid admin session (legacy - for backward compatibility)
 * @deprecated Use validateSessionToken instead
 */
export function hasValidAdminSession(email) {
    if (!email) return false;
    cleanupExpiredSessions();
    const normalizedEmail = email.toLowerCase().trim();
    const token = emailToToken.get(normalizedEmail);
    if (!token) return false;
    const session = verifiedAdminSessions.get(token);
    return session && Date.now() < session.expiresAt;
}

// Alias for backward compatibility
export const verifyAdminSession = hasValidAdminSession;

// Alias for passkey module
export const isSessionValid = hasValidAdminSession;

/**
 * Grant an admin session directly (used after passkey verification)
 * @returns {string} Session token to be set in HTTP-only cookie
 */
export function grantSession(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();
    const token = generateSessionToken();
    
    // Invalidate any existing session for this email
    const existingToken = emailToToken.get(normalizedEmail);
    if (existingToken) {
        verifiedAdminSessions.delete(existingToken);
    }
    
    verifiedAdminSessions.set(token, {
        email: normalizedEmail,
        verifiedAt: Date.now(),
        expiresAt: Date.now() + SESSION_VALIDITY_MS
    });
    emailToToken.set(normalizedEmail, token);
    
    return token;
}

/**
 * Invalidate admin session by token
 */
export function invalidateSessionByToken(token) {
    if (!token) return;
    const session = verifiedAdminSessions.get(token);
    if (session) {
        emailToToken.delete(session.email);
        verifiedAdminSessions.delete(token);
    }
}

/**
 * Invalidate admin session for email (legacy)
 */
export function invalidateAdminSession(email) {
    if (!email) return;
    const normalizedEmail = email.toLowerCase().trim();
    const token = emailToToken.get(normalizedEmail);
    if (token) {
        verifiedAdminSessions.delete(token);
        emailToToken.delete(normalizedEmail);
    }
}
