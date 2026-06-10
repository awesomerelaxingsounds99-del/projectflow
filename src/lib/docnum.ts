import { prisma } from './prisma'

export async function nextDocumentNumber(tenantId: string, type: 'estimate' | 'invoice'): Promise<string> {
  const prefix = type === 'invoice' ? 'INV' : 'EST'
  const year = new Date().getFullYear()
  const pattern = `${prefix}-${year}-%`

  const rows = await prisma.estimate.findMany({
    where: { tenantId, documentNumber: { startsWith: `${prefix}-${year}-` } },
    select: { documentNumber: true },
  })

  const nums = rows
    .map(r => parseInt(r.documentNumber.split('-')[2] || '0', 10))
    .filter(n => !isNaN(n))

  const n = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${year}-${String(n).padStart(4, '0')}`
}
