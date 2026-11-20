import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'motion/react'

// Every route is its own chunk (D-102): the demo stage, the two flows, the component kit and the
// dev overlay load on demand, so the entry chunk is only React, the router and the store.
const DemoStage = lazy(() => import('@/demo/DemoStage'))
const RohanFlow = lazy(() => import('@/screens/rohan/RohanFlow'))
const FriendFlow = lazy(() => import('@/screens/friend/FriendFlow'))
const KitPage = lazy(() => import('@/screens/KitPage'))
// 08: dev only. In production `import.meta.env.DEV` is false, so the import is dropped from the bundle.
const ReferenceOverlay = import.meta.env.DEV ? lazy(() => import('@/dev/ReferenceOverlay')) : () => null

export default function App() {
  return (
    // 08: every route honours the system "Reduce motion" setting (sheets, banners, coach marks)
    <MotionConfig reducedMotion="user">
    <Suspense fallback={<div className="min-h-[var(--app-h)] bg-bg-page" />}>
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
                minHeight: 'var(--app-h)',
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
    </MotionConfig>
  )
}
