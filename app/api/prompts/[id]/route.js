import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { uploadTextToS3, deleteFromS3 } from '@/lib/s3';

export async function PUT(request, { params }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { id } = await params;
        const { title, text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Get the existing prompt to find the S3 key
        const existingPrompt = await prisma.prompt.findUnique({
            where: { id, userId },
        });

        if (!existingPrompt) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        // Upload new text to S3 using the existing key
        await uploadTextToS3(existingPrompt.s3Key, text);

        // Update the prompt in the database
        const prompt = await prisma.prompt.updateMany({
            where: { id, userId },
            data: { title: title || "Untitled", text },
        });

        if (prompt.count === 0) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating prompt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { id } = await params;

        // Get the prompt to find the associated S3 key
        const prompt = await prisma.prompt.findUnique({
            where: { id, userId },
        });

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        // Delete the text file from S3
        await deleteFromS3(prompt.s3Key);

        // Delete the prompt from the database
        await prisma.prompt.deleteMany({
            where: { id, userId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting prompt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
