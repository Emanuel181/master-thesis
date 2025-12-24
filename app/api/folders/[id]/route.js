import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { isSameOrigin, readJsonBody, securityHeaders } from "@/lib/api-security";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// CUID validation pattern (starts with 'c', 25 chars, lowercase alphanumeric)
const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format');

const patchFolderSchema = z.object({
    name: z.string().min(1).max(100).regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, 'Folder name contains invalid characters').optional(),
    parentId: z.union([cuidSchema, z.null()]).optional(),
    order: z.number().int().min(0).max(100000).optional(),
}).strict();

async function isDescendantBfs(db, { rootId, targetId, maxNodes = 2000 }) {
    if (!rootId || !targetId) return false;
    if (rootId === targetId) return true;

    const queue = [rootId];
    const visited = new Set([rootId]);
    let processed = 0;

    while (queue.length) {
        const parentId = queue.shift();
        processed += 1;
        if (processed > maxNodes) {
            // Defensive: avoid unbounded traversal; treat as unsafe.
            return true;
        }

        const children = await db.folder.findMany({
            where: { parentId },
            select: { id: true },
        });

        for (const child of children) {
            if (!child?.id) continue;
            if (child.id === targetId) return true;
            if (!visited.has(child.id)) {
                visited.add(child.id);
                queue.push(child.id);
            }
        }
    }

    return false;
}

// GET - Get a single folder with its contents
export async function GET(request, { params }) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const headers = { ...securityHeaders, 'x-request-id': requestId };
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401, headers });
        }

        const rl = rateLimit({ key: `folders:id:get:${session.user.id}`, limit: 120, windowMs: 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId }, { status: 429, headers });
        }

        const { id } = await params;

        const folder = await prisma.folder.findFirst({
            where: { id },
            include: {
                useCase: true,
                children: {
                    orderBy: { order: "asc" },
                },
                pdfs: {
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found", requestId }, { status: 404, headers });
        }

        // Verify user owns this folder
        if (folder.useCase.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized", requestId }, { status: 403, headers });
        }

        return NextResponse.json({ folder, requestId }, { headers });
    } catch (error) {
        console.error("Error fetching folder:", error);
        return NextResponse.json({ error: "Failed to fetch folder", requestId }, { status: 500, headers });
    }
}

// PATCH - Update folder (rename, move)
export async function PATCH(request, { params }) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const headers = { ...securityHeaders, 'x-request-id': requestId };
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401, headers });
        }

        const rl = rateLimit({ key: `folders:id:patch:${session.user.id}`, limit: 120, windowMs: 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId }, { status: 429, headers });
        }

        // CSRF protection for state-changing operations
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden', requestId }, { status: 403, headers });
        }

        const { id } = await params;
        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body', requestId }, { status: 400, headers });
        }

        const validation = patchFolderSchema.safeParse(parsed.body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Validation failed', requestId }, { status: 400, headers });
        }

        const { name, parentId, order } = validation.data;

        const folder = await prisma.folder.findFirst({
            where: { id },
            include: {
                useCase: true,
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found", requestId }, { status: 404, headers });
        }

        // Verify user owns this folder
        if (folder.useCase.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized", requestId }, { status: 403, headers });
        }

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name;
        }

        if (order !== undefined) {
            updateData.order = order;
        }

        // Handle moving to a different parent
        if (parentId !== undefined) {
            // Prevent moving a folder into itself or its descendants
            if (parentId === id) {
                return NextResponse.json({ error: "Cannot move folder into itself", requestId }, { status: 400, headers });
            }

            if (parentId !== null) {
                const newParent = await prisma.folder.findFirst({
                    where: {
                        id: parentId,
                        useCaseId: folder.useCaseId,
                    },
                    select: { id: true },
                });

                if (!newParent) {
                    return NextResponse.json({ error: "Parent folder not found", requestId }, { status: 404, headers });
                }

                const isDesc = await isDescendantBfs(prisma, { rootId: id, targetId: parentId });
                if (isDesc) {
                    return NextResponse.json({ error: "Cannot move folder into its descendant", requestId }, { status: 400, headers });
                }
            }

            updateData.parentId = parentId;
        }

        const updatedFolder = await prisma.folder.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ folder: updatedFolder, requestId }, { headers });
    } catch (error) {
        console.error("Error updating folder:", error);
        return NextResponse.json({ error: "Failed to update folder", requestId }, { status: 500, headers });
    }
}

// DELETE - Delete folder and all its contents
export async function DELETE(request, { params }) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const headers = { ...securityHeaders, 'x-request-id': requestId };
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401, headers });
        }

        const rl = rateLimit({ key: `folders:id:delete:${session.user.id}`, limit: 60, windowMs: 60 * 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId }, { status: 429, headers });
        }

        // CSRF protection for state-changing operations
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden', requestId }, { status: 403, headers });
        }

        const { id } = await params;

        const folder = await prisma.folder.findFirst({
            where: { id },
            include: {
                useCase: true,
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found", requestId }, { status: 404, headers });
        }

        // Verify user owns this folder
        if (folder.useCase.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized", requestId }, { status: 403, headers });
        }

        // Delete folder (cascade will handle children and PDF relations)
        await prisma.folder.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, requestId }, { headers });
    } catch (error) {
        console.error("Error deleting folder:", error);
        return NextResponse.json({ error: "Failed to delete folder", requestId }, { status: 500, headers });
    }
}
