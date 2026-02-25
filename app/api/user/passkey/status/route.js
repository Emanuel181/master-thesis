import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasUserPasskey } from '@/lib/user-passkey';

/** GET /api/user/passkey/status — check if current user has a registered passkey */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const has = await hasUserPasskey(session.user.id);
        return NextResponse.json({ hasPasskey: has });
    } catch (err) {
        console.error('[UserPasskey] status error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

