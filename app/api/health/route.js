// app/api/health/route.js
import { NextResponse } from 'next/server';

// Minimal security headers for health checks (avoid importing from lib to keep fast)
const healthHeaders = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'X-Permitted-Cross-Domain-Policies': 'none',
};

/**
 * Lightweight health check for ALB / ECS
 * - No DB access
 * - No rate limiting
 * - Always fast
 */
export function GET() {
    return new NextResponse('ok', {
        status: 200,
        headers: healthHeaders,
    });
}

export function HEAD() {
    return new NextResponse(null, { 
        status: 200, 
        headers: healthHeaders 
    });
}
