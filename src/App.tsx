import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import DeviceFrame from '@/demo/DeviceFrame'
import RohanFlow from '@/screens/rohan/RohanFlow'

// Lazy-loaded routes to minimize main production bundle size
const KitPage = lazy(() => import('@/screens/KitPage'))
const ReferenceOverlay = lazy(() => import('@/dev/ReferenceOverlay'))

// ---------------------------------------------------------------------------
// Placeholder screens
// ---------------------------------------------------------------------------

function DemoStage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '48px',
        padding: '32px',
        background: 'var(--bg-page)',
        flexWrap: 'wrap',
      }}
    >
      <DeviceFrame time="9:41">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '8px',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Rohan's phone</span>
          <span style={{ fontSize: '12px' }}>Demo stage placeholder</span>
        </div>
      </DeviceFrame>

      <DeviceFrame time="9:41">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '8px',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Friend's phone</span>
          <span style={{ fontSize: '12px' }}>Demo stage placeholder</span>
        </div>
      </DeviceFrame>
    </div>
  )
}

function FriendPlaceholder() {
  return (
    <DeviceFrame time="9:41">
      <div
        style={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '8px',
          color: 'var(--text-secondary)',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 500 }}>Friend's screen</span>
        <span style={{ fontSize: '12px' }}>Coming soon</span>
      </div>
    </DeviceFrame>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-page" />}>
      <Routes>
        <Route path="/" element={<DemoStage />} />
        <Route path="/rohan/*" element={<RohanFlow />} />
        <Route path="/rohan" element={<RohanFlow />} />
        <Route path="/friend/:name" element={<FriendPlaceholder />} />
        <Route
          path="/kit"
          element={
            <div
              style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
                background: 'var(--bg-page)',
              }}
            >
              <KitPage />
            </div>
          }
        />
      </Routes>
      <ReferenceOverlay />
    </Suspense>
  )
}
