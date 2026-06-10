'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusPill from '@/components/StatusPill'
import { fmtMoney } from '@/lib/money'

interface Doc {
  id: string
  documentNumber: string
  status: string
  clientName: string
  clientBizName: string
  projectName: string
  total: number
  createdAt: string
}

interface Template {
  id: string
  name: string
  description: string
  projectType: string
  items: string
}

export default function EstimatesPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [showNewModal, setShowNewModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/estimates?type=estimate').then(r => r.json()),
      fetch('/api/admin/templates').then(r => r.json()),
    ]).then(([d, t]) => {
      setDocs(d)
      setTemplates(t)
      setLoading(false)
    })
  }, [])

  async function createEstimate(templateId?: string) {
    const template = templateId ? templates.find(t => t.id === templateId) : null
    const catalog = template ? await fetch('/api/admin/catalog').then(r => r.json()) : []
    const items = template
      ? (JSON.parse(template.items) as string[]).map((cid: string, i: number) => {
          const c = catalog.find((x: Record<string, unknown>) => x.id === cid)
          return c ? { description: c.description, qty: 1, unit: c.unit, unitPrice: c.unitPrice, discountPct: 0, lineTotal: c.unitPrice, category: c.category, sortOrder: i } : null
        }).filter(Boolean)
      : [{ description: '', qty: 1, unit: 'ea', unitPrice: 0, discountPct: 0, lineTotal: 0, category: 'MEP', sortOrder: 0 }]

    const res = await fetch('/api/admin/estimates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: template?.projectType || '',
        lineItems: items,
      }),
    })
    const est = await res.json()
    setShowNewModal(false)
    router.push(`/admin/estimates/${est.id}`)
  }

  async function convertToInvoice(id: string) {
    const res = await fetch(`/api/admin/estimates/${id}/convert`, { method: 'POST' })
    const inv = await res.json()
    router.push(`/admin/estimates/${inv.id}`)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title">Estimates</h1>
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New estimate
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Project</th>
              <th>Client</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-3)' }}>Loading…</td></tr>}
            {!loading && docs.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-3)' }}>No estimates yet</td></tr>}
            {docs.map(doc => (
              <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/estimates/${doc.id}`)}>
                <td><span className="mono" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{doc.documentNumber}</span></td>
                <td style={{ fontWeight: 500 }}>{doc.projectName || '—'}</td>
                <td style={{ color: 'var(--ink-2)' }}>{doc.clientBizName || doc.clientName || '—'}</td>
                <td className="mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(doc.total)}</td>
                <td><StatusPill status={doc.status} /></td>
                <td style={{ color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{doc.createdAt.slice(0, 10)}</td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/estimates/${doc.id}`)}>Edit</button>
                    {doc.status === 'approved' && (
                      <button className="btn btn-primary btn-sm" onClick={() => convertToInvoice(doc.id)}>Invoice</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New estimate modal */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>New estimate</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 16 }}>Start from a template or create a blank estimate.</p>
              <div style={{ display: 'grid', gap: 8 }}>
                <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 14px' }} onClick={() => createEstimate()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>Blank estimate</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Start with one empty line item</div>
                  </div>
                </button>
                {templates.map(t => (
                  <button key={t.id} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 14px' }} onClick={() => createEstimate(t.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
