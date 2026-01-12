import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { checkAdminStatus } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { 
    successResponse, 
    errorResponse, 
    generateRequestId 
} from "@/lib/api-handler";

// GET - Fetch all visible supporters (public endpoint)
export async function GET(request) {
    const requestId = generateRequestId();
    
    try {
        // Rate limiting - 400 requests per minute (generous for public read-only endpoint)
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
        const rl = await rateLimit({
            key: `supporters:get:${clientIp}`,
            limit: 400,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return errorResponse('Rate limit exceeded', {
                status: 429,
                code: 'RATE_LIMITED',
                requestId,
                headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
            });
        }

        // Check if user is admin (async database check)
        const session = await auth();
        const adminStatus = await checkAdminStatus(session?.user?.email);
        const isAdmin = adminStatus.isAdmin;

        // Get supporters from database (only visible ones, sorted by tier/order)
        const supporters = await prisma.supporter.findMany({
            where: { visible: true },
            orderBy: [
                { tier: 'asc' },
                { featured: 'desc' },
                { order: 'asc' },
            ],
        });

        return successResponse(
            { supporters, isAdmin },
            { 
                requestId,
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
                }
            }
        );
    } catch (error) {
        console.error('[Supporters GET Error]', error);
        return errorResponse('Failed to fetch supporters', { status: 500, code: 'INTERNAL_ERROR', requestId });
    }
}

// POST - Not available (supporters managed via data file)
export async function POST(request) {
    const requestId = generateRequestId();
    const session = await auth();
    const adminStatus = await checkAdminStatus(session?.user?.email);

    if (!adminStatus.isAdmin) {
        return errorResponse('Unauthorized - Admin access required', { status: 403, code: 'FORBIDDEN', requestId });
    }

    return errorResponse('Supporters are managed via the data file', {
        status: 501,
        code: 'NOT_IMPLEMENTED',
        requestId,
    });
}
