import type { ReactNode, CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeviceFrameProps {
  /** Status bar time string, default "9:41" */
  time?: string
  children?: ReactNode
}

// ---------------------------------------------------------------------------
// Status bar icon sub-components (drawn with SVG, no raw hex — tokens only)
// ---------------------------------------------------------------------------

/** Signal strength bars icon */
function SignalIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-label="Signal">
      {/* 4 bars of increasing height */}
      <rect x="0"  y="8"  width="3" height="4" rx="0.5" fill="currentColor" />
      <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" fill="currentColor" />
      <rect x="9"  y="3"  width="3" height="9" rx="0.5" fill="currentColor" />
      <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
    </svg>
  )
}

/** Wi-Fi arcs icon */
function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-label="Wi-Fi">
      <path d="M8 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" fill="currentColor" />
      <path d="M4.5 7.2A5 5 0 0 1 11.5 7.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M1.5 4.4A9 9 0 0 1 14.5 4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M-1 1.6A13 13 0 0 1 17 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** Battery icon */
function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-label="Battery">
      {/* Body */}
      <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke="currentColor" strokeWidth="1" />
      {/* Fill (~80%) */}
      <rect x="2" y="2" width="16" height="8" rx="1.5" fill="currentColor" />
      {/* Nub */}
      <path d="M23 4v4a2 2 0 0 0 0-4z" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const DEVICE_W = 402
const DEVICE_H = 874
const SAFE_TOP = 62
const SAFE_BOTTOM = 34
const STATUS_H = 54
const DI_W = 126   // Dynamic Island width
const DI_H = 37    // Dynamic Island height
const DI_TOP = 11  // from top of screen
const HOME_W = 134
const HOME_H = 5
const HOME_BOTTOM = 8
// breakpoint: when viewport ≤ 430px wide, go full-screen
const BREAKPOINT = 430

// ---------------------------------------------------------------------------
// DeviceFrame
// ---------------------------------------------------------------------------

export default function DeviceFrame({ time = '9:41', children }: DeviceFrameProps) {
  // Detect small viewport via CSS — we use a media-query class approach.
  // The outer wrapper is always rendered; the frame is hidden on narrow screens.

  const statusBarStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: STATUS_H,
    display: 'flex',
    alignItems: 'flex-end',
    paddingBottom: '12px',
    paddingLeft: '24px',
    paddingRight: '20px',
    justifyContent: 'space-between',
    color: 'var(--text-primary)',
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '-0.3px',
    zIndex: 10,
    pointerEvents: 'none',
    userSelect: 'none',
  }

  const dynamicIslandStyle: CSSProperties = {
    position: 'absolute',
    top: DI_TOP,
    left: '50%',
    transform: 'translateX(-50%)',
    width: DI_W,
    height: DI_H,
    background: '#000000',
    borderRadius: 999,
    zIndex: 20,
    pointerEvents: 'none',
  }

  const homeIndicatorStyle: CSSProperties = {
    position: 'absolute',
    bottom: HOME_BOTTOM,
    left: '50%',
    transform: 'translateX(-50%)',
    width: HOME_W,
    height: HOME_H,
    background: 'var(--text-primary)',
    borderRadius: 999,
    opacity: 0.2,
    zIndex: 10,
    pointerEvents: 'none',
  }

  const contentStyle: CSSProperties = {
    position: 'absolute',
    top: SAFE_TOP,
    left: 0,
    right: 0,
    bottom: 0, // content runs under the home indicator; bars add var(--sab) themselves
    overflow: 'hidden',
    overflowY: 'auto',
  }

  const overlayStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 60,
    pointerEvents: 'none',
  }

  return (
    <>
      {/* ---- Desktop frame (≥ 431 px wide) ---- */}
      <div
        className="device-frame-desktop"
        style={{
          ['--sab' as string]: `${SAFE_BOTTOM}px`,
          position: 'relative',
          width: DEVICE_W,
          height: DEVICE_H,
          background: 'var(--bg-surface)',
          borderRadius: 52,
          boxShadow:
            '0 0 0 1.5px rgba(0,0,0,0.12), 0 24px 64px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.6)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Status bar */}
        <div style={statusBarStyle} aria-hidden>
          <span>{time}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>

        {/* Dynamic Island */}
        <div style={dynamicIslandStyle} aria-hidden />

        {/* Content */}
        <div style={contentStyle}>{children}</div>

        {/* Frame-level overlay (iOS banners slide over the status bar) */}
        <div data-frame-overlay style={overlayStyle} />

        {/* Home indicator */}
        <div style={homeIndicatorStyle} aria-hidden />
      </div>

      {/* ---- Full-screen mode (≤ 430 px wide real device) ---- */}
      <div
        className="device-frame-mobile"
        style={{
          display: 'none', // shown via CSS media query below
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          paddingTop: 'env(safe-area-inset-top, var(--safe-top))',
          // bottom inset is owned by bars via --sab (no double inset)
          ['--sab' as string]: 'env(safe-area-inset-bottom, 0px)',
          background: 'var(--bg-surface)',
          overflow: 'hidden',
        }}
      >
        {children}
        <div data-frame-overlay style={overlayStyle} />
      </div>

      {/* Responsive breakpoint styles injected as a style tag */}
      <style>{`
        @media (max-width: ${BREAKPOINT}px) {
          .device-frame-desktop { display: none !important; }
          /* Full-screen: sized from --app-h (100dvh standalone; the demo stage's app viewport
             sets it to the height left under its demo bar, 07b). Never 100vh. */
          .device-frame-mobile  { display: flex !important; position: fixed; top: 0; left: 0; right: 0; height: var(--app-h, 100dvh); }
        }
      `}</style>
    </>
  )
}
