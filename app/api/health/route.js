import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/api-security';

/**
 * Health check endpoint for monitoring and load balancer health probes
 * Returns overall system health status and individual component checks
 */
export async function GET(request) {
    // Rate limiting - 120 requests per minute per IP (generous for monitoring)
    const clientIp = getClientIp(request);
    const rl = rateLimit({
        key: `health:${clientIp}`,
        limit: 120,
        windowMs: 60 * 1000
    });
    if (!rl.allowed) {
        return NextResponse.json(
            { status: 'error', error: 'Rate limit exceeded' },
            { status: 429, headers: { 'Cache-Control': 'no-store' } }
        );
    }

    const startTime = Date.now();
    const checks = {};
    let overallHealthy = true;

    // Check database connectivity
    try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        checks.database = {
            status: 'ok',
            latencyMs: Date.now() - dbStart,
        };
    } catch (error) {
        checks.database = {
            status: 'error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection failed',
        };
        overallHealthy = false;
    }

    // Check memory usage
    try {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
        const heapUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

        checks.memory = {
            status: heapUsagePercent > 90 ? 'warning' : 'ok',
            heapUsedMB,
            heapTotalMB,
            heapUsagePercent,
        };

        if (heapUsagePercent > 95) {
            overallHealthy = false;
        }
    } catch (error) {
        checks.memory = {
            status: 'unknown',
            error: 'Could not determine memory usage',
        };
    }

    // Check uptime
    checks.uptime = {
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
    };

    // Overall response
    const response = {
        status: overallHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        totalLatencyMs: Date.now() - startTime,
        checks,
        version: process.env.APP_VERSION || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(response, {
        status: overallHealthy ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Content-Type': 'application/json',
        },
    });
}

// Also support HEAD requests for simple health probes
export async function HEAD() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return new NextResponse(null, { status: 200 });
    } catch {
        return new NextResponse(null, { status: 503 });
    }
}

