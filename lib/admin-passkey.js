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

// Relying Party configuration
const rpName = process.env.WEBAUTHN_RP_NAME || 'VulnIQ Admin';

// RP ID must be the eTLD+1 (e.g., 'example.com' not 'admin.example.com')
// In production, this MUST be explicitly set via WEBAUTHN_RP_ID
function getRpID() {
    if (process.env.WEBAUTHN_RP_ID) {
        return process.env.WEBAUTHN_RP_ID;
    }
    
    if (process.env.NEXT_PUBLIC_APP_URL) {
        const hostname = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
        // Warn if using derived RP ID in production
        if (isProduction) {
            console.warn('[WebAuthn] WEBAUTHN_RP_ID not set in production. Deriving from NEXT_PUBLIC_APP_URL:', hostname);
        }
        return hostname;
    }
    
    // Only allow localhost in development
    if (!isDevelopment) {
        throw new Error('WEBAUTHN_RP_ID or NEXT_PUBLIC_APP_URL must be set in production');
    }
    
    return 'localhost';
}

function getOrigin() {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    if (!isDevelopment) {
        throw new Error('NEXT_PUBLIC_APP_URL must be set in production');
    }
    
    return 'http://localhost:3000';
}

const rpID = getRpID();
const origin = getOrigin();

// Log RP configuration on startup (for debugging)
if (isDevelopment) {
    console.log('[WebAuthn] RP ID:', rpID);
    console.log('[WebAuthn] Origin:', origin);
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
 * @returns {Promise<Object>} Registration options to pass to browser
 */
export async function generatePasskeyRegistrationOptions(email, displayName) {
    const normalizedEmail = email.toLowerCase();
    
    // Get existing passkeys to exclude
    const existingPasskeys = await getPasskeys(normalizedEmail);
    
    // Create a stable user ID based on email (for WebAuthn user handle)
    const encoder = new TextEncoder();
    const emailBytes = encoder.encode(normalizedEmail);
    const hashBuffer = await crypto.subtle.digest('SHA-256', emailBytes);
    const webauthnUserId = Buffer.from(hashBuffer).toString('base64url');
    
    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: normalizedEmail,
        userDisplayName: displayName || normalizedEmail,
        userID: webauthnUserId,
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
            // Require user verification (biometric/PIN) for security
            userVerification: 'required',
            // Allow both platform (Touch ID, Face ID, Windows Hello)
            // and cross-platform (security keys) authenticators
            authenticatorAttachment: undefined, // Don't restrict
        },
    });
    
    // Store challenge for verification
    await prisma.adminPasskeyChallenge.create({
        data: {
            email: normalizedEmail,
            challenge: options.challenge,
            type: 'registration',
            expiresAt: new Date(Date.now() + CHALLENGE_EXPIRY_MS),
        }
    });
    
    // Clean up expired challenges
    await prisma.adminPasskeyChallenge.deleteMany({
        where: { expiresAt: { lt: new Date() } }
    });
    
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
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPasskeyRegistration(email, response, deviceName) {
    const normalizedEmail = email.toLowerCase();
    
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
    
    console.log('[Passkey] Starting verification for:', normalizedEmail);
    
    try {
        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: challengeRecord.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });
        
        console.log('[Passkey] Verification result:', verification.verified);
        
        if (!verification.verified || !verification.registrationInfo) {
            throw new Error('Registration verification failed');
        }
        
        const { registrationInfo } = verification;
        
        // SimpleWebAuthn v9.x structure - properties are directly on registrationInfo
        // NOT nested under a 'credential' object
        const {
            credentialID,
            credentialPublicKey,
            counter,
            credentialDeviceType,
            credentialBackedUp,
            aaguid,
        } = registrationInfo;
        
        if (!credentialID || !credentialPublicKey) {
            console.error('[WebAuthn] Missing credential data:', { 
                hasCredentialID: !!credentialID, 
                hasCredentialPublicKey: !!credentialPublicKey 
            });
            throw new Error('Invalid credential data received from authenticator');
        }
        
        // Convert Uint8Array credentialID to base64url string for storage
        const credentialIdBase64 = Buffer.from(credentialID).toString('base64url');
        
        // Create a stable user ID based on email
        const encoder = new TextEncoder();
        const emailBytes = encoder.encode(normalizedEmail);
        const hashBuffer = await crypto.subtle.digest('SHA-256', emailBytes);
        const webauthnUserId = Buffer.from(hashBuffer).toString('base64url');
        
        // Get transports from the original response if available
        const transports = response.response?.transports || response.transports || [];
        
        // Save the passkey
        console.log('[Passkey] Saving passkey for:', normalizedEmail);
        console.log('[Passkey] Credential ID:', credentialIdBase64);
        
        const savedPasskey = await prisma.adminPasskey.create({
            data: {
                email: normalizedEmail,
                credentialId: credentialIdBase64,
                publicKey: Buffer.from(credentialPublicKey),
                webauthnUserId,
                counter: BigInt(counter || 0),
                deviceType: credentialDeviceType || 'singleDevice',
                backedUp: credentialBackedUp || false,
                transports: transports.length > 0 ? transports.join(',') : null,
                aaguid: aaguid || null,
                deviceName: deviceName || null,
            }
        });
        
        console.log('[Passkey] Saved passkey ID:', savedPasskey.id);
        
        // Delete the used challenge
        await prisma.adminPasskeyChallenge.delete({
            where: { id: challengeRecord.id }
        });
        
        return { verified: true };
        
    } catch (error) {
        console.error('Passkey registration verification error:', error);
        throw error;
    }
}

/**
 * Generate WebAuthn authentication options
 * @param {string} email - Admin email
 * @returns {Promise<Object>} Authentication options to pass to browser
 */
export async function generatePasskeyAuthenticationOptions(email) {
    const normalizedEmail = email.toLowerCase();
    
    // Get existing passkeys
    const passkeys = await getPasskeys(normalizedEmail);
    
    console.log('[Auth Options] Found passkeys for', normalizedEmail, ':', passkeys.length);
    passkeys.forEach((p, i) => {
        console.log(`[Auth Options] Passkey ${i}: credentialId=${p.credentialId}, transports=${p.transports}`);
    });
    
    if (passkeys.length === 0) {
        throw new Error('No passkeys registered for this admin');
    }
    
    const allowCredentials = passkeys.map(passkey => ({
        id: passkey.credentialId,
        type: 'public-key',
        transports: passkey.transports ? passkey.transports.split(',') : undefined,
    }));
    
    console.log('[Auth Options] allowCredentials:', JSON.stringify(allowCredentials));
    
    const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials,
        // Require user verification (biometric/PIN) for security
        // This ensures the person using the passkey is authenticated
        userVerification: 'required',
    });
    
    console.log('[Auth Options] Generated options challenge:', options.challenge);
    
    // Store challenge for verification
    await prisma.adminPasskeyChallenge.create({
        data: {
            email: normalizedEmail,
            challenge: options.challenge,
            type: 'authentication',
            expiresAt: new Date(Date.now() + CHALLENGE_EXPIRY_MS),
        }
    });
    
    // Clean up expired challenges
    await prisma.adminPasskeyChallenge.deleteMany({
        where: { expiresAt: { lt: new Date() } }
    });
    
    return options;
}

/**
 * Verify passkey authentication response
 * @param {string} email - Admin email
 * @param {Object} response - Authentication response from browser
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPasskeyAuthentication(email, response) {
    const normalizedEmail = email.toLowerCase();
    
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
    
    // Get the passkey used
    const passkey = await prisma.adminPasskey.findUnique({
        where: { credentialId: response.id }
    });
    
    if (!passkey) {
        throw new Error('Passkey not found');
    }
    
    // Verify passkey belongs to this email
    if (passkey.email !== normalizedEmail) {
        throw new Error('Passkey does not belong to this admin');
    }
    
    try {
        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge: challengeRecord.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
                id: passkey.credentialId,
                publicKey: new Uint8Array(passkey.publicKey),
                counter: Number(passkey.counter),
                transports: passkey.transports ? passkey.transports.split(',') : undefined,
            },
            // Allow counter to be 0 for modern platform authenticators
            // Many modern authenticators (especially passkeys synced via cloud)
            // don't reliably increment counters
            requireUserVerification: true,
        });
        
        if (!verification.verified) {
            throw new Error('Authentication verification failed');
        }
        
        const newCounter = verification.authenticationInfo.newCounter;
        const storedCounter = Number(passkey.counter);
        
        // Counter rollback detection (potential credential cloning)
        // Note: Many modern authenticators return counter=0, so we only warn
        // if there's a clear rollback from a non-zero counter
        if (newCounter > 0 && storedCounter > 0 && newCounter <= storedCounter) {
            console.warn(
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
        
        // Delete the used challenge
        await prisma.adminPasskeyChallenge.delete({
            where: { id: challengeRecord.id }
        });
        
        return { verified: true };
        
    } catch (error) {
        console.error('Passkey authentication verification error:', error);
        throw error;
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
