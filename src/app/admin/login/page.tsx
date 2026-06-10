'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        router.push('/admin')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 380, padding: 32 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, background: 'var(--theme)', borderRadius: 10, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>ProjectFlow</h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 13.5, marginTop: 4 }}>Sign in to your admin portal</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@firm.com" required />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p style={{ color: '#B23A2E', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: 'var(--ink-3)' }}>
          Demo: dana@rge-consultants.com / password123
        </p>
      </div>
    </div>
  )
}
