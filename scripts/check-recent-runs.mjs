import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const runs = await p.workflowRun.findMany({
  orderBy: { startedAt: 'desc' },
  take: 5,
  select: {
    id: true,
    status: true,
    startedAt: true,
    completedAt: true,
    sfnExecutionArn: true,
    totalUseCases: true,
    completedUseCases: true,
    metadata: true,
    useCaseRuns: {
      select: { useCaseTitle: true, status: true, reviewerCompleted: true, implementerCompleted: true, testerCompleted: true, reporterCompleted: true }
    },
  },
})
for (const r of runs) {
  console.log('---')
  console.log('id:', r.id)
  console.log('status:', r.status)
  console.log('sfn:', r.sfnExecutionArn)
  console.log('started/completed:', r.startedAt, '->', r.completedAt)
  console.log('useCases:', r.completedUseCases, '/', r.totalUseCases)
  console.log('scanName:', r.metadata?.scanName)
  console.log('provider:', r.metadata?.currentRepo?.provider, 'repo:', r.metadata?.currentRepo)
  console.log('useCaseRuns:', r.useCaseRuns)
}
await p.$disconnect()

