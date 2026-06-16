'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      setMessage('No session found.')
      return
    }

    fetch('/api/signup/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setStatus('success')
          setTimeout(() => router.push('/admin'), 2000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Something went wrong.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Network error. Please contact support.')
      })
  }, [sessionId, router])

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', border: '1px solid #E9EBF0', borderRadius: 16, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        {status === 'loading' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid #E9EBF0', borderTopColor: '#185FA5', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F1B2D', marginBottom: 8 }}>Activating your account…</h2>
            <p style={{ color: '#5A6577', fontSize: 14 }}>Please wait while we set up your portal.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', marginBottom: 8 }}>Welcome to ProjectFlow!</h2>
            <p style={{ color: '#5A6577', fontSize: 14, marginBottom: 20 }}>Your account is active. Redirecting you to your dashboard…</p>
            <div style={{ height: 4, background: '#E9EBF0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#185FA5', borderRadius: 999, animation: 'progress 2s linear forwards' }} />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F1B2D', marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: '#5A6577', fontSize: 14, marginBottom: 20 }}>{message}</p>
            <a href="mailto:support@projectflow.io" style={{ color: '#185FA5', fontSize: 13.5, fontWeight: 600 }}>Contact support →</a>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F6F8FC' }} />}>
      <SuccessInner />
    </Suspense>
  )
}
