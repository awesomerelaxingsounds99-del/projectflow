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
  archived: boolean
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
  const [showNew, setShowNew] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
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
      body: JSON.stringify({ projectType: template?.projectType || '', lineItems: items }),
    })
    const est = await res.json()
    setShowNew(false)
    router.push(`/admin/estimates/${est.id}`)
  }

  async function toggleArchive(doc: Doc, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/admin/estimates/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !doc.archived }),
    })
    setDocs(ds => ds.map(d => d.id === doc.id ? { ...d, archived: !d.archived } : d))
  }

  const visible = docs.filter(d => showArchived ? d.archived : !d.archived)

  const archivedCount = docs.filter(d => d.archived).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title">Estimates</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {archivedCount > 0 && (
            <button onClick={() => setShowArchived(!showArchived)} className="btn btn-ghost" style={{ fontSize: 13 }}>
              {showArchived ? 'Show active' : `Archived (${archivedCount})`}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New estimate
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Client</th>
              <th>Project</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-3)' }}>Loading…</td></tr>}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-3)' }}>
                {showArchived ? 'No archived estimates' : 'No estimates yet'}
              </td></tr>
            )}
            {visible.map(doc => (
              <tr key={doc.id} style={{ cursor: 'pointer', opacity: doc.archived ? 0.6 : 1 }} onClick={() => router.push(`/admin/estimates/${doc.id}`)}>
                <td><span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>{doc.documentNumber}</span></td>
                <td style={{ fontWeight: 600 }}>{doc.clientBizName || doc.clientName || '—'}</td>
                <td style={{ color: 'var(--ink-2)' }}>{doc.projectName || '—'}</td>
                <td style={{ fontFamily: 'var(--mono)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(doc.total)}</td>
                <td><StatusPill status={doc.status} /></td>
                <td style={{ color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{doc.createdAt.slice(0, 10)}</td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/estimates/${doc.id}`)}>Edit</button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => toggleArchive(doc, e)}
                      title={doc.archived ? 'Restore' : 'Archive'}
                      style={{ padding: '5px 7px' }}
                    >
                      {doc.archived ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" /></svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New estimate modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowNew(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 0, width: 420, boxShadow: '0 12px 48px rgba(0,0,0,.2)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>New estimate</span>
              <button onClick={() => setShowNew(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, borderRadius: 6, display: 'inline-flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 14 }}>Start from a template or create a blank estimate.</p>
              <div style={{ display: 'grid', gap: 8 }}>
                <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 14px', gap: 12 }} onClick={() => createEstimate()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>Blank estimate</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Start with one empty line item</div>
                  </div>
                </button>
                {templates.map(t => (
                  <button key={t.id} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 14px', gap: 12 }} onClick={() => createEstimate(t.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
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
