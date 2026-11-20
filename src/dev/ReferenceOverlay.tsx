import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Route → reference image map
// ---------------------------------------------------------------------------

const ROUTE_IMAGE_MAP: Record<string, string> = {
  '/':        '01-home.jpg',
  '/rohan':   '06-seat-layout-empty.jpg',
  '/friend':  '06-seat-layout-empty.jpg',
  '/kit':     '06-seat-layout-empty.jpg',
}

function getImageForRoute(pathname: string): string | null {
  // Exact match first
  if (ROUTE_IMAGE_MAP[pathname]) return ROUTE_IMAGE_MAP[pathname]
  // Prefix match (e.g. /friend/priya)
  for (const [route, image] of Object.entries(ROUTE_IMAGE_MAP)) {
    if (pathname.startsWith(route) && route !== '/') return image
  }
  return null
}

function getBaseUrl(): string {
  // In production on GitHub Pages the base is /Navi-Design-Task/
  // Vite copies reference screens to public/reference/ at build time.
  const base = import.meta.env.BASE_URL ?? '/'
  return base.endsWith('/') ? base : `${base}/`
}

// ---------------------------------------------------------------------------
// ReferenceOverlay
// ---------------------------------------------------------------------------

export default function ReferenceOverlay() {
  const location = useLocation()
  const params = new URLSearchParams(window.location.search)
  const isEnabled = params.get('overlay') === '1'

  const [visible, setVisible] = useState(false)
  const [opacity, setOpacity] = useState(50)
  const [isDiff, setIsDiff] = useState(false)

  // Toggle on 'O' keypress
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!isEnabled) return
      if (
        e.key === 'o' || e.key === 'O' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        setVisible(v => !v)
      }
    },
    [isEnabled],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  if (!isEnabled) return null

  const image = getImageForRoute(location.pathname)
  if (!image) return null

  const imgSrc = `${getBaseUrl()}reference/${image}`

  return (
    <>
      {/* Overlay image */}
      {visible && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <img
            src={imgSrc}
            alt="Reference overlay"
            style={{
              width: 402,
              height: 874,
              objectFit: 'cover',
              opacity: opacity / 100,
              mixBlendMode: isDiff ? 'difference' : 'normal',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* Controls panel — always visible when ?overlay=1 */}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 10000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          color: '#fff',
          fontSize: 12,
          fontFamily: 'monospace',
          userSelect: 'none',
          minWidth: 180,
        }}
        aria-label="Reference overlay controls"
      >
        <div style={{ fontWeight: 700, marginBottom: 2 }}>
          Overlay {visible ? '● ON' : '○ OFF'} · press O
        </div>
        <div style={{ fontSize: 10, opacity: 0.6, wordBreak: 'break-all' }}>
          {image}
        </div>

        {/* Opacity slider */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Opacity: {opacity}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--bms-red)' }}
          />
        </label>

        {/* Difference blend toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isDiff}
            onChange={e => setIsDiff(e.target.checked)}
            style={{ accentColor: 'var(--bms-red)', width: 14, height: 14 }}
          />
          Difference blend
        </label>
      </div>
    </>
  )
}
