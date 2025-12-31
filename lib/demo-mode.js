/**
 * Demo Mode Security Module
 * =========================
 * 
 * CRITICAL SECURITY: This module provides the ONLY source of truth for demo mode detection.
 * 
 * Demo Mode Principles (Zero Trust):
 * 1. Demo mode MUST be detected server-side, not client-side
 * 2. Demo routes MUST NOT access production data or APIs
 * 3. Demo data MUST be completely isolated from production data
 * 4. No shared state, credentials, or endpoints between modes
 * 5. All ambiguity is treated as production (fail-closed)
 * 
 * Attack Vectors Mitigated:
 * - Client-side isDemoMode manipulation
 * - Demo route accessing production APIs via direct fetch
 * - State leakage via shared localStorage
 * - Cookie/session reuse between modes
 * - URL manipulation to bypass demo restrictions
 */

// Demo route prefix - ONLY routes starting with this are considered demo
export const DEMO_ROUTE_PREFIX = '/demo';

// Demo-specific localStorage key prefix
export const DEMO_STORAGE_PREFIX = 'vulniq_demo_';

// Production localStorage key prefix  
export const PROD_STORAGE_PREFIX = 'vulniq_';

// Whitelist of stateless, safe APIs allowed in Demo Mode
// These APIs must NOT access the database, external services with prod credentials, or have side effects.
export const ALLOWED_DEMO_APIS = [
    '/api/health',
    '/api/detect-language',
    '/api/format-code',
    '/api/icons',
];

/**
 * Server-side demo mode detection based on request headers
 * This is the ONLY authoritative way to detect demo mode on the server
 * 
 * SECURITY NOTE: This function trusts the 'x-vulniq-demo-mode' header because
 * the global Proxy (middleware) strictly sanitizes this header for all requests.
 * 
 * @param {Request} request - The incoming request object
 * @returns {boolean} True if request originated from demo mode
 */
export function isDemoRequest(request) {
    // Check referer header - the page that made the request
    const referer = request.headers.get('referer');
    if (referer) {
        try {
            const refererUrl = new URL(referer);
            if (refererUrl.pathname.startsWith(DEMO_ROUTE_PREFIX)) {
                return true;
            }
        } catch {
            // Invalid referer URL - treat as production (fail-closed)
            return false;
        }
    }
    
    // Check custom header set by demo mode requests
    const demoHeader = request.headers.get('x-vulniq-demo-mode');
    if (demoHeader === 'true') {
        return true;
    }
    
    // No demo indicators - treat as production (fail-closed)
    return false;
}

/**
 * Client-side demo mode detection based on pathname
 * 
 * @param {string|null} pathname - The current pathname
 * @returns {boolean} True if currently in demo mode
 */
export function isDemoPath(pathname) {
    if (!pathname || typeof pathname !== 'string') {
        return false;
    }
    return pathname.startsWith(DEMO_ROUTE_PREFIX);
}

/**
 * Get the appropriate localStorage key for current mode
 * 
 * @param {string} baseKey - The base key name (without prefix)
 * @param {boolean} isDemoMode - Whether in demo mode
 * @returns {string} The prefixed key for the current mode
 */
export function getStorageKey(baseKey, isDemoMode) {
    if (isDemoMode) {
        return `${DEMO_STORAGE_PREFIX}${baseKey}`;
    }
    return `${PROD_STORAGE_PREFIX}${baseKey}`;
}

/**
 * Clear all demo-mode localStorage data
 * Call this when exiting demo mode to prevent data leakage
 */
export function clearDemoStorage() {
    if (typeof window === 'undefined') return;
    
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(DEMO_STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (err) {
        console.error('Error clearing demo storage:', err);
    }
}

/**
 * API Response helper for demo mode
 * Returns a 403 Forbidden response when production APIs are called from demo mode
 * 
 * @param {string} requestId - Request ID for tracking
 * @returns {Response} 403 Forbidden response
 */
export function demoModeBlockedResponse(requestId = '') {
    return new Response(
        JSON.stringify({
            error: 'Demo mode cannot access production APIs',
            code: 'DEMO_MODE_BLOCKED',
            requestId,
        }),
        {
            status: 403,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
                'X-Demo-Blocked': 'true',
            },
        }
    );
}

/**
 * Validate that a request is NOT from demo mode before allowing production operations
 * Use this at the start of all production API routes
 * 
 * @param {Request} request - The incoming request
 * @param {Object} options - Options
 * @param {boolean} options.allowDemo - If true, allows demo requests (for demo-specific endpoints)
 * @returns {{ allowed: boolean, isDemoMode: boolean, blockResponse?: Response }}
 */
export function validateRequestMode(request, { allowDemo = false } = {}) {
    const isDemoMode = isDemoRequest(request);
    
    if (isDemoMode && !allowDemo) {
        return {
            allowed: false,
            isDemoMode: true,
            blockResponse: demoModeBlockedResponse(),
        };
    }
    
    return {
        allowed: true,
        isDemoMode,
    };
}

/**
 * Demo-safe fetch wrapper for client-side use
 * In demo mode, this returns mock responses instead of making real API calls
 * 
 * @param {string} url - The URL to fetch
 * @param {boolean} isDemoMode - Whether in demo mode
 * @param {Object} mockResponse - Mock response to return in demo mode
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function demoSafeFetch(url, isDemoMode, mockResponse, options = {}) {
    if (isDemoMode) {
        // Return a mock Response object
        return new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    
    // Production mode - add demo mode header for server-side detection
    const headers = new Headers(options.headers);
    headers.set('x-vulniq-demo-mode', 'false');
    
    return fetch(url, { ...options, headers });
}

/**
 * Create a demo-aware fetch function with automatic header injection
 * 
 * @param {boolean} isDemoMode - Whether in demo mode
 * @returns {typeof fetch} A fetch function that handles demo API routing
 */
export function createDemoAwareFetch(isDemoMode) {
    return (url, options = {}) => {
        // If in demo mode and targeting an API, redirect to /demo/api/...
        if (isDemoMode && typeof url === 'string' && url.startsWith('/api/')) {
            url = `/demo${url}`;
        }
        
        const headers = new Headers(options.headers);
        headers.set('x-vulniq-demo-mode', isDemoMode ? 'true' : 'false');
        return fetch(url, { ...options, headers });
    };
}

/**
 * Get a safe user ID for demo mode rate limiting (IP-based)
 * Used by stateless APIs when in Demo Mode
 * 
 * @param {Request} request 
 * @returns {string} IP address or fallback
 */
export function getDemoModeUserId(request) {
    const xff = request.headers.get('x-forwarded-for');
    return xff ? xff.split(',')[0].trim() : 'demo-user-unknown-ip';
}

export default {
    DEMO_ROUTE_PREFIX,
    DEMO_STORAGE_PREFIX,
    PROD_STORAGE_PREFIX,
    ALLOWED_DEMO_APIS,
    isDemoRequest,
    isDemoPath,
    getStorageKey,
    clearDemoStorage,
    demoModeBlockedResponse,
    validateRequestMode,
    demoSafeFetch,
    createDemoAwareFetch,
    getDemoModeUserId,
};
