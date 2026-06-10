'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { JWTPayload } from '@/lib/auth'

const NAV = [
  { href: '/admin', label: 'Overview', icon: 'grid' },
  { href: '/admin/pending', label: 'Pending', icon: 'inbox', badge: true },
  { href: '/admin/active', label: 'Active Projects', icon: 'briefcase' },
  { href: '/admin/estimates', label: 'Estimates', icon: 'file-text' },
  { href: '/admin/invoices', label: 'Invoices', icon: 'dollar-sign' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
]

function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    inbox: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
    briefcase: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    'file-text': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    'dollar-sign': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  }
  return icons[name] || null
}

export default function AdminShell({ children, session }: { children: React.ReactNode; session: JWTPayload }) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [theme, setTheme] = useState('#185FA5')

  useEffect(() => {
    fetch('/api/admin/overview').then(r => r.json()).then(d => {
      if (d.pendingCount !== undefined) setPendingCount(d.pendingCount)
    }).catch(() => {})
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.themeColor) {
        setTheme(d.themeColor)
        document.documentElement.style.setProperty('--theme', d.themeColor)
      }
    }).catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const initials = session.adminEmail.slice(0, 2).toUpperCase()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        {/* Brand block */}
        <div style={{ padding: '20px 14px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: theme, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.businessName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Admin portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px 0', flex: 1 }}>
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <Icon name={item.icon} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && pendingCount > 0 && (
                <span style={{ background: '#C94B1E', color: '#fff', borderRadius: 999, fontSize: 10.5, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: theme, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.adminEmail}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ padding: '4px 6px' }} title="Sign out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      <main className="admin-main" id="pf-main">
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  )
}
