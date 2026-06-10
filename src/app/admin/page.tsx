'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatusPill from '@/components/StatusPill'
import { fmtMoney0 } from '@/lib/money'

interface Overview {
  pendingCount: number
  activeCount: number
  outstanding: number
  collected: number
  recentProjects: Project[]
}

interface Project {
  id: string
  projectName: string
  clientName: string
  status: string
  createdAt: string
}

export default function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null)

  useEffect(() => {
    fetch('/api/admin/overview').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div style={{ color: 'var(--ink-3)', padding: 40 }}>Loading…</div>

  const stats = [
    { label: 'Pending review', value: data.pendingCount, href: '/admin/pending', color: '#9A5B0B' },
    { label: 'Active projects', value: data.activeCount, href: '/admin/active', color: '#1B5C9B' },
    { label: 'Outstanding', value: fmtMoney0(data.outstanding), href: '/admin/invoices', color: '#A4541A' },
    { label: 'Collected', value: fmtMoney0(data.collected), href: '/admin/invoices', color: '#0B6E4F' },
  ]

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Overview</h1>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent projects */}
      <div>
        <h2 className="section-title">Recent Projects</h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {data.recentProjects.length === 0 && (
                <tr><td colSpan={4} style={{ color: 'var(--ink-3)', textAlign: 'center', padding: 24 }}>No projects yet</td></tr>
              )}
              {data.recentProjects.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.projectName}</td>
                  <td style={{ color: 'var(--ink-2)' }}>{p.clientName}</td>
                  <td><StatusPill status={p.status} /></td>
                  <td style={{ color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{p.createdAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
