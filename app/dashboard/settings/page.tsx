'use client'

import { useState, useEffect } from 'react'
import { useWindowWidth } from '@/lib/useWindowWidth'

export default function SettingsPage() {
  const isMobile = useWindowWidth() < 768

  // ── Cover image ──────────────────────────────────────────────────────────────
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroError, setHeroError] = useState<string | null>(null)
  const [heroSuccess, setHeroSuccess] = useState(false)

  // ── Stylist photo ────────────────────────────────────────────────────────────
  const [stylistPhotoUrl, setStylistPhotoUrl] = useState<string | null>(null)
  const [stylistUploading, setStylistUploading] = useState(false)
  const [stylistError, setStylistError] = useState<string | null>(null)
  const [stylistSuccess, setStylistSuccess] = useState(false)

  // ── Gallery photos ────────────────────────────────────────────────────────────
  const [galleryPhotos, setGalleryPhotos] = useState<(string | null)[]>([null, null, null, null])
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)
  const [galleryError, setGalleryError] = useState<string | null>(null)

  // ── Bootstrap from saved siteConfig ─────────────────────────────────────────
  useEffect(() => {
    fetch('/api/bookings/business')
      .then(r => r.json())
      .then(data => {
        const biz = data.business ?? data
        setHeroImageUrl(biz.coverImage ?? biz.cover_image ?? null)
        if (biz.siteConfig) {
          setStylistPhotoUrl(biz.siteConfig.stylistPhoto ?? null)
          setGalleryPhotos(biz.siteConfig.galleryPhotos ?? [null, null, null, null])
        }
      })
      .catch(() => null)
  }, [])

  // ── Helper: persist siteConfig ───────────────────────────────────────────────
  async function saveSiteConfig(patch: { stylistPhoto: string | null; galleryPhotos: (string | null)[] }) {
    const token = localStorage.getItem('outsyde_access_token')
    const res = await fetch('/api/admin/site-config', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error(`Save failed: ${res.status}`)
  }

  // ── Cover image upload ───────────────────────────────────────────────────────
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
      form.append('file', file)

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

  // ── Stylist photo upload ─────────────────────────────────────────────────────
  async function handleStylistUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStylistError(null)
    setStylistSuccess(false)

    if (file.size > 8 * 1024 * 1024) {
      setStylistError('File too large — maximum 8MB.')
      return
    }

    setStylistUploading(true)

    try {
      const token = localStorage.getItem('outsyde_access_token')
      const form = new FormData()
      form.append('file', file)

      const uploadRes = await fetch('/api/admin/stylist/upload-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)

      const { url } = await uploadRes.json()
      if (!url) throw new Error('No URL returned from upload')

      await saveSiteConfig({ stylistPhoto: url, galleryPhotos })

      setStylistPhotoUrl(url)
      setStylistSuccess(true)
      setTimeout(() => setStylistSuccess(false), 4000)
    } catch (err) {
      setStylistError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setStylistUploading(false)
      e.target.value = ''
    }
  }

  // ── Gallery slot upload ──────────────────────────────────────────────────────
  async function handleGalleryUpload(slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setGalleryError(null)

    if (file.size > 8 * 1024 * 1024) {
      setGalleryError('File too large — maximum 8MB.')
      return
    }

    setUploadingSlot(slotIndex)

    try {
      const token = localStorage.getItem('outsyde_access_token')
      const form = new FormData()
      form.append('file', file)

      const uploadRes = await fetch('/api/admin/gallery/upload-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)

      const { url } = await uploadRes.json()
      if (!url) throw new Error('No URL returned from upload')

      const updated = galleryPhotos.map((p, i) => i === slotIndex ? url : p)
      await saveSiteConfig({ stylistPhoto: stylistPhotoUrl, galleryPhotos: updated })
      setGalleryPhotos(updated)
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setUploadingSlot(null)
      e.target.value = ''
    }
  }

  // ── Gallery slot remove ──────────────────────────────────────────────────────
  async function handleGalleryRemove(slotIndex: number) {
    setGalleryError(null)
    setUploadingSlot(slotIndex)
    try {
      const updated = galleryPhotos.map((p, i) => i === slotIndex ? null : p)
      await saveSiteConfig({ stylistPhoto: stylistPhotoUrl, galleryPhotos: updated })
      setGalleryPhotos(updated)
    } catch {
      setGalleryError('Failed to remove photo. Try again.')
    } finally {
      setUploadingSlot(null)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1.5px solid #F0D9C8',
    borderRadius: 12,
    padding: isMobile ? '24px 20px' : '28px 32px',
    marginBottom: 24,
  }

  const uploadBtnStyle = (uploading: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: uploading ? '#B5977A' : '#E8630A',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 22px',
    borderRadius: 4,
    cursor: uploading ? 'not-allowed' : 'pointer',
    letterSpacing: '0.04em',
    transition: 'background 0.2s',
  })

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

      {/* ── Card 1: Cover Image ────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 600, color: '#1C1008', marginBottom: 6 }}>
          Cover Image
        </h2>
        <p style={{ fontSize: 13, color: '#7A5C4A', marginBottom: 20, lineHeight: 1.6 }}>
          Your business cover photo — appears on your homepage and across the Outsyde platform.
          Upload a high-quality braiding photo, at least 1200px wide.
        </p>

        {heroImageUrl && (
          <div style={{ marginBottom: 24 }}>
            <img
              src={heroImageUrl}
              alt="Current hero"
              style={{ width: '100%', maxWidth: 480, height: 220, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #F0D9C8', display: 'block' }}
            />
            <p style={{ fontSize: 11, color: '#B5977A', marginTop: 6 }}>Current cover image</p>
          </div>
        )}

        <label style={uploadBtnStyle(heroUploading)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {heroUploading ? 'Uploading…' : 'Upload cover photo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={heroUploading} onChange={handleHeroUpload} />
        </label>

        {heroError && <p style={{ fontSize: 12, color: '#e05252', marginTop: 12 }}>{heroError}</p>}
        {heroSuccess && <p style={{ fontSize: 12, color: '#E8630A', marginTop: 12 }}>✓ Cover image updated</p>}
      </div>

      {/* ── Card 2: Stylist Photo ──────────────────────────────────────────── */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 600, color: '#1C1008', marginBottom: 6 }}>
          Stylist Photo
        </h2>
        <p style={{ fontSize: 13, color: '#7A5C4A', marginBottom: 20, lineHeight: 1.6 }}>
          A portrait or action photo of you — shown in the "Meet Your Stylist" section on your homepage.
        </p>

        {stylistPhotoUrl && (
          <div style={{ marginBottom: 24 }}>
            <img
              src={stylistPhotoUrl}
              alt="Stylist photo"
              style={{ width: 180, height: 220, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #F0D9C8', display: 'block' }}
            />
            <p style={{ fontSize: 11, color: '#B5977A', marginTop: 6 }}>Current stylist photo</p>
          </div>
        )}

        <label style={uploadBtnStyle(stylistUploading)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {stylistUploading ? 'Uploading…' : 'Upload stylist photo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={stylistUploading} onChange={handleStylistUpload} />
        </label>

        {stylistError && <p style={{ fontSize: 12, color: '#e05252', marginTop: 12 }}>{stylistError}</p>}
        {stylistSuccess && <p style={{ fontSize: 12, color: '#E8630A', marginTop: 12 }}>✓ Stylist photo updated</p>}
      </div>

      {/* ── Card 3: Gallery Photos ─────────────────────────────────────────── */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 600, color: '#1C1008', marginBottom: 6 }}>
          Gallery Photos
        </h2>
        <p style={{ fontSize: 13, color: '#7A5C4A', marginBottom: 20, lineHeight: 1.6 }}>
          Up to 4 photos shown in the "Recent Work" gallery on your homepage. Click a slot to upload.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 400 }}>
          {galleryPhotos.map((photo, i) => (
            <div key={i} style={{ position: 'relative' }}>
              {photo ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={photo}
                    alt={`Gallery ${i + 1}`}
                    style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #F0D9C8', display: 'block' }}
                  />
                  <button
                    onClick={() => handleGalleryRemove(i)}
                    disabled={uploadingSlot !== null}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'rgba(28,16,8,0.75)', border: 'none', borderRadius: '50%',
                      width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: uploadingSlot !== null ? 'not-allowed' : 'pointer', color: '#fff', fontSize: 14, lineHeight: 1,
                    }}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                  {uploadingSlot === i && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, color: '#E8630A' }}>Saving…</span>
                    </div>
                  )}
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  width: '100%', height: 150, border: '1.5px dashed #F0D9C8', borderRadius: 8,
                  cursor: uploadingSlot !== null ? 'not-allowed' : 'pointer',
                  background: uploadingSlot === i ? 'rgba(232,99,10,0.04)' : '#FFFAF5',
                  transition: 'border-color 0.2s',
                }}>
                  {uploadingSlot === i ? (
                    <span style={{ fontSize: 11, color: '#E8630A' }}>Uploading…</span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8630A" strokeWidth="1.8" style={{ marginBottom: 8 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      <span style={{ fontSize: 11, color: '#B5977A' }}>Slot {i + 1}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    disabled={uploadingSlot !== null}
                    onChange={e => handleGalleryUpload(i, e)}
                  />
                </label>
              )}
            </div>
          ))}
        </div>

        {galleryError && <p style={{ fontSize: 12, color: '#e05252', marginTop: 12 }}>{galleryError}</p>}
      </div>
    </div>
  )
}
