import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { isSameOrigin, securityHeaders } from '@/lib/api-security';

const ALLOWED_PROVIDERS = new Set(['github', 'google', 'gitlab', 'microsoft-entra-id']);

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders });
        }

        // CSRF protection for state-changing operations (cookie-auth)
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: securityHeaders });
        }

        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');

        if (!provider || !ALLOWED_PROVIDERS.has(provider)) {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400, headers: securityHeaders });
        }

        // Delete the linked OAuth account scoped to the authenticated user
        await prisma.account.deleteMany({
            where: {
                userId: session.user.id,
                provider,
            },
        });

        return NextResponse.json({ success: true }, { headers: securityHeaders });
    } catch (error) {
        console.error('[auth/disconnect] error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: securityHeaders });
    }
}
