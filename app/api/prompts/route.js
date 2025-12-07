import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        const prompts = await prisma.prompt.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });

        // Group by agent
        const grouped = {};
        prompts.forEach(prompt => {
            if (!grouped[prompt.agent]) {
                grouped[prompt.agent] = [];
            }
            grouped[prompt.agent].push({
                id: prompt.id,
                text: prompt.text,
            });
        });

        return NextResponse.json(grouped);
    } catch (error) {
        console.error('Error fetching prompts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { agent, text } = await request.json();

        if (!agent || !text) {
            return NextResponse.json({ error: 'Agent and text are required' }, { status: 400 });
        }

        const prompt = await prisma.prompt.create({
            data: {
                agent,
                text,
                userId,
            },
        });

        return NextResponse.json({
            id: prompt.id,
            text: prompt.text,
        });
    } catch (error) {
        console.error('Error creating prompt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
