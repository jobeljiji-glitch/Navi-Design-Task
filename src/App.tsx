import { Routes, Route } from 'react-router-dom'
import DeviceFrame from '@/demo/DeviceFrame'
import ReferenceOverlay from '@/dev/ReferenceOverlay'

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

function RohanPlaceholder() {
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
        <span style={{ fontSize: '14px', fontWeight: 500 }}>Rohan's screen</span>
        <span style={{ fontSize: '12px' }}>Coming soon</span>
      </div>
    </DeviceFrame>
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

import KitPage from '@/screens/KitPage'

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DemoStage />} />
        <Route path="/rohan" element={<RohanPlaceholder />} />
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
    </>
  )
}
