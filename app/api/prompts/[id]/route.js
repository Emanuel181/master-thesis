import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { uploadTextToS3, deleteFromS3 } from '@/lib/s3';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { isSameOrigin, readJsonBody, securityHeaders } from '@/lib/api-security';

// Input validation schema for updates
const updatePromptSchema = z.object({
    title: z.string().max(200, 'Title must be less than 200 characters').optional(),
    text: z.string()
        .min(1, 'Text is required')
        .max(50000, 'Text must be less than 50000 characters'),
});

export async function PUT(request, { params }) {
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

        // Rate limiting - 30 updates per hour
        const rl = rateLimit({
            key: `prompts:update:${session.user.id}`,
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
        const { id } = await params;
        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: securityHeaders });
        }

        // Validate input with Zod
        const validationResult = updatePromptSchema.safeParse(parsed.body);
        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
            }, { status: 400, headers: securityHeaders });
        }

        const { title, text } = validationResult.data;

        // Get the existing prompt to find the S3 key
        const existingPrompt = await prisma.prompt.findFirst({
            where: { id, userId },
        });

        if (!existingPrompt) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404, headers: securityHeaders });
        }

        // Upload new text to S3 using the existing key
        await uploadTextToS3(existingPrompt.s3Key, text);

        // Update the prompt in the database
        const prompt = await prisma.prompt.update({
            where: {
                id,
                userId // Ensure user can only update their own prompts
            },
            data: { title: title || "Untitled", text },
        });

        return NextResponse.json({ success: true, prompt }, { headers: securityHeaders });
    } catch (error) {
        console.error('Error updating prompt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: securityHeaders });
    }
}

export async function DELETE(request, { params }) {
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

        // Rate limiting - 30 deletes per hour
        const rl = rateLimit({
            key: `prompts:delete:${session.user.id}`,
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
        const { id } = await params;

        // Get the prompt to find the associated S3 key
        const prompt = await prisma.prompt.findFirst({
            where: { id, userId },
        });

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404, headers: securityHeaders });
        }

        // Delete the text file from S3
        await deleteFromS3(prompt.s3Key);

        // Delete the prompt from the database
        await prisma.prompt.deleteMany({
            where: { id, userId },
        });

        return NextResponse.json({ success: true }, { headers: securityHeaders });
    } catch (error) {
        console.error('Error deleting prompt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: securityHeaders });
    }
}
