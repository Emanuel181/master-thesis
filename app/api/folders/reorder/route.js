import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { isSameOrigin, readJsonBody, securityHeaders } from "@/lib/api-security";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { requireProductionMode } from "@/lib/api-middleware";

// CUID validation pattern (starts with 'c', 25 chars, lowercase alphanumeric)
const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format');

const reorderSchema = z.object({
    useCaseId: cuidSchema,
    items: z.array(z.object({
        id: cuidSchema,
        type: z.enum(['folder', 'pdf']),
        order: z.number().int().min(0).max(100000),
        parentId: cuidSchema.nullable().optional(),
    })).min(1).max(500),
});

// PATCH - Reorder folders and PDFs
export async function PATCH(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const headers = { ...securityHeaders, 'x-request-id': requestId };
    const demoBlock = requireProductionMode(request, { requestId });
    if (demoBlock) return demoBlock;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401, headers });
        }

        const rl = await rateLimit({ key: `folders:reorder:${session.user.id}`,
            limit: 60,
            windowMs: 60 * 1000 });
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId }, { status: 429, headers });
        }

        // CSRF protection for state-changing operations
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden', requestId }, { status: 403, headers });
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body', requestId }, { status: 400, headers });
        }

        const validation = reorderSchema.safeParse(parsed.body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Validation failed', requestId }, { status: 400, headers });
        }

        const { useCaseId, items } = validation.data;

        // Verify user owns this use case
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id: useCaseId,
                userId: session.user.id,
            },
            select: { id: true },
        });

        if (!useCase) {
            return NextResponse.json({ error: "Use case not found", requestId }, { status: 404, headers });
        }

        // Process reorder updates in a transaction, but prevent IDOR by checking ownership:
        await prisma.$transaction(async (tx) => {
            for (const item of items) {
                const { id, type, order, parentId } = item;

                if (parentId) {
                    const parentFolder = await tx.folder.findFirst({
                        where: { id: parentId, useCaseId },
                        select: { id: true },
                    });
                    if (!parentFolder) {
                        // Throw a sentinel error the catch handler will map to 400.
                        throw new Error('validation:invalid-parent');
                    }
                }

                if (type === "folder") {
                    const updated = await tx.folder.updateMany({
                        where: { id, useCaseId },
                        data: {
                            order,
                            parentId: parentId || null,
                        },
                    });

                    if (updated.count === 0) {
                        throw new Error('validation:invalid-folder');
                    }
                } else {
                    const updated = await tx.pdf.updateMany({
                        where: { id, useCaseId },
                        data: {
                            order,
                            folderId: parentId || null,
                        },
                    });

                    if (updated.count === 0) {
                        throw new Error('validation:invalid-pdf');
                    }
                }
            }
        });

        return NextResponse.json({ success: true, requestId }, { headers });
    } catch (error) {
        const msg = typeof error?.message === 'string' ? error.message : '';
        if (msg.startsWith('validation:')) {
            return NextResponse.json({ error: 'Validation failed', requestId }, { status: 400, headers });
        }

        console.error("Error reordering items:", error);
        return NextResponse.json({ error: "Failed to reorder items", requestId }, { status: 500, headers });
    }
}
