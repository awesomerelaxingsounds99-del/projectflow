'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Tenant {
  id: string
  businessName: string
  tagline: string
  logoUrl: string | null
  themeColor: string
  acceptingProjects: boolean
  offlineMessage: string
  services: string
}

export default function ClientPortal() {
  const { subdomain } = useParams<{ subdomain: string }>()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    clientName: '', clientEmail: '', clientPhone: '', clientBiz: '',
    clientType: 'homeowner', service: '', projectName: '', address: '', description: '',
  })

  useEffect(() => {
    fetch(`/api/public/${subdomain}`)
      .then(r => r.json())
      .then(data => {
        setTenant(data)
        document.documentElement.style.setProperty('--theme', data.themeColor || '#185FA5')
      })
  }, [subdomain])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/public/${subdomain}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setSubmitted(true)
      else setError('Something went wrong. Please try again.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!tenant) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Loading portal…</div>

  const services = (() => {
    try { return JSON.parse(tenant.services).filter((s: Record<string, unknown>) => s.enabled) } catch { return [] }
  })()

  if (submitted) {
    return (
      <div className="portal-page">
        <div className="portal-header">
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{tenant.businessName}</h1>
            {tenant.tagline && <p style={{ opacity: 0.85, marginTop: 4, fontSize: 14 }}>{tenant.tagline}</p>}
          </div>
        </div>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#E2F2E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B6E4F" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Request submitted!</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6 }}>
            Thank you! {tenant.businessName} will review your project and reach out within 1–2 business days with an estimate.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-page">
      <div className="portal-header">
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{tenant.businessName}</h1>
            {tenant.tagline && <p style={{ opacity: 0.85, marginTop: 4, fontSize: 14 }}>{tenant.tagline}</p>}
          </div>
          {tenant.acceptingProjects && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', borderRadius: 999, padding: '6px 12px', fontSize: 12.5, fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#90E4A8', display: 'inline-block' }} />
              Now accepting projects
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        {!tenant.acceptingProjects ? (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6 }}>{tenant.offlineMessage || 'We are not currently accepting new projects.'}</p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Submit a project request</h2>
            <p style={{ color: 'var(--ink-2)', marginBottom: 24, fontSize: 14 }}>Fill out the form below and we'll respond with an estimate within 1–2 business days.</p>

            <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Your information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 6 }}>
                <div className="field">
                  <label className="label">Full name *</label>
                  <input className="input" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} required />
                </div>
                <div className="field">
                  <label className="label">Email *</label>
                  <input className="input" type="email" value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} required />
                </div>
                <div className="field">
                  <label className="label">Phone</label>
                  <input className="input" type="tel" value={form.clientPhone} onChange={e => setForm({ ...form, clientPhone: e.target.value })} />
                </div>
                <div className="field">
                  <label className="label">Company / Organization</label>
                  <input className="input" value={form.clientBiz} onChange={e => setForm({ ...form, clientBiz: e.target.value })} placeholder="Optional" />
                </div>
              </div>

              <div className="field">
                <label className="label">I am a *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['homeowner', 'builder', 'commercial'].map(type => (
                    <button key={type} type="button" onClick={() => setForm({ ...form, clientType: type })} style={{
                      flex: 1, padding: '9px 12px', border: `1.5px solid ${form.clientType === type ? 'var(--theme)' : 'var(--border-strong)'}`,
                      borderRadius: 8, background: form.clientType === type ? 'var(--theme-tint-12)' : '#fff',
                      color: form.clientType === type ? 'var(--theme)' : 'var(--ink-2)',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, marginTop: 8 }}>Project details</h3>

              {services.length > 0 && (
                <div className="field">
                  <label className="label">Service needed *</label>
                  <select className="input" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required>
                    <option value="">Select a service…</option>
                    {services.map((s: Record<string, unknown>) => (
                      <option key={s.id as string} value={s.label as string}>{s.label as string}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field">
                <label className="label">Project name *</label>
                <input className="input" value={form.projectName} onChange={e => setForm({ ...form, projectName: e.target.value })} placeholder="e.g. New custom home, Office TI…" required />
              </div>
              <div className="field">
                <label className="label">Project address</label>
                <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street, City, State" />
              </div>
              <div className="field">
                <label className="label">Project description *</label>
                <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Describe your project, scope, timeline…" required />
              </div>

              {error && <p style={{ color: '#B23A2E', fontSize: 13, marginBottom: 12 }}>{error}</p>}

              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Submitting…' : 'Submit project request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
