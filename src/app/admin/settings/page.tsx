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

interface CatalogItem {
  id: string
  description: string
  unit: string
  unitPrice: number
  category: string
}

interface Template {
  id: string
  name: string
  description: string
  projectType: string
  items: string
}

const TABS = ['branding', 'services', 'catalog', 'accepting', 'integrations', 'domain', 'password']

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState('branding')

  // Catalog
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [editItem, setEditItem] = useState<Partial<CatalogItem> | null>(null)
  const [savingItem, setSavingItem] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(setTenant)
  }, [])

  useEffect(() => {
    if (tab === 'catalog') {
      Promise.all([
        fetch('/api/admin/catalog').then(r => r.json()),
        fetch('/api/admin/templates').then(r => r.json()),
      ]).then(([c, t]) => { setCatalog(c); setTemplates(t) })
    }
  }, [tab])

  function update(patch: Partial<Tenant>) {
    setTenant(t => t ? { ...t, ...patch } : t)
    setDirty(true)
  }

  async function save() {
    if (!tenant || !dirty) return
    setSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenant),
      })
      setDirty(false)
      document.documentElement.style.setProperty('--theme', tenant.themeColor)
      setToast('Settings saved')
      setTimeout(() => setToast(''), 2600)
    } finally {
      setSaving(false)
    }
  }

  async function saveCatalogItem() {
    if (!editItem) return
    setSavingItem(true)
    try {
      if (editItem.id) {
        const res = await fetch(`/api/admin/catalog/${editItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editItem),
        })
        const updated = await res.json()
        setCatalog(cs => cs.map(c => c.id === updated.id ? updated : c))
      } else {
        const res = await fetch('/api/admin/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editItem, unitPrice: parseFloat(String(editItem.unitPrice || 0)) }),
        })
        const created = await res.json()
        setCatalog(cs => [...cs, created])
      }
      setEditItem(null)
    } finally {
      setSavingItem(false)
    }
  }

  async function deleteCatalogItem(id: string) {
    await fetch(`/api/admin/catalog/${id}`, { method: 'DELETE' })
    setCatalog(cs => cs.filter(c => c.id !== id))
  }

  if (!tenant) return <div style={{ padding: 40, color: 'var(--ink-3)' }}>Loading…</div>

  const services = (() => { try { return JSON.parse(tenant.services) } catch { return [] } })()

  return (
    <div style={{ paddingBottom: dirty ? 80 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 16px', fontSize: 13.5, fontWeight: tab === t ? 600 : 500,
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? 'var(--theme)' : 'var(--ink-2)',
            borderBottom: `2px solid ${tab === t ? 'var(--theme)' : 'transparent'}`,
            marginBottom: -1, letterSpacing: '-0.01em',
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'branding' && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 14 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Business identity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Business name', field: 'businessName' as const },
                { label: 'Tagline', field: 'tagline' as const },
                { label: 'Address', field: 'address' as const },
                { label: 'Phone', field: 'phone' as const },
                { label: 'Website', field: 'website' as const },
                { label: 'License #', field: 'license' as const },
              ].map(({ label, field }) => (
                <div key={field} className="field">
                  <label className="label">{label}</label>
                  <input className="input" value={(tenant as unknown as Record<string, string>)[field] || ''} onChange={e => update({ [field]: e.target.value })} />
                </div>
              ))}
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
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 12 }}>
              Current: {THEMES.find(t => t.hex === tenant.themeColor)?.name || tenant.themeColor}
            </p>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Services offered</h3>
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

      {tab === 'catalog' && (
        <div>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Service catalog</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Reusable line items for estimates</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setEditItem({ description: '', unit: 'ea', unitPrice: 0, category: 'MEP' })}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add item
              </button>
            </div>
            {catalog.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No catalog items yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Description', 'Category', 'Unit', 'Unit price', ''].map(h => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: i < catalog.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500 }}>{item.description}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--ink-2)' }}>{item.category}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--ink-2)' }}>{item.unit}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--mono)' }}>${item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditItem({ ...item })}>Edit</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: '#C62828' }} onClick={() => deleteCatalogItem(item.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Estimate templates</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Templates pre-populate estimates with catalog items</div>
            </div>
            {templates.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No templates yet</div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {templates.map(t => {
                  const items = (() => { try { return JSON.parse(t.items) } catch { return [] } })()
                  return (
                    <div key={t.id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{t.projectType} · {items.length} items · {t.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'accepting' && (
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
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
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

      {tab === 'integrations' && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {/* Google Calendar glyph */}
                <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="17" rx="2" fill="#fff" stroke="#E1E0DB" strokeWidth="1" />
                  <rect x="3" y="4" width="18" height="6" rx="2" fill="#4285F4" />
                  <rect x="3" y="8" width="18" height="2" fill="#4285F4" />
                  <text x="12" y="18" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="7" fill="#5C5B55">31</text>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Google Calendar</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>Sync project start dates and milestones to your Google Calendar.</div>
                {tenant.gcal ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#E8F5E9', color: '#2E7D32', fontSize: 12, fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2E7D32', flexShrink: 0 }} />
                        Connected
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>Calendar: {tenant.gcal}</div>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => update({ gcal: '' })}>Disconnect</button>
                  </div>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ marginBottom: 10 }}>
                      <label className="label">Calendar ID / email</label>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <input className="input" placeholder="your@gmail.com" value={tenant.gcal || ''} onChange={e => update({ gcal: e.target.value })} style={{ maxWidth: 280 }} />
                        <button className="btn btn-primary" onClick={() => setDirty(true)}>Connect</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      Connect your Google Calendar to automatically add project start dates and milestone events.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'domain' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Custom domain</h3>
          <div className="field">
            <label className="label">Subdomain</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input className="input" value={tenant.subdomain} readOnly style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', maxWidth: 180 }} />
              <span style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap', fontSize: 13 }}>.projectflow.io</span>
            </div>
          </div>
          <div className="field">
            <label className="label">Custom domain (optional)</label>
            <input className="input" value={tenant.customDomain || ''} onChange={e => update({ customDomain: e.target.value })} placeholder="portal.yourfirm.com" />
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, fontSize: 13, marginTop: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>DNS setup</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--ink-3)', padding: '4px 0' }}>Type</th>
                <th style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--ink-3)' }}>Name</th>
                <th style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--ink-3)' }}>Value</th>
              </tr></thead>
              <tbody><tr>
                <td style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: 12 }}>CNAME</td>
                <td style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: 12 }}>{tenant.subdomain}</td>
                <td style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: 12 }}>tenant.projectflow.io</td>
              </tr></tbody>
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

      {/* Sticky unsaved-changes save bar */}
      {dirty && (
        <div style={{
          position: 'fixed', bottom: 0, left: 220, right: 0,
          background: '#1C1C1A', color: '#fff',
          padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 40, boxShadow: '0 -2px 12px rgba(0,0,0,.18)',
        }}>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,.75)' }}>You have unsaved changes</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setDirty(false); fetch('/api/admin/settings').then(r => r.json()).then(setTenant) }}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 500 }}>
              Discard
            </button>
            <button onClick={save} disabled={saving}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#fff', color: '#1C1C1A', cursor: 'pointer', fontSize: 13.5, fontWeight: 700 }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Catalog item modal */}
      {editItem !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditItem(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 0, width: 420, boxShadow: '0 12px 48px rgba(0,0,0,.2)', overflow: 'hidden', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{editItem.id ? 'Edit item' : 'New catalog item'}</span>
              <button onClick={() => setEditItem(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, borderRadius: 6, display: 'inline-flex' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field">
                <label className="label">Description</label>
                <input className="input" value={editItem.description || ''} onChange={e => setEditItem(ei => ({ ...ei!, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="field">
                  <label className="label">Category</label>
                  <select className="input" value={editItem.category || 'MEP'} onChange={e => setEditItem(ei => ({ ...ei!, category: e.target.value }))}>
                    {['MEP', 'Civil', 'Structural', 'Architectural', 'Consulting', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Unit</label>
                  <input className="input" value={editItem.unit || 'ea'} onChange={e => setEditItem(ei => ({ ...ei!, unit: e.target.value }))} placeholder="ea, hr, ft" />
                </div>
                <div className="field">
                  <label className="label">Unit price</label>
                  <input className="input" type="number" step="0.01" value={editItem.unitPrice ?? 0} onChange={e => setEditItem(ei => ({ ...ei!, unitPrice: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditItem(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={saveCatalogItem} disabled={savingItem} className="btn btn-primary">{savingItem ? 'Saving…' : 'Save item'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
