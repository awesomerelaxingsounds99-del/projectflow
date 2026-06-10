'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusPill from '@/components/StatusPill'

interface Project {
  id: string
  projectName: string
  clientName: string
  clientEmail: string
  status: string
  startDate: string | null
  gcalSynced: boolean
  gcalLink: string | null
  estimateId: string | null
}

export default function ActivePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStart, setEditingStart] = useState<string | null>(null)
  const [dateVal, setDateVal] = useState('')

  useEffect(() => {
    fetch('/api/admin/projects?status=active')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false) })
  }, [])

  async function saveStartDate(id: string) {
    await fetch(`/api/admin/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: dateVal }),
    })
    setProjects(ps => ps.map(p => p.id === id ? { ...p, startDate: dateVal } : p))
    setEditingStart(null)
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Active Projects</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Starts</th>
              <th>Project</th>
              <th>Client</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ color: 'var(--ink-3)', textAlign: 'center', padding: 24 }}>Loading…</td></tr>}
            {!loading && projects.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--ink-3)', textAlign: 'center', padding: 24 }}>No active projects</td></tr>
            )}
            {projects.map(p => (
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
                      <span style={{ fontSize: 12.5, background: '#E6EEF8', color: '#1B5C9B', padding: '3px 8px', borderRadius: 6, fontVariantNumeric: 'tabular-nums' }}>{p.startDate}</span>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px' }} onClick={() => { setEditingStart(p.id); setDateVal(p.startDate || '') }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm" style={{ color: '#A4541A' }} onClick={() => { setEditingStart(p.id); setDateVal('') }}>
                      Set start date
                    </button>
                  )}
                </td>
                <td style={{ fontWeight: 500 }}>{p.projectName}</td>
                <td>
                  <div>{p.clientName}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.clientEmail}</div>
                </td>
                <td><StatusPill status={p.status} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {p.estimateId && (
                      <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/estimates/${p.estimateId}`)}>Open</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
