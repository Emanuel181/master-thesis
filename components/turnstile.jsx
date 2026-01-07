'use client';

import { useEffect, useRef, useState, useCallback, useId, forwardRef, useImperativeHandle } from 'react';

/**
 * Cloudflare Turnstile React Component (Explicit Rendering)
 *
 * Uses explicit rendering for full control over widget lifecycle.
 *
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 */

/**
 * Script URL - Must be fetched from this exact URL per Cloudflare docs.
 * Proxying or caching this file will cause Turnstile to fail.
 */
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

/** Token validity period: 5 minutes (300 seconds) */
const TOKEN_VALIDITY_MS = 300000;

// Global script loading state
let scriptLoadingPromise = null;
let scriptLoaded = false;

/**
 * Load the Turnstile script with explicit rendering mode
 * @returns {Promise<void>}
 */
function loadTurnstileScript() {
    // Already loaded and available
    if (scriptLoaded && typeof window !== 'undefined' && window.turnstile) {
        return Promise.resolve();
    }

    // Currently loading
    if (scriptLoadingPromise) {
        return scriptLoadingPromise;
    }

    scriptLoadingPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('Turnstile requires a browser environment'));
            return;
        }

        // Already available
        if (window.turnstile) {
            scriptLoaded = true;
            resolve();
            return;
        }

        // Check if script already exists in DOM
        const existingScript = document.querySelector(`script[src*="challenges.cloudflare.com/turnstile"]`);
        if (existingScript) {
            // Wait for turnstile to become available
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.turnstile) {
                    clearInterval(checkInterval);
                    scriptLoaded = true;
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    scriptLoadingPromise = null;
                    reject(new Error('Turnstile script loaded but not initialized'));
                }
            }, 100);
            return;
        }

        // Create new script element
        const script = document.createElement('script');
        script.src = `${TURNSTILE_SCRIPT_URL}?render=explicit`;
        script.async = true;
        script.defer = true;
        script.id = 'cf-turnstile-script';

        const cleanup = () => {
            script.onload = null;
            script.onerror = null;
        };

        script.onload = () => {
            // Wait for turnstile object to be available
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds
            const checkTurnstile = () => {
                attempts++;
                if (window.turnstile) {
                    cleanup();
                    scriptLoaded = true;
                    resolve();
                } else if (attempts >= maxAttempts) {
                    cleanup();
                    scriptLoadingPromise = null;
                    reject(new Error('Turnstile script loaded but turnstile object not available'));
                } else {
                    setTimeout(checkTurnstile, 100);
                }
            };
            checkTurnstile();
        };

        script.onerror = (event) => {
            cleanup();
            scriptLoadingPromise = null;
            console.error('[Turnstile] Failed to load script:', event);
            reject(new Error('Failed to load Turnstile script. Check network and CSP settings.'));
        };

        document.head.appendChild(script);
    });

    return scriptLoadingPromise;
}

/**
 * @typedef {Object} TurnstileProps
 * @property {string} [siteKey] - Turnstile site key (defaults to NEXT_PUBLIC_TURNSTILE_SITE_KEY)
 * @property {(token: string) => void} onSuccess - Called with token on successful verification
 * @property {(errorCode: string) => void} [onError] - Called with error code on failure
 * @property {() => void} [onExpire] - Called when token expires (after 5 minutes)
 * @property {() => void} [onTimeout] - Called when challenge times out
 * @property {'auto' | 'light' | 'dark'} [theme='auto'] - Visual theme
 * @property {'normal' | 'flexible' | 'compact'} [size='normal'] - Widget size
 * @property {string} [action] - Custom action identifier for analytics
 * @property {string} [cData] - Custom data payload (max 255 chars)
 * @property {'render' | 'execute'} [execution='render'] - When to run the challenge
 * @property {'always' | 'execute' | 'interaction-only'} [appearance='always'] - When widget is visible
 * @property {string} [className] - Additional CSS classes
 * @property {number} [refreshBeforeExpiry=10000] - Milliseconds before expiry to auto-refresh
 */

/**
 * Turnstile Widget Component
 *
 * @example
 * const turnstileRef = useRef(null);
 *
 * <Turnstile
 *   ref={turnstileRef}
 *   onSuccess={(token) => setToken(token)}
 *   onError={(code) => console.error('Error:', code)}
 *   onExpire={() => setToken(null)}
 *   action="login"
 *   theme="auto"
 * />
 *
 * // Reset after form submission:
 * turnstileRef.current?.reset();
 */
export const Turnstile = forwardRef(function Turnstile({
    siteKey,
    onSuccess,
    onError,
    onExpire,
    onTimeout,
    theme = 'auto',
    size = 'normal',
    action,
    cData,
    execution = 'render',
    appearance = 'always',
    className = '',
    refreshBeforeExpiry = 10000,
}, ref) {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const verifiedRef = useRef(false); // Track if already verified to prevent reset
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const mountedRef = useRef(true);
    const uniqueId = useId();
    const containerId = `turnstile-${uniqueId.replace(/:/g, '')}`;

    // Use refs for callbacks to prevent re-initialization when callbacks change
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);
    const onTimeoutRef = useRef(onTimeout);

    // Keep refs updated with latest callbacks
    useEffect(() => {
        onSuccessRef.current = onSuccess;
        onErrorRef.current = onError;
        onExpireRef.current = onExpire;
        onTimeoutRef.current = onTimeout;
    });

    // Ensure consistent SSR/CSR rendering to avoid hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const resolvedSiteKey = siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const reset = useCallback(() => {
        verifiedRef.current = false; // Allow re-verification
        if (widgetIdRef.current != null && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
        }
    }, []);

    const getResponse = useCallback(() => {
        if (widgetIdRef.current != null && window.turnstile) {
            return window.turnstile.getResponse(widgetIdRef.current);
        }
        return undefined;
    }, []);

    const isExpired = useCallback(() => {
        if (widgetIdRef.current != null && window.turnstile) {
            return window.turnstile.isExpired(widgetIdRef.current);
        }
        return true;
    }, []);

    const execute = useCallback(() => {
        if (widgetIdRef.current != null && window.turnstile) {
            window.turnstile.execute(widgetIdRef.current);
        }
    }, []);

    const remove = useCallback(() => {
        if (widgetIdRef.current != null && window.turnstile) {
            try {
                window.turnstile.remove(widgetIdRef.current);
            } catch {
                // Widget may already be removed
            }
            widgetIdRef.current = null;
        }
    }, []);

    // Retry handler
    const handleRetry = useCallback(() => {
        if (retryCount < 3) {
            setError(null);
            setIsLoading(true);
            setRetryCount(prev => prev + 1);
            // Reset script loading state to force reload
            scriptLoadingPromise = null;
            scriptLoaded = false;
        }
    }, [retryCount]);

    useImperativeHandle(ref, () => ({
        reset,
        getResponse,
        isExpired,
        execute,
        remove,
        retry: handleRetry,
    }), [reset, getResponse, isExpired, execute, remove, handleRetry]);

    useEffect(() => {
        mountedRef.current = true;

        if (!resolvedSiteKey) {
            setError('Turnstile site key is not configured');
            setIsLoading(false);
            return;
        }

        let expiryTimer = null;

        const initWidget = async () => {
            // Don't reinitialize if already verified successfully
            if (verifiedRef.current && widgetIdRef.current != null) {
                return;
            }
            
            try {
                await loadTurnstileScript();

                if (!mountedRef.current || !containerRef.current) return;
                
                // Don't reinitialize if verified while loading script
                if (verifiedRef.current && widgetIdRef.current != null) {
                    return;
                }

                // Remove existing widget before creating new one
                remove();

                // Ensure turnstile is available before rendering
                if (!window.turnstile) {
                    throw new Error('Turnstile script loaded but API not available');
                }

                // Render the widget directly (don't use turnstile.ready() with async/defer scripts)
                // The script is already loaded at this point via loadTurnstileScript()
                if (!mountedRef.current || !containerRef.current) return;
                
                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                        sitekey: resolvedSiteKey,
                        theme,
                        size,
                        action,
                        cData,
                        execution,
                        appearance,
                        callback: (token) => {
                            if (!mountedRef.current) return;
                            // Mark as verified to prevent re-initialization
                            verifiedRef.current = true;
                            onSuccessRef.current?.(token);

                            if (refreshBeforeExpiry > 0) {
                                const refreshTime = TOKEN_VALIDITY_MS - refreshBeforeExpiry;
                                expiryTimer = setTimeout(() => {
                                    if (mountedRef.current) {
                                        verifiedRef.current = false; // Allow refresh
                                        reset();
                                    }
                                }, refreshTime);
                            }
                        },
                        'error-callback': (errorCode) => {
                            if (!mountedRef.current) return;
                            console.error('[Turnstile] Widget error:', errorCode);
                            setError(`Turnstile error: ${errorCode}`);
                            onErrorRef.current?.(errorCode);
                        },
                        'expired-callback': () => {
                            if (!mountedRef.current) return;
                            onExpireRef.current?.();
                            reset();
                        },
                        'timeout-callback': () => {
                            if (!mountedRef.current) return;
                            onTimeoutRef.current?.();
                        },
                    });

                if (mountedRef.current) {
                    setIsLoading(false);
                    setError(null);
                }
            } catch (err) {
                if (!mountedRef.current) return;
                console.error('[Turnstile] Init error:', err);
                setError(err.message || 'Failed to initialize security check');
                setIsLoading(false);
            }
        };

        initWidget();

        return () => {
            mountedRef.current = false;
            if (expiryTimer) clearTimeout(expiryTimer);
            remove();
        };
    // Only re-initialize on essential widget config changes
    // Callbacks are accessed via refs to prevent unnecessary re-initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedSiteKey, retryCount]);

    if (!resolvedSiteKey) {
        return (
            <div className={`text-sm text-destructive ${className}`}>
                Turnstile is not configured. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY.
            </div>
        );
    }

    // Return null during SSR to avoid hydration mismatch
    if (!isMounted) {
        return (
            <div className={className}>
                <div className="flex items-center justify-center h-[65px] text-sm text-muted-foreground">
                    Loading security check...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`text-sm text-center ${className}`}>
                <p className="text-destructive mb-2">Security check failed</p>
                {retryCount < 3 && (
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="text-xs text-primary underline hover:no-underline"
                    >
                        Click to retry ({3 - retryCount} attempts remaining)
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={className}>
            {isLoading && (
                <div className="flex items-center justify-center h-[65px] text-sm text-muted-foreground">
                    Loading security check...
                </div>
            )}
            <div
                ref={containerRef}
                id={containerId}
                style={{ display: isLoading ? 'none' : 'block' }}
            />
        </div>
    );
});

/**
 * Hook for programmatic Turnstile control (invisible/execute mode)
 */
export function useTurnstile(options = {}) {
    const { siteKey, action } = options;
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const widgetIdRef = useRef(null);
    const containerRef = useRef(null);

    const resolvedSiteKey = siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    useEffect(() => {
        if (!resolvedSiteKey) {
            setError('Turnstile site key is not configured');
            return;
        }

        const init = async () => {
            try {
                await loadTurnstileScript();
                setIsReady(true);
            } catch (err) {
                console.error('[useTurnstile] Failed to load:', err);
                setError(err.message);
            }
        };

        init();

        return () => {
            if (containerRef.current && containerRef.current.parentNode) {
                containerRef.current.parentNode.removeChild(containerRef.current);
                containerRef.current = null;
            }
        };
    }, [resolvedSiteKey]);

    const execute = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!isReady) {
                reject(new Error('Turnstile not ready'));
                return;
            }

            if (!window.turnstile) {
                reject(new Error('Turnstile API not available'));
                return;
            }

            if (!resolvedSiteKey) {
                reject(new Error('Turnstile site key not configured'));
                return;
            }

            if (!containerRef.current) {
                containerRef.current = document.createElement('div');
                containerRef.current.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
                document.body.appendChild(containerRef.current);
            }

            if (widgetIdRef.current != null) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {}
                widgetIdRef.current = null;
            }

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: resolvedSiteKey,
                action,
                appearance: 'interaction-only',
                execution: 'execute',
                callback: (token) => resolve(token),
                'error-callback': (errorCode) => reject(new Error(`Turnstile error: ${errorCode}`)),
                'timeout-callback': () => reject(new Error('Turnstile challenge timed out')),
            });

            window.turnstile.execute(widgetIdRef.current);
        });
    }, [isReady, resolvedSiteKey, action]);

    const reset = useCallback(() => {
        if (widgetIdRef.current != null && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
        }
    }, []);

    return { execute, reset, isReady, error };
}

export default Turnstile;

