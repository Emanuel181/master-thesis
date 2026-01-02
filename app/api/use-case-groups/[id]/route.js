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

// Input validation schema for updates
const updateGroupSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters')
        .transform(normalizeText)
        .refine(v => !/[<>]/.test(v), { message: 'Name must not contain < or >' })
        .optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(50).optional(),
    parentId: z.string().max(50).nullable().optional(),
    order: z.number().int().min(0).optional(),
});

// GET - Fetch a single group
export async function GET(request, { params }) {
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

        const { id } = await params;

        const group = await prisma.useCaseGroup.findFirst({
            where: { id, userId: session.user.id },
            include: {
                useCases: {
                    select: {
                        id: true,
                        title: true,
                        content: true,
                        icon: true,
                        color: true,
                    }
                },
                children: true,
            }
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404, headers: securityHeaders });
        }

        return NextResponse.json({ group }, { headers: securityHeaders });
    } catch (error) {
        console.error("Error fetching group:", error);
        return NextResponse.json(
            { error: "Failed to fetch group" },
            { status: 500, headers: securityHeaders }
        );
    }
}

// PUT - Update a group
export async function PUT(request, { params }) {
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

        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: securityHeaders });
        }

        const rl = await rateLimit({
            key: `use-case-groups:update:${session.user.id}`,
            limit: 30,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const { id } = await params;

        // Verify ownership
        const existingGroup = await prisma.useCaseGroup.findFirst({
            where: { id, userId: session.user.id }
        });

        if (!existingGroup) {
            return NextResponse.json({ error: "Group not found" }, { status: 404, headers: securityHeaders });
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: securityHeaders });
        }

        const validationResult = updateGroupSchema.safeParse(parsed.body);
        if (!validationResult.success) {
            return NextResponse.json({ error: "Validation failed" }, { status: 400, headers: securityHeaders });
        }

        const { name, icon, color, parentId, order } = validationResult.data;

        // Prevent setting self as parent
        if (parentId === id) {
            return NextResponse.json({ error: "Cannot set group as its own parent" }, { status: 400, headers: securityHeaders });
        }

        // Verify new parent belongs to user if provided
        if (parentId) {
            const parentGroup = await prisma.useCaseGroup.findFirst({
                where: { id: parentId, userId: session.user.id }
            });
            if (!parentGroup) {
                return NextResponse.json({ error: "Parent group not found" }, { status: 404, headers: securityHeaders });
            }
        }

        const updatedGroup = await prisma.useCaseGroup.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(icon && { icon }),
                ...(color && { color }),
                ...(parentId !== undefined && { parentId }),
                ...(order !== undefined && { order }),
            },
        });

        return NextResponse.json({ group: updatedGroup }, { headers: securityHeaders });
    } catch (error) {
        console.error("Error updating group:", error);
        return NextResponse.json(
            { error: "Failed to update group" },
            { status: 500, headers: securityHeaders }
        );
    }
}

// DELETE - Delete a group (use cases will be ungrouped, not deleted)
export async function DELETE(request, { params }) {
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

        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: securityHeaders });
        }

        const rl = await rateLimit({
            key: `use-case-groups:delete:${session.user.id}`,
            limit: 10,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const { id } = await params;

        const group = await prisma.useCaseGroup.findFirst({
            where: { id, userId: session.user.id }
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404, headers: securityHeaders });
        }

        // Ungroup all use cases (set groupId to null)
        await prisma.knowledgeBaseCategory.updateMany({
            where: { groupId: id },
            data: { groupId: null }
        });

        // Move child groups to parent (or root if no parent)
        await prisma.useCaseGroup.updateMany({
            where: { parentId: id },
            data: { parentId: group.parentId }
        });

        // Delete the group
        await prisma.useCaseGroup.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Group deleted successfully" }, { headers: securityHeaders });
    } catch (error) {
        console.error("Error deleting group:", error);
        return NextResponse.json(
            { error: "Failed to delete group" },
            { status: 500, headers: securityHeaders }
        );
    }
}

