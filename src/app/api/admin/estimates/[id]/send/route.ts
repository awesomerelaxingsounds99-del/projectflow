import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/admin/estimates/[id]/send'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const { to, cc, subject, message } = await req.json()

  const today = new Date().toISOString().slice(0, 10)

  const updated = await prisma.$transaction(async (tx) => {
    const est = await tx.estimate.update({
      where: { id },
      data: {
        status: 'sent',
        dateSent: today,
        sentByName: session.adminEmail,
      },
    })

    await tx.estimateActivity.create({
      data: {
        tenantId: session.tenantId,
        estimateId: id,
        eventType: 'sent',
        actorName: session.adminEmail,
        actorType: 'admin',
        description: `Sent to ${to}`,
      },
    })

    return est
  })

  // TODO: Send actual email via Resend with PDF attachment and approval link

  return Response.json(updated)
}
