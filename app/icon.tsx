import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: '#1C1008',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      color: '#E8630A',
      fontStyle: 'italic',
      fontFamily: 'serif',
    }}>
      B
    </div>,
    { ...size }
  )
}
