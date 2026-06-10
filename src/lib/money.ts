export interface LineItem {
  qty: number
  unit_price: number
  discount_pct: number
}

export interface DocForTotals {
  lineItems?: LineItem[]
  total?: number
  discount_amt?: number
  markup_rate?: number
  tax_rate?: number
  payments?: { amount: number }[]
}

export function totalsOf(doc: DocForTotals) {
  const items = doc.lineItems || []
  if (items.length === 0 && typeof doc.total === 'number') {
    const paid0 = (doc.payments || []).reduce((s, p) => s + (p.amount || 0), 0)
    return { subtotal: doc.total, discount: 0, markup: 0, tax: 0, total: doc.total, paid: paid0, due: doc.total - paid0 }
  }
  const subtotal = items.reduce(
    (s, l) => s + l.qty * l.unit_price * (1 - (l.discount_pct || 0) / 100),
    0
  )
  const discount = doc.discount_amt || 0
  const afterDisc = subtotal - discount
  const markup = afterDisc * ((doc.markup_rate || 0) / 100)
  const tax = (afterDisc + markup) * ((doc.tax_rate || 0) / 100)
  const total = afterDisc + markup + tax
  const paid = (doc.payments || []).reduce((s, p) => s + p.amount, 0)
  return { subtotal, discount, markup, tax, total, paid, due: Math.max(0, total - paid) }
}

export function lineTotal(qty: number, unitPrice: number, discountPct: number): number {
  return qty * unitPrice * (1 - (discountPct || 0) / 100)
}

export function fmtMoney(n: number): string {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtMoney0(n: number): string {
  return '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function computePaymentStatus(total: number, paid: number): 'paid' | 'partial' | 'unpaid' {
  if (paid >= total && total > 0) return 'paid'
  if (paid > 0) return 'partial'
  return 'unpaid'
}
