import { useEffect, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { Route, Routes, useSearchParams } from 'react-router-dom'
import RohanFlow from '@/screens/rohan/RohanFlow'
import FriendFlow from '@/screens/friend/FriendFlow'
import { useDemoStore } from '@/store'
import { useStageStore } from '@/store/stage'
import { MOMENTS, TOUR_STEPS, type MomentId } from '@/logic/tour'
import PhoneRouter from './PhoneRouter'
import CoachBubble from './CoachBubble'
import ExploreChips from './ExploreChips'
import { DoneCard, Interstitial, Intro } from './Overlays'
import { ControlPanel, StoryPanel } from './Panels'
import { advanceFrom, backStep, exploreFreely, jumpTo, jumpToMoment, nextStep, skipTour } from './stageActions'

const DEVICE_W = 402
const DEVICE_H = 874

function useMedia(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}

function useViewportHeight() {
  const [h, setH] = useState(window.innerHeight)
  useEffect(() => {
    const on = () => setH(window.innerHeight)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return h
}

/**
 * `#/` demo stage (07). One phone that changes hands as the story moves (D-093).
 * ≥ 1024 px: story steps · phone · controls. Narrower: the phone (full-screen on an iPhone)
 * with the bubble and explore chips as overlays.
 */
export default function DemoStage() {
  const [params] = useSearchParams()
  const { mode, step, interstitial, phoneKey } = useStageStore()
  const wide = useMedia('(min-width: 1024px)')
  const framed = useMedia('(min-width: 431px)')
  const vh = useViewportHeight()
  const scale = framed ? Math.min(1, (vh - 32) / DEVICE_H) : 1

  // Deep links: `?step=8` (tour at step 8), `?explore=1[&moment=receipt]`. Once per distinct query
  // (the ref also absorbs StrictMode's second effect run).
  const linked = useRef<string | null>(null)
  const query = params.toString()
  useEffect(() => {
    if (linked.current === query) return
    linked.current = query
    const st = Number(params.get('step'))
    if (st >= 1) jumpTo(st - 1)
    else if (params.get('explore') === '1') {
      exploreFreely()
      const m = params.get('moment') as MomentId | null
      if (m && MOMENTS.some((x) => x.id === m)) jumpToMoment(m)
    }
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance when the user makes the highlighted tap themselves.
  const demo = useDemoStore()
  const path = useStageStore((s) => s.path)
  useEffect(() => {
    if (mode !== 'tour') return
    const s = TOUR_STEPS[step]
    if (s?.done?.(demo, path)) advanceFrom(step)
  }, [demo, path, mode, step])

  const phone = (
    <div
      data-phone
      className="relative shrink-0"
      style={framed ? { width: DEVICE_W * scale, height: DEVICE_H * scale } : undefined}
    >
      <div className="relative" style={framed && scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top left', width: DEVICE_W, height: DEVICE_H } : undefined}>
        <PhoneRouter key={phoneKey} initialPath={useStageStore.getState().path} onPath={(p) => useStageStore.setState({ path: p })} isCurrent={() => useStageStore.getState().phoneKey === phoneKey}>
          <Routes>
            <Route path="/friend/:name" element={<FriendFlow />} />
            <Route path="*" element={<RohanFlow />} />
          </Routes>
        </PhoneRouter>
        <Interstitial text={interstitial} />
      </div>
    </div>
  )

  const tourStep = mode === 'tour' ? TOUR_STEPS[step] : null

  // While the intro is open, everything behind it is inert (keyboard and screen readers stay in the dialog).
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    if (mode === 'intro') el.setAttribute('inert', '')
    else el.removeAttribute('inert')
  }, [mode])

  return (
    <MotionConfig reducedMotion="user">
      <div className="demo-stage min-h-[100dvh] w-full" style={{ backgroundColor: 'var(--stage-bg)', color: 'var(--text-primary)' }} data-mode={mode}>
        <div ref={bodyRef}>
        {wide ? (
          <div className="grid h-[100dvh] gap-6 px-6" style={{ gridTemplateColumns: 'minmax(220px, 280px) auto minmax(260px, 320px)' }}>
            <div className="overflow-y-auto py-6 no-scrollbar">
              <StoryPanel />
            </div>
            <div className="flex items-center justify-center">{phone}</div>
            <div className="overflow-y-auto py-6 no-scrollbar">
              <ControlPanel top={mode === 'done' ? <DoneCard wide /> : undefined} />
            </div>
          </div>
        ) : (
          <div className="min-h-[100dvh] flex items-center justify-center px-4">
            {phone}
            {(mode === 'explore' || mode === 'done') && <ExploreChips />}
            {mode === 'done' && <DoneCard wide={false} />}
          </div>
        )}
        </div>

        {tourStep && (
          <CoachBubble key={step} step={tourStep} index={step} hidden={!!interstitial} onNext={nextStep} onBack={backStep} onSkip={skipTour} />
        )}
        {mode === 'intro' && <Intro />}
      </div>
    </MotionConfig>
  )
}
