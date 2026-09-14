'use client'

import { useState, useEffect } from 'react'
import { useWindowWidth } from '@/lib/useWindowWidth'

export default function SettingsPage() {
  const isMobile = useWindowWidth() < 768
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroError, setHeroError] = useState<string | null>(null)
  const [heroSuccess, setHeroSuccess] = useState(false)

  useEffect(() => {
    const bizId = process.env.NEXT_PUBLIC_OUTSYDE_BUSINESS_ID
    const apiUrl = process.env.NEXT_PUBLIC_OUTSYDE_API_URL
    if (!bizId || !apiUrl) return
    fetch(`${apiUrl}/api/businesses/${bizId}`)
      .then(r => r.json())
      .then(data => {
        const biz = data.business ?? data
        setHeroImageUrl(biz.coverImage ?? biz.cover_image ?? null)
      })
      .catch(() => null)
  }, [])

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setHeroError(null)
    setHeroSuccess(false)

    if (file.size > 8 * 1024 * 1024) {
      setHeroError('File too large — maximum 8MB.')
      return
    }

    setHeroUploading(true)

    try {
      const token = localStorage.getItem('outsyde_access_token')
      const form = new FormData()
      form.append('image', file)

      const uploadRes = await fetch('/api/admin/hero-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)

      const { url } = await uploadRes.json()
      if (!url) throw new Error('No URL returned from upload')

      const patchRes = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ heroImageUrl: url }),
      })

      if (!patchRes.ok) throw new Error(`Profile update failed: ${patchRes.status}`)

      setHeroImageUrl(url)
      setHeroSuccess(true)
      setTimeout(() => setHeroSuccess(false), 4000)
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setHeroUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 32,
        fontWeight: 600,
        color: '#1C1008',
        marginBottom: 8,
      }}>
        Site Settings
      </h1>
      <p style={{ fontSize: 13, color: '#7A5C4A', marginBottom: 36, lineHeight: 1.6 }}>
        Manage how your public-facing site looks to clients.
      </p>

      {/* Hero Image */}
      <div style={{
        background: '#fff',
        border: '1.5px solid #F0D9C8',
        borderRadius: 12,
        padding: isMobile ? '24px 20px' : '28px 32px',
      }}>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 24,
          fontWeight: 600,
          color: '#1C1008',
          marginBottom: 6,
        }}>
          Cover Image
        </h2>
        <p style={{ fontSize: 13, color: '#7A5C4A', marginBottom: 20, lineHeight: 1.6 }}>
          This is your business cover photo. It appears on your homepage and across the Outsyde platform.
          Upload a high-quality braiding photo — at least 1200px wide.
        </p>

        {heroImageUrl && (
          <div style={{ marginBottom: 24 }}>
            <img
              src={heroImageUrl}
              alt="Current hero"
              style={{
                width: '100%',
                maxWidth: 480,
                height: 220,
                objectFit: 'cover',
                borderRadius: 8,
                border: '1.5px solid #F0D9C8',
                display: 'block',
              }}
            />
            <p style={{ fontSize: 11, color: '#B5977A', marginTop: 6 }}>Current cover image</p>
          </div>
        )}

        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: heroUploading ? '#B5977A' : '#E8630A',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          padding: '10px 22px',
          borderRadius: 4,
          cursor: heroUploading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.04em',
          transition: 'background 0.2s',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {heroUploading ? 'Uploading…' : 'Upload cover photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            disabled={heroUploading}
            onChange={handleHeroUpload}
          />
        </label>

        {heroError && (
          <p style={{ fontSize: 12, color: '#e05252', marginTop: 12 }}>{heroError}</p>
        )}
        {heroSuccess && (
          <p style={{ fontSize: 12, color: '#E8630A', marginTop: 12 }}>
            ✓ Cover image updated
          </p>
        )}
      </div>
    </div>
  )
}
