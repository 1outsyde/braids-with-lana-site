'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

type State = 'idle' | 'submitting' | 'success' | 'error'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Enter a valid email address.')
      return
    }
    setState('submitting')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setState('error')
        setErrorMsg((data as { error?: string }).error || 'Something went wrong. Please try again.')
        return
      }
      setState('success')
    } catch {
      setState('error')
      setErrorMsg("Couldn't reach the server. Please try again.")
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D2B35', color: '#f0f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <p style={{ fontSize: '0.7rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(240,249,250,0.4)', textAlign: 'center', marginBottom: 12 }}>
          Braids With Lana
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.2rem', fontWeight: 500, textAlign: 'center', marginBottom: 6 }}>
          Forgot Password
        </h1>
        <p style={{ textAlign: 'center', color: 'rgba(240,249,250,0.4)', fontSize: '0.85rem', marginBottom: 36 }}>
          Enter your email and we&rsquo;ll send you a reset link.
        </p>

        {state === 'success' ? (
          <div style={{ padding: '16px', border: '1px solid rgba(100,200,100,0.3)', background: 'rgba(100,200,100,0.05)', color: '#86efac', fontSize: '0.85rem', lineHeight: 1.6, borderRadius: '4px' }} role="status">
            Check your email for a reset link. It expires in 1 hour.
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(240,249,250,0.4)', marginBottom: 8 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 14px', color: '#f0f9fa', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', borderRadius: '4px' }}
              />
            </div>

            {state === 'error' && errorMsg && (
              <div style={{ padding: '12px 14px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', color: '#fca5a5', fontSize: '0.85rem', borderRadius: '4px' }} role="alert">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={state === 'submitting'}
              style={{ marginTop: 8, background: '#29C5CC', color: '#0D0D0D', border: 'none', padding: '14px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', cursor: state === 'submitting' ? 'not-allowed' : 'pointer', opacity: state === 'submitting' ? 0.6 : 1, borderRadius: '4px' }}
            >
              {state === 'submitting' ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'rgba(240,249,250,0.4)', marginTop: 28 }}>
          <Link href="/login" style={{ color: '#f0f9fa', textDecoration: 'underline' }}>
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
