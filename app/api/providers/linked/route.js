import prisma from '@/lib/prisma';
import { createApiHandler } from '@/lib/api-handler';

export const GET = createApiHandler(
  async (request, { session }) => {
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    });

    const providers = Array.from(new Set(accounts.map((a) => a.provider))).sort();
    return { providers, updatedAt: new Date().toISOString() };
  },
  {
    requireAuth: true,
    requireProductionMode: true,
    rateLimit: { limit: 120, windowMs: 60 * 1000, keyPrefix: 'providers:linked' },
  }
);
