import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// GET - Get a single folder with its contents
export async function GET(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Verify user owns this folder
        if (folder.useCase.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json({ folder });
    } catch (error) {
        console.error("Error fetching folder:", error);
        return NextResponse.json({ error: "Failed to fetch folder" }, { status: 500 });
    }
}

// PATCH - Update folder (rename, move)
export async function PATCH(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, parentId, order } = body;

        const folder = await prisma.folder.findFirst({
            where: { id },
            include: {
                useCase: true,
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Verify user owns this folder
        if (folder.useCase.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
                return NextResponse.json({ error: "Cannot move folder into itself" }, { status: 400 });
            }

            if (parentId !== null) {
                // Check if new parent is a descendant of this folder
                const isDescendant = async (folderId, targetId) => {
                    if (folderId === targetId) return true;
                    const children = await prisma.folder.findMany({
                        where: { parentId: folderId },
                        select: { id: true },
                    });
                    for (const child of children) {
                        if (await isDescendant(child.id, targetId)) return true;
                    }
                    return false;
                };

                if (await isDescendant(id, parentId)) {
                    return NextResponse.json({ error: "Cannot move folder into its descendant" }, { status: 400 });
                }

                // Verify new parent exists and belongs to same use case
                const newParent = await prisma.folder.findFirst({
                    where: {
                        id: parentId,
                        useCaseId: folder.useCaseId,
                    },
                });

                if (!newParent) {
                    return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
                }
            }

            updateData.parentId = parentId;
        }

        const updatedFolder = await prisma.folder.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ folder: updatedFolder });
    } catch (error) {
        console.error("Error updating folder:", error);
        return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
    }
}

// DELETE - Delete folder and all its contents
export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const folder = await prisma.folder.findFirst({
            where: { id },
            include: {
                useCase: true,
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Verify user owns this folder
        if (folder.useCase.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Delete folder (cascade will handle children and PDF relations)
        await prisma.folder.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting folder:", error);
        return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
    }
}

