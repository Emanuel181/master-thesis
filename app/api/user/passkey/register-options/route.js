import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateUserRegistrationOptions } from '@/lib/user-passkey';

/** POST /api/user/passkey/register-options */
export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const origin = request.headers.get('origin') || request.headers.get('referer');
        const { options } = await generateUserRegistrationOptions(
            session.user.id,
            session.user.name || session.user.email || 'VulnIQ User',
            origin,
        );

        return NextResponse.json({ options });
    } catch (err) {
        console.error('[UserPasskey] register-options error:', err);
        return NextResponse.json({ error: 'Failed to generate registration options' }, { status: 500 });
    }
}

