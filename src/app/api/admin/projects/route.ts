import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = { tenantId: session.tenantId }
  if (status === 'pending') {
    where.status = 'pending_review'
  } else if (status === 'active') {
    where.status = { in: ['active', 'complete'] }
  } else if (status === 'complete') {
    where.status = 'complete'
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: status === 'active'
      ? [{ startDate: 'asc' }, { createdAt: 'desc' }]
      : { createdAt: 'desc' },
  })

  // Attach estimates per project
  const projectIds = projects.map(p => p.id)
  const estimates = projectIds.length
    ? await prisma.estimate.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, projectId: true, documentNumber: true, status: true, total: true, documentType: true, amountPaid: true },
      })
    : []

  const result = projects.map(p => ({
    ...p,
    estimates: estimates.filter(e => e.projectId === p.id),
  }))

  return Response.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const project = await prisma.project.create({
    data: { ...body, tenantId: session.tenantId, status: 'pending_review' },
  })

  return Response.json(project, { status: 201 })
}
