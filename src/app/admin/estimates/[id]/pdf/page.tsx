'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { totalsOf, fmtMoney, fmtMoney0 } from '@/lib/money'
import StatusPill from '@/components/StatusPill'

export default function PDFPreview() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null)
  const [tenant, setTenant] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/estimates/${id}`).then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
    ]).then(([d, t]) => { setDoc(d); setTenant(t) })
  }, [id])

  if (!doc || !tenant) return <div style={{ padding: 40, color: 'var(--ink-3)' }}>Loading…</div>

  const lineItems = doc.lineItems as Record<string, unknown>[] || []
  const payments = doc.payments as Record<string, unknown>[] || []
  const milestones = doc.milestones as Record<string, unknown>[] || []
  const t = totalsOf({
    lineItems: lineItems.map(li => ({ qty: li.qty as number, unit_price: li.unitPrice as number, discount_pct: li.discountPct as number })),
    discount_amt: doc.discountAmt as number,
    markup_rate: doc.markupRate as number,
    tax_rate: doc.taxRate as number,
    payments: payments.map(p => ({ amount: p.amount as number })),
  })
  const themeColor = tenant.themeColor as string || '#185FA5'

  return (
    <div style={{ background: '#E5E5E3', minHeight: '100vh', padding: '20px 40px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: 'var(--surface)', padding: '10px 16px', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>← Back</button>
        <span style={{ fontWeight: 600, fontSize: 13.5, flex: 1 }}>{doc.documentNumber as string}.pdf</span>
        <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>Print</button>
      </div>

      {/* Document */}
      <div style={{ maxWidth: 820, margin: '0 auto', background: '#fff', boxShadow: '0 4px 40px rgba(0,0,0,.15)', borderRadius: 4 }}>
        {/* Header */}
        <div style={{ background: themeColor, color: '#fff', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{tenant.businessName as string}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{tenant.address as string}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>{tenant.phone as string} · {tenant.website as string}</div>
            {!!tenant.license && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{tenant.license as string}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>{(doc.documentType as string).toUpperCase()}</div>
            <div style={{ fontSize: 16, fontFamily: 'DM Mono, monospace', marginTop: 4 }}>{doc.documentNumber as string}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>Issued: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>

        <div style={{ padding: '28px 36px' }}>
          {/* Bill to / Project */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#666', marginBottom: 6 }}>Bill to</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{doc.clientBizName as string || doc.clientName as string}</div>
              {!!doc.clientBizName && <div style={{ fontSize: 13.5, color: '#444', marginTop: 2 }}>{doc.clientName as string}</div>}
              <div style={{ fontSize: 13, color: '#666' }}>{doc.clientEmail as string}</div>
              {!!doc.clientPhone && <div style={{ fontSize: 13, color: '#666' }}>{doc.clientPhone as string}</div>}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#666', marginBottom: 6 }}>Project</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{doc.projectName as string}</div>
              <div style={{ fontSize: 13, color: '#444', marginTop: 2 }}>{doc.projectType as string}</div>
              {!!doc.projectAddress && <div style={{ fontSize: 13, color: '#666' }}>{doc.projectAddress as string}</div>}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E5E5E3', marginBottom: 20 }} />

          {/* Scope */}
          {!!doc.scopeOfWork && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ borderLeft: `3px solid ${themeColor}`, paddingLeft: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: themeColor, marginBottom: 6 }}>Scope of work</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#333' }}>{doc.scopeOfWork as string}</div>
              </div>
              {!!(doc.assumptions || doc.exclusions) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                  {!!doc.assumptions && (
                    <div style={{ background: '#F6F8FC', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: 4 }}>Assumptions</div>
                      <div style={{ fontSize: 12.5, color: '#444', lineHeight: 1.5 }}>{doc.assumptions as string}</div>
                    </div>
                  )}
                  {!!doc.exclusions && (
                    <div style={{ background: '#FBE7E5', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#B23A2E', marginBottom: 4 }}>Exclusions</div>
                      <div style={{ fontSize: 12.5, color: '#444', lineHeight: 1.5 }}>{doc.exclusions as string}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #E5E5E3', marginBottom: 20 }} />

          {/* Line items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr style={{ background: themeColor, color: '#fff' }}>
                <th style={{ textAlign: 'left', padding: '9px 12px', fontSize: 11.5, fontWeight: 600 }}>Description</th>
                <th style={{ width: 60, textAlign: 'right', padding: '9px 8px', fontSize: 11.5, fontWeight: 600 }}>Qty</th>
                <th style={{ width: 56, textAlign: 'left', padding: '9px 8px', fontSize: 11.5, fontWeight: 600 }}>Unit</th>
                <th style={{ width: 90, textAlign: 'right', padding: '9px 8px', fontSize: 11.5, fontWeight: 600 }}>Rate</th>
                <th style={{ width: 100, textAlign: 'right', padding: '9px 12px', fontSize: 11.5, fontWeight: 600 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i} style={{ background: i % 2 ? '#fff' : '#FAFAF9' }}>
                  <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid #EDEDED' }}>
                    <div>{li.description as string}</div>
                    {!!li.category && <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{li.category as string}</div>}
                  </td>
                  <td style={{ padding: '9px 8px', textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #EDEDED' }}>{li.qty as number}</td>
                  <td style={{ padding: '9px 8px', fontSize: 13, color: '#666', borderBottom: '1px solid #EDEDED' }}>{li.unit as string}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #EDEDED' }}>{fmtMoney(li.unitPrice as number)}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontSize: 13, fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #EDEDED' }}>{fmtMoney(li.lineTotal as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <div style={{ width: 260 }}>
              {[
                { label: 'Subtotal', val: t.subtotal },
                t.discount > 0 ? { label: 'Discount', val: -t.discount } : null,
                t.markup > 0 ? { label: `Markup (${doc.markupRate}%)`, val: t.markup } : null,
                t.tax > 0 ? { label: `Tax (${doc.taxRate}%)`, val: t.tax } : null,
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>{row!.label}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{row!.val! < 0 ? '−' : ''}{fmtMoney(Math.abs(row!.val!))}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #333', marginTop: 8, paddingTop: 10 }}>
                <span style={{ fontWeight: 700 }}>Total due</span>
                <span style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: themeColor }}>{fmtMoney(t.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {!!doc.notes && (
            <div style={{ marginBottom: 24, padding: '12px 14px', background: '#F9F9F8', borderRadius: 8, fontSize: 13, color: '#444' }}>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>Notes</div>
              {doc.notes as string}
            </div>
          )}

          {/* Acceptance */}
          <div style={{ border: '1px solid #E5E5E3', borderRadius: 10, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13.5 }}>Client acceptance</div>
            <div style={{ fontSize: 12.5, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>
              By signing below, client authorizes {tenant.businessName as string} to proceed with the scope of work described herein. This agreement constitutes a binding contract.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ borderBottom: '1px solid #999', height: 44, marginBottom: 6, display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                  {doc.approvedByName ? <span style={{ fontSize: 15, fontStyle: 'italic' }}>{doc.approvedByName as string}</span> : null}
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>Client signature</div>
              </div>
              <div>
                <div style={{ borderBottom: '1px solid #999', height: 44, marginBottom: 6, display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                  {doc.dateApproved ? <span style={{ fontSize: 13 }}>{doc.dateApproved as string}</span> : null}
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>Date</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: 11, color: '#999', borderTop: '1px solid #E5E5E3', paddingTop: 14 }}>
            {tenant.license as string} · {tenant.website as string} · Page 1 of 1
          </div>
        </div>
      </div>
    </div>
  )
}
