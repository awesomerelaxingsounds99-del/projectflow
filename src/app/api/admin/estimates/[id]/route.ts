import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { totalsOf } from '@/lib/money'

export async function GET(req: NextRequest, ctx: RouteContext<'/api/admin/estimates/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  const estimate = await prisma.estimate.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      lineItems: { orderBy: { sortOrder: 'asc' } },
      milestones: { orderBy: { sortOrder: 'asc' } },
      payments: { orderBy: { paidAt: 'asc' } },
      attachments: true,
      activity: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!estimate) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(estimate)
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/admin/estimates/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json()
  const { lineItems, milestones, payments, ...rest } = body

  // Recompute totals if line items are included
  if (lineItems) {
    const t = totalsOf({ lineItems, discount_amt: rest.discountAmt, markup_rate: rest.markupRate, tax_rate: rest.taxRate, payments: payments || [] })
    rest.total = t.total
    rest.amountPaid = t.paid
    rest.amountDue = t.due
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (lineItems !== undefined) {
      await tx.estimateLineItem.deleteMany({ where: { estimateId: id, tenantId: session.tenantId } })
      if (lineItems.length > 0) {
        await tx.estimateLineItem.createMany({
          data: lineItems.map((li: Record<string, unknown>, i: number) => ({
            ...li, tenantId: session.tenantId, estimateId: id, sortOrder: i,
          })),
        })
      }
    }
    if (milestones !== undefined) {
      await tx.estimateMilestone.deleteMany({ where: { estimateId: id, tenantId: session.tenantId } })
      if (milestones.length > 0) {
        await tx.estimateMilestone.createMany({
          data: milestones.map((ms: Record<string, unknown>, i: number) => ({
            ...ms, tenantId: session.tenantId, estimateId: id, sortOrder: i,
          })),
        })
      }
    }
    return tx.estimate.update({
      where: { id },
      data: rest,
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        milestones: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paidAt: 'asc' } },
        attachments: true,
        activity: { orderBy: { createdAt: 'asc' } },
      },
    })
  })

  return Response.json(updated)
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/admin/estimates/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  await prisma.estimate.deleteMany({ where: { id, tenantId: session.tenantId } })
  return Response.json({ ok: true })
}
