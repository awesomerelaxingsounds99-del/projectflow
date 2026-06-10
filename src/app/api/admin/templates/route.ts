import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await prisma.estimateTemplate.findMany({ where: { tenantId: session.tenantId } })
  return Response.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const t = await prisma.estimateTemplate.create({
    data: {
      ...body,
      items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []),
      tenantId: session.tenantId,
    },
  })
  return Response.json(t, { status: 201 })
}
