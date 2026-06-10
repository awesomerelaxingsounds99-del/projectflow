import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.serviceCatalog.findMany({ where: { tenantId: session.tenantId } })
  return Response.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const item = await prisma.serviceCatalog.create({ data: { ...body, tenantId: session.tenantId } })
  return Response.json(item, { status: 201 })
}
