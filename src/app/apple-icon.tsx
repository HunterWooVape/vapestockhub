import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
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
        {/* 中文注释：Apple 图标延续同一品牌形态，但放大留白提升主屏幕显示效果。 */}
        <div
          style={{
            width: 156,
            height: 156,
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 42,
            border: '4px solid rgba(34, 199, 169, 0.24)',
            background: 'linear-gradient(180deg, #111827 0%, #0F172A 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 18,
              height: 86,
              left: 42,
              top: 28,
              borderRadius: 999,
              background: '#22C7A9',
              transform: 'rotate(28deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 18,
              height: 86,
              right: 42,
              top: 28,
              borderRadius: 999,
              background: '#7CE9D4',
              transform: 'rotate(-28deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 28,
              height: 28,
              right: 22,
              bottom: 22,
              borderRadius: 999,
              background: '#22C7A9',
              boxShadow: '0 0 26px rgba(34, 199, 169, 0.55)',
            }}
          />
        </div>
      </div>
    ),
    size
  )
}
