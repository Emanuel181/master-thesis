import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { isSameOrigin, readJsonBody, securityHeaders } from "@/lib/api-security";

// CUID validation pattern (starts with 'c', 25 chars, lowercase alphanumeric)
const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format');

// Input validation schema for folder creation
const createFolderSchema = z.object({
    name: z.string()
        .min(1, 'Folder name is required')
        .max(100, 'Folder name must be less than 100 characters')
        .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, 'Folder name contains invalid characters'),
    useCaseId: cuidSchema,
    parentId: cuidSchema.nullable().optional(),
});

// GET - List all folders for a use case (as tree structure)
export async function GET(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const headers = { ...securityHeaders, 'x-request-id': requestId };
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401, headers });
        }

        // Rate limiting - 60 requests per minute
        const rl = rateLimit({
            key: `folders:get:${session.user.id}`,
            limit: 60,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
                { status: 429, headers }
            );
        }

        const { searchParams } = new URL(request.url);
        const useCaseId = searchParams.get("useCaseId");

        if (!useCaseId) {
            return NextResponse.json({ error: "useCaseId is required", requestId }, { status: 400, headers });
        }

        // Verify user owns this use case
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id: useCaseId,
                userId: session.user.id,
            },
        });

        if (!useCase) {
            return NextResponse.json({ error: "Use case not found", requestId }, { status: 404, headers });
        }

        // Get all folders for this use case
        const folders = await prisma.folder.findMany({
            where: { useCaseId },
            orderBy: { order: "asc" },
            include: {
                pdfs: {
                    orderBy: { order: "asc" },
                },
            },
        });

        // Get root-level PDFs (not in any folder)
        const rootPdfs = await prisma.pdf.findMany({
            where: {
                useCaseId,
                folderId: null,
            },
            orderBy: { order: "asc" },
        });

        // Build tree structure
        const buildTree = (parentId = null) => {
            return folders
                .filter(f => f.parentId === parentId)
                .map(folder => ({
                    ...folder,
                    type: "folder",
                    children: [
                        ...buildTree(folder.id),
                        ...folder.pdfs.map(pdf => ({ ...pdf, type: "pdf" })),
                    ].sort((a, b) => a.order - b.order),
                }));
        };

        const tree = [
            ...buildTree(null),
            ...rootPdfs.map(pdf => ({ ...pdf, type: "pdf" })),
        ].sort((a, b) => a.order - b.order);

        return NextResponse.json({ folders: tree, requestId }, { headers });
    } catch (error) {
        console.error("Error fetching folders:", error);
        return NextResponse.json({ error: "Failed to fetch folders", requestId }, { status: 500, headers });
    }
}

// POST - Create a new folder
export async function POST(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const headers = { ...securityHeaders, 'x-request-id': requestId };
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401, headers });
        }

        // Rate limiting - 30 folders per hour
        const rl = rateLimit({
            key: `folders:create:${session.user.id}`,
            limit: 30,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
                { status: 429, headers }
            );
        }

        // CSRF protection for state-changing operations
        if (!isSameOrigin(request)) {
            return NextResponse.json(
                { error: 'Forbidden', requestId },
                { status: 403, headers }
            );
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body', requestId }, { status: 400, headers });
        }

        // Validate input with Zod
        const validationResult = createFolderSchema.safeParse(parsed.body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed", requestId },
                { status: 400, headers }
            );
        }

        const { name, useCaseId, parentId } = validationResult.data;

        // Verify user owns this use case
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id: useCaseId,
                userId: session.user.id,
            },
        });

        if (!useCase) {
            return NextResponse.json({ error: "Use case not found", requestId }, { status: 404, headers });
        }

        // If parentId is provided, verify it exists and belongs to same use case
        if (parentId) {
            const parentFolder = await prisma.folder.findFirst({
                where: {
                    id: parentId,
                    useCaseId,
                },
            });

            if (!parentFolder) {
                return NextResponse.json({ error: "Parent folder not found", requestId }, { status: 404, headers });
            }

            // Check depth limit (max 5 levels)
            let depth = 1;
            let currentParent = parentFolder;
            while (currentParent?.parentId && depth < 6) {
                currentParent = await prisma.folder.findUnique({
                    where: { id: currentParent.parentId },
                    select: { parentId: true },
                });
                if (!currentParent) {
                    // Defensive: broken parent chain; treat as invalid.
                    return NextResponse.json(
                        { error: "Parent folder not found", requestId },
                        { status: 404, headers }
                    );
                }
                depth++;
            }

            if (depth >= 5) {
                return NextResponse.json({ error: "Maximum folder depth (5) exceeded", requestId }, { status: 400, headers });
            }
        }

        // Get the max order in the target location
        const maxOrderResult = await prisma.folder.aggregate({
            where: {
                useCaseId,
                parentId: parentId || null,
            },
            _max: { order: true },
        });

        const maxPdfOrderResult = await prisma.pdf.aggregate({
            where: {
                useCaseId,
                folderId: parentId || null,
            },
            _max: { order: true },
        });

        const newOrder = Math.max(
            (maxOrderResult._max.order || 0) + 1,
            (maxPdfOrderResult._max.order || 0) + 1
        );

        const folder = await prisma.folder.create({
            data: {
                name,
                useCaseId,
                parentId: parentId || null,
                order: newOrder,
            },
        });

        return NextResponse.json({ folder, requestId }, { status: 201, headers });
    } catch (error) {
        console.error("Error creating folder:", error);
        return NextResponse.json({ error: "Failed to create folder", requestId }, { status: 500, headers });
    }
}
