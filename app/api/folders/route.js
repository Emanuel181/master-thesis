import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// GET - List all folders for a use case (as tree structure)
export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const useCaseId = searchParams.get("useCaseId");

        if (!useCaseId) {
            return NextResponse.json({ error: "useCaseId is required" }, { status: 400 });
        }

        // Verify user owns this use case
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id: useCaseId,
                userId: session.user.id,
            },
        });

        if (!useCase) {
            return NextResponse.json({ error: "Use case not found" }, { status: 404 });
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

        return NextResponse.json({ folders: tree });
    } catch (error) {
        console.error("Error fetching folders:", error);
        return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
    }
}

// POST - Create a new folder
export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, useCaseId, parentId } = body;

        if (!name || !useCaseId) {
            return NextResponse.json({ error: "name and useCaseId are required" }, { status: 400 });
        }

        // Verify user owns this use case
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id: useCaseId,
                userId: session.user.id,
            },
        });

        if (!useCase) {
            return NextResponse.json({ error: "Use case not found" }, { status: 404 });
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
                return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
            }

            // Check depth limit (max 5 levels)
            let depth = 1;
            let currentParent = parentFolder;
            while (currentParent.parentId && depth < 6) {
                currentParent = await prisma.folder.findUnique({
                    where: { id: currentParent.parentId },
                });
                depth++;
            }

            if (depth >= 5) {
                return NextResponse.json({ error: "Maximum folder depth (5) exceeded" }, { status: 400 });
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

        return NextResponse.json({ folder }, { status: 201 });
    } catch (error) {
        console.error("Error creating folder:", error);
        return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
    }
}

