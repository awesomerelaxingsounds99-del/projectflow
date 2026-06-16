import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { setSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })
  const { sessionId } = await req.json()
  if (!sessionId) return Response.json({ error: 'Missing session' }, { status: 400 })

  // Verify the Stripe session
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.payment_status !== 'paid') {
    return Response.json({ error: 'Payment not completed' }, { status: 400 })
  }

  const tenantId = session.metadata?.tenantId
  if (!tenantId) return Response.json({ error: 'Invalid session' }, { status: 400 })

  // Activate the tenant
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionStatus: 'active',
      stripeSubscriptionId: session.subscription as string,
    },
  })

  // Log them in automatically
  await setSession({
    tenantId: tenant.id,
    adminEmail: tenant.adminEmail,
    businessName: tenant.businessName,
  })

  return Response.json({ ok: true, tenantId: tenant.id })
}
