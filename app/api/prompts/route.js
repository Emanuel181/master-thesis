import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { uploadTextToS3, generatePromptS3Key } from '@/lib/s3';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { isSameOrigin, readJsonBody, securityHeaders } from '@/lib/api-security';

// Input validation schemas
const VALID_AGENTS = ["reviewer", "implementation", "tester", "report"];

const createPromptSchema = z.object({
    agent: z.enum(VALID_AGENTS, `Agent must be one of: ${VALID_AGENTS.join(', ')}`),
    title: z.string().max(200, 'Title must be less than 200 characters').optional(),
    text: z.string()
        .min(1, 'Text is required')
        .max(50000, 'Text must be less than 50000 characters'),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders });
        }

        // Rate limiting - 60 requests per minute
        const rl = rateLimit({
            key: `prompts:get:${session.user.id}`,
            limit: 60,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const userId = session.user.id;

        // Try to order by 'order' field if it exists, fallback to createdAt only
        let prompts;
        try {
            prompts = await prisma.prompt.findMany({
                where: { userId },
                orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            });
        } catch (orderError) {
            // Fallback if 'order' field doesn't exist yet (migration not run)
            console.warn('Order field not available, falling back to createdAt ordering');
            prompts = await prisma.prompt.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
            });
        }

        // Group by agent
        const agents = ["reviewer", "implementation", "tester", "report"];
        const grouped = {};
        agents.forEach(agent => grouped[agent] = []);

        prompts.forEach(prompt => {
            if (grouped[prompt.agent]) {
                grouped[prompt.agent].push({
                    id: prompt.id,
                    title: prompt.title,
                    text: prompt.text,
                    order: prompt.order ?? 0,
                });
            }
        });

        return NextResponse.json(grouped, { headers: securityHeaders });
    } catch (error) {
        console.error('Error fetching prompts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: securityHeaders });
    }
}

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

        // Rate limiting - 30 prompts created per hour
        const rl = rateLimit({
            key: `prompts:create:${session.user.id}`,
            limit: 30,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const userId = session.user.id;
        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: securityHeaders });
        }

        // Validate input
        const validationResult = createPromptSchema.safeParse(parsed.body);
        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
            }, { status: 400, headers: securityHeaders });
        }

        const { agent, title, text } = validationResult.data;

        // Upload to S3
        const s3Key = generatePromptS3Key(userId, agent);
        await uploadTextToS3(s3Key, text);

        const prompt = await prisma.prompt.create({
            data: {
                agent,
                title: title || "Untitled",
                text,
                userId,
                s3Key,
            },
        });

        return NextResponse.json({
            id: prompt.id,
            title: prompt.title,
            text: prompt.text,
        }, { headers: securityHeaders });
    } catch (error) {
        console.error('Error creating prompt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: securityHeaders });
    }
}
