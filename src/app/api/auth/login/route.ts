import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { setSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const tenant = await prisma.tenant.findUnique({ where: { adminEmail: email } })
  if (!tenant) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, tenant.passwordHash)
  if (!valid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  await setSession({
    tenantId: tenant.id,
    adminEmail: tenant.adminEmail,
    businessName: tenant.businessName,
  })

  return Response.json({ ok: true, tenantId: tenant.id, businessName: tenant.businessName })
}
