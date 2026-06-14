'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import StatusPill, { getStatusColor } from '@/components/StatusPill'
import { totalsOf, fmtMoney, fmtMoney0, lineTotal } from '@/lib/money'

interface LineItem {
  id?: string
  description: string
  qty: number
  unit: string
  unitPrice: number
  discountPct: number
  lineTotal: number
  category: string
  sortOrder?: number
}

interface Milestone {
  id?: string
  label: string
  description: string
  amount: number
  amountBilled: number
  dueDate?: string
  status: string
  sortOrder?: number
}

interface Payment {
  id: string
  amount: number
  method: string
  reference: string
  note: string
  paidAt: string
  recordedByName: string
}

interface Estimate {
  id: string
  documentType: string
  documentNumber: string
  status: string
  clientBizName: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientType: string
  projectName: string
  projectAddress: string
  projectType: string
  scopeOfWork: string
  assumptions: string
  exclusions: string
  discountAmt: number
  markupRate: number
  taxRate: number
  notes: string
  total: number
  amountPaid: number
  amountDue: number
  paymentMethods: string
  approvedByName: string
  createdByName: string
  sentByName: string
  dateSent: string | null
  dateViewed: string | null
  dateApproved: string | null
  paidAt: string | null
  revisionNumber: number
  lineItems: LineItem[]
  milestones: Milestone[]
  payments: Payment[]
  attachments: { id: string; filename: string; sizeBytes: number }[]
  activity: { id: string; eventType: string; actorName: string; actorType: string; description: string; createdAt: string }[]
}

const STATUS_PRESETS = [
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Awaiting approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'partial', label: 'Partially paid' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
]

function Section({ title, sub, right, children, noPad }: { title?: string; sub?: string; right?: React.ReactNode; children: React.ReactNode; noPad?: boolean }) {
  return (
    <section className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
            {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 1 }}>{sub}</div>}
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: noPad ? 0 : 14 }}>{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

const PM_LABELS: Record<string, string> = {
  check: 'Check',
  ach: 'ACH / bank transfer',
  wire: 'Wire transfer',
  card: 'Credit card',
  zelle: 'Zelle',
  venmo: 'Venmo',
  paypal: 'PayPal',
}

export default function EstimateBuilder() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [doc, setDoc] = useState<Estimate | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showSend, setShowSend] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [catalog, setCatalog] = useState<Record<string, unknown>[]>([])
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function showToast(msg: string) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  useEffect(() => {
    fetch(`/api/admin/estimates/${id}`).then(r => r.json()).then(setDoc)
    fetch('/api/admin/catalog').then(r => r.json()).then(setCatalog)
  }, [id])

  const update = useCallback((patch: Partial<Estimate>) => {
    setDoc(d => d ? { ...d, ...patch } : d)
    setDirty(true)
  }, [])

  async function save() {
    if (!doc || !dirty) return
    setSaving(true)
    try {
      const { lineItems, milestones, payments, attachments, activity, ...rest } = doc
      const res = await fetch(`/api/admin/estimates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rest, lineItems, milestones }),
      })
      const updated = await res.json()
      setDoc(updated)
      setDirty(false)
      showToast('Saved')
    } finally {
      setSaving(false)
    }
  }

  async function handleSend(opts: { to: string; cc: string; subject: string; message: string }) {
    await fetch(`/api/admin/estimates/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    })
    setDoc(d => d ? { ...d, status: 'sent' } : d)
    setShowSend(false)
    showToast('Estimate sent')
  }

  async function handleConvert() {
    if (!confirm('Convert this estimate to an invoice?')) return
    const res = await fetch(`/api/admin/estimates/${id}/convert`, { method: 'POST' })
    const inv = await res.json()
    router.push(`/admin/estimates/${inv.id}`)
  }

  async function addPayment(payment: Omit<Payment, 'id' | 'recordedByName'>) {
    const res = await fetch(`/api/admin/estimates/${id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    })
    const updated = await res.json()
    setDoc(updated)
    setShowPayment(false)
    showToast('Payment recorded')
  }

  async function deletePayment(paymentId: string) {
    if (!confirm('Remove this payment?')) return
    await fetch(`/api/admin/estimates/${id}/payment`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    })
    setDoc(d => d ? { ...d, payments: d.payments.filter(p => p.id !== paymentId) } : d)
    showToast('Payment removed')
  }

  if (!doc) return <div style={{ padding: 40, color: 'var(--ink-3)' }}>Loading…</div>

  const t = totalsOf({
    lineItems: doc.lineItems.map(li => ({ qty: li.qty, unit_price: li.unitPrice, discount_pct: li.discountPct })),
    discount_amt: doc.discountAmt,
    markup_rate: doc.markupRate,
    tax_rate: doc.taxRate,
    payments: doc.payments.map(p => ({ amount: p.amount })),
  })

  const isInvoice = doc.documentType === 'invoice'
  const pm = (() => { try { return JSON.parse(doc.paymentMethods || '{}') } catch { return {} } })()
  const sc = getStatusColor(doc.status)

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-2)' }}>{doc.documentNumber}</span>
        <StatusPill status={doc.status} />
        {doc.projectName && <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{doc.projectName}</span>}
        <div style={{ flex: 1 }} />
        {dirty && (
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        )}
        {!dirty && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>All saved</span>}
        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/estimates/${id}/pdf`)}>
          Preview PDF
        </button>
        {!isInvoice && doc.status !== 'converted' && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSend(true)}>
            Send to client
          </button>
        )}
        {!isInvoice && doc.status === 'approved' && (
          <button className="btn btn-primary btn-sm" onClick={handleConvert}>
            Convert → Invoice
          </button>
        )}
        {isInvoice && doc.status !== 'paid' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowPayment(true)}>
            Record payment
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14, alignItems: 'start' }}>
        {/* LEFT column */}
        <div>
          {/* Company / bill-to */}
          <Section title="Bill to">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Business name"><input className="input" value={doc.clientBizName} onChange={e => update({ clientBizName: e.target.value })} /></Field>
              <Field label="Contact name"><input className="input" value={doc.clientName} onChange={e => update({ clientName: e.target.value })} /></Field>
              <Field label="Email"><input className="input" type="email" value={doc.clientEmail} onChange={e => update({ clientEmail: e.target.value })} /></Field>
              <Field label="Phone"><input className="input" value={doc.clientPhone} onChange={e => update({ clientPhone: e.target.value })} /></Field>
            </div>
          </Section>

          {/* Project info */}
          <Section title="Project">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Project name"><input className="input" value={doc.projectName} onChange={e => update({ projectName: e.target.value })} /></Field>
              <Field label="Project type"><input className="input" value={doc.projectType} onChange={e => update({ projectType: e.target.value })} /></Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Project address"><input className="input" value={doc.projectAddress} onChange={e => update({ projectAddress: e.target.value })} /></Field>
              </div>
            </div>
          </Section>

          {/* Scope */}
          <Section title="Scope of work">
            <Field label="Scope of work">
              <textarea className="input" value={doc.scopeOfWork} onChange={e => update({ scopeOfWork: e.target.value })} rows={4} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <Field label="Assumptions">
                <textarea className="input" value={doc.assumptions} onChange={e => update({ assumptions: e.target.value })} rows={3} />
              </Field>
              <Field label="Exclusions">
                <textarea className="input" value={doc.exclusions} onChange={e => update({ exclusions: e.target.value })} rows={3} />
              </Field>
            </div>
          </Section>

          {/* Line items */}
          <Section
            title="Line items"
            sub="Every cell is editable. Totals recalculate as you type."
            noPad
            right={
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowCatalog(true)}>From catalog</button>
                <button className="btn btn-primary btn-sm" onClick={() => update({ lineItems: [...doc.lineItems, { description: '', qty: 1, unit: 'ea', unitPrice: 0, discountPct: 0, lineTotal: 0, category: 'MEP' }] })}>+ Add line</button>
              </div>
            }
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {['Description', 'Qty', 'Unit', 'Rate', 'Disc%', 'Amount', ''].map((h, i) => (
                      <th key={i} style={{ textAlign: i >= 1 && i <= 5 ? 'right' : 'left', padding: '8px 8px', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doc.lineItems.map((li, i) => (
                    <tr key={i} style={{ background: i % 2 ? 'var(--surface)' : '#FCFCFB' }}>
                      <td style={{ padding: '3px 6px', borderBottom: '1px solid var(--border)', minWidth: 200 }}>
                        <input value={li.description} placeholder="Service description" onChange={e => { const items = [...doc.lineItems]; items[i] = { ...items[i], description: e.target.value }; update({ lineItems: items }) }} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: 'var(--ink)' }} />
                        <input value={li.category || ''} placeholder="Category" onChange={e => { const items = [...doc.lineItems]; items[i] = { ...items[i], category: e.target.value }; update({ lineItems: items }) }} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 11, color: 'var(--ink-3)', outline: 'none', fontFamily: 'inherit' }} />
                      </td>
                      <td style={{ borderBottom: '1px solid var(--border)', width: 60 }}>
                        <input type="number" value={li.qty} onChange={e => { const items = [...doc.lineItems]; const v = parseFloat(e.target.value) || 0; items[i] = { ...items[i], qty: v, lineTotal: lineTotal(v, items[i].unitPrice, items[i].discountPct) }; update({ lineItems: items }) }} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'right', fontSize: 13, outline: 'none', fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit', padding: '3px 6px' }} />
                      </td>
                      <td style={{ borderBottom: '1px solid var(--border)', width: 56 }}>
                        <input value={li.unit} onChange={e => { const items = [...doc.lineItems]; items[i] = { ...items[i], unit: e.target.value }; update({ lineItems: items }) }} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, outline: 'none', fontFamily: 'inherit', padding: '3px 6px', textAlign: 'right' }} />
                      </td>
                      <td style={{ borderBottom: '1px solid var(--border)', width: 90 }}>
                        <input type="number" value={li.unitPrice} onChange={e => { const items = [...doc.lineItems]; const v = parseFloat(e.target.value) || 0; items[i] = { ...items[i], unitPrice: v, lineTotal: lineTotal(items[i].qty, v, items[i].discountPct) }; update({ lineItems: items }) }} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'right', fontSize: 13, outline: 'none', fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit', padding: '3px 6px' }} />
                      </td>
                      <td style={{ borderBottom: '1px solid var(--border)', width: 60 }}>
                        <input type="number" value={li.discountPct} onChange={e => { const items = [...doc.lineItems]; const v = parseFloat(e.target.value) || 0; items[i] = { ...items[i], discountPct: v, lineTotal: lineTotal(items[i].qty, items[i].unitPrice, v) }; update({ lineItems: items }) }} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'right', fontSize: 13, outline: 'none', fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit', padding: '3px 6px' }} />
                      </td>
                      <td style={{ borderBottom: '1px solid var(--border)', width: 100, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: 13, padding: '3px 8px' }}>{fmtMoney(li.lineTotal)}</td>
                      <td style={{ borderBottom: '1px solid var(--border)', width: 32, textAlign: 'center' }}>
                        <button onClick={() => update({ lineItems: doc.lineItems.filter((_, j) => j !== i) })} style={{ border: 'none', background: 'transparent', color: 'var(--ink-3)', padding: 4, borderRadius: 5, cursor: 'pointer', display: 'inline-flex' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {doc.lineItems.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No line items yet. Add your first service line above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Notes & attachments side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <section className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Notes to client</span>
              </div>
              <div style={{ padding: 14 }}>
                <textarea className="input" value={doc.notes} onChange={e => update({ notes: e.target.value })} rows={4} placeholder="Visible to the client on the document…" style={{ width: '100%' }} />
              </div>
            </section>
            <section className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Attachments</span>
              </div>
              <div style={{ padding: 14 }}>
                {doc.attachments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--ink-3)', fontSize: 12.5 }}>
                    No attachments
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {doc.attachments.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ink-3)', flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6"/></svg>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.filename}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{Math.round(a.sizeBytes / 1024)}KB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Activity log */}
          <Section title="Activity log">
            {doc.activity.length === 0 && <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>No activity yet.</p>}
            {doc.activity.map(act => (
              <div key={act.id} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: act.actorType === 'client' ? '#0B6E4F' : 'var(--theme)', marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink)' }}>{act.description}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{act.actorName} · {act.createdAt.slice(0, 16).replace('T', ' ')}</div>
                </div>
              </div>
            ))}
          </Section>
        </div>

        {/* RIGHT rail */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Status banner */}
          <section className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', background: sc.bg, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: sc.fg, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: sc.fg, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{sc.label}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {STATUS_PRESETS.map(p => {
                  const ps = getStatusColor(p.key)
                  const on = doc.status === p.key
                  return (
                    <button key={p.key} onClick={() => update({ status: p.key })} style={{
                      border: on ? `1.5px solid ${ps.fg}` : '1px solid rgba(0,0,0,.12)',
                      background: on ? ps.bg : 'rgba(255,255,255,.65)', color: on ? ps.fg : 'rgba(0,0,0,.55)',
                      borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}>{p.label}</button>
                  )
                })}
              </div>
            </div>
            {!isInvoice && doc.status !== 'approved' && (
              <div style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 4 }}>Approval link</div>
                <code style={{ fontSize: 11, wordBreak: 'break-all', color: 'var(--ink-2)' }}>/approve/{doc.documentNumber}</code>
              </div>
            )}
            {doc.status === 'approved' && (
              <div style={{ padding: '10px 14px', background: '#E8F5E9' }}>
                <div style={{ fontSize: 12, color: '#2E7D32', fontWeight: 600 }}>
                  ✓ Approved{doc.approvedByName ? ` by ${doc.approvedByName}` : ''}
                </div>
              </div>
            )}
          </section>

          {/* Tax & totals */}
          <section className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Tax & adjustments</span>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label className="label">Discount $</label>
                  <input className="input" style={{ fontFamily: 'var(--mono)' }} type="number" value={doc.discountAmt} onChange={e => update({ discountAmt: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="label">Markup %</label>
                  <input className="input" style={{ fontFamily: 'var(--mono)' }} type="number" value={doc.markupRate} onChange={e => update({ markupRate: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="label">Tax %</label>
                  <input className="input" style={{ fontFamily: 'var(--mono)' }} type="number" value={doc.taxRate} onChange={e => update({ taxRate: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              {/* Totals box */}
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                {[
                  { label: 'Subtotal', val: t.subtotal },
                  t.discount > 0 ? { label: 'Discount', val: -t.discount } : null,
                  t.markup > 0 ? { label: `Markup (${doc.markupRate}%)`, val: t.markup } : null,
                  t.tax > 0 ? { label: `Tax (${doc.taxRate}%)`, val: t.tax } : null,
                ].filter(Boolean).map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-2)' }}>{row!.label}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: (row!.val ?? 0) < 0 ? '#B23A2E' : 'var(--ink)' }}>{(row!.val ?? 0) < 0 ? '−' : ''}{fmtMoney(Math.abs(row!.val ?? 0))}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{fmtMoney(t.total)}</span>
                </div>
                {t.paid > 0 && (
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-3)' }}>
                      <span>Paid to date</span><span>−{fmtMoney(t.paid)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: t.due > 0 ? '#E65100' : '#2E7D32', marginTop: 3 }}>
                      <span>Balance due</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(t.due)}</span>
                    </div>
                    {t.total > 0 && (
                      <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (t.paid / t.total) * 100)}%`, height: '100%', background: '#2E7D32', borderRadius: 999 }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Payments received (invoices) */}
          {isInvoice && (
            <section className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Payments received</span>
                <button className="btn btn-primary btn-sm" onClick={() => setShowPayment(true)}>+ Record</button>
              </div>
              <div style={{ padding: 14 }}>
                {doc.payments.length === 0 && <p style={{ color: 'var(--ink-3)', fontSize: 12.5, margin: 0 }}>No payments yet.</p>}
                {doc.payments.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(p.amount)}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{p.method} · {p.paidAt}{p.reference && ` · ${p.reference}`}</div>
                    </div>
                    <button onClick={() => deletePayment(p.id)} style={{ border: 'none', background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', padding: 3, display: 'inline-flex', borderRadius: 5 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Milestones */}
          {doc.milestones.length > 0 && (
            <section className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Milestones</span>
              </div>
              <div style={{ padding: 14 }}>
                {doc.milestones.map((ms, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < doc.milestones.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{ms.label}</div>
                      {ms.dueDate && <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{ms.dueDate}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: ms.status === 'paid' ? '#2E7D32' : 'var(--ink)' }}>{fmtMoney(ms.amount)}</div>
                      {ms.amountBilled > 0 && ms.amountBilled < ms.amount && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fmtMoney(ms.amountBilled)} billed</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Payment methods */}
          <section className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Payment methods</span>
            </div>
            <div style={{ padding: 14 }}>
              {Object.entries(PM_LABELS).map(([key, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
                  <label style={{ fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={!!pm[key]}
                      onChange={e => {
                        const updated = { ...pm, [key]: e.target.checked }
                        update({ paymentMethods: JSON.stringify(updated) })
                      }}
                    />
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Acceptance / tracking */}
          <section className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Tracking</span>
            </div>
            <div style={{ padding: 14 }}>
              {[
                { label: 'Created by', val: doc.createdByName || '—' },
                { label: 'Sent', val: doc.dateSent?.slice(0, 10) || '—' },
                { label: 'Viewed', val: doc.dateViewed?.slice(0, 10) || '—' },
                { label: 'Approved', val: doc.dateApproved?.slice(0, 10) || '—' },
                { label: 'Paid', val: doc.paidAt?.slice(0, 10) || '—' },
                { label: 'Revision', val: `Rev. ${doc.revisionNumber}` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
                  <span style={{ color: 'var(--ink-3)' }}>{row.label}</span>
                  <span style={{ color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Send modal */}
      {showSend && <SendModal doc={doc} onSend={handleSend} onClose={() => setShowSend(false)} />}

      {/* Payment modal */}
      {showPayment && <PaymentModal onRecord={addPayment} onClose={() => setShowPayment(false)} />}

      {/* Catalog picker */}
      {showCatalog && (
        <CatalogModal
          catalog={catalog}
          onAdd={(picks) => {
            update({ lineItems: [...doc.lineItems, ...picks.map((c: Record<string, unknown>) => ({
              description: c.description as string, qty: 1, unit: c.unit as string,
              unitPrice: c.unitPrice as number, discountPct: 0, lineTotal: c.unitPrice as number, category: c.category as string,
            }))] })
            setShowCatalog(false)
          }}
          onClose={() => setShowCatalog(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function SendModal({ doc, onSend, onClose }: { doc: Estimate; onSend: (opts: { to: string; cc: string; subject: string; message: string }) => void; onClose: () => void }) {
  const [to, setTo] = useState(doc.clientEmail)
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState(`Estimate ${doc.documentNumber} — ${doc.projectName}`)
  const [message, setMessage] = useState('Please review and approve the attached estimate at your earliest convenience.')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Send estimate to client</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field"><label className="label">To</label><input className="input" value={to} onChange={e => setTo(e.target.value)} /></div>
            <div className="field"><label className="label">CC (optional)</label><input className="input" value={cc} onChange={e => setCc(e.target.value)} /></div>
            <div className="field"><label className="label">Subject</label><input className="input" value={subject} onChange={e => setSubject(e.target.value)} /></div>
            <div className="field"><label className="label">Message</label><textarea className="input" value={message} onChange={e => setMessage(e.target.value)} rows={4} /></div>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12.5 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Auto-included</div>
              <div style={{ color: 'var(--ink-2)' }}>Approval link: <code style={{ fontSize: 11 }}>/approve/{doc.documentNumber}</code></div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSend({ to, cc, subject, message })}>Send estimate</button>
        </div>
      </div>
    </div>
  )
}

function PaymentModal({ onRecord, onClose }: { onRecord: (p: Omit<Payment, 'id' | 'recordedByName'>) => void; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('ACH transfer')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Record payment</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><label className="label">Amount ($)</label><input className="input" style={{ fontFamily: 'var(--mono)' }} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
            <div className="field"><label className="label">Date</label><input className="input" type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} /></div>
            <div className="field"><label className="label">Method</label>
              <select className="input" value={method} onChange={e => setMethod(e.target.value)}>
                <option>ACH transfer</option>
                <option>Check</option>
                <option>Credit card</option>
                <option>Stripe online</option>
                <option>Wire transfer</option>
                <option>Zelle</option>
                <option>Other</option>
              </select>
            </div>
            <div className="field"><label className="label">Reference</label><input className="input" value={reference} onChange={e => setReference(e.target.value)} placeholder="Check #, transaction ID…" /></div>
          </div>
          <div className="field" style={{ marginTop: 8 }}><label className="label">Note (optional)</label><input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. 50% deposit" /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!amount} onClick={() => onRecord({ amount: parseFloat(amount), method, reference, note, paidAt })}>Record payment</button>
        </div>
      </div>
    </div>
  )
}

function CatalogModal({ catalog, onAdd, onClose }: { catalog: Record<string, unknown>[]; onAdd: (picks: Record<string, unknown>[]) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Add from service catalog</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ maxHeight: 400, overflowY: 'auto' }}>
          {catalog.length === 0 && <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>No catalog items yet. Add items in Settings → Catalog.</p>}
          {catalog.map((item) => (
            <div key={item.id as string} onClick={() => toggle(item.id as string)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.includes(item.id as string)} onChange={() => toggle(item.id as string)} style={{ marginTop: 3 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{item.description as string}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{item.category as string} · {item.unit as string} · {fmtMoney(item.unitPrice as number)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={selected.length === 0} onClick={() => onAdd(catalog.filter(c => selected.includes(c.id as string)))}>
            Add {selected.length > 0 ? selected.length : ''} item{selected.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
