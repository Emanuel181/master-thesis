// app/api/health/ready/route.js
// 
// Readiness probe for ALB/ECS health checks
// Unlike /api/health, this endpoint verifies database connectivity
// Use this for ALB target group health checks to avoid routing traffic
// to instances that can't reach the database.

import prisma from '@/lib/prisma';

// Minimal security headers for health checks
const healthHeaders = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
};

/**
 * Readiness health check that probes the database
 * Returns 200 if database is reachable, 503 otherwise
 * 
 * @example
 * ALB health check config:
 * - Path: /api/health/ready
 * - Healthy threshold: 2
 * - Unhealthy threshold: 3
 * - Timeout: 5s
 * - Interval: 30s
 */
export async function GET() {
    const start = Date.now();
    
    try {
        // Simple connectivity check - SELECT 1 is the fastest possible query
        await prisma.$queryRaw`SELECT 1`;
        
        const latency = Date.now() - start;
        
        return new Response(
            JSON.stringify({ 
                status: 'ok', 
                db: 'connected',
                latency_ms: latency,
                timestamp: new Date().toISOString()
            }),
            {
                status: 200,
                headers: {
                    ...healthHeaders,
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        const latency = Date.now() - start;
        
        // Log for debugging but don't expose details
        console.error('[health/ready] Database check failed:', error.message);
        
        return new Response(
            JSON.stringify({ 
                status: 'unavailable', 
                db: 'disconnected',
                latency_ms: latency,
                timestamp: new Date().toISOString()
            }),
            {
                status: 503,
                headers: {
                    ...healthHeaders,
                    'Content-Type': 'application/json',
                    'Retry-After': '5',
                },
            }
        );
    }
}

/**
 * HEAD request support for lightweight checks
 */
export async function HEAD() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return new Response(null, { status: 200, headers: healthHeaders });
    } catch {
        return new Response(null, { status: 503, headers: healthHeaders });
    }
}
