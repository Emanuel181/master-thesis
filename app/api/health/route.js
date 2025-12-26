// app/api/healthz/route.ts
import { NextResponse } from 'next/server';

/**
 * Lightweight health check for ALB / ECS
 * - No DB access
 * - No rate limiting
 * - Always fast
 */
export function GET() {
    return new NextResponse('ok', {
        status: 200,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}

export function HEAD() {
    return new NextResponse(null, { status: 200 });
}
