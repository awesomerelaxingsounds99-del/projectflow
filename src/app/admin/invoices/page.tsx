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

function PaymentModal({ doc, onClose, onSave }: { doc: Doc; onClose: () => void; onSave: (amount: number, method: string, note: string) => void }) {
  const [amount, setAmount] = useState(String(doc.amountDue.toFixed(2)))
  const [method, setMethod] = useState('check')
  const [note, setNote] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 0, width: 380, boxShadow: '0 12px 48px rgba(0,0,0,.2)', overflow: 'hidden', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Record payment</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, borderRadius: 6, display: 'inline-flex' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>Invoice {doc.documentNumber} · Balance due {fmtMoney(doc.amountDue)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>Amount</label>
              <input className="input" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>Method</label>
              <select className="input" value={method} onChange={e => setMethod(e.target.value)}>
                {['check', 'cash', 'wire', 'ach', 'zelle', 'card', 'other'].map(m => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>Note (optional)</label>
              <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Check #, ref, etc." />
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={() => onSave(parseFloat(amount) || 0, method, note)} className="btn btn-primary">Record payment</button>
        </div>
      </div>
    </div>
  )
}

function ReminderModal({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const [sent, setSent] = useState(false)
  async function send() {
    await fetch(`/api/admin/estimates/${doc.id}/send`, { method: 'POST' })
    setSent(true)
    setTimeout(onClose, 1400)
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 0, width: 360, boxShadow: '0 12px 48px rgba(0,0,0,.2)', overflow: 'hidden', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Send reminder</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, borderRadius: 6, display: 'inline-flex' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: 20 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '12px 0', color: '#2E7D32', fontWeight: 600 }}>Reminder sent ✓</div>
          ) : (
            <>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 16 }}>
                Send a payment reminder to <strong>{doc.clientBizName || doc.clientName}</strong> for invoice {doc.documentNumber} ({fmtMoney(doc.amountDue)} due).
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={onClose} className="btn btn-ghost">Cancel</button>
                <button onClick={send} className="btn btn-primary">Send reminder</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InvoicesPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [payDoc, setPayDoc] = useState<Doc | null>(null)
  const [reminderDoc, setReminderDoc] = useState<Doc | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/admin/estimates?type=invoice')
      .then(r => r.json())
      .then(data => { setDocs(data); setLoading(false) })
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2600)
  }

  async function recordPayment(amount: number, method: string, note: string) {
    if (!payDoc) return
    const res = await fetch(`/api/admin/estimates/${payDoc.id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, method, note, date: new Date().toISOString().slice(0, 10) }),
    })
    const updated = await res.json()
    setDocs(ds => ds.map(d => d.id === payDoc.id ? { ...d, amountPaid: updated.amountPaid, amountDue: updated.amountDue, status: updated.status } : d))
    setPayDoc(null)
    showToast('Payment recorded')
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Invoices</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Client</th>
              <th>Project</th>
              <th>Total</th>
              <th>Balance due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-3)' }}>Loading…</td></tr>}
            {!loading && docs.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-3)' }}>No invoices yet</td></tr>}
            {docs.map(doc => (
              <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/estimates/${doc.id}`)}>
                <td><span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>{doc.documentNumber}</span></td>
                <td style={{ fontWeight: 600 }}>{doc.clientBizName || doc.clientName || '—'}</td>
                <td style={{ color: 'var(--ink-2)' }}>{doc.projectName || '—'}</td>
                <td style={{ fontFamily: 'var(--mono)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(doc.total)}</td>
                <td style={{ fontFamily: 'var(--mono)', fontVariantNumeric: 'tabular-nums', fontWeight: doc.amountDue > 0 ? 600 : 400, color: doc.amountDue > 0 ? '#E65100' : 'var(--ink-2)' }}>{fmtMoney(doc.amountDue)}</td>
                <td><StatusPill status={doc.status} /></td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/estimates/${doc.id}`)}>Edit</button>
                    {doc.amountDue > 0 && (
                      <button className="btn btn-primary btn-sm" onClick={() => setPayDoc(doc)}>Record payment</button>
                    )}
                    {(doc.status === 'sent' || doc.status === 'viewed' || doc.status === 'overdue') && (
                      <button className="btn btn-ghost btn-sm" style={{ padding: '5px 7px' }} onClick={() => setReminderDoc(doc)} title="Send reminder">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payDoc && <PaymentModal doc={payDoc} onClose={() => setPayDoc(null)} onSave={recordPayment} />}
      {reminderDoc && <ReminderModal doc={reminderDoc} onClose={() => setReminderDoc(null)} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1C1C1A', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, zIndex: 80 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
