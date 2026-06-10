import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/admin/catalog/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json()
  const item = await prisma.serviceCatalog.updateMany({ where: { id, tenantId: session.tenantId }, data: body })
  return Response.json(item)
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/admin/catalog/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  await prisma.serviceCatalog.deleteMany({ where: { id, tenantId: session.tenantId } })
  return Response.json({ ok: true })
}
