import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { deleteFromS3 } from '@/lib/s3';
import { bulkDeletePrompts } from '@/lib/prompts/bulk-delete-service';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
    }

    const rl = rateLimit({ key: `prompts:bulk-delete:${session.user.id}`, limit: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', requestId, retryAt: rl.resetAt },
        { status: 429, headers: { 'x-request-id': requestId } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids : [];

    if (ids.length > 500) {
      return NextResponse.json({ error: 'Too many IDs', requestId, max: 500 }, { status: 413 });
    }

    const result = await bulkDeletePrompts({
      prisma,
      userId: session.user.id,
      ids,
      deleteFromS3,
      logger: console,
    });

    return NextResponse.json({ ...result, requestId }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    console.error('[prompts/bulk-delete] error', { requestId, message: error?.message || String(error) });
    const status = error?.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 500;
    return NextResponse.json({ error: 'Internal server error', requestId }, { status, headers: { 'x-request-id': requestId } });
  }
}

