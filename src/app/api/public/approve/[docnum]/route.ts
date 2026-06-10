import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, ctx: RouteContext<'/api/public/approve/[docnum]'>) {
  const { docnum } = await ctx.params

  const estimate = await prisma.estimate.findFirst({
    where: { documentNumber: docnum, documentType: 'estimate' },
    include: {
      lineItems: { orderBy: { sortOrder: 'asc' } },
      milestones: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!estimate) return Response.json({ error: 'Not found' }, { status: 404 })

  // Mark as viewed if first time
  if (!estimate.dateViewed) {
    const today = new Date().toISOString().slice(0, 10)
    await prisma.estimate.update({ where: { id: estimate.id }, data: { dateViewed: today, status: 'viewed' } })
    await prisma.estimateActivity.create({
      data: {
        tenantId: estimate.tenantId,
        estimateId: estimate.id,
        eventType: 'viewed',
        actorName: estimate.clientName,
        actorType: 'client',
        description: 'Opened approval link',
      },
    })
  }

  // Get tenant branding
  const tenant = await prisma.tenant.findUnique({
    where: { id: estimate.tenantId },
    select: { businessName: true, logoUrl: true, themeColor: true, address: true, phone: true, website: true, license: true },
  })

  return Response.json({ estimate, tenant })
}

export async function POST(req: NextRequest, ctx: RouteContext<'/api/public/approve/[docnum]'>) {
  const { docnum } = await ctx.params
  const { approvedByName, approvalSignature } = await req.json()

  if (!approvedByName || !approvalSignature) {
    return Response.json({ error: 'Name and signature required' }, { status: 400 })
  }

  const estimate = await prisma.estimate.findFirst({
    where: { documentNumber: docnum, documentType: 'estimate' },
  })
  if (!estimate) return Response.json({ error: 'Not found' }, { status: 404 })
  if (estimate.status === 'approved') return Response.json({ error: 'Already approved' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)

  await prisma.$transaction(async (tx) => {
    await tx.estimate.update({
      where: { id: estimate.id },
      data: { status: 'approved', approvedByName, approvalSignature, dateApproved: today },
    })

    // Set project active
    if (estimate.projectId) {
      await tx.project.updateMany({
        where: { id: estimate.projectId },
        data: { status: 'active' },
      })
    }

    await tx.estimateActivity.create({
      data: {
        tenantId: estimate.tenantId,
        estimateId: estimate.id,
        eventType: 'approved',
        actorName: approvedByName,
        actorType: 'client',
        description: `Approved by ${approvedByName}`,
      },
    })
  })

  return Response.json({ ok: true })
}
