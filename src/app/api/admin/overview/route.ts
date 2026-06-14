import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.tenantId

  const [pendingCount, activeCount, invoices, projects] = await Promise.all([
    prisma.project.count({ where: { tenantId, status: 'pending_review' } }),
    prisma.project.count({ where: { tenantId, status: { in: ['active', 'complete'] } } }),
    prisma.estimate.findMany({
      where: { tenantId, documentType: 'invoice', status: { notIn: ['paid', 'void'] } },
      select: { amountDue: true, total: true, status: true, createdAt: true },
    }),
    prisma.project.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  const outstanding = invoices.reduce((s, i) => s + i.amountDue, 0)
  const payments = await prisma.estimatePayment.findMany({ where: { tenantId } })
  const collected = payments.reduce((s, p) => s + p.amount, 0)

  // Attach most recent estimate per project
  const projectIds = projects.map(p => p.id)
  const estimates = projectIds.length
    ? await prisma.estimate.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, projectId: true, documentNumber: true, status: true, total: true, documentType: true },
      })
    : []

  const recentProjects = projects.map(p => ({
    ...p,
    estimates: estimates.filter(e => e.projectId === p.id).slice(0, 1),
  }))

  return Response.json({ pendingCount, activeCount, outstanding, collected, recentProjects })
}
