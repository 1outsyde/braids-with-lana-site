'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type State = 'idle' | 'submitting' | 'success' | 'error' | 'invalid-link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [state, setState] = useState<State>(token && email ? 'idle' : 'invalid-link')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setState('submitting')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword }),
      })

      if (res.ok) {
        setState('success')
        return
      }

      if (res.status === 400 || res.status === 401) {
        setState('error')
        setErrorMsg('This reset link is invalid or has expired.')
        return
      }

      setState('error')
      setErrorMsg('Something went wrong. Please try again.')
    } catch {
      setState('error')
      setErrorMsg("Couldn't reach the server. Please try again.")
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '12px 14px',
    color: '#f0f9fa',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    borderRadius: '4px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D2B35', color: '#f0f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <p style={{ fontSize: '0.7rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(240,249,250,0.4)', textAlign: 'center', marginBottom: 12 }}>
          Braids With Love
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.2rem', fontWeight: 500, textAlign: 'center', marginBottom: 6 }}>
          Reset Password
        </h1>

        {state === 'invalid-link' ? (
          <>
            <p style={{ textAlign: 'center', color: 'rgba(240,249,250,0.4)', fontSize: '0.85rem', marginBottom: 36 }}>
              Account Recovery
            </p>
            <div style={{ padding: '16px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.6, borderRadius: '4px' }}>
              Invalid or expired reset link.{' '}
              <Link href="/forgot-password" style={{ color: '#f0f9fa', textDecoration: 'underline' }}>
                Request a new one.
              </Link>
            </div>
          </>
        ) : (
          <>
            <p style={{ textAlign: 'center', color: 'rgba(240,249,250,0.4)', fontSize: '0.85rem', marginBottom: 36 }}>
              Choose a new password for your account.
            </p>

            {state === 'success' ? (
              <div style={{ padding: '16px', border: '1px solid rgba(100,200,100,0.3)', background: 'rgba(100,200,100,0.05)', color: '#86efac', fontSize: '0.85rem', lineHeight: 1.6, borderRadius: '4px' }} role="status">
                Password updated. You can now{' '}
                <Link href="/login" style={{ color: '#f0f9fa', textDecoration: 'underline' }}>
                  log in
                </Link>.
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(240,249,250,0.4)', marginBottom: 8 }}>
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(240,249,250,0.4)', marginBottom: 8 }}>
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    required
                    style={inputStyle}
                  />
                </div>

                {state === 'error' && errorMsg && (
                  <div style={{ padding: '12px 14px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.5, borderRadius: '4px' }} role="alert">
                    {errorMsg}{' '}
                    {errorMsg.includes('invalid or has expired') && (
                      <Link href="/forgot-password" style={{ color: '#f0f9fa', textDecoration: 'underline' }}>
                        Request a new link.
                      </Link>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  style={{ marginTop: 8, background: '#29C5CC', color: '#0D0D0D', border: 'none', padding: '14px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', cursor: state === 'submitting' ? 'not-allowed' : 'pointer', opacity: state === 'submitting' ? 0.6 : 1, borderRadius: '4px' }}
                >
                  {state === 'submitting' ? 'Updating…' : 'Set New Password'}
                </button>
              </form>
            )}
          </>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
