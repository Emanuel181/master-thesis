import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const VALID_AGENTS = ["reviewer", "implementation", "tester", "report"];

const reorderSchema = z.object({
    agent: z.enum(VALID_AGENTS, {
        errorMap: () => ({ message: `Agent must be one of: ${VALID_AGENTS.join(', ')}` })
    }),
    orderedIds: z.array(z.string()).min(1, 'At least one prompt ID is required'),
});

export async function POST(request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limiting
        const rl = rateLimit({
            key: `prompts:reorder:${session.user.id}`,
            limit: 30,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429 }
            );
        }

        const userId = session.user.id;
        const body = await request.json();

        // Validate input
        const validationResult = reorderSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.errors
            }, { status: 400 });
        }

        const { agent, orderedIds } = validationResult.data;

        // Verify all prompts belong to the user and the agent
        const existingPrompts = await prisma.prompt.findMany({
            where: {
                id: { in: orderedIds },
                userId,
                agent,
            },
            select: { id: true }
        });

        const existingIds = new Set(existingPrompts.map(p => p.id));
        const invalidIds = orderedIds.filter(id => !existingIds.has(id));

        if (invalidIds.length > 0) {
            return NextResponse.json({
                error: 'Invalid prompt IDs',
                invalidIds
            }, { status: 400 });
        }

        // Update order for each prompt
        try {
            const updates = orderedIds.map((id, index) =>
                prisma.prompt.update({
                    where: { id },
                    data: { order: index }
                })
            );

            await prisma.$transaction(updates);
        } catch (updateError) {
            // If order field doesn't exist, return a helpful message
            if (updateError.message?.includes('order')) {
                return NextResponse.json({
                    error: 'Database migration required. Please run: npx prisma db push && npx prisma generate',
                    details: 'The order field has not been added to the database yet.'
                }, { status: 500 });
            }
            throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering prompts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

