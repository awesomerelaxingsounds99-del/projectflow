'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusPill from '@/components/StatusPill'

interface Project {
  id: string
  projectName: string
  description: string
  clientName: string
  clientEmail: string
  clientType: string
  projectType: string
  createdAt: string
}

export default function PendingPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/projects?status=pending')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false) })
  }, [])

  async function handleDecline(id: string) {
    if (!confirm('Decline this project request?')) return
    await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
    setProjects(ps => ps.filter(p => p.id !== id))
  }

  async function handleCreateEstimate(project: Project) {
    const res = await fetch('/api/admin/estimates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: project.id,
        clientBizName: '',
        clientName: project.clientName,
        clientEmail: project.clientEmail,
        clientType: project.clientType,
        projectName: project.projectName,
        projectType: project.projectType,
        lineItems: [{ description: `MEP construction documents — ${project.projectType}`, qty: 1, unit: 'LS', unitPrice: 0, discountPct: 0, lineTotal: 0, category: 'MEP' }],
      }),
    })
    const est = await res.json()
    router.push(`/admin/estimates/${est.id}`)
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Pending Review</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Type</th>
              <th>Submitted</th>
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ color: 'var(--ink-3)', textAlign: 'center', padding: 24 }}>Loading…</td></tr>}
            {!loading && projects.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--ink-3)', textAlign: 'center', padding: 24 }}>No pending projects</td></tr>
            )}
            {projects.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.projectName}</div>
                  {p.description && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                </td>
                <td>
                  <div>{p.clientName}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.clientEmail}</div>
                </td>
                <td style={{ color: 'var(--ink-2)' }}><StatusPill status="pending_review" /></td>
                <td style={{ color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{p.createdAt.slice(0, 10)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDecline(p.id)}>Decline</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleCreateEstimate(p)}>Create estimate</button>
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
