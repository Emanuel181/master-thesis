/**
 * User Passkey Helper
 *
 * WebAuthn passkey registration & authentication for regular users.
 * Used to gate sensitive actions like revealing PDF report passwords.
 * Modelled after lib/admin-passkey.js but keyed by userId.
 */

import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ── Environment ──────────────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const log = isDevelopment ? console.log.bind(console) : () => {};

const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const UNLOCK_TOKEN_EXPIRY_S = 120; // 2 min lifetime for unlock tokens

const rpName = process.env.WEBAUTHN_RP_NAME || 'VulnIQ';

// ── RP helpers (same logic as admin-passkey.js) ──────────────────────────────
function getRpID(requestOrigin = null) {
    if (isDevelopment && requestOrigin) {
        try { return new URL(requestOrigin).hostname; } catch {}
    }
    if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
    if (process.env.NEXT_PUBLIC_APP_URL) return new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
    if (!isDevelopment) throw new Error('WEBAUTHN_RP_ID or NEXT_PUBLIC_APP_URL must be set in production');
    return 'localhost';
}

function getExpectedOrigins(requestOrigin = null) {
    if (isDevelopment) {
        const origins = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];
        if (requestOrigin && !origins.includes(requestOrigin)) origins.push(requestOrigin);
        return origins;
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'https://vulniq.com';
}

// ── Unlock-token helpers (HMAC-based, stateless) ─────────────────────────────
const TOKEN_SECRET = process.env.NEXTAUTH_SECRET || 'vulniq-unlock-secret';

/**
 * Create a short-lived unlock token (HMAC-signed, not JWT — zero deps).
 * Format: <base64-payload>.<base64-signature>
 */
export function createUnlockToken(userId) {
    const payload = JSON.stringify({ uid: userId, purpose: 'pdf-unlock', exp: Math.floor(Date.now() / 1000) + UNLOCK_TOKEN_EXPIRY_S });
    const payloadB64 = Buffer.from(payload).toString('base64url');
    const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('base64url');
    return `${payloadB64}.${sig}`;
}

/**
 * Verify an unlock token.  Returns { userId } on success, throws on failure.
 */
export function verifyUnlockToken(token) {
    const [payloadB64, sig] = (token || '').split('.');
    if (!payloadB64 || !sig) throw new Error('Malformed token');
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('base64url');
    if (sig !== expected) throw new Error('Invalid token signature');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.purpose !== 'pdf-unlock') throw new Error('Wrong token purpose');
    if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
    return { userId: payload.uid };
}

// ── Passkey helpers ──────────────────────────────────────────────────────────

/** Check if a user has any registered passkeys */
export async function hasUserPasskey(userId) {
    const count = await prisma.userPasskey.count({ where: { userId } });
    return count > 0;
}

/** Get registration options (call from POST /api/user/passkey/register-options) */
export async function generateUserRegistrationOptions(userId, userName, requestOrigin = null) {
    const rpID = getRpID(requestOrigin);
    log('[UserPasskey][Reg] RP ID:', rpID, 'origin:', requestOrigin);

    const existingPasskeys = await prisma.userPasskey.findMany({
        where: { userId },
        select: { credentialId: true, transports: true },
    });

    // Stable user handle derived from userId
    const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId));
    const webauthnUserIdBytes = new Uint8Array(hashBuf);
    const webauthnUserId = Buffer.from(hashBuf).toString('base64url');

    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: userName || 'VulnIQ User',
        userDisplayName: userName || 'VulnIQ User',
        userID: webauthnUserIdBytes,
        attestationType: 'none',
        excludeCredentials: existingPasskeys.map(p => ({
            id: p.credentialId,
            type: 'public-key',
            transports: p.transports ? p.transports.split(',') : undefined,
        })),
        pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'discouraged',
        },
    });

    // Store challenge
    await prisma.userPasskeyChallenge.create({
        data: {
            userId,
            challenge: options.challenge,
            type: 'registration',
            expiresAt: new Date(Date.now() + CHALLENGE_EXPIRY_MS),
        },
    });

    // Background cleanup
    prisma.userPasskeyChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});

    return { options, webauthnUserId };
}

/** Verify registration and save the credential */
export async function verifyUserRegistration(userId, response, deviceName, requestOrigin = null) {
    const rpID = getRpID(requestOrigin);
    const expectedOrigins = getExpectedOrigins(requestOrigin);

    const challengeRecord = await prisma.userPasskeyChallenge.findFirst({
        where: { userId, type: 'registration', expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
    });
    if (!challengeRecord) throw new Error('Registration challenge not found or expired');

    const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: rpID,
        requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
        throw new Error('Registration verification failed');
    }

    const { credential, credentialDeviceType, credentialBackedUp, aaguid } = verification.registrationInfo;

    if (!credential?.id || !credential?.publicKey) {
        throw new Error('Invalid credential data');
    }

    const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId));
    const webauthnUserId = Buffer.from(hashBuf).toString('base64url');

    await prisma.userPasskey.create({
        data: {
            userId,
            credentialId: credential.id,
            publicKey: Buffer.from(credential.publicKey),
            webauthnUserId,
            counter: BigInt(credential.counter || 0),
            deviceType: credentialDeviceType || 'singleDevice',
            backedUp: credentialBackedUp || false,
            transports: credential.transports?.join(',') || null,
            aaguid: aaguid || null,
            deviceName: deviceName || null,
        },
    });

    // Cleanup
    await prisma.userPasskeyChallenge.delete({ where: { id: challengeRecord.id } }).catch(() => {});

    return { verified: true };
}

/** Generate authentication options */
export async function generateUserAuthOptions(userId, requestOrigin = null) {
    const rpID = getRpID(requestOrigin);

    const passkeys = await prisma.userPasskey.findMany({
        where: { userId },
        select: { credentialId: true, transports: true },
    });

    if (passkeys.length === 0) throw new Error('No passkeys registered. Set up biometric unlock first.');

    const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: passkeys.map(p => ({
            id: p.credentialId,
            type: 'public-key',
            transports: p.transports ? p.transports.split(',') : undefined,
        })),
        userVerification: 'required',
    });

    await prisma.userPasskeyChallenge.create({
        data: {
            userId,
            challenge: options.challenge,
            type: 'authentication',
            expiresAt: new Date(Date.now() + CHALLENGE_EXPIRY_MS),
        },
    });

    prisma.userPasskeyChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});

    return options;
}

/** Verify authentication — returns { verified, unlockToken } */
export async function verifyUserAuthentication(userId, response, requestOrigin = null) {
    const rpID = getRpID(requestOrigin);
    const expectedOrigins = getExpectedOrigins(requestOrigin);

    // Fix malformed userHandle
    if (response?.response) {
        const uh = response.response.userHandle;
        if (uh === '[object Object]' || uh === null || uh === '' || (typeof uh === 'object' && uh !== null)) {
            delete response.response.userHandle;
        }
    }

    const challengeRecord = await prisma.userPasskeyChallenge.findFirst({
        where: { userId, type: 'authentication', expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
    });
    if (!challengeRecord) throw new Error('Authentication challenge not found or expired');

    const passkey = await prisma.userPasskey.findUnique({ where: { credentialId: response.id } });
    if (!passkey) throw new Error('Passkey not recognized');
    if (passkey.userId !== userId) throw new Error('Passkey does not belong to this user');

    const publicKeyBytes = new Uint8Array(passkey.publicKey);
    const counterValue = Number(passkey.counter) || 0;
    const transportsArray = passkey.transports ? passkey.transports.split(',') : undefined;

    const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: rpID,
        credential: {
            id: passkey.credentialId,
            publicKey: publicKeyBytes,
            counter: counterValue,
            transports: transportsArray,
        },
        requireUserVerification: false,
    });

    if (!verification.verified) throw new Error('Authentication verification failed');

    // Update counter
    await prisma.userPasskey.update({
        where: { id: passkey.id },
        data: { counter: BigInt(verification.authenticationInfo.newCounter), lastUsedAt: new Date() },
    });

    // Cleanup challenge
    await prisma.userPasskeyChallenge.delete({ where: { id: challengeRecord.id } }).catch(() => {});

    // Issue short-lived unlock token
    const unlockToken = createUnlockToken(userId);

    return { verified: true, unlockToken };
}

