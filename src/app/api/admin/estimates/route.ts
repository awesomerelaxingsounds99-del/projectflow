import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nextDocumentNumber } from '@/lib/docnum'
import { totalsOf } from '@/lib/money'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'estimate'

  const docs = await prisma.estimate.findMany({
    where: { tenantId: session.tenantId, documentType: type },
    include: { lineItems: true, payments: true },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(docs)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const documentType = body.documentType || 'estimate'
  const documentNumber = await nextDocumentNumber(session.tenantId, documentType)

  const { lineItems, milestones, ...rest } = body

  const estimate = await prisma.estimate.create({
    data: {
      ...rest,
      tenantId: session.tenantId,
      documentType,
      documentNumber,
      status: 'draft',
      revisionNumber: 1,
      lineItems: lineItems
        ? {
            create: lineItems.map((li: Record<string, unknown>, i: number) => ({
              ...li,
              tenantId: session.tenantId,
              sortOrder: i,
            })),
          }
        : undefined,
      milestones: milestones
        ? {
            create: milestones.map((ms: Record<string, unknown>, i: number) => ({
              ...ms,
              tenantId: session.tenantId,
              sortOrder: i,
            })),
          }
        : undefined,
    },
    include: { lineItems: true, milestones: true, payments: true, attachments: true, activity: true },
  })

  return Response.json(estimate, { status: 201 })
}
