import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, readJsonBody, securityHeaders } from "@/lib/api-security";
import { requireProductionMode } from "@/lib/api-middleware";

// Normalize text to prevent XSS
const normalizeText = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[\0\x08\x1a\x0b\x0c]/g, '').trim();
};

// Input validation schema
const createGroupSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters')
        .transform(normalizeText)
        .refine(v => !/[<>]/.test(v), { message: 'Name must not contain < or >' }),
    icon: z.string().max(50).optional(),
    color: z.string().max(50).optional(),
    parentId: z.string().max(50).nullable().optional(),
});

// GET - Fetch all use case groups for the current user
export async function GET(request) {
    const demoBlock = requireProductionMode(request);
    if (demoBlock) return demoBlock;

    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: securityHeaders });
        }

        // Rate limiting
        const rl = await rateLimit({
            key: `use-case-groups:get:${session.user.id}`,
            limit: 60,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        // Check if useCaseGroup model is available (might not be if client is cached)
        if (!prisma.useCaseGroup) {
            console.warn("UseCaseGroup model not available - Prisma client may need regeneration. Restart the dev server.");
            return NextResponse.json({ groups: [] }, { headers: securityHeaders });
        }

        const groups = await prisma.useCaseGroup.findMany({
            where: { userId: session.user.id },
            include: {
                useCases: {
                    select: {
                        id: true,
                        title: true,
                        icon: true,
                        color: true,
                    }
                },
                children: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        color: true,
                    }
                }
            },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });

        return NextResponse.json({ groups }, { headers: securityHeaders });
    } catch (error) {
        console.error("Error fetching use case groups:", error);
        return NextResponse.json(
            { error: "Failed to fetch groups" },
            { status: 500, headers: securityHeaders }
        );
    }
}

// POST - Create a new use case group
export async function POST(request) {
    const demoBlock = requireProductionMode(request);
    if (demoBlock) return demoBlock;

    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: securityHeaders });
        }

        // Check if useCaseGroup model is available
        if (!prisma.useCaseGroup) {
            return NextResponse.json({ error: "Feature not available" }, { status: 503, headers: securityHeaders });
        }

        // CSRF protection
        if (!isSameOrigin(request)) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403, headers: securityHeaders }
            );
        }

        // Rate limiting
        const rl = await rateLimit({
            key: `use-case-groups:create:${session.user.id}`,
            limit: 20,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: securityHeaders });
        }

        const validationResult = createGroupSchema.safeParse(parsed.body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed" },
                { status: 400, headers: securityHeaders }
            );
        }

        const { name, icon, color, parentId } = validationResult.data;

        // Verify parent belongs to user if provided
        if (parentId) {
            const parentGroup = await prisma.useCaseGroup.findFirst({
                where: { id: parentId, userId: session.user.id }
            });
            if (!parentGroup) {
                return NextResponse.json(
                    { error: "Parent group not found" },
                    { status: 404, headers: securityHeaders }
                );
            }
        }

        // Get max order for positioning
        const maxOrder = await prisma.useCaseGroup.aggregate({
            where: { userId: session.user.id, parentId: parentId || null },
            _max: { order: true }
        });

        const group = await prisma.useCaseGroup.create({
            data: {
                name,
                icon: icon || "Folder",
                color: color || "default",
                parentId: parentId || null,
                order: (maxOrder._max.order ?? -1) + 1,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ group }, { status: 201, headers: securityHeaders });
    } catch (error) {
        console.error("Error creating use case group:", error);
        return NextResponse.json(
            { error: "Failed to create group" },
            { status: 500, headers: securityHeaders }
        );
    }
}

