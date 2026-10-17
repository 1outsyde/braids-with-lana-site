'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { isPlayableUrl, muxThumbnailUrl } from '@/lib/coverMedia'

type Props = {
  src: string | null | undefined
  poster?: string | null
  style?: CSSProperties
  /** Shown instead of the video while it is still processing (Mux upload id). */
  processing?: ReactNode
}

/**
 * Muted, looping cover video. Mux covers are HLS (.m3u8): Safari plays them
 * natively, every other browser goes through hls.js (loaded only when needed).
 * The poster (Mux thumbnail) shows until the first frame and if playback fails.
 */
export default function CoverVideo({ src, poster, style, processing = null }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const playable = isPlayableUrl(src)
  const posterUrl = poster || muxThumbnailUrl(src) || undefined

  useEffect(() => {
    const video = ref.current
    if (!video || !playable || !src) return
    let destroy: (() => void) | undefined
    let cancelled = false

    const isHls = /\.m3u8(\?|$)/i.test(src)
    if (!isHls || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.play().catch(() => {})
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return
        if (!Hls.isSupported()) { video.src = src; return }
        const hls = new Hls({ capLevelToPlayerSize: true })
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}) })
        destroy = () => hls.destroy()
      }).catch(() => { /* poster stays visible */ })
    }
    return () => {
      cancelled = true
      destroy?.()
      video.removeAttribute('src')
      video.load()
    }
  }, [src, playable])

  if (!playable) return <>{processing}</>

  return (
    <video
      ref={ref}
      style={{ objectFit: 'cover', ...style }}
      poster={posterUrl}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  )
}
