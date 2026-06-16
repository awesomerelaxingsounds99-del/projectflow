import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })
  const { businessName, subdomain, email, password } = await req.json()

  if (!businessName || !subdomain || !email || !password) {
    return Response.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!/^[a-z0-9]+$/.test(subdomain)) {
    return Response.json({ error: 'Subdomain can only contain lowercase letters and numbers' }, { status: 400 })
  }

  // Check if email or subdomain already taken
  const existing = await prisma.tenant.findFirst({
    where: { OR: [{ adminEmail: email }, { subdomain }] },
  })
  if (existing) {
    if (existing.adminEmail === email) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 400 })
    }
    return Response.json({ error: 'That subdomain is already taken' }, { status: 400 })
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)

  // Create tenant (inactive until payment)
  const tenant = await prisma.tenant.create({
    data: {
      businessName,
      subdomain,
      adminEmail: email,
      passwordHash,
      subscriptionStatus: 'incomplete',
      services: JSON.stringify([
        { id: '1', label: 'MEP Engineering', description: 'Mechanical, electrical & plumbing systems', enabled: true },
        { id: '2', label: 'Structural Engineering', description: 'Structural analysis and design', enabled: true },
        { id: '3', label: 'Civil Engineering', description: 'Site work, grading, and utilities', enabled: true },
        { id: '4', label: 'Consulting', description: 'General engineering consulting', enabled: true },
      ]),
    },
  })

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: businessName,
    metadata: { tenantId: tenant.id },
  })

  // Update tenant with Stripe customer ID
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { stripeCustomerId: customer.id },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`

  // Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${baseUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/signup?cancelled=1`,
    metadata: { tenantId: tenant.id },
    subscription_data: {
      metadata: { tenantId: tenant.id },
    },
  })

  return Response.json({ url: session.url })
}
