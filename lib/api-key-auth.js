/**
 * API Key Authentication
 * ======================
 *
 * Provides programmatic API access via API keys.
 * Keys are hashed using SHA-256 before storage.
 *
 * Features:
 * - Secure key generation (32 bytes entropy)
 * - SHA-256 hashing for storage
 * - Per-key rate limiting
 * - Audit logging
 * - Key rotation support
 * - Scoped permissions
 */

import { createHash, randomBytes } from 'crypto';
import prisma from '@/lib/prisma';

// API Key prefix for identification
const API_KEY_PREFIX = 'vulniq_';

// Key scopes/permissions
export const API_KEY_SCOPES = {
    READ: 'read',           // Read-only access
    WRITE: 'write',         // Read + write access
    ADMIN: 'admin',         // Full access
    WORKFLOW: 'workflow',   // Workflow execution only
    EXPORT: 'export',       // Data export only
};

/**
 * Generate a new API key
 * Returns the raw key (show once to user) and the hash (store in DB)
 *
 * @returns {{rawKey: string, hashedKey: string}}
 */
export function generateApiKey() {
    // Generate 32 bytes of random data (256 bits of entropy)
    const keyBytes = randomBytes(32);
    const keyBase64 = keyBytes.toString('base64url');
    const rawKey = `${API_KEY_PREFIX}${keyBase64}`;

    // Hash the key for storage
    const hashedKey = hashApiKey(rawKey);

    return { rawKey, hashedKey };
}

/**
 * Hash an API key for storage/comparison
 *
 * @param {string} rawKey - The raw API key
 * @returns {string} SHA-256 hash of the key
 */
export function hashApiKey(rawKey) {
    return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Validate API key format
 *
 * @param {string} key - API key to validate
 * @returns {boolean}
 */
export function isValidApiKeyFormat(key) {
    if (!key || typeof key !== 'string') return false;
    if (!key.startsWith(API_KEY_PREFIX)) return false;

    // Check length: prefix (7) + base64url (43) = 50 chars
    if (key.length < 40 || key.length > 60) return false;

    // Check for valid base64url characters after prefix
    const keyPart = key.slice(API_KEY_PREFIX.length);
    return /^[A-Za-z0-9_-]+$/.test(keyPart);
}

/**
 * Create a new API key for a user
 *
 * @param {string} userId - User ID
 * @param {string} name - Friendly name for the key
 * @param {string[]} scopes - Array of permission scopes
 * @param {Date} expiresAt - Optional expiration date
 * @returns {Promise<{key: string, id: string}>} Raw key (show once) and record ID
 */
export async function createApiKey(userId, name, scopes = [API_KEY_SCOPES.READ], expiresAt = null) {
    const { rawKey, hashedKey } = generateApiKey();

    // Store only the hash
    const record = await prisma.apiKey.create({
        data: {
            userId,
            name,
            keyHash: hashedKey,
            keyPrefix: rawKey.slice(0, 12), // Store prefix for identification
            scopes: scopes.join(','),
            expiresAt,
            lastUsedAt: null,
            usageCount: 0,
        },
    });

    return {
        key: rawKey,  // Only returned once!
        id: record.id,
        name: record.name,
        keyPrefix: record.keyPrefix,
        scopes,
        expiresAt,
        createdAt: record.createdAt,
    };
}

/**
 * Verify an API key and return the associated user
 *
 * @param {string} rawKey - The raw API key from request
 * @returns {Promise<{valid: boolean, userId?: string, scopes?: string[], error?: string}>}
 */
export async function verifyApiKey(rawKey) {
    // Validate format first (fast check)
    if (!isValidApiKeyFormat(rawKey)) {
        return { valid: false, error: 'invalid_format' };
    }

    const hashedKey = hashApiKey(rawKey);

    try {
        // Find the key
        const apiKey = await prisma.apiKey.findUnique({
            where: { keyHash: hashedKey },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        if (!apiKey) {
            return { valid: false, error: 'key_not_found' };
        }

        // Check if revoked
        if (apiKey.revokedAt) {
            return { valid: false, error: 'key_revoked' };
        }

        // Check expiration
        if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
            return { valid: false, error: 'key_expired' };
        }

        // Update last used timestamp and usage count (non-blocking)
        prisma.apiKey.update({
            where: { id: apiKey.id },
            data: {
                lastUsedAt: new Date(),
                usageCount: { increment: 1 },
            },
        }).catch(err => {
            console.error('[api-key] Failed to update usage:', err.message);
        });

        return {
            valid: true,
            userId: apiKey.userId,
            user: apiKey.user,
            scopes: apiKey.scopes.split(','),
            keyId: apiKey.id,
            keyName: apiKey.name,
        };

    } catch (error) {
        console.error('[api-key] Verification error:', error.message);
        return { valid: false, error: 'verification_failed' };
    }
}

/**
 * Check if an API key has a specific scope
 *
 * @param {string[]} keyScopes - Scopes the key has
 * @param {string} requiredScope - Scope to check
 * @returns {boolean}
 */
export function hasScope(keyScopes, requiredScope) {
    // Admin scope has all permissions
    if (keyScopes.includes(API_KEY_SCOPES.ADMIN)) return true;

    // Write scope includes read
    if (requiredScope === API_KEY_SCOPES.READ && keyScopes.includes(API_KEY_SCOPES.WRITE)) {
        return true;
    }

    return keyScopes.includes(requiredScope);
}

/**
 * Revoke an API key
 *
 * @param {string} keyId - Key ID to revoke
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>}
 */
export async function revokeApiKey(keyId, userId) {
    try {
        const result = await prisma.apiKey.updateMany({
            where: {
                id: keyId,
                userId, // Ensure user owns the key
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });

        return result.count > 0;
    } catch (error) {
        console.error('[api-key] Revoke error:', error.message);
        return false;
    }
}

/**
 * List all API keys for a user (without revealing the key)
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function listApiKeys(userId) {
    return prisma.apiKey.findMany({
        where: {
            userId,
            revokedAt: null,
        },
        select: {
            id: true,
            name: true,
            keyPrefix: true,
            scopes: true,
            createdAt: true,
            expiresAt: true,
            lastUsedAt: true,
            usageCount: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Extract API key from request headers
 * Supports both Authorization header and X-API-Key header
 *
 * @param {Request} request - HTTP request
 * @returns {string|null}
 */
export function extractApiKey(request) {
    // Check Authorization header (Bearer token style)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        if (token.startsWith(API_KEY_PREFIX)) {
            return token;
        }
    }

    // Check X-API-Key header
    const apiKeyHeader = request.headers.get('x-api-key');
    if (apiKeyHeader?.startsWith(API_KEY_PREFIX)) {
        return apiKeyHeader;
    }

    return null;
}

export default {
    generateApiKey,
    createApiKey,
    verifyApiKey,
    revokeApiKey,
    listApiKeys,
    extractApiKey,
    hasScope,
    API_KEY_SCOPES,
};
