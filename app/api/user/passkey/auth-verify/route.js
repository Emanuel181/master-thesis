import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyUserAuthentication } from '@/lib/user-passkey';

/** POST /api/user/passkey/auth-verify */
export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { response } = await request.json();
        const origin = request.headers.get('origin') || request.headers.get('referer');

        const result = await verifyUserAuthentication(session.user.id, response, origin);
        return NextResponse.json(result); // { verified: true, unlockToken: '...' }
    } catch (err) {
        console.error('[UserPasskey] auth-verify error:', err);
        return NextResponse.json({ error: err.message || 'Authentication failed' }, { status: 400 });
    }
}

