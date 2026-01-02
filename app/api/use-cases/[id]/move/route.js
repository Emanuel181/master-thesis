import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, readJsonBody, securityHeaders } from "@/lib/api-security";
import { requireProductionMode } from "@/lib/api-middleware";

// Input validation schema
const moveUseCaseSchema = z.object({
    groupId: z.string().max(50).nullable(), // null to ungroup
});

// PUT - Move a use case to a group (or ungroup it)
export async function PUT(request, { params }) {
    const demoBlock = requireProductionMode(request);
    if (demoBlock) return demoBlock;

    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: securityHeaders });
        }

        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: securityHeaders });
        }

        const rl = await rateLimit({
            key: `use-cases:move:${session.user.id}`,
            limit: 60,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const { id } = await params;

        // Verify use case belongs to user
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: { id, userId: session.user.id }
        });

        if (!useCase) {
            return NextResponse.json({ error: "Use case not found" }, { status: 404, headers: securityHeaders });
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: securityHeaders });
        }

        const validationResult = moveUseCaseSchema.safeParse(parsed.body);
        if (!validationResult.success) {
            return NextResponse.json({ error: "Validation failed" }, { status: 400, headers: securityHeaders });
        }

        const { groupId } = validationResult.data;

        // Verify group belongs to user if provided
        if (groupId) {
            // Check if useCaseGroup model is available
            if (!prisma.useCaseGroup) {
                // Model not available - just update without verification
                console.warn("UseCaseGroup model not available - skipping group verification");
            } else {
                const group = await prisma.useCaseGroup.findFirst({
                    where: { id: groupId, userId: session.user.id }
                });
                if (!group) {
                    return NextResponse.json({ error: "Group not found" }, { status: 404, headers: securityHeaders });
                }
            }
        }

        const updatedUseCase = await prisma.knowledgeBaseCategory.update({
            where: { id },
            data: { groupId: groupId || null }
        });

        return NextResponse.json({ useCase: updatedUseCase }, { headers: securityHeaders });
    } catch (error) {
        console.error("Error moving use case:", error);
        return NextResponse.json(
            { error: "Failed to move use case" },
            { status: 500, headers: securityHeaders }
        );
    }
}

