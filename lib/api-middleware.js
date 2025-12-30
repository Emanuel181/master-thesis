/**
 * API Security Middleware for Demo Mode Enforcement
 * ==================================================
 * 
 * This module provides middleware functions to protect production APIs
 * from being accessed in demo mode.
 * 
 * CRITICAL: Import and use `requireProductionMode` at the start of ALL
 * production API routes to prevent demo mode access.
 */

import { NextResponse } from 'next/server';
import { securityHeaders } from './api-security';
import { isDemoRequest, demoModeBlockedResponse } from './demo-mode';

/**
 * Middleware to require production mode for API routes
 * Returns a blocking response if the request originated from demo mode
 * 
 * Usage:
 * ```js
 * import { requireProductionMode } from '@/lib/api-middleware';
 * 
 * export async function GET(request) {
 *     const modeCheck = requireProductionMode(request);
 *     if (modeCheck) return modeCheck; // Returns 403 if demo mode
 *     
 *     // ... rest of handler
 * }
 * ```
 * 
 * @param {Request} request - The incoming request
 * @param {Object} options - Options
 * @param {string} options.requestId - Optional request ID for logging
 * @returns {Response|null} Returns 403 response if demo mode, null if production
 */
export function requireProductionMode(request, { requestId = '' } = {}) {
    if (isDemoRequest(request)) {
        const id = requestId || globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
        
        // Log demo mode access attempt for security monitoring
        console.warn(`[SECURITY] Demo mode attempted to access production API. RequestId: ${id}`);
        
        return NextResponse.json(
            {
                error: 'Demo mode cannot access production APIs',
                code: 'DEMO_MODE_BLOCKED',
                requestId: id,
            },
            {
                status: 403,
                headers: {
                    ...securityHeaders,
                    'x-request-id': id,
                    'x-demo-blocked': 'true',
                },
            }
        );
    }
    
    return null; // Allow request to proceed
}

/**
 * Check if request is from demo mode without blocking
 * Use this when you need conditional logic based on demo mode
 * 
 * @param {Request} request - The incoming request
 * @returns {boolean} True if request is from demo mode
 */
export function isRequestFromDemoMode(request) {
    return isDemoRequest(request);
}

/**
 * Create a demo-mode aware API handler
 * Wraps an API handler to automatically block demo mode requests
 * 
 * @param {Function} handler - The API route handler function
 * @returns {Function} Wrapped handler that blocks demo mode
 */
export function withProductionOnly(handler) {
    return async (request, context) => {
        const blockResponse = requireProductionMode(request);
        if (blockResponse) return blockResponse;
        
        return handler(request, context);
    };
}

/**
 * Validate and log all API access patterns
 * Use for security auditing
 * 
 * @param {Request} request - The incoming request
 * @param {string} routeName - Name of the API route for logging
 * @returns {{ isDemoMode: boolean, clientIp: string, userAgent: string }}
 */
export function auditApiAccess(request, routeName) {
    const isDemoMode = isDemoRequest(request);
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
        || request.headers.get('x-real-ip') 
        || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'none';
    
    // Log access for security monitoring (only in development or if suspicious)
    if (isDemoMode) {
        console.info(`[API_AUDIT] Demo mode access to ${routeName} from ${clientIp}`);
    }
    
    return {
        isDemoMode,
        clientIp,
        userAgent,
        referer,
    };
}

export default {
    requireProductionMode,
    isRequestFromDemoMode,
    withProductionOnly,
    auditApiAccess,
};
