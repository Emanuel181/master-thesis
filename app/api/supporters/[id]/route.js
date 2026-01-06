import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBody, securityHeaders } from "@/lib/api-security";

// Admin email(s) - only these users can manage supporters
const ADMIN_EMAILS = [
    process.env.ADMIN_EMAIL,
    'rusuemanuelemanuel@gmail.com'
].filter(Boolean);

function isAdmin(session) {
    return session?.user?.email && ADMIN_EMAILS.includes(session.user.email);
}

const normalizeText = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[\0\x08\x1a\x0b\x0c]/g, '').trim();
};

const urlRegex = /^https?:\/\/.+/i;

const updateSupporterSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters')
        .transform(normalizeText)
        .optional(),
    title: z.string()
        .max(100, 'Title must be less than 100 characters')
        .transform(normalizeText)
        .optional()
        .nullable(),
    company: z.string()
        .max(100, 'Company must be less than 100 characters')
        .transform(normalizeText)
        .optional()
        .nullable(),
    avatarUrl: z.string()
        .max(500, 'Avatar URL must be less than 500 characters')
        .refine(v => !v || urlRegex.test(v), { message: 'Invalid avatar URL' })
        .optional()
        .nullable(),
    linkedinUrl: z.string()
        .max(200, 'LinkedIn URL must be less than 200 characters')
        .refine(v => !v || urlRegex.test(v), { message: 'Invalid LinkedIn URL' })
        .optional()
        .nullable(),
    githubUrl: z.string()
        .max(200, 'GitHub URL must be less than 200 characters')
        .refine(v => !v || urlRegex.test(v), { message: 'Invalid GitHub URL' })
        .optional()
        .nullable(),
    websiteUrl: z.string()
        .max(200, 'Website URL must be less than 200 characters')
        .refine(v => !v || urlRegex.test(v), { message: 'Invalid website URL' })
        .optional()
        .nullable(),
    message: z.string()
        .max(500, 'Message must be less than 500 characters')
        .transform(normalizeText)
        .optional()
        .nullable(),
    tier: z.enum(['supporter', 'contributor', 'sponsor']).optional(),
    order: z.number().int().min(0).max(1000).optional(),
    featured: z.boolean().optional(),
    visible: z.boolean().optional(),
});

// GET - Fetch a single supporter by ID (public)
export async function GET(request, { params }) {
    try {
        const { id } = await params;

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

        const supporter = await prisma.supporter.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                occupation: true,
                company: true,
                companyUrl: true,
                contributionBio: true,
                personalBio: true,
                linkedinUrl: true,
                websiteUrl: true,
                tier: true,
                featured: true,
                visible: true,
                // Note: createdAt, updatedAt, order excluded - internal fields
            }
        });

        if (!supporter) {
            return NextResponse.json(
                { error: 'Supporter not found' },
                { status: 404, headers: securityHeaders }
            );
        }

        // Only show hidden supporters to admins
        const session = await auth();
        if (!supporter.visible && !isAdmin(session)) {
            return NextResponse.json(
                { error: 'Supporter not found' },
                { status: 404, headers: securityHeaders }
            );
        }

        // Return only public fields (exclude visible flag for non-admins)
        const publicSupporter = {
            id: supporter.id,
            name: supporter.name,
            avatarUrl: supporter.avatarUrl,
            occupation: supporter.occupation,
            company: supporter.company,
            companyUrl: supporter.companyUrl,
            contributionBio: supporter.contributionBio,
            personalBio: supporter.personalBio,
            linkedinUrl: supporter.linkedinUrl,
            websiteUrl: supporter.websiteUrl,
            tier: supporter.tier,
            featured: supporter.featured,
        };

        return NextResponse.json({ supporter: publicSupporter }, { status: 200, headers: securityHeaders });
    } catch (error) {
        console.error('[Supporters GET by ID Error]', error);
        return NextResponse.json(
            { error: 'Failed to fetch supporter' },
            { status: 500, headers: securityHeaders }
        );
    }
}

// PUT - Update a supporter (admin only)
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!isAdmin(session)) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403, headers: securityHeaders }
            );
        }

        const rl = await rateLimit({
            key: `supporters:put:${session.user.id}`,
            limit: 30,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const existingSupporter = await prisma.supporter.findUnique({
            where: { id }
        });

        if (!existingSupporter) {
            return NextResponse.json(
                { error: 'Supporter not found' },
                { status: 404, headers: securityHeaders }
            );
        }

        const bodyResult = await readJsonBody(request);
        if (!bodyResult.success) {
            return NextResponse.json(
                { error: bodyResult.error },
                { status: 400, headers: securityHeaders }
            );
        }

        const validation = updateSupporterSchema.safeParse(bodyResult.data);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400, headers: securityHeaders }
            );
        }

        const supporter = await prisma.supporter.update({
            where: { id },
            data: validation.data
        });

        return NextResponse.json({ supporter }, { status: 200, headers: securityHeaders });
    } catch (error) {
        console.error('[Supporters PUT Error]', error);
        return NextResponse.json(
            { error: 'Failed to update supporter' },
            { status: 500, headers: securityHeaders }
        );
    }
}

// DELETE - Delete a supporter (admin only)
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!isAdmin(session)) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403, headers: securityHeaders }
            );
        }

        const rl = await rateLimit({
            key: `supporters:delete:${session.user.id}`,
            limit: 20,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const existingSupporter = await prisma.supporter.findUnique({
            where: { id }
        });

        if (!existingSupporter) {
            return NextResponse.json(
                { error: 'Supporter not found' },
                { status: 404, headers: securityHeaders }
            );
        }

        await prisma.supporter.delete({
            where: { id }
        });

        return NextResponse.json(
            { message: 'Supporter deleted successfully' },
            { status: 200, headers: securityHeaders }
        );
    } catch (error) {
        console.error('[Supporters DELETE Error]', error);
        return NextResponse.json(
            { error: 'Failed to delete supporter' },
            { status: 500, headers: securityHeaders }
        );
    }
}

