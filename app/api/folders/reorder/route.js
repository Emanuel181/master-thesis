import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// PATCH - Reorder folders and PDFs
export async function PATCH(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { useCaseId, items } = body;

        if (!useCaseId || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: "useCaseId and items array are required" }, { status: 400 });
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

        // Process reorder updates in a transaction
        await prisma.$transaction(async (tx) => {
            for (const item of items) {
                const { id, type, order, parentId } = item;

                if (type === "folder") {
                    await tx.folder.update({
                        where: { id },
                        data: {
                            order,
                            parentId: parentId || null,
                        },
                    });
                } else if (type === "pdf") {
                    await tx.pdf.update({
                        where: { id },
                        data: {
                            order,
                            folderId: parentId || null,
                        },
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering items:", error);
        return NextResponse.json({ error: "Failed to reorder items" }, { status: 500 });
    }
}

