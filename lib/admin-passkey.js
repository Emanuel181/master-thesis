/**
 * Admin Passkey Helper
 * 
 * Implements WebAuthn passkey registration and authentication for admin users.
 * Uses @simplewebauthn/server for secure passkey operations.
 */

import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Conditional logging - only log in development
const log = isDevelopment ? console.log.bind(console) : () => {};
const warn = console.warn.bind(console); // Always log warnings

// Helper to redact sensitive data in logs
function redact(obj, keysToRedact = ['challenge', 'publicKey', 'response']) {
    if (!obj || typeof obj !== 'object') return obj;
    const redacted = { ...obj };
    for (const key of keysToRedact) {
        if (key in redacted) {
            redacted[key] = '[REDACTED]';
        }
    }
    return redacted;
}

// Admin accounts require stronger verification by default in production
// Set WEBAUTHN_REQUIRE_USER_VERIFICATION=false to disable (not recommended)
const REQUIRE_USER_VERIFICATION = isProduction 
    ? process.env.WEBAUTHN_REQUIRE_USER_VERIFICATION !== 'false'
    : false; // More lenient in development for testing

// Relying Party configuration
const rpName = process.env.WEBAUTHN_RP_NAME || 'VulnIQ Admin';

// RP ID must be the eTLD+1 (e.g., 'example.com' not 'admin.example.com')
// In production, this MUST be explicitly set via WEBAUTHN_RP_ID
function getRpID(requestOrigin = null) {
    // In development, if we have a request origin, use its hostname
    // This handles both localhost and 127.0.0.1 automatically
    if (isDevelopment && requestOrigin) {
        try {
            const hostname = new URL(requestOrigin).hostname;
            log('[WebAuthn] Using request-based RP ID:', hostname);
            return hostname;
        } catch (e) {
            // Fall through to default logic
        }
    }
    
    if (process.env.WEBAUTHN_RP_ID) {
        return process.env.WEBAUTHN_RP_ID;
    }
    
    if (process.env.NEXT_PUBLIC_APP_URL) {
        const hostname = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
        // Warn if using derived RP ID in production
        if (isProduction) {
            warn('[WebAuthn] WEBAUTHN_RP_ID not set in production. Deriving from NEXT_PUBLIC_APP_URL:', hostname);
        }
        return hostname;
    }
    
    // Only allow localhost in development
    if (!isDevelopment) {
        throw new Error('WEBAUTHN_RP_ID or NEXT_PUBLIC_APP_URL must be set in production');
    }
    
    return 'localhost';
}

function getOrigin(requestOrigin = null) {
    // In development, accept the actual request origin
    // This handles localhost:3000, 127.0.0.1:3000, different ports, etc.
    if (isDevelopment && requestOrigin) {
        log('[WebAuthn] Using request-based origin:', requestOrigin);
        return requestOrigin;
    }
    
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    if (!isDevelopment) {
        throw new Error('NEXT_PUBLIC_APP_URL must be set in production');
    }
    
    return 'http://localhost:3000';
}

// Default values (used when no request origin is provided)
const defaultRpID = getRpID();
const defaultOrigin = getOrigin();

// Allowed localhost origins for development (for verification)
const LOCALHOST_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
];

// Helper to get expected origins for verification
function getExpectedOrigins(requestOrigin = null) {
    if (isDevelopment) {
        // In development, accept all localhost variations
        const origins = [...LOCALHOST_ORIGINS];
        if (requestOrigin && !origins.includes(requestOrigin)) {
            origins.push(requestOrigin);
        }
        return origins;
    }
    return getOrigin(requestOrigin);
}

// Log RP configuration on startup (for debugging)
if (isDevelopment) {
    log('[WebAuthn] Default RP ID:', defaultRpID);
    log('[WebAuthn] Default Origin:', defaultOrigin);
    log('[WebAuthn] Allowed origins:', LOCALHOST_ORIGINS);
}

// Challenge expiry (5 minutes)
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Check if an admin has any registered passkeys
 * @param {string} email - Admin email
 * @returns {Promise<boolean>}
 */
export async function hasPasskey(email) {
    const count = await prisma.adminPasskey.count({
        where: { email: email.toLowerCase() }
    });
    return count > 0;
}

/**
 * Get all passkeys for an admin
 * @param {string} email - Admin email
 * @returns {Promise<Array>}
 */
export async function getPasskeys(email) {
    return prisma.adminPasskey.findMany({
        where: { email: email.toLowerCase() },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Generate WebAuthn registration options for a new passkey
 * @param {string} email - Admin email
 * @param {string} displayName - Display name for the passkey
 * @param {string} requestOrigin - The origin of the request (for localhost flexibility)
 * @returns {Promise<Object>} Registration options to pass to browser
 */
export async function generatePasskeyRegistrationOptions(email, displayName, requestOrigin = null) {
    const normalizedEmail = email.toLowerCase();
    
    // Get RP ID based on request origin (handles localhost vs 127.0.0.1)
    const rpID = getRpID(requestOrigin);
    log('[Registration] Using RP ID:', rpID, 'from origin:', requestOrigin);
    
    // Get existing passkeys to exclude
    const existingPasskeys = await getPasskeys(normalizedEmail);
    
    // Create a stable user ID based on email (for WebAuthn user handle)
    // In SimpleWebAuthn v9.x, userID must be a Uint8Array, not a string
    const encoder = new TextEncoder();
    const emailBytes = encoder.encode(normalizedEmail);
    const hashBuffer = await crypto.subtle.digest('SHA-256', emailBytes);
    const webauthnUserIdBytes = new Uint8Array(hashBuffer);
    const webauthnUserId = Buffer.from(hashBuffer).toString('base64url');
    
    log('[Registration] RP ID being used:', rpID);
    log('[Registration] RP Name:', rpName);
    log('[Registration] User email:', normalizedEmail);
    log('[Registration] User ID (base64url):', webauthnUserId);
    log('[Registration] User ID bytes length:', webauthnUserIdBytes.length);
    
    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: normalizedEmail,
        userDisplayName: displayName || normalizedEmail,
        // SimpleWebAuthn v9.x requires userID as Uint8Array
        userID: webauthnUserIdBytes,
        // Don't require attestation for easier compatibility
        attestationType: 'none',
        // Exclude existing credentials to prevent re-registration
        excludeCredentials: existingPasskeys.map(passkey => ({
            id: passkey.credentialId,
            type: 'public-key',
            transports: passkey.transports ? passkey.transports.split(',') : undefined,
        })),
        authenticatorSelection: {
            // Require resident keys (discoverable credentials) for true passkey behavior
            // This enables:
            // - Usernameless authentication
            // - Cross-device sync (Apple/Google/Microsoft passkey sync)
            // - Proper passkey UX vs legacy WebAuthn
            residentKey: 'required',
            // For admin accounts in production, require user verification (biometric/PIN)
            // In development, use 'preferred' for easier testing
            userVerification: REQUIRE_USER_VERIFICATION ? 'required' : 'preferred',
            // Allow both platform (Touch ID, Face ID, Windows Hello)
            // and cross-platform (security keys) authenticators
            authenticatorAttachment: undefined, // Don't restrict
        },
    });
    
    log('[Registration] Generated options:', redact({
        rpId: options.rp?.id,
        rpName: options.rp?.name,
        challenge: options.challenge,
        userId: options.user?.id,
        userName: options.user?.name,
    }));
    
    // Store challenge for verification
    await prisma.adminPasskeyChallenge.create({
        data: {
            email: normalizedEmail,
            challenge: options.challenge,
            type: 'registration',
            expiresAt: new Date(Date.now() + CHALLENGE_EXPIRY_MS),
        }
    });
    
    // Clean up expired challenges in background (non-blocking, limited)
    // Note: Consider using a cron job for production at scale
    prisma.adminPasskeyChallenge.deleteMany({
        where: { expiresAt: { lt: new Date() } }
    }).catch(err => warn('[WebAuthn] Challenge cleanup error:', err.message));
    
    return {
        options,
        webauthnUserId,
    };
}

/**
 * Verify passkey registration response and save credential
 * @param {string} email - Admin email
 * @param {Object} response - Registration response from browser
 * @param {string} deviceName - Optional device name
 * @param {string} requestOrigin - The origin of the request
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPasskeyRegistration(email, response, deviceName, requestOrigin = null) {
    const normalizedEmail = email.toLowerCase();
    
    // Get RP ID and expected origins based on request
    const rpID = getRpID(requestOrigin);
    const expectedOrigins = getExpectedOrigins(requestOrigin);
    log('[Passkey] Verification config - RP ID:', rpID, 'Expected origins:', expectedOrigins);
    
    // Get the challenge
    const challengeRecord = await prisma.adminPasskeyChallenge.findFirst({
        where: {
            email: normalizedEmail,
            type: 'registration',
            expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
    });
    
    if (!challengeRecord) {
        throw new Error('Registration challenge not found or expired');
    }
    
    log('[Passkey] Starting verification for:', normalizedEmail);
    
    try {
        // For admin accounts, requireUserVerification is configurable
        // In production, defaults to true for stronger security
        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: challengeRecord.challenge,
            expectedOrigin: expectedOrigins,
            expectedRPID: rpID,
            requireUserVerification: REQUIRE_USER_VERIFICATION,
        });
        
        log('[Passkey] Verification result:', verification.verified);
        
        if (!verification.verified || !verification.registrationInfo) {
            throw new Error('Registration verification failed');
        }
        
        const { registrationInfo } = verification;
        
        // SimpleWebAuthn v13.x structure - credential is nested under registrationInfo
        // credential: { id: Base64URLString, publicKey: Uint8Array, counter: number, transports?: string[] }
        const {
            credential,
            credentialDeviceType,
            credentialBackedUp,
            aaguid,
        } = registrationInfo;
        
        if (!credential || !credential.id || !credential.publicKey) {
            console.error('[WebAuthn] Missing credential data:', { 
                hasCredential: !!credential,
                hasCredentialID: !!credential?.id, 
                hasCredentialPublicKey: !!credential?.publicKey 
            });
            throw new Error('Invalid credential data received from authenticator');
        }
        
        // In v13.x, credential.id is already Base64URLString
        const credentialIdBase64 = credential.id;
        
        // Create a stable user ID based on email
        const encoder = new TextEncoder();
        const emailBytes = encoder.encode(normalizedEmail);
        const hashBuffer = await crypto.subtle.digest('SHA-256', emailBytes);
        const webauthnUserId = Buffer.from(hashBuffer).toString('base64url');
        
        // Get transports - prefer from credential (v13.x), fallback to response
        const transports = credential.transports || response.response?.transports || [];
        
        // Save the passkey
        log('[Passkey] Saving passkey for:', normalizedEmail);
        log('[Passkey] Credential ID:', credentialIdBase64);
        
        const savedPasskey = await prisma.adminPasskey.create({
            data: {
                email: normalizedEmail,
                credentialId: credentialIdBase64,
                publicKey: Buffer.from(credential.publicKey),
                webauthnUserId,
                counter: BigInt(credential.counter || 0),
                deviceType: credentialDeviceType || 'singleDevice',
                backedUp: credentialBackedUp || false,
                transports: transports.length > 0 ? transports.join(',') : null,
                aaguid: aaguid || null,
                deviceName: deviceName || null,
            }
        });
        
        log('[Passkey] Saved passkey ID:', savedPasskey.id);
        
        return { verified: true };
        
    } catch (error) {
        console.error('Passkey registration verification error:', error);
        throw error;
    } finally {
        // Always delete the used challenge (prevents replay attacks)
        if (challengeRecord?.id) {
            await prisma.adminPasskeyChallenge.delete({
                where: { id: challengeRecord.id }
            }).catch(() => {}); // Ignore if already deleted
        }
    }
}

/**
 * Generate WebAuthn authentication options
 * @param {string} email - Admin email
 * @param {string} requestOrigin - The origin of the request
 * @returns {Promise<Object>} Authentication options to pass to browser
 */
export async function generatePasskeyAuthenticationOptions(email, requestOrigin = null) {
    const normalizedEmail = email.toLowerCase();
    
    // Get RP ID based on request origin
    const rpID = getRpID(requestOrigin);
    log('[Auth Options] Using RP ID:', rpID, 'from origin:', requestOrigin);
    
    // Get existing passkeys
    const passkeys = await getPasskeys(normalizedEmail);
    
    log('[Auth Options] Found passkeys for', normalizedEmail, ':', passkeys.length);
    if (isDevelopment) {
        passkeys.forEach((p, i) => {
            log(`[Auth Options] Passkey ${i}: credentialId=${p.credentialId}, transports=${p.transports}`);
        });
    }
    
    if (passkeys.length === 0) {
        throw new Error('No passkeys registered for this admin');
    }
    
    // For discoverable credentials (resident keys), we have two options:
    // 1. allowCredentials = undefined → Browser shows ALL passkeys for this RP (user picks)
    // 2. allowCredentials = [...] → Browser filters to only matching credential IDs
    //
    // We'll try option 1 first (discoverable mode) since it's more flexible
    // and avoids credential ID format mismatches between what we stored and what the browser has
    
    // Per SimpleWebAuthn docs:
    // - allowCredentials: [] for passkey discovery mode
    // For admin accounts in production, require user verification
    const options = await generateAuthenticationOptions({
        rpID,
        // Don't filter by credential IDs - let the browser discover all available passkeys
        // This works because we registered with residentKey: 'required'
        allowCredentials: [],
        userVerification: REQUIRE_USER_VERIFICATION ? 'required' : 'preferred',
    });
    
    log('[Auth Options] Generated options (discoverable mode):', redact({
        challenge: options.challenge,
        rpId: options.rpId,
        allowCredentials: options.allowCredentials,
        userVerification: options.userVerification,
    }));
    
    // Store challenge for verification
    await prisma.adminPasskeyChallenge.create({
        data: {
            email: normalizedEmail,
            challenge: options.challenge,
            type: 'authentication',
            expiresAt: new Date(Date.now() + CHALLENGE_EXPIRY_MS),
        }
    });
    
    // Clean up expired challenges in background (non-blocking)
    prisma.adminPasskeyChallenge.deleteMany({
        where: { expiresAt: { lt: new Date() } }
    }).catch(err => warn('[WebAuthn] Challenge cleanup error:', err.message));
    
    return options;
}

/**
 * Verify passkey authentication response
 * @param {string} email - Admin email
 * @param {Object} response - Authentication response from browser
 * @param {string} requestOrigin - The origin of the request
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPasskeyAuthentication(email, response, requestOrigin = null) {
    const normalizedEmail = email.toLowerCase();
    
    // Get RP ID and expected origins based on request
    const rpID = getRpID(requestOrigin);
    const expectedOrigins = getExpectedOrigins(requestOrigin);
    log('[Auth Verify] Config - RP ID:', rpID, 'Expected origins:', expectedOrigins);
    
    // Fix malformed userHandle - sometimes it comes as "[object Object]" due to
    // improper serialization of Uint8Array/ArrayBuffer in JSON.stringify
    // We can safely delete it since we're verifying by credential ID anyway
    // and SimpleWebAuthn will fail to parse the malformed string
    if (response?.response) {
        const userHandle = response.response.userHandle;
        if (userHandle === '[object Object]' || 
            userHandle === null ||
            userHandle === '' ||
            (typeof userHandle === 'object' && userHandle !== null)) {
            log('[Auth Verify] Removing malformed/empty userHandle');
            delete response.response.userHandle;
        }
    }
    
    // Get the challenge
    const challengeRecord = await prisma.adminPasskeyChallenge.findFirst({
        where: {
            email: normalizedEmail,
            type: 'authentication',
            expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
    });
    
    if (!challengeRecord) {
        throw new Error('Authentication challenge not found or expired');
    }
    
    // Get the passkey used - response.id is the credential ID returned by the browser
    log('[Auth Verify] Looking up passkey with credentialId:', response.id);
    
    const passkey = await prisma.adminPasskey.findUnique({
        where: { credentialId: response.id }
    });
    
    log('[Auth Verify] Passkey lookup result:', passkey ? 'found' : 'NOT FOUND');
    
    if (!passkey) {
        // The browser returned a passkey that doesn't exist in our database
        // Log details for debugging, but return generic error to user
        warn('[Auth Verify] Passkey not found:', response.id);
        throw new Error('Passkey not recognized. Please register a new passkey or contact support.');
    }
    
    // Verify passkey belongs to this email
    if (passkey.email !== normalizedEmail) {
        throw new Error('Passkey does not belong to this admin');
    }
    
    log('[Auth Verify] Passkey belongs to:', passkey.email, ', counter:', passkey.counter);
    log('[Auth Verify] Response ID:', response.id, 'type:', response.type);
    log('[Auth Verify] Public key length:', passkey.publicKey?.length);
    
    // Prepare credential object for SimpleWebAuthn v13.x
    // WebAuthnCredential type requires:
    // - id: Base64URLString (NOT Uint8Array!)
    // - publicKey: Uint8Array
    // - counter: number
    // - transports?: string[]
    const publicKeyBytes = new Uint8Array(passkey.publicKey);
    const counterValue = Number(passkey.counter) || 0;
    const transportsArray = passkey.transports ? passkey.transports.split(',') : undefined;
    
    log('[Auth Verify] Credential components:', {
        credentialId: passkey.credentialId,
        publicKeyBytesLength: publicKeyBytes.length,
        publicKeyBytesType: Object.prototype.toString.call(publicKeyBytes),
        counterValue,
        counterValueType: typeof counterValue,
        transportsArray,
    });
    
    // Build the options object explicitly
    // NOTE: In SimpleWebAuthn v13.x, the parameter is called 'credential', not 'authenticator'
    // and id must be Base64URLString, not Uint8Array
    const verificationOptions = {
        response: response,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: rpID,
        credential: {
            id: passkey.credentialId,
            publicKey: publicKeyBytes,
            counter: counterValue,
            transports: transportsArray,
        },
        // For admin accounts, requireUserVerification is configurable
        // In production, defaults to true for stronger security
        requireUserVerification: REQUIRE_USER_VERIFICATION,
    };
    
    log('[Auth Verify] Full verification options:', {
        hasResponse: !!verificationOptions.response,
        hasChallenge: !!verificationOptions.expectedChallenge,
        hasOrigin: !!verificationOptions.expectedOrigin,
        hasRPID: !!verificationOptions.expectedRPID,
        hasCredential: !!verificationOptions.credential,
        credentialId: verificationOptions.credential?.id,
        credentialCounter: verificationOptions.credential?.counter,
        credentialPublicKeyLength: verificationOptions.credential?.publicKey?.length,
    });
    
    try {
        // Per SimpleWebAuthn docs for passkeys:
        // - requireUserVerification can be false for better compatibility
        // - The phishing-resistant properties of WebAuthn already provide strong security
        const verification = await verifyAuthenticationResponse(verificationOptions);
        
        log('[Auth Verify] Verification result:', verification);
        
        if (!verification.verified) {
            throw new Error('Authentication verification failed');
        }
        
        const newCounter = verification.authenticationInfo.newCounter;
        const storedCounter = Number(passkey.counter);
        
        // Counter rollback detection (potential credential cloning)
        // Note: Many modern authenticators return counter=0, so we only warn
        // if there's a clear rollback from a non-zero counter
        if (newCounter > 0 && storedCounter > 0 && newCounter <= storedCounter) {
            warn(
                `[WebAuthn] Counter rollback detected for passkey ${passkey.id}. ` +
                `Stored: ${storedCounter}, Received: ${newCounter}. ` +
                `This could indicate credential cloning, but may also be a sync issue.`
            );
            // We don't fail here because:
            // 1. Many platform authenticators have unreliable counters
            // 2. Passkey sync can cause legitimate counter issues
            // 3. User verification is required, providing security
        }
        
        // Update counter and last used timestamp
        await prisma.adminPasskey.update({
            where: { id: passkey.id },
            data: {
                counter: BigInt(newCounter),
                lastUsedAt: new Date(),
            }
        });
        
        return { verified: true };
        
    } catch (error) {
        console.error('Passkey authentication verification error:', error);
        throw error;
    } finally {
        // Always delete the used challenge (prevents replay attacks)
        if (challengeRecord?.id) {
            await prisma.adminPasskeyChallenge.delete({
                where: { id: challengeRecord.id }
            }).catch(() => {}); // Ignore if already deleted
        }
    }
}

/**
 * Delete a passkey
 * @param {string} email - Admin email
 * @param {string} passkeyId - Passkey ID to delete
 * @returns {Promise<boolean>}
 */
export async function deletePasskey(email, passkeyId) {
    const normalizedEmail = email.toLowerCase();
    
    const passkey = await prisma.adminPasskey.findUnique({
        where: { id: passkeyId }
    });
    
    if (!passkey || passkey.email !== normalizedEmail) {
        throw new Error('Passkey not found or does not belong to this admin');
    }
    
    // Check if this is the last passkey
    const count = await prisma.adminPasskey.count({
        where: { email: normalizedEmail }
    });
    
    if (count <= 1) {
        throw new Error('Cannot delete the last passkey');
    }
    
    await prisma.adminPasskey.delete({
        where: { id: passkeyId }
    });
    
    return true;
}
