export async function bulkDeletePrompts({ prisma, userId, ids, deleteFromS3, logger = console }) {
  if (!userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }

  const uniqueIds = Array.from(new Set((ids || []).filter((id) => typeof id === 'string' && id.trim().length > 0)));
  if (uniqueIds.length === 0) {
    return { success: true, deletedIds: [], missingIds: [], s3Failed: [] };
  }

  const prompts = await prisma.prompt.findMany({
    where: { userId, id: { in: uniqueIds } },
    select: { id: true, s3Key: true },
  });

  const foundIds = new Set(prompts.map((p) => p.id));
  const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

  const deletedIds = await prisma.$transaction(async (tx) => {
    const res = await tx.prompt.deleteMany({
      where: { userId, id: { in: prompts.map((p) => p.id) } },
    });
    if (res.count !== prompts.length) {
      logger.warn('[prompts/bulk-delete] deleteMany count mismatch', { userId, expected: prompts.length, actual: res.count });
    }
    return prompts.map((p) => p.id);
  });

  const settled = await Promise.allSettled(
    prompts.map(async (p) => {
      await deleteFromS3(p.s3Key);
      return p.id;
    })
  );

  const s3Failed = [];
  for (let i = 0; i < settled.length; i += 1) {
    const result = settled[i];
    if (result.status === 'rejected') {
      const prompt = prompts[i];
      s3Failed.push({ id: prompt.id, error: result.reason?.message || String(result.reason) });
    }
  }

  const success = missingIds.length === 0 && s3Failed.length === 0;
  return { success, deletedIds, missingIds, s3Failed };
}

