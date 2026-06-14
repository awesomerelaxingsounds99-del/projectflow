'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { JWTPayload } from '@/lib/auth'

const NAV = [
  { href: '/admin', label: 'Overview', path: 'M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6ZM13 9h8V3h-8v6Z' },
  { href: '/admin/pending', label: 'Pending', path: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', badge: true },
  { href: '/admin/active', label: 'Active projects', path: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
  { href: '/admin/estimates', label: 'Estimates', path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M9 13h6M9 17h6' },
  { href: '/admin/invoices', label: 'Invoices', path: 'M4 3h16v18l-3-2-2 2-3-2-3 2-2-2-3 2V3Zm4 5h8M8 12h8M8 16h5' },
  { href: '/admin/history', label: 'History', path: 'M20 6 9 17l-5-5' },
  { href: '/admin/settings', label: 'Settings', path: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z' },
]

function NavIcon({ path }: { path: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {path.split(' M').map((seg, i) => <path key={i} d={(i === 0 ? '' : 'M') + seg} />)}
    </svg>
  )
}

export default function AdminShell({ children, session }: { children: React.ReactNode; session: JWTPayload }) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [businessName, setBusinessName] = useState(session.businessName || 'Admin')
  const [themeColor, setThemeColor] = useState('#185FA5')

  useEffect(() => {
    fetch('/api/admin/overview').then(r => r.json()).then(d => {
      if (d.pendingCount !== undefined) setPendingCount(d.pendingCount)
    }).catch(() => {})
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.themeColor) {
        setThemeColor(d.themeColor)
        document.documentElement.style.setProperty('--theme', d.themeColor)
      }
      if (d.businessName) setBusinessName(d.businessName)
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

  const initials = (session.adminEmail || '?').split('@')[0].slice(0, 2).toUpperCase()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        {/* Brand */}
        <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--theme)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', flexShrink: 0 }}>
            {businessName.charAt(0).toUpperCase()}
          </span>
          <div style={{ lineHeight: 1.15, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{businessName}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Admin portal</div>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--border)', margin: '0 0 8px' }} />

        {/* Nav */}
        <nav style={{ padding: '2px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV.map(item => {
            const on = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
                background: on ? 'var(--theme-tint-8)' : 'transparent',
                color: on ? 'var(--theme-ink)' : 'var(--ink-2)',
                fontWeight: on ? 600 : 500, fontSize: 13.5,
                textDecoration: 'none', transition: 'background .12s',
              }}>
                <NavIcon path={item.path} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && pendingCount > 0 && (
                  <span style={{ background: on ? 'var(--theme)' : '#E3D7C9', color: on ? '#fff' : '#8a6d4b', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--theme-tint-12)', color: 'var(--theme-ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.adminEmail}</div>
          </div>
          <button onClick={handleLogout} style={{ border: 'none', background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', padding: 4, display: 'inline-flex', borderRadius: 6 }} title="Sign out">
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
