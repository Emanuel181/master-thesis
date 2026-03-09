import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateUserAuthOptions } from '@/lib/user-passkey';

/** POST /api/user/passkey/auth-options */
export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const origin = request.headers.get('origin') || request.headers.get('referer');
        const options = await generateUserAuthOptions(session.user.id, origin);

        return NextResponse.json({ options });
    } catch (err) {
        console.error('[UserPasskey] auth-options error:', err);
        return NextResponse.json({ error: 'Failed to generate auth options' }, { status: 500 });
    }
}

