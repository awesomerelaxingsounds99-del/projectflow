import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/public/[subdomain]/submit'>) {
  const { subdomain } = await ctx.params
  const body = await req.json()

  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) return Response.json({ error: 'Not found' }, { status: 404 })
  if (!tenant.acceptingProjects) return Response.json({ error: 'Not accepting projects' }, { status: 403 })

  const project = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone || '',
      clientBiz: body.clientBiz || '',
      clientType: body.clientType || 'homeowner',
      projectName: body.projectName,
      projectType: body.service || '',
      address: body.address || '',
      description: body.description || '',
      status: 'pending_review',
    },
  })

  return Response.json(project, { status: 201 })
}
