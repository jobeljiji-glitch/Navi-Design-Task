import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Every route is its own chunk (D-102): the demo stage, the two flows, the component kit and the
// dev overlay load on demand, so the entry chunk is only React, the router and the store.
const DemoStage = lazy(() => import('@/demo/DemoStage'))
const RohanFlow = lazy(() => import('@/screens/rohan/RohanFlow'))
const FriendFlow = lazy(() => import('@/screens/friend/FriendFlow'))
const KitPage = lazy(() => import('@/screens/KitPage'))
const ReferenceOverlay = lazy(() => import('@/dev/ReferenceOverlay'))

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-page" />}>
      <Routes>
        <Route path="/" element={<DemoStage />} />
        <Route path="/rohan/*" element={<RohanFlow />} />
        <Route path="/rohan" element={<RohanFlow />} />
        <Route path="/friend/:name" element={<FriendFlow />} />
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
