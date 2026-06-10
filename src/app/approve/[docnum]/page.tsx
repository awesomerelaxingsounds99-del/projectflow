'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { fmtMoney, totalsOf } from '@/lib/money'

interface EstimateData {
  estimate: Record<string, unknown>
  tenant: Record<string, unknown>
}

export default function ApprovalPage() {
  const { docnum } = useParams<{ docnum: string }>()
  const [data, setData] = useState<EstimateData | null>(null)
  const [approved, setApproved] = useState(false)
  const [approvedByName, setApprovedByName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    fetch(`/api/public/approve/${docnum}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        if (d.tenant?.themeColor) {
          document.documentElement.style.setProperty('--theme', d.tenant.themeColor)
        }
      })
  }, [docnum])

  // Signature canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function getPos(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect()
      const scaleX = canvas!.width / rect.width
      const scaleY = canvas!.height / rect.height
      if ('touches' in e) {
        return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
      }
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
    }

    function start(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      isDrawing.current = true
      const { x, y } = getPos(e)
      ctx!.beginPath()
      ctx!.moveTo(x, y)
    }

    function draw(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      if (!isDrawing.current) return
      const { x, y } = getPos(e)
      ctx!.lineTo(x, y)
      ctx!.stroke()
      setHasSignature(true)
    }

    function end() { isDrawing.current = false }

    ctx.strokeStyle = '#1B1B18'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', end)

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', end)
    }
  }, [data])

  function clearSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  async function handleApprove() {
    if (!approvedByName.trim()) { setError('Please enter your full name.'); return }
    if (!hasSignature) { setError('Please draw your signature.'); return }

    const canvas = canvasRef.current!
    const signature = canvas.toDataURL('image/png')

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/public/approve/${docnum}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedByName: approvedByName.trim(), approvalSignature: signature }),
      })
      if (res.ok) setApproved(true)
      else {
        const d = await res.json()
        setError(d.error || 'Something went wrong.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Loading estimate…</div>

  const { estimate, tenant } = data
  const lineItems = estimate.lineItems as Record<string, unknown>[] || []
  const payments = estimate.payments as Record<string, unknown>[] || []
  const themeColor = tenant.themeColor as string || '#185FA5'

  const t = totalsOf({
    lineItems: lineItems.map(li => ({ qty: li.qty as number, unit_price: li.unitPrice as number, discount_pct: li.discountPct as number })),
    discount_amt: estimate.discountAmt as number,
    markup_rate: estimate.markupRate as number,
    tax_rate: estimate.taxRate as number,
    payments: payments.map(p => ({ amount: p.amount as number })),
  })

  const alreadyApproved = estimate.status === 'approved'

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: '\'DM Sans\', system-ui, sans-serif', fontSize: 15 }}>
      {/* Header */}
      <div style={{ background: themeColor, color: '#fff', padding: '20px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{tenant.businessName as string}</div>
            {!!tenant.address && <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 2 }}>{tenant.address as string}</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, opacity: 0.85 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700 }}>{estimate.documentNumber as string}</div>
            <div>Total: {fmtMoney(t.total)}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px' }}>
        {alreadyApproved || approved ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ width: 60, height: 60, background: '#E2F2E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0B6E4F" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Estimate approved!</h2>
            <p style={{ color: '#5C5B55', fontSize: 15, lineHeight: 1.6 }}>
              {alreadyApproved ? `This estimate was approved by ${estimate.approvedByName as string}.` : `Thank you, ${approvedByName}!`} {tenant.businessName as string} will be in touch to kick off your project.
            </p>
          </div>
        ) : (
          <>
            {/* Awaiting banner */}
            <div style={{ background: '#FCEFD9', border: '1px solid #F5C77E', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A5B0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <div style={{ fontWeight: 600, color: '#9A5B0B', fontSize: 14 }}>Awaiting your approval</div>
                <div style={{ fontSize: 13, color: '#A4541A' }}>Review the estimate below, then sign and approve to get started.</div>
              </div>
            </div>

            {/* Estimate summary */}
            <div style={{ background: '#fff', border: '1px solid #E9E8E4', borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E9E8E4', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8B897F', marginBottom: 4 }}>Prepared for</div>
                  <div style={{ fontWeight: 600 }}>{estimate.clientBizName as string || estimate.clientName as string}</div>
                  {!!estimate.clientBizName && <div style={{ fontSize: 13, color: '#5C5B55' }}>{estimate.clientName as string}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8B897F', marginBottom: 4 }}>Project</div>
                  <div style={{ fontWeight: 600 }}>{estimate.projectName as string}</div>
                  {!!estimate.projectAddress && <div style={{ fontSize: 13, color: '#5C5B55' }}>{estimate.projectAddress as string}</div>}
                </div>
              </div>

              {!!estimate.scopeOfWork && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E9E8E4' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8B897F', marginBottom: 8 }}>Scope of work</div>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: '#1B1B18' }}>{estimate.scopeOfWork as string}</p>
                </div>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: themeColor, color: '#fff' }}>
                    <th style={{ textAlign: 'left', padding: '9px 16px', fontSize: 12, fontWeight: 600 }}>Service</th>
                    <th style={{ width: 70, textAlign: 'right', padding: '9px 10px', fontSize: 12, fontWeight: 600 }}>Qty</th>
                    <th style={{ width: 90, textAlign: 'right', padding: '9px 16px', fontSize: 12, fontWeight: 600 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, i) => (
                    <tr key={i} style={{ background: i % 2 ? '#fff' : '#FAFAF9', borderBottom: '1px solid #E9E8E4' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13.5 }}>
                        <div>{li.description as string}</div>
                        {!!li.category && <div style={{ fontSize: 11.5, color: '#8B897F', marginTop: 1 }}>{li.category as string} · {li.qty as number} {li.unit as string} @ {fmtMoney(li.unitPrice as number)}</div>}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 10px', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{li.qty as number} {li.unit as string}</td>
                      <td style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(li.lineTotal as number)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 220 }}>
                  {t.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5C5B55', padding: '3px 0' }}>
                      <span>Discount</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>−{fmtMoney(t.discount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1B1B18', paddingTop: 10, marginTop: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Total due</span>
                    <span style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: themeColor }}>{fmtMoney(t.total)}</span>
                  </div>
                </div>
              </div>

              {!!estimate.notes && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid #E9E8E4', background: '#FAFAF9', fontSize: 13.5, color: '#5C5B55', lineHeight: 1.6 }}>
                  {estimate.notes as string}
                </div>
              )}
            </div>

            {/* Acceptance form */}
            <div style={{ background: '#fff', border: '1px solid #E9E8E4', borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Approve this estimate</h3>
              <p style={{ color: '#5C5B55', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                By signing, you authorize {tenant.businessName as string} to proceed with the scope of work described above.
              </p>

              <div className="field">
                <label className="label">Your full name *</label>
                <input className="input" style={{ fontSize: 16 }} value={approvedByName} onChange={e => setApprovedByName(e.target.value)} placeholder="Type your full legal name" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="label" style={{ marginBottom: 0 }}>Signature *</label>
                  <button onClick={clearSignature} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 12.5, cursor: 'pointer' }}>Clear</button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={130}
                  style={{ width: '100%', height: 130, border: '1px solid var(--border-strong)', borderRadius: 8, background: '#FAFAF9', touchAction: 'none', cursor: 'crosshair' }}
                />
                {!hasSignature && <p style={{ color: 'var(--ink-3)', fontSize: 12, marginTop: 4 }}>Draw your signature above using mouse or finger.</p>}
              </div>

              {error && <p style={{ color: '#B23A2E', fontSize: 13.5, marginBottom: 12 }}>{error}</p>}

              <button
                onClick={handleApprove}
                disabled={submitting || !approvedByName.trim() || !hasSignature}
                style={{
                  width: '100%', padding: '14px 20px', background: themeColor, color: '#fff',
                  border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer',
                  opacity: (submitting || !approvedByName.trim() || !hasSignature) ? 0.5 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {submitting ? 'Approving…' : `Approve estimate — ${fmtMoney(t.total)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
