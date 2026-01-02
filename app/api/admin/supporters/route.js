import { NextResponse } from "next/server";
import { securityHeaders, readJsonBody } from "@/lib/api-security";
import prisma from "@/lib/prisma";
import { z } from "zod";

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
 */
export async function GET() {
    try {
        const supporters = await prisma.supporter.findMany({
            orderBy: [
                { tier: 'asc' },
                { featured: 'desc' },
                { order: 'asc' },
            ],
        });

        return NextResponse.json(
            { supporters },
            { status: 200, headers: securityHeaders }
        );
    } catch (error) {
        console.error('[Admin Supporters GET Error]', error);
        return NextResponse.json(
            { error: 'Failed to fetch supporters' },
            { status: 500, headers: securityHeaders }
        );
    }
}

/**
 * POST /api/admin/supporters
 * Create a new supporter in database
 */
export async function POST(request) {
    try {
        const bodyResult = await readJsonBody(request);
        if (!bodyResult.ok) {
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400, headers: securityHeaders }
            );
        }

        const validation = supporterSchema.safeParse(bodyResult.body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400, headers: securityHeaders }
            );
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

        return NextResponse.json(
            { supporter: newSupporter, message: 'Supporter created successfully' },
            { status: 201, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Admin Supporters POST Error]', error);
        return NextResponse.json(
            { error: 'Failed to create supporter' },
            { status: 500, headers: securityHeaders }
        );
    }
}
