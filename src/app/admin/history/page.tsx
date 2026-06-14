'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmtMoney0, fmtMoney } from '@/lib/money'

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Project {
  id: string
  clientName: string
  clientEmail: string
  projectType: string
  status: string
  startDate: string | null
  createdAt: string
  estimates?: Array<{ id: string; documentNumber: string; total: number; amountPaid: number; documentType: string; status: string }>
}

export default function HistoryPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/projects?status=complete')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false) })
  }, [])

  const totalCollected = projects.reduce((sum, p) => {
    const invoices = p.estimates?.filter(e => e.documentType === 'invoice') || []
    return sum + invoices.reduce((s, e) => s + (e.amountPaid || 0), 0)
  }, 0)

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>History</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 28, maxWidth: 480 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Completed</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{loading ? '—' : projects.length}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Lifetime collected</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{loading ? '—' : fmtMoney0(totalCollected)}</div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Type</th>
              <th>Started</th>
              <th>Completed</th>
              <th>Collected</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-3)' }}>Loading…</td></tr>}
            {!loading && projects.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-3)' }}>
                No completed projects yet. Projects with fully paid invoices will appear here.
              </td></tr>
            )}
            {projects.map(p => {
              const invoices = p.estimates?.filter(e => e.documentType === 'invoice') || []
              const collected = invoices.reduce((s, e) => s + (e.amountPaid || 0), 0)
              const latestInv = invoices[0]
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.clientName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.clientEmail}</div>
                  </td>
                  <td style={{ color: 'var(--ink-2)' }}>{p.projectType || '—'}</td>
                  <td style={{ color: 'var(--ink-3)' }}>{fmtDate(p.startDate)}</td>
                  <td style={{ color: 'var(--ink-3)' }}>{fmtDate(p.createdAt)}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#2E7D32' }}>{fmtMoney(collected)}</td>
                  <td>
                    {latestInv && (
                      <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/estimates/${latestInv.id}`)}>View invoice</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
