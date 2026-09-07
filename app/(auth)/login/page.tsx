'use client'
import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { isAdminEmail } from '@/lib/config'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === 'true'
  const redirect = searchParams.get('redirect') ?? '/account'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const loggedInUser = await login(email, password)
      if (isAdminEmail(loggedInUser.email) || loggedInUser.role === 'vendor' || loggedInUser.role === 'admin') {
        router.push('/dashboard')
      } else {
        router.push(redirect)
      }
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.65rem',
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    color: 'rgba(240,249,250,0.5)',
    marginBottom: 8,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D2B35', color: '#f0f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <p style={{ fontSize: '0.7rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(240,249,250,0.4)', textAlign: 'center', marginBottom: 12 }}>
          Braids With Love
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.4rem', fontWeight: 500, textAlign: 'center', marginBottom: 6, color: '#f0f9fa' }}>
          Sign In
        </h1>
        <p style={{ textAlign: 'center', color: 'rgba(240,249,250,0.5)', fontSize: '0.85rem', marginBottom: 36 }}>
          Welcome back
        </p>

        {justRegistered && (
          <div style={{ marginBottom: 20, padding: '12px 16px', border: '1px solid rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.85rem', borderRadius: '4px' }}>
            Account created — please sign in.
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#fca5a5', fontSize: '0.85rem', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              background: '#29C5CC',
              color: '#0D0D0D',
              border: 'none',
              padding: '14px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              borderRadius: '4px',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'rgba(240,249,250,0.5)', marginTop: 24 }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: '#29C5CC', textDecoration: 'underline' }}>
            Create one
          </Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'rgba(240,249,250,0.5)', marginTop: 12 }}>
          <Link href="/forgot-password" style={{ color: 'rgba(240,249,250,0.45)', textDecoration: 'underline' }}>
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  )
}
