import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0F14',
        }}
      >
        {/* 中文注释：图标主体保持高识别度，优先服务浏览器标签页和书签场景。 */}
        <div
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            border: '1px solid rgba(34, 199, 169, 0.24)',
            background: 'linear-gradient(180deg, #111827 0%, #0F172A 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 4,
              height: 15,
              left: 8,
              top: 6,
              borderRadius: 999,
              background: '#22C7A9',
              transform: 'rotate(28deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 4,
              height: 15,
              right: 8,
              top: 6,
              borderRadius: 999,
              background: '#7CE9D4',
              transform: 'rotate(-28deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              right: 4,
              bottom: 4,
              borderRadius: 999,
              background: '#22C7A9',
              boxShadow: '0 0 8px rgba(34, 199, 169, 0.55)',
            }}
          />
        </div>
      </div>
    ),
    size
  )
}
