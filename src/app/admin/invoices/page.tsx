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
  amountPaid: number
  amountDue: number
  createdAt: string
}

export default function InvoicesPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/estimates?type=invoice')
      .then(r => r.json())
      .then(data => { setDocs(data); setLoading(false) })
  }, [])

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Invoices</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Project</th>
              <th>Client</th>
              <th>Total</th>
              <th>Balance due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-3)' }}>Loading…</td></tr>}
            {!loading && docs.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-3)' }}>No invoices yet</td></tr>}
            {docs.map(doc => (
              <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/estimates/${doc.id}`)}>
                <td><span className="mono" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{doc.documentNumber}</span></td>
                <td style={{ fontWeight: 500 }}>{doc.projectName || '—'}</td>
                <td style={{ color: 'var(--ink-2)' }}>{doc.clientBizName || doc.clientName || '—'}</td>
                <td className="mono">{fmtMoney(doc.total)}</td>
                <td className="mono" style={{ fontWeight: doc.amountDue > 0 ? 600 : 400, color: doc.amountDue > 0 ? '#9A5B0B' : 'var(--ink-2)' }}>{fmtMoney(doc.amountDue)}</td>
                <td><StatusPill status={doc.status} /></td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/estimates/${doc.id}`)}>Edit</button>
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
