import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, ctx: RouteContext<'/api/public/[subdomain]'>) {
  const { subdomain } = await ctx.params

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: {
      id: true, businessName: true, tagline: true, logoUrl: true, themeColor: true,
      acceptingProjects: true, offlineMessage: true, services: true, subdomain: true,
    },
  })

  if (!tenant) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(tenant)
}
