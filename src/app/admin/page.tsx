'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fmtMoney0 } from '@/lib/money'

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface AttentionItem { label: string; sub: string; href: string; urgent?: boolean }

interface Overview {
  pendingCount: number
  activeCount: number
  outstanding: number
  collected: number
  recentProjects: Array<{
    id: string
    clientName: string
    projectType: string
    status: string
    startDate: string | null
    estimates?: Array<{ status: string; total: number; documentNumber: string; id: string }>
  }>
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  pending_review: { bg: '#FFF3E0', fg: '#E65100', label: 'Pending' },
  active: { bg: '#E8F5E9', fg: '#2E7D32', label: 'Active' },
  complete: { bg: '#E3F2FD', fg: '#1565C0', label: 'Complete' },
  awaiting_approval: { bg: '#E3F2FD', fg: '#1565C0', label: 'Awaiting approval' },
  draft: { bg: '#F5F5F5', fg: '#616161', label: 'Draft' },
  sent: { bg: '#E3F2FD', fg: '#1565C0', label: 'Sent' },
  approved: { bg: '#E8F5E9', fg: '#2E7D32', label: 'Approved' },
  converted: { bg: '#F3E5F5', fg: '#6A1B9A', label: 'Converted' },
  overdue: { bg: '#FFEBEE', fg: '#C62828', label: 'Overdue' },
  paid: { bg: '#E8F5E9', fg: '#2E7D32', label: 'Paid' },
  unpaid: { bg: '#FFF8E1', fg: '#F57F17', label: 'Unpaid' },
  partial: { bg: '#FFF3E0', fg: '#E65100', label: 'Partial' },
  void: { bg: '#ECEFF1', fg: '#546E7A', label: 'Void' },
}

function Pill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || { bg: '#EFEFEE', fg: '#6B6B66', label: status }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, background: s.bg, color: s.fg, fontSize: 12, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.fg, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

const STAT_CFG = [
  { key: 'pendingCount', label: 'Pending leads', icon: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', tint: '#FFF3E0', iconColor: '#E65100', href: '/admin/pending', money: false },
  { key: 'activeCount', label: 'Active projects', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', tint: '#E8F5E9', iconColor: '#2E7D32', href: '/admin/active', money: false },
  { key: 'outstanding', label: 'Outstanding', icon: 'M4 3h16v18l-3-2-2 2-3-2-3 2-2-2-3 2V3Zm4 5h8M8 12h8M8 16h5', tint: '#FFF8E1', iconColor: '#F57F17', href: '/admin/invoices', money: true },
  { key: 'collected', label: 'Collected (YTD)', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', tint: '#E3F2FD', iconColor: '#1565C0', href: '/admin/invoices', money: true },
]

function StatIcon({ d }: { d: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((seg, i) => <path key={i} d={(i === 0 ? '' : 'M') + seg} />)}
    </svg>
  )
}

export default function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null)
  const [attention, setAttention] = useState<AttentionItem[]>([])

  useEffect(() => {
    fetch('/api/admin/overview').then(r => r.json()).then((d: Overview) => {
      setData(d)
      const items: AttentionItem[] = []
      for (const p of d.recentProjects || []) {
        const est = p.estimates?.[0]
        if (est?.status === 'overdue') {
          items.push({ label: `Invoice overdue — ${p.clientName}`, sub: fmtMoney0(est.total), href: `/admin/estimates/${est.id}`, urgent: true })
        } else if (est?.status === 'sent' || est?.status === 'viewed') {
          items.push({ label: `Awaiting approval — ${p.clientName}`, sub: est.documentNumber, href: `/admin/estimates/${est.id}` })
        } else if (p.status === 'active' && !p.startDate) {
          items.push({ label: `No start date — ${p.clientName}`, sub: p.projectType || 'Project', href: '/admin/active' })
        }
      }
      setAttention(items.slice(0, 5))
    }).catch(() => {})
  }, [])

  const statValues: Record<string, number> = { pendingCount: data?.pendingCount ?? 0, activeCount: data?.activeCount ?? 0, outstanding: data?.outstanding ?? 0, collected: data?.collected ?? 0 }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1040 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.02em' }}>Overview</h1>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {STAT_CFG.map(s => (
          <Link key={s.key} href={s.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: s.tint, color: s.iconColor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <StatIcon d={s.icon} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {!data ? '—' : s.money ? fmtMoney0(statValues[s.key]) : statValues[s.key]}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: attention.length ? '1fr 310px' : '1fr', gap: 18, alignItems: 'start' }}>
        {/* Recent projects */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Recent projects</span>
            <Link href="/admin/active" style={{ fontSize: 12.5, color: 'var(--theme)', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
          </div>
          {!data ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
          ) : !data.recentProjects?.length ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No projects yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Client', 'Type', 'Status', 'Start'].map(h => (
                    <th key={h} style={{ padding: '8px 18px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentProjects.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < data.recentProjects.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '11px 18px', fontWeight: 600 }}>{p.clientName}</td>
                    <td style={{ padding: '11px 18px', color: 'var(--ink-2)' }}>{p.projectType || '—'}</td>
                    <td style={{ padding: '11px 18px' }}><Pill status={p.status} /></td>
                    <td style={{ padding: '11px 18px', color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{fmtDate(p.startDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Needs attention */}
        {attention.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Needs attention</span>
            </div>
            <div style={{ padding: '6px 0' }}>
              {attention.map((item, i) => (
                <Link key={i} href={item.href} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '10px 14px', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: item.urgent ? '#FFEBEE' : '#FFF8E1', color: item.urgent ? '#C62828' : '#F57F17', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{item.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{item.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
