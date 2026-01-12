import prisma from '@/lib/prisma';
import { createApiHandler } from '@/lib/api-handler';

export const GET = createApiHandler(
  async (request, { session }) => {
    console.log('[API providers/linked] Fetching accounts for user:', session.user.id);
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    });

    console.log('[API providers/linked] Found accounts:', accounts);
    const providers = Array.from(new Set(accounts.map((a) => a.provider))).sort();
    console.log('[API providers/linked] Returning providers array:', providers);
    const result = { providers, updatedAt: new Date().toISOString() };
    console.log('[API providers/linked] Final result object:', JSON.stringify(result, null, 2));
    return result;
  },
  {
    requireAuth: true,
    requireProductionMode: true,
    rateLimit: { limit: 120, windowMs: 60 * 1000, keyPrefix: 'providers:linked' },
  }
);
