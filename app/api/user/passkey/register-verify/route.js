import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyUserRegistration } from '@/lib/user-passkey';

/** POST /api/user/passkey/register-verify */
export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { response, deviceName } = await request.json();
        const origin = request.headers.get('origin') || request.headers.get('referer');

        const result = await verifyUserRegistration(session.user.id, response, deviceName, origin);
        return NextResponse.json(result);
    } catch (err) {
        console.error('[UserPasskey] register-verify error:', err);
        return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 });
    }
}

