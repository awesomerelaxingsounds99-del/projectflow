import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nextDocumentNumber } from '@/lib/docnum'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/admin/estimates/[id]/convert'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  const est = await prisma.estimate.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { lineItems: true, milestones: true, attachments: true },
  })
  if (!est) return Response.json({ error: 'Not found' }, { status: 404 })

  const invoiceNumber = await nextDocumentNumber(session.tenantId, 'invoice')

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.estimate.create({
      data: {
        tenantId: session.tenantId,
        projectId: est.projectId,
        documentType: 'invoice',
        documentNumber: invoiceNumber,
        status: 'unpaid',
        clientBizName: est.clientBizName,
        clientName: est.clientName,
        clientEmail: est.clientEmail,
        clientPhone: est.clientPhone,
        clientType: est.clientType,
        projectName: est.projectName,
        projectAddress: est.projectAddress,
        projectType: est.projectType,
        scopeOfWork: est.scopeOfWork,
        assumptions: est.assumptions,
        exclusions: est.exclusions,
        discountAmt: est.discountAmt,
        markupRate: est.markupRate,
        taxRate: est.taxRate,
        notes: est.notes,
        total: est.total,
        amountPaid: 0,
        amountDue: est.total,
        paymentMethods: est.paymentMethods,
        createdByName: session.adminEmail,
        convertedFromEstimateId: est.id,
        revisionNumber: 1,
        lineItems: {
          create: est.lineItems.map((li) => ({
            tenantId: session.tenantId,
            sortOrder: li.sortOrder,
            description: li.description,
            qty: li.qty,
            unit: li.unit,
            unitPrice: li.unitPrice,
            discountPct: li.discountPct,
            lineTotal: li.lineTotal,
            category: li.category,
          })),
        },
        milestones: {
          create: est.milestones.map((ms) => ({
            tenantId: session.tenantId,
            sortOrder: ms.sortOrder,
            label: ms.label,
            description: ms.description,
            amount: ms.amount,
            amountBilled: 0,
            status: 'pending',
            dueDate: ms.dueDate,
          })),
        },
      },
    })

    await tx.estimate.update({
      where: { id: est.id },
      data: { status: 'converted', convertedToInvoiceId: inv.id },
    })

    await tx.estimateActivity.create({
      data: {
        tenantId: session.tenantId,
        estimateId: est.id,
        eventType: 'converted',
        actorName: session.adminEmail,
        actorType: 'admin',
        description: `Converted to invoice ${invoiceNumber}`,
      },
    })

    return inv
  })

  return Response.json(invoice, { status: 201 })
}
