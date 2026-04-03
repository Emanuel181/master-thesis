"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

/**
 * Reusable hook for WebAuthn biometric authentication.
 *
 * Handles:
 *  - Checking if the user has a registered passkey
 *  - Registering a new passkey (first-time setup)
 *  - Authenticating and returning a short-lived unlockToken
 *  - Caching the token for its lifetime to avoid repeated prompts
 *
 * Usage:
 *   const { authenticate, hasPasskey, isAuthenticating } = useBiometricAuth();
 *   const token = await authenticate();  // prompts biometric, returns unlockToken
 */
export function useBiometricAuth() {
    const pathname = usePathname();
    const isDemo = pathname?.startsWith('/demo');
    const [hasPasskey, setHasPasskey] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [checked, setChecked] = useState(false);

    // Cache token + expiry so we don't prompt repeatedly
    const tokenCache = useRef({ token: null, expiresAt: 0 });

    // Guard against concurrent WebAuthn ceremonies (only one allowed at a time)
    const ceremonyInProgress = useRef(false);
    const pendingPromise = useRef(null);

    // Check passkey status on mount (skip in demo mode — no auth session)
    useEffect(() => {
        if (isDemo) { setChecked(true); return; }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/user/passkey/status");
                if (!res.ok) return;
                const { hasPasskey: has } = await res.json();
                if (!cancelled) {
                    setHasPasskey(has);
                    setChecked(true);
                }
            } catch {
                // Silently ignore — will prompt registration on first use
                if (!cancelled) setChecked(true);
            }
        })();
        return () => { cancelled = true; };
    }, [isDemo]);

    /**
     * Authenticate the user with biometrics.
     * - If no passkey exists, registers one first (user must call again to authenticate).
     * - Returns an `unlockToken` string on success.
     * - Throws on cancellation or failure.
     */
    const authenticate = useCallback(async () => {
        // Return cached token if still valid (with 5s buffer)
        if (tokenCache.current.token && tokenCache.current.expiresAt > Date.now() + 5000) {
            return tokenCache.current.token;
        }

        // If a ceremony is already in progress, piggy-back on it instead of
        // starting a second one (which would abort the first with an AbortError).
        if (ceremonyInProgress.current && pendingPromise.current) {
            return pendingPromise.current;
        }

        ceremonyInProgress.current = true;

        const run = async () => {
        setIsAuthenticating(true);
        try {
            const { startRegistration, startAuthentication } = await import("@simplewebauthn/browser");

            if (!hasPasskey) {
                // ── Register a new passkey ──
                const regOptRes = await fetch("/api/user/passkey/register-options", { method: "POST" });
                if (!regOptRes.ok) throw new Error((await regOptRes.json()).error || "Failed to get registration options");
                const { options: regOptions } = await regOptRes.json();

                const credential = await startRegistration({ optionsJSON: regOptions });

                const regVerifyRes = await fetch("/api/user/passkey/register-verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ response: credential, deviceName: navigator.userAgent.slice(0, 60) }),
                });
                if (!regVerifyRes.ok) throw new Error((await regVerifyRes.json()).error || "Registration failed");

                setHasPasskey(true);
                toast.success("Biometric unlock set up! Please authenticate again to continue.");
                throw new Error("PASSKEY_REGISTERED"); // Caller should retry
            }

            // ── Authenticate with the passkey ──
            const authOptRes = await fetch("/api/user/passkey/auth-options", { method: "POST" });
            if (!authOptRes.ok) throw new Error((await authOptRes.json()).error || "Failed to get auth options");
            const { options: authOptions } = await authOptRes.json();

            const assertion = await startAuthentication({ optionsJSON: authOptions });

            const authVerifyRes = await fetch("/api/user/passkey/auth-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ response: assertion }),
            });
            if (!authVerifyRes.ok) throw new Error((await authVerifyRes.json()).error || "Authentication failed");
            const { unlockToken } = await authVerifyRes.json();

            // Cache the token (120s lifetime, minus 10s safety margin)
            tokenCache.current = { token: unlockToken, expiresAt: Date.now() + 110_000 };

            return unlockToken;
        } catch (err) {
            if (err.message === "PASSKEY_REGISTERED") throw err;
            if (err.name === "NotAllowedError" || err.name === "AbortError") {
                toast.error("Biometric authentication cancelled");
                throw new Error("Authentication cancelled");
            }
            toast.error(err.message || "Biometric authentication failed");
            throw err;
        } finally {
            setIsAuthenticating(false);
            ceremonyInProgress.current = false;
            pendingPromise.current = null;
        }
        };

        pendingPromise.current = run();
        return pendingPromise.current;
    }, [hasPasskey]);

    /**
     * Wrapper that retries once if the passkey was just registered.
     * Call this instead of `authenticate()` for a seamless UX.
     */
    const authenticateWithRetry = useCallback(async () => {
        try {
            return await authenticate();
        } catch (err) {
            if (err.message === "PASSKEY_REGISTERED") {
                // Passkey was just registered — authenticate immediately
                return await authenticate();
            }
            throw err;
        }
    }, [authenticate]);

    return {
        /** Prompt biometric auth and return unlockToken. Throws on failure. */
        authenticate: authenticateWithRetry,
        /** Whether the user has a registered passkey */
        hasPasskey,
        /** Whether an authentication ceremony is in progress */
        isAuthenticating,
        /** Whether the initial passkey status check has completed */
        ready: checked,
    };
}

