import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders } from "@/lib/api-security";
import { isAdminEmail } from "@/lib/supporters-data";
import prisma from "@/lib/prisma";

// GET - Fetch all visible supporters (public endpoint)
export async function GET(request) {
    try {
        // Rate limiting - 100 requests per minute (generous for public endpoint)
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
        const rl = await rateLimit({
            key: `supporters:get:${clientIp}`,
            limit: 100,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        // Check if user is admin
        const session = await auth();
        const isAdmin = isAdminEmail(session?.user?.email);

        // Get supporters from database (only visible ones, sorted by tier/order)
        const supporters = await prisma.supporter.findMany({
            where: { visible: true },
            orderBy: [
                { tier: 'asc' },
                { featured: 'desc' },
                { order: 'asc' },
            ],
        });

        return NextResponse.json({
            supporters,
            isAdmin
        }, {
            status: 200,
            headers: {
                ...securityHeaders,
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (error) {
        console.error('[Supporters GET Error]', error);
        return NextResponse.json(
            { error: 'Failed to fetch supporters' },
            { status: 500, headers: securityHeaders }
        );
    }
}

// POST - Not available (supporters managed via data file)
export async function POST(request) {
    const session = await auth();
    const isAdmin = isAdminEmail(session?.user?.email);

    if (!isAdmin) {
        return NextResponse.json(
            { error: 'Unauthorized - Admin access required' },
            { status: 403, headers: securityHeaders }
        );
    }

    return NextResponse.json(
        {
            error: 'Supporters are managed via the data file',
            info: 'Edit lib/supporters-data.js to add/modify supporters'
        },
        { status: 501, headers: securityHeaders }
    );
}
