import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' })
const prisma = new PrismaClient({ adapter } as never)

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('password123', 12)

  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'rge' },
    update: {},
    create: {
      id: 'tenant_rge',
      adminEmail: 'dana@rge-consultants.com',
      passwordHash,
      businessName: 'RGE Consultants',
      tagline: 'Mechanical · Electrical · Plumbing Engineering',
      themeColor: '#185FA5',
      subdomain: 'rge',
      address: '1100 K Street, Suite 410, Sacramento, CA 95814',
      phone: '(916) 555-0100',
      website: 'rge-consultants.com',
      license: 'CA PE #M-48201',
      acceptingProjects: true,
      subscriptionStatus: 'active',
      services: JSON.stringify([
        { id: 'svc_plumb', label: 'Plumbing Engineering', description: 'Water, sanitary, storm & gas system design', enabled: true },
        { id: 'svc_energy', label: 'Energy & Title 24', description: 'Compliance modeling, reports & certificates', enabled: true },
        { id: 'svc_mech', label: 'Mechanical / HVAC', description: 'Load calcs, equipment selection & ductwork', enabled: true },
        { id: 'svc_mep', label: 'Full MEP Coordination', description: 'Integrated M/E/P construction documents', enabled: true },
      ]),
      gcal: JSON.stringify({ connected: false, email: '', calendarId: 'primary', calendarName: 'RGE Projects', autoSchedule: true, durationDays: 1 }),
    },
  })

  console.log('Tenant created:', tenant.businessName)

  // Service catalog
  const catalogItems = [
    { id: 'cat_sd', description: 'MEP schematic design — basis of design, single-line diagrams, equipment narrative', unit: 'LS', unitPrice: 8500, category: 'Mechanical' },
    { id: 'cat_hvac', description: 'Mechanical (HVAC) construction documents — load calcs, equipment selection, ductwork & VRF layout', unit: 'LS', unitPrice: 16400, category: 'Mechanical' },
    { id: 'cat_elec', description: 'Electrical construction documents — power distribution, panel schedules, lighting & device plans', unit: 'LS', unitPrice: 13900, category: 'Electrical' },
    { id: 'cat_plumb', description: 'Plumbing & gas construction documents — water supply, sanitary, storm & gas piping', unit: 'LS', unitPrice: 10800, category: 'Plumbing' },
    { id: 'cat_t24', description: 'Title 24 Part 6 energy compliance — modeling, forms & certificate of compliance', unit: 'LS', unitPrice: 3400, category: 'Energy' },
    { id: 'cat_photo', description: 'Photometric / site lighting analysis — exterior IES modeling to code', unit: 'LS', unitPrice: 2200, category: 'Electrical' },
    { id: 'cat_ca', description: 'Construction administration — RFIs, submittals & punch-list site visits', unit: 'hr', unitPrice: 165, category: 'MEP' },
    { id: 'cat_kitchen', description: 'Commercial kitchen MEP — grease interlock, make-up air, gas sizing', unit: 'LS', unitPrice: 7600, category: 'Mechanical' },
    { id: 'cat_solar', description: 'Solar PV-ready design & electrical provisions', unit: 'LS', unitPrice: 2800, category: 'Electrical' },
    { id: 'cat_resmech', description: 'Residential HVAC design — Manual J/S/D load & duct calcs', unit: 'LS', unitPrice: 2400, category: 'Mechanical' },
    { id: 'cat_plancheck', description: 'Plan-check correction cycle (per cycle, beyond first)', unit: 'ea', unitPrice: 950, category: 'MEP' },
    { id: 'cat_rev', description: 'Additional services / revisions', unit: 'hr', unitPrice: 125, category: 'Revision' },
    { id: 'cat_survey', description: 'Existing-conditions field survey & as-builts', unit: 'ea', unitPrice: 1850, category: 'MEP' },
    { id: 'cat_arcflash', description: 'Arc-flash & short-circuit study', unit: 'LS', unitPrice: 4200, category: 'Electrical' },
  ]

  for (const item of catalogItems) {
    await prisma.serviceCatalog.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, tenantId: tenant.id },
    })
  }
  console.log('Catalog seeded')

  // Templates
  const templates = [
    { id: 'tpl_sfr', name: 'Single-Family Residence', projectType: 'Single-Family — New Construction', description: 'Custom home — mechanical, energy & light electrical', items: JSON.stringify(['cat_resmech', 'cat_t24', 'cat_elec', 'cat_plumb']) },
    { id: 'tpl_multi', name: 'Multifamily New Construction', projectType: 'Multifamily — New Construction', description: 'Full MEP permit set with construction admin', items: JSON.stringify(['cat_sd', 'cat_hvac', 'cat_elec', 'cat_plumb', 'cat_t24', 'cat_photo', 'cat_ca']) },
    { id: 'tpl_ti', name: 'Commercial Tenant Improvement', projectType: 'Commercial — Tenant Improvement', description: 'Existing building TI — survey, MEP & CA', items: JSON.stringify(['cat_survey', 'cat_hvac', 'cat_elec', 'cat_plumb', 'cat_ca']) },
    { id: 'tpl_rest', name: 'Restaurant / Food Service', projectType: 'Commercial — New Construction', description: 'Commercial kitchen, grease & gas + full MEP', items: JSON.stringify(['cat_sd', 'cat_hvac', 'cat_kitchen', 'cat_elec', 'cat_plumb', 'cat_t24']) },
    { id: 'tpl_light', name: 'Lighting Retrofit', projectType: 'Commercial — Renovation', description: 'LED retrofit with photometric & arc-flash', items: JSON.stringify(['cat_elec', 'cat_photo', 'cat_arcflash']) },
  ]

  for (const tpl of templates) {
    await prisma.estimateTemplate.upsert({
      where: { id: tpl.id },
      update: {},
      create: { ...tpl, tenantId: tenant.id },
    })
  }
  console.log('Templates seeded')

  // Projects
  const projects = [
    { id: 'prj_west', clientName: 'Marcus Deane', clientEmail: 'marcus@harborridge.co', clientPhone: '(916) 555-0148', clientBiz: 'Harbor Ridge Builders', clientType: 'builder', projectName: 'Westview — 24-Unit Apartments', projectType: 'Multifamily — New Construction', address: '1840 Westview Blvd, Sacramento, CA', description: 'Full MEP for a 4-story, 24-unit apartment building. Need stamped permit set.', status: 'active', startDate: '2026-06-22', estimateId: 'est_0016' },
    { id: 'prj_oak', clientName: 'Priya Raman', clientEmail: 'priya.raman@gmail.com', clientPhone: '(530) 555-0193', clientBiz: '', clientType: 'homeowner', projectName: 'Oakwood Custom Residence', projectType: 'Single-Family — New Construction', address: '27 Oakwood Ln, Davis, CA', description: 'New 3,800 sq ft custom home. Want energy-efficient HVAC and a Title 24 report.', status: 'pending_review' },
    { id: 'prj_mill', clientName: 'Trevor Goff', clientEmail: 'trevor@millcreekdev.com', clientPhone: '(916) 555-0177', clientBiz: 'Mill Creek Development', clientType: 'commercial', projectName: 'Mill Creek Medical Office TI', projectType: 'Commercial — Tenant Improvement', address: '5500 Folsom Blvd, Sacramento, CA', description: '12,000 sq ft medical office tenant improvement.', status: 'pending_review' },
    { id: 'prj_ridge', clientName: 'Sofia Marin', clientEmail: 'sofia@ridgelinebuild.com', clientPhone: '(916) 555-0120', clientBiz: 'Ridgeline Builders', clientType: 'builder', projectName: 'Ridgeline Townhomes Phase 2', projectType: 'Multifamily — New Construction', address: '900 Ridgeline Dr, Roseville, CA', description: '8 townhome units, electrical + plumbing only.', status: 'pending_review' },
    { id: 'prj_cedar', clientName: 'Alan Whitfield', clientEmail: 'alan.w@cedarhospitality.com', clientPhone: '(916) 555-0166', clientBiz: 'Cedar Hospitality Group', clientType: 'commercial', projectName: 'Cedar Grove Restaurant', projectType: 'Commercial — New Construction', address: '120 Vine St, Folsom, CA', description: 'New 4,200 sq ft restaurant with commercial kitchen.', status: 'active', startDate: '2026-06-09', estimateId: 'est_0012' },
    { id: 'prj_pine', clientName: 'Gabriela Sosa', clientEmail: 'g.sosa@pinecrestllc.com', clientPhone: '(916) 555-0102', clientBiz: 'Pinecrest LLC', clientType: 'commercial', projectName: 'Pinecrest Warehouse Lighting Retrofit', projectType: 'Commercial — Renovation', address: '44 Industrial Pkwy, West Sacramento, CA', description: 'LED retrofit + photometric for 60,000 sq ft warehouse.', status: 'complete', startDate: '2026-03-24', estimateId: 'est_0009' },
  ]

  for (const p of projects) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, tenantId: tenant.id },
    })
  }
  console.log('Projects seeded')

  // Hero estimate
  const heroLineItems = [
    { description: 'MEP schematic design — basis of design, single-line diagrams, equipment narrative', qty: 1, unit: 'LS', unitPrice: 8500, discountPct: 0, lineTotal: 8500, category: 'Mechanical', sortOrder: 0 },
    { description: 'Mechanical (HVAC) construction documents — load calcs, equipment selection, ductwork & VRF layout', qty: 1, unit: 'LS', unitPrice: 16400, discountPct: 0, lineTotal: 16400, category: 'Mechanical', sortOrder: 1 },
    { description: 'Electrical construction documents — power distribution, panel schedules, lighting & device plans', qty: 1, unit: 'LS', unitPrice: 13900, discountPct: 0, lineTotal: 13900, category: 'Electrical', sortOrder: 2 },
    { description: 'Plumbing & gas construction documents — water supply, sanitary, storm & gas piping', qty: 1, unit: 'LS', unitPrice: 10800, discountPct: 0, lineTotal: 10800, category: 'Plumbing', sortOrder: 3 },
    { description: 'Title 24 Part 6 energy compliance — modeling, forms & certificate of compliance', qty: 1, unit: 'LS', unitPrice: 3400, discountPct: 0, lineTotal: 3400, category: 'Energy', sortOrder: 4 },
    { description: 'Photometric / site lighting analysis — exterior IES modeling to code', qty: 1, unit: 'LS', unitPrice: 2200, discountPct: 0, lineTotal: 2200, category: 'Electrical', sortOrder: 5 },
    { description: 'Construction administration — RFIs, submittals & punch-list site visits', qty: 48, unit: 'hr', unitPrice: 165, discountPct: 0, lineTotal: 7920, category: 'MEP', sortOrder: 6 },
  ]

  const heroEst = await prisma.estimate.upsert({
    where: { id: 'est_0016' },
    update: {},
    create: {
      id: 'est_0016',
      tenantId: tenant.id,
      projectId: 'prj_west',
      documentType: 'estimate',
      documentNumber: 'EST-2026-0016',
      status: 'viewed',
      clientBizName: 'Harbor Ridge Builders',
      clientName: 'Marcus Deane',
      clientEmail: 'marcus@harborridge.co',
      clientPhone: '(916) 555-0148',
      clientType: 'builder',
      projectName: 'Westview — 24-Unit Apartments',
      projectAddress: '1840 Westview Blvd, Sacramento, CA 95818',
      projectType: 'Multifamily — New Construction',
      scopeOfWork: 'RGE Consultants will provide full mechanical, electrical, and plumbing engineering design for the Westview 24-unit apartment development. Services include construction documents suitable for permit submission to the City of Sacramento, coordination with the architect\'s Revit model, and code compliance review through CALGreen and Title 24. Deliverables issued as a stamped CD set at 100% completion.',
      assumptions: 'Architectural backgrounds provided in Revit (.rvt) at each phase. One round of plan-check corrections included. Structural and civil by others. Utility service capacity assumed adequate per preliminary will-serve.',
      exclusions: 'Low-voltage / AV design, fire sprinkler hydraulic calculations, solar PV, commissioning agent services, and expediting fees are excluded. Additional plan-check cycles billed hourly.',
      discountAmt: 1500,
      markupRate: 0,
      taxRate: 0,
      notes: 'Thank you for the opportunity to support Harbor Ridge on Westview. A 15% retainer is due to schedule the project into our production calendar.',
      contractAmount: 61120,
      amountPaid: 8500,
      amountDue: 52620,
      total: 61620,
      paymentMethods: JSON.stringify({ ach: true, check: true, creditCard: false, stripe: true, quickbooks: false, achInstructions: 'Routing 121000358 · Account 8840561902 · RGE Consultants LLC, Wells Fargo. Reference the estimate number on your transfer.', checkPayableTo: 'RGE Consultants LLC', stripePaymentLink: '' }),
      createdByName: 'Dana Okafor',
      sentByName: 'Dana Okafor',
      dateSent: '2026-05-20',
      dateViewed: '2026-05-21',
      revisionNumber: 1,
    },
  })

  // Delete existing line items for hero estimate and re-create
  await prisma.estimateLineItem.deleteMany({ where: { estimateId: 'est_0016' } })
  for (const li of heroLineItems) {
    await prisma.estimateLineItem.create({ data: { ...li, tenantId: tenant.id, estimateId: 'est_0016' } })
  }

  await prisma.estimateMilestone.deleteMany({ where: { estimateId: 'est_0016' } })
  const milestones = [
    { label: 'Schematic Design', description: 'Basis of design & single-line diagrams', amount: 8500, amountBilled: 8500, status: 'paid', sortOrder: 0 },
    { label: 'Design Development', description: '50% coordinated MEP set', amount: 14000, amountBilled: 0, status: 'pending', sortOrder: 1 },
    { label: 'Construction Documents', description: '100% stamped permit set', amount: 30720, amountBilled: 0, status: 'pending', sortOrder: 2 },
    { label: 'Construction Administration', description: 'RFIs, submittals, site visits', amount: 7920, amountBilled: 0, status: 'pending', sortOrder: 3 },
  ]
  for (const ms of milestones) {
    await prisma.estimateMilestone.create({ data: { ...ms, tenantId: tenant.id, estimateId: 'est_0016' } })
  }

  await prisma.estimatePayment.deleteMany({ where: { estimateId: 'est_0016' } })
  await prisma.estimatePayment.create({
    data: { tenantId: tenant.id, estimateId: 'est_0016', amount: 8500, method: 'ACH transfer', reference: 'WF-8841', note: 'Schematic retainer', paidAt: '2026-05-22', recordedByName: 'Dana Okafor' },
  })

  await prisma.estimateActivity.deleteMany({ where: { estimateId: 'est_0016' } })
  const activities = [
    { eventType: 'created', actorName: 'Dana Okafor', actorType: 'admin', description: 'Estimate created from Westview intake' },
    { eventType: 'sent', actorName: 'Dana Okafor', actorType: 'admin', description: 'Sent to marcus@harborridge.co' },
    { eventType: 'viewed', actorName: 'Marcus Deane', actorType: 'client', description: 'Opened approval link' },
  ]
  for (const act of activities) {
    await prisma.estimateActivity.create({ data: { ...act, tenantId: tenant.id, estimateId: 'est_0016' } })
  }
  console.log('Hero estimate seeded')

  // Other estimates/invoices
  const otherDocs = [
    { id: 'est_0017', documentType: 'estimate', documentNumber: 'EST-2026-0017', status: 'draft', projectId: 'prj_cedar', clientBizName: 'Cedar Hospitality Group', clientName: 'Alan Whitfield', projectName: 'Cedar Grove Restaurant', projectType: 'Commercial — New Construction', total: 38600, amountPaid: 0, amountDue: 38600 },
    { id: 'est_0015', documentType: 'estimate', documentNumber: 'EST-2026-0015', status: 'approved', projectId: 'prj_ridge', clientBizName: 'Ridgeline Builders', clientName: 'Sofia Marin', projectName: 'Ridgeline Townhomes Phase 1', projectType: 'Multifamily', total: 27400, amountPaid: 0, amountDue: 27400, convertedToInvoiceId: 'inv_0045' },
    { id: 'est_0012', documentType: 'estimate', documentNumber: 'EST-2026-0012', status: 'converted', projectId: 'prj_cedar', clientBizName: 'Cedar Hospitality Group', clientName: 'Alan Whitfield', projectName: 'Cedar Grove — Shell', projectType: 'Commercial', total: 19800, amountPaid: 0, amountDue: 19800, convertedToInvoiceId: 'inv_0041' },
    { id: 'inv_0045', documentType: 'invoice', documentNumber: 'INV-2026-0045', status: 'unpaid', projectId: 'prj_ridge', clientBizName: 'Ridgeline Builders', clientName: 'Sofia Marin', projectName: 'Ridgeline Townhomes Phase 1', projectType: 'Multifamily', total: 27400, amountPaid: 0, amountDue: 27400, convertedFromEstimateId: 'est_0015' },
    { id: 'inv_0041', documentType: 'invoice', documentNumber: 'INV-2026-0041', status: 'partial', projectId: 'prj_cedar', clientBizName: 'Cedar Hospitality Group', clientName: 'Alan Whitfield', projectName: 'Cedar Grove — Shell', projectType: 'Commercial', total: 19800, amountPaid: 9900, amountDue: 9900, convertedFromEstimateId: 'est_0012' },
    { id: 'inv_0038', documentType: 'invoice', documentNumber: 'INV-2026-0038', status: 'paid', projectId: 'prj_pine', clientBizName: 'Pinecrest LLC', clientName: 'Gabriela Sosa', projectName: 'Pinecrest Warehouse Lighting Retrofit', projectType: 'Commercial — Renovation', total: 14250, amountPaid: 14250, amountDue: 0, paidAt: '2026-04-19' },
    { id: 'inv_0033', documentType: 'invoice', documentNumber: 'INV-2026-0033', status: 'overdue', projectId: 'prj_mill', clientBizName: 'Northgate Partners', clientName: 'Ray Okada', projectName: 'Northgate Retail Pad B', projectType: 'Commercial', total: 8900, amountPaid: 0, amountDue: 8900 },
  ]

  for (const doc of otherDocs) {
    await prisma.estimate.upsert({
      where: { id: doc.id },
      update: {},
      create: {
        ...doc,
        tenantId: tenant.id,
        revisionNumber: 1,
        createdByName: 'Dana Okafor',
        paymentMethods: JSON.stringify({ ach: true, check: true }),
      },
    })
  }
  console.log('Other documents seeded')

  console.log('\n✅ Seed complete!')
  console.log('Login: dana@rge-consultants.com / password123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
