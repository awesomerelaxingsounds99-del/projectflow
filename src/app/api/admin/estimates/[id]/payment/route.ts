import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computePaymentStatus } from '@/lib/money'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/admin/estimates/[id]/payment'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json()

  const result = await prisma.$transaction(async (tx) => {
    await tx.estimatePayment.create({
      data: {
        tenantId: session.tenantId,
        estimateId: id,
        amount: body.amount,
        method: body.method,
        reference: body.reference || '',
        note: body.note || '',
        paidAt: body.paidAt || new Date().toISOString().slice(0, 10),
        recordedByName: session.adminEmail,
      },
    })

    const payments = await tx.estimatePayment.findMany({ where: { estimateId: id } })
    const estimate = await tx.estimate.findUnique({ where: { id } })
    const paid = payments.reduce((s, p) => s + p.amount, 0)
    const total = estimate?.total || 0
    const status = computePaymentStatus(total, paid)
    const paidAt = status === 'paid' ? new Date().toISOString().slice(0, 10) : estimate?.paidAt

    return tx.estimate.update({
      where: { id },
      data: {
        amountPaid: paid,
        amountDue: Math.max(0, total - paid),
        status,
        paidAt: paidAt ?? null,
      },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        milestones: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paidAt: 'asc' } },
        attachments: true,
        activity: { orderBy: { createdAt: 'asc' } },
      },
    })
  })

  return Response.json(result)
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/admin/estimates/[id]/payment'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const { paymentId } = await req.json()

  const result = await prisma.$transaction(async (tx) => {
    await tx.estimatePayment.delete({ where: { id: paymentId } })

    const payments = await tx.estimatePayment.findMany({ where: { estimateId: id } })
    const estimate = await tx.estimate.findUnique({ where: { id } })
    const paid = payments.reduce((s, p) => s + p.amount, 0)
    const total = estimate?.total || 0
    const status = computePaymentStatus(total, paid)

    return tx.estimate.update({
      where: { id },
      data: { amountPaid: paid, amountDue: Math.max(0, total - paid), status, paidAt: status === 'paid' ? estimate?.paidAt : null },
    })
  })

  return Response.json(result)
}
