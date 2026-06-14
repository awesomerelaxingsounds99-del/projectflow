'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusPill from '@/components/StatusPill'

interface Project {
  id: string
  clientName: string
  clientEmail: string
  projectType: string
  status: string
  startDate: string | null
  estimates?: Array<{ id: string; documentNumber: string; status: string; total: number; documentType: string }>
}

function Confirm({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onCancel}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Are you sure?</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 13.5, fontWeight: 500 }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#C62828', color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default function ActivePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStart, setEditingStart] = useState<string | null>(null)
  const [dateVal, setDateVal] = useState('')
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    fetch('/api/admin/projects?status=active')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false) })
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2600)
  }

  async function saveStartDate(id: string) {
    await fetch(`/api/admin/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: dateVal }),
    })
    setProjects(ps => ps.map(p => p.id === id ? { ...p, startDate: dateVal } : p))
    setEditingStart(null)
  }

  async function sendInvoice(project: Project) {
    const est = project.estimates?.find(e => e.documentType === 'estimate' && e.status === 'approved')
    if (est) {
      const res = await fetch(`/api/admin/estimates/${est.id}/convert`, { method: 'POST' })
      const inv = await res.json()
      router.push(`/admin/estimates/${inv.id}`)
      return
    }
    const existingInv = project.estimates?.find(e => e.documentType === 'invoice')
    if (existingInv) {
      router.push(`/admin/estimates/${existingInv.id}`)
      return
    }
    const res = await fetch('/api/admin/estimates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, type: 'invoice' }),
    })
    const inv = await res.json()
    router.push(`/admin/estimates/${inv.id}`)
  }

  async function cancelProject(id: string) {
    await fetch(`/api/admin/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    setProjects(ps => ps.filter(p => p.id !== id))
    setConfirmCancel(null)
    showToast('Project cancelled')
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Active Projects</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Starts</th>
              <th>Client</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ color: 'var(--ink-3)', textAlign: 'center', padding: 24 }}>Loading…</td></tr>}
            {!loading && projects.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--ink-3)', textAlign: 'center', padding: 32 }}>No active projects</td></tr>
            )}
            {projects.map(p => {
              const estimate = p.estimates?.find(e => e.documentType === 'estimate')
              const invoice = p.estimates?.find(e => e.documentType === 'invoice')
              return (
                <tr key={p.id}>
                  <td style={{ minWidth: 140 }}>
                    {editingStart === p.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input className="input" type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} style={{ width: 120, padding: '4px 6px', fontSize: 12 }} />
                        <button className="btn btn-primary btn-sm" onClick={() => saveStartDate(p.id)}>✓</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingStart(null)}>✕</button>
                      </div>
                    ) : p.startDate ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12.5, background: 'var(--theme-tint-8)', color: 'var(--theme-ink)', padding: '3px 8px', borderRadius: 6, fontVariantNumeric: 'tabular-nums' }}>{p.startDate.slice(0, 10)}</span>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px' }} onClick={() => { setEditingStart(p.id); setDateVal(p.startDate || '') }} title="Edit date">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ color: '#E65100', fontSize: 12 }} onClick={() => { setEditingStart(p.id); setDateVal('') }}>
                        Set start date
                      </button>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.clientName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.clientEmail}</div>
                  </td>
                  <td style={{ color: 'var(--ink-2)' }}>{p.projectType || '—'}</td>
                  <td><StatusPill status={p.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {estimate && (
                        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/estimates/${estimate.id}`)}>Estimate</button>
                      )}
                      {invoice ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/estimates/${invoice.id}`)}>Invoice</button>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => sendInvoice(p)} title="Create invoice">Send invoice</button>
                      )}
                      <button onClick={() => setConfirmCancel(p.id)} style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} title="Cancel project">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {confirmCancel && (
        <Confirm
          message="This will cancel the project and remove it from active. This action cannot be undone."
          onConfirm={() => cancelProject(confirmCancel)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1C1C1A', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, zIndex: 80 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
