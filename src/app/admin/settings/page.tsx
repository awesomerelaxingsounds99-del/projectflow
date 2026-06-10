'use client'
import { useEffect, useState } from 'react'

const THEMES = [
  { name: 'Blueprint Blue', hex: '#185FA5' },
  { name: 'Forest Green', hex: '#0B6E4F' },
  { name: 'Ember Orange', hex: '#C94B1E' },
  { name: 'Steel Violet', hex: '#5B3FBE' },
  { name: 'Slate Dark', hex: '#2A2A28' },
]

interface Tenant {
  businessName: string
  tagline: string
  themeColor: string
  subdomain: string
  customDomain: string
  address: string
  phone: string
  website: string
  license: string
  acceptingProjects: boolean
  offlineMessage: string
  services: string
  gcal: string
  adminEmail: string
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState('branding')

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(setTenant)
  }, [])

  function update(patch: Partial<Tenant>) {
    setTenant(t => t ? { ...t, ...patch } : t)
    setDirty(true)
  }

  async function save() {
    if (!tenant || !dirty) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenant),
      })
      await res.json()
      setDirty(false)
      setToast('Settings saved')
      setTimeout(() => setToast(''), 2600)
      document.documentElement.style.setProperty('--theme', tenant.themeColor)
    } finally {
      setSaving(false)
    }
  }

  if (!tenant) return <div style={{ padding: 40, color: 'var(--ink-3)' }}>Loading…</div>

  const services = (() => { try { return JSON.parse(tenant.services) } catch { return [] } })()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title">Settings</h1>
        {dirty && (
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24, flexWrap: 'wrap' }}>
        {['branding', 'services', 'portal', 'domain', 'password'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 14px', fontSize: 13.5, fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? 'var(--theme)' : 'var(--ink-2)',
            borderBottom: `2px solid ${tab === t ? 'var(--theme)' : 'transparent'}`,
            marginBottom: -1,
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'branding' && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 14 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Business identity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field">
                <label className="label">Business name</label>
                <input className="input" value={tenant.businessName} onChange={e => update({ businessName: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Tagline</label>
                <input className="input" value={tenant.tagline} onChange={e => update({ tagline: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Address</label>
                <input className="input" value={tenant.address} onChange={e => update({ address: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Phone</label>
                <input className="input" value={tenant.phone} onChange={e => update({ phone: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Website</label>
                <input className="input" value={tenant.website} onChange={e => update({ website: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">License #</label>
                <input className="input" value={tenant.license} onChange={e => update({ license: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Brand color</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {THEMES.map(th => (
                <button key={th.hex} onClick={() => update({ themeColor: th.hex })} style={{
                  width: 44, height: 44, borderRadius: '50%', background: th.hex, border: 'none', cursor: 'pointer',
                  outline: tenant.themeColor === th.hex ? `3px solid ${th.hex}` : 'none',
                  outlineOffset: 3,
                  transform: tenant.themeColor === th.hex ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.1s',
                }} title={th.name} />
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 12 }}>Current: {THEMES.find(t => t.hex === tenant.themeColor)?.name || tenant.themeColor}</p>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Services offered</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 16 }}>Enabled services appear in the client intake form dropdown.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {services.map((svc: Record<string, unknown>, i: number) => (
              <div key={svc.id as string} style={{ display: 'flex', gap: 14, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ paddingTop: 2 }}>
                  <input type="checkbox" checked={svc.enabled as boolean} onChange={e => {
                    const updated = [...services]; updated[i] = { ...svc, enabled: e.target.checked }
                    update({ services: JSON.stringify(updated) })
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <input className="input" value={svc.label as string} onChange={e => {
                    const updated = [...services]; updated[i] = { ...svc, label: e.target.value }
                    update({ services: JSON.stringify(updated) })
                  }} style={{ marginBottom: 6 }} />
                  <input className="input" value={svc.description as string} onChange={e => {
                    const updated = [...services]; updated[i] = { ...svc, description: e.target.value }
                    update({ services: JSON.stringify(updated) })
                  }} placeholder="Description" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'portal' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Client portal</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>Accepting new projects</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Show the intake form to prospective clients</div>
            </div>
            <button onClick={() => update({ acceptingProjects: !tenant.acceptingProjects })} style={{
              width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: tenant.acceptingProjects ? 'var(--theme)' : 'var(--border-strong)',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute',
                top: 3, left: tenant.acceptingProjects ? 23 : 3, transition: 'left 0.2s',
              }} />
            </button>
          </div>
          {!tenant.acceptingProjects && (
            <div className="field">
              <label className="label">Offline message</label>
              <textarea className="input" value={tenant.offlineMessage} onChange={e => update({ offlineMessage: e.target.value })} rows={3} />
            </div>
          )}
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Portal URL</div>
            <code style={{ fontSize: 12 }}>http://localhost:3000/portal/{tenant.subdomain}</code>
          </div>
        </div>
      )}

      {tab === 'domain' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Custom domain</h3>
          <div className="field">
            <label className="label">Subdomain</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input className="input" value={tenant.subdomain} readOnly style={{ background: 'var(--surface-2)', color: 'var(--ink-2)' }} />
              <span style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>.projectflow.io</span>
            </div>
          </div>
          <div className="field">
            <label className="label">Custom domain (optional)</label>
            <input className="input" value={tenant.customDomain || ''} onChange={e => update({ customDomain: e.target.value })} placeholder="portal.yourfirm.com" />
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>DNS setup</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={{ textAlign: 'left', fontSize: 12, color: 'var(--ink-3)', padding: '4px 0' }}>Type</th><th style={{ textAlign: 'left', fontSize: 12, color: 'var(--ink-3)' }}>Name</th><th style={{ textAlign: 'left', fontSize: 12, color: 'var(--ink-3)' }}>Value</th></tr></thead>
              <tbody><tr><td style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: 12 }}>CNAME</td><td style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: 12 }}>{tenant.subdomain}</td><td style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: 12 }}>tenant.projectflow.io</td></tr></tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Change password</h3>
          <p style={{ color: 'var(--ink-2)', fontSize: 13.5, marginBottom: 16 }}>Password changes require re-authentication. Use the forgot password flow from the login page to reset via email.</p>
          <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>Admin email: <strong>{tenant.adminEmail}</strong></div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
