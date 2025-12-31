import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { securityHeaders } from '@/lib/api-security';
import { requireProductionMode } from '@/lib/api-middleware';

export async function GET(request) {
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  
  // SECURITY: Block demo mode from accessing production providers API
  const demoBlock = requireProductionMode(request, { requestId });
  if (demoBlock) return demoBlock;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
    }

    const rl = await rateLimit({ key: `providers:linked:${session.user.id}`, limit: 120, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', requestId, retryAt: rl.resetAt },
        { status: 429, headers: { ...securityHeaders, 'x-request-id': requestId } }
      );
    }

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    });

    const providers = Array.from(new Set(accounts.map((a) => a.provider))).sort();
    return NextResponse.json(
      { providers, requestId, updatedAt: new Date().toISOString() },
      { headers: { ...securityHeaders, 'x-request-id': requestId } }
    );
  } catch (error) {
    console.error('[providers/linked] error', { requestId, message: error?.message || String(error) });
    return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500, headers: { ...securityHeaders, 'x-request-id': requestId } });
  }
}
