import { readJsonBody } from "@/lib/api-security";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { 
    successResponse, 
    errorResponse, 
    validationErrorResponse,
    generateRequestId 
} from "@/lib/api-handler";

// Validation schema
const supporterSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
    occupation: z.string().min(1, 'Occupation is required').max(100),
    company: z.string().max(100).optional().nullable().or(z.literal('')),
    companyUrl: z.string().url().optional().nullable().or(z.literal('')),
    contributionBio: z.string().min(1, 'Contribution is required').max(500),
    personalBio: z.string().max(500).optional().nullable().or(z.literal('')),
    linkedinUrl: z.string().url().optional().nullable().or(z.literal('')),
    websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
    tier: z.enum(['sponsor', 'contributor', 'supporter']).optional().default('supporter'),
    featured: z.boolean().default(false),
    order: z.number().int().min(0).max(1000).default(0),
});

/**
 * GET /api/admin/supporters
 * Get all supporters from database
 * Requires admin authentication
 */
export async function GET() {
    const requestId = generateRequestId();
    
    // Verify admin authentication
    const adminCheck = await requireAdmin();
    if (adminCheck.error) return adminCheck.error;

    try {
        const supporters = await prisma.supporter.findMany({
            orderBy: [
                { tier: 'asc' },
                { featured: 'desc' },
                { order: 'asc' },
            ],
        });

        return successResponse({ supporters }, { requestId });
    } catch (error) {
        console.error('[Admin Supporters GET Error]', error);
        return errorResponse('Failed to fetch supporters', { status: 500, code: 'INTERNAL_ERROR', requestId });
    }
}

/**
 * POST /api/admin/supporters
 * Create a new supporter in database
 * Requires admin authentication
 */
export async function POST(request) {
    const requestId = generateRequestId();
    
    // Verify admin authentication
    const adminCheck = await requireAdmin();
    if (adminCheck.error) return adminCheck.error;

    try {
        const bodyResult = await readJsonBody(request);
        if (!bodyResult.ok) {
            return errorResponse('Invalid request body', { status: 400, code: 'INVALID_JSON', requestId });
        }

        const validation = supporterSchema.safeParse(bodyResult.body);
        if (!validation.success) {
            return validationErrorResponse(validation.error, { requestId });
        }

        const newSupporter = await prisma.supporter.create({
            data: {
                name: validation.data.name,
                avatarUrl: validation.data.avatarUrl || null,
                occupation: validation.data.occupation,
                company: validation.data.company || null,
                companyUrl: validation.data.companyUrl || null,
                contributionBio: validation.data.contributionBio,
                personalBio: validation.data.personalBio || null,
                linkedinUrl: validation.data.linkedinUrl || null,
                websiteUrl: validation.data.websiteUrl || null,
                tier: validation.data.tier,
                featured: validation.data.featured,
                order: validation.data.order,
                visible: true,
            },
        });

        return successResponse(
            { supporter: newSupporter, message: 'Supporter created successfully' }, 
            { status: 201, requestId }
        );

    } catch (error) {
        console.error('[Admin Supporters POST Error]', error);
        return errorResponse('Failed to create supporter', { status: 500, code: 'INTERNAL_ERROR', requestId });
    }
}
