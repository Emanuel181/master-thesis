import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { isSameOrigin, readJsonBody, securityHeaders } from '@/lib/api-security';

const VALID_AGENTS = ["reviewer", "implementation", "tester", "report"];

// CUID validation pattern (starts with 'c', 25 chars, lowercase alphanumeric)
const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format');

const reorderSchema = z.object({
    agent: z.enum(VALID_AGENTS, `Agent must be one of: ${VALID_AGENTS.join(', ')}`),
    orderedIds: z.array(cuidSchema).min(1, 'At least one prompt ID is required').max(500),
});

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders });
        }

        // CSRF protection for state-changing operations
        if (!isSameOrigin(request)) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403, headers: securityHeaders }
            );
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
                { status: 429, headers: securityHeaders }
            );
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: securityHeaders });
        }

        // Validate input
        const validationResult = reorderSchema.safeParse(parsed.body);
        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
            }, { status: 400, headers: securityHeaders });
        }

        const { agent, orderedIds } = validationResult.data;
        const userId = session.user.id;

        // Verify all prompts belong to the user and the agent
        const existingPrompts = await prisma.prompt.findMany({
            where: {
                id: { in: orderedIds },
                userId,
                agent,
            },
            select: { id: true }
        });

        if (existingPrompts.length !== orderedIds.length) {
            return NextResponse.json({
                error: 'Validation failed',
            }, { status: 400, headers: securityHeaders });
        }

        // Update order for each prompt in a transaction
        const updates = orderedIds.map((id, index) =>
            prisma.prompt.updateMany({
                where: { id, userId, agent },
                data: { order: index }
            })
        );

        await prisma.$transaction(updates);

        return NextResponse.json({ success: true }, { headers: securityHeaders });
    } catch (error) {
        console.error('Error reordering prompts:', error);
        // Check if the error is due to missing 'order' field
        if (error?.message?.includes('order')) {
            return NextResponse.json({
                error: 'Database migration required',
            }, { status: 500, headers: securityHeaders });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: securityHeaders });
    }
}
