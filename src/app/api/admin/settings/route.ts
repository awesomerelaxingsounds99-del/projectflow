import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      id: true, businessName: true, tagline: true, logoUrl: true, themeColor: true,
      subdomain: true, customDomain: true, address: true, phone: true, website: true,
      license: true, acceptingProjects: true, offlineMessage: true, services: true, gcal: true,
      adminEmail: true,
    },
  })

  return Response.json(tenant)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Serialize JSON fields
  if (body.services && typeof body.services !== 'string') {
    body.services = JSON.stringify(body.services)
  }
  if (body.gcal && typeof body.gcal !== 'string') {
    body.gcal = JSON.stringify(body.gcal)
  }

  const tenant = await prisma.tenant.update({
    where: { id: session.tenantId },
    data: body,
    select: {
      id: true, businessName: true, tagline: true, logoUrl: true, themeColor: true,
      subdomain: true, customDomain: true, address: true, phone: true, website: true,
      license: true, acceptingProjects: true, offlineMessage: true, services: true, gcal: true,
    },
  })

  return Response.json(tenant)
}
