import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          gap: 24,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              color: 'white',
              fontWeight: 700,
            }}
          >
            P
          </div>
          <span style={{ fontSize: 56, fontWeight: 700, color: '#6d28d9' }}>PointArt</span>
        </div>
        {/* Tagline */}
        <p style={{ fontSize: 28, color: '#4b5563', margin: 0, textAlign: 'center', maxWidth: 700 }}>
          Scheme pentru broderie, goblene și picturi cu diamante
        </p>
        <p style={{ fontSize: 20, color: '#7c3aed', margin: 0 }}>
          Din orice fotografie → schemă DMC cu export PDF
        </p>
        {/* Pills */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {['🪡 Broderie', '🖼 Goblene', '💎 Diamante'].map(label => (
            <div
              key={label}
              style={{
                background: 'white',
                border: '1px solid #ddd6fe',
                borderRadius: 100,
                padding: '8px 20px',
                fontSize: 18,
                color: '#5b21b6',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
