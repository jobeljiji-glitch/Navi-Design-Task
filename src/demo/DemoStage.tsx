import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import { useTopChrome } from './useTopChrome'
import { advanceFrom, backStep, exploreFreely, jumpTo, jumpToMoment, nextStep, openPhoneAt, skipTour } from './stageActions'

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
 * Demo bar open/closed on a phone, remembered for the session (07b). The tour starts collapsed
 * (its bubble has the controls); explore starts open. Each remembers the viewer's last choice.
 */
function useBarState(mode: string): [boolean, () => void] {
  const key = mode === 'tour' ? 'demoBar:tour' : 'demoBar:explore'
  const read = () => {
    try {
      const v = sessionStorage.getItem(key)
      if (v === 'open' || v === 'closed') return v === 'open'
    } catch {
      /* storage blocked: use the default */
    }
    return mode !== 'tour'
  }
  const [open, setOpen] = useState(read)
  useEffect(() => setOpen(read()), [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = () =>
    setOpen((o) => {
      try {
        sessionStorage.setItem(key, o ? 'closed' : 'open')
      } catch {
        /* ignore */
      }
      return !o
    })
  return [open, toggle]
}

/**
 * `#/` demo stage (07). One phone that changes hands as the story moves (D-093).
 * ≥ 1024 px: story steps · phone · controls. 431–1023 px: the framed phone with floating chips.
 * ≤ 430 px (07b, D-106): a 100dvh column [demo bar][app viewport]; the app gets the rest.
 */
export default function DemoStage() {
  const [params] = useSearchParams()
  const { mode, step, interstitial, phoneKey } = useStageStore()
  const wide = useMedia('(min-width: 1024px)')
  const framed = useMedia('(min-width: 431px)')
  const vh = useViewportHeight()
  const scale = framed ? Math.min(1, (vh - 32) / DEVICE_H) : 1

  // Deep links: `?step=8` (tour at step 8), `?explore=1[&moment=receipt][&phone=/rohan/confirm]`.
  // Once per distinct query (the ref also absorbs StrictMode's second effect run).
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
      const ph = params.get('phone')
      if (ph && /^\/(rohan|friend)\//.test(ph)) openPhoneAt(ph)
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

  const phoneContent = (
    <>
      <PhoneRouter
        key={phoneKey}
        initialPath={useStageStore.getState().path}
        onPath={(p) => useStageStore.setState({ path: p })}
        isCurrent={() => useStageStore.getState().phoneKey === phoneKey}
      >
        <Routes>
          <Route path="/friend/:name" element={<FriendFlow />} />
          <Route path="*" element={<RohanFlow />} />
        </Routes>
      </PhoneRouter>
      <Interstitial text={interstitial} />
    </>
  )

  // Framed phone (≥ 431 px): 402 × 874, scaled to fit the height.
  const framedPhone = (
    <div data-phone className="relative shrink-0" style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }}>
      <div
        className="relative"
        style={{ width: DEVICE_W, height: DEVICE_H, ...(scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top left' } : {}) }}
      >
        {phoneContent}
      </div>
    </div>
  )

  // Phone (≤ 430 px): the app viewport takes whatever height the demo bar leaves; its measured
  // height is published as --app-h on the stage column (screens, sheets, popovers read it).
  const [barOpen, toggleBar] = useBarState(mode)
  const showBar = mode !== 'intro'
  const columnRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const app = appRef.current
    const col = columnRef.current
    if (!app || !col) return
    const set = () => col.style.setProperty('--app-h', `${app.clientHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(app)
    return () => ro.disconnect()
  }, [framed, wide])

  const tourStep = mode === 'tour' ? TOUR_STEPS[step] : null

  // 07c: browser chrome colour = whatever is at the top of the page.
  const topSource = framed ? 'stage' : mode === 'intro' || (showBar && barOpen) ? 'bar' : 'screen'
  useTopChrome(topSource, [path, phoneKey, interstitial, step])

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
      <div className="demo-stage w-full" style={{ backgroundColor: 'var(--stage-bg)', color: 'var(--text-primary)' }} data-mode={mode}>
        <div ref={bodyRef}>
          {wide ? (
            <div className="grid h-[var(--app-h)] gap-6 px-6" style={{ gridTemplateColumns: 'minmax(220px, 280px) auto minmax(260px, 320px)' }}>
              <div className="overflow-y-auto py-6 no-scrollbar">
                <StoryPanel />
              </div>
              <div className="flex items-center justify-center">{framedPhone}</div>
              <div className="overflow-y-auto py-6 no-scrollbar">
                <ControlPanel top={mode === 'done' ? <DoneCard wide /> : undefined} />
              </div>
            </div>
          ) : framed ? (
            <div className="min-h-[var(--app-h)] flex items-center justify-center px-4">
              {framedPhone}
              {(mode === 'explore' || mode === 'done') && <ExploreChips layout="float" />}
              {mode === 'done' && <DoneCard wide={false} />}
            </div>
          ) : (
            <div ref={columnRef} className="stage-column flex flex-col overflow-hidden" style={{ height: '100dvh' }} data-testid="stage-column">
              {showBar && barOpen && <ExploreChips layout="bar" onToggle={toggleBar} />}
              <div
                ref={appRef}
                data-phone
                className="stage-app relative flex-1 min-h-0 overflow-hidden"
                data-bar={showBar && barOpen ? 'open' : 'closed'}
                data-testid="stage-app"
              >
                {phoneContent}
              </div>
              {showBar && !barOpen && <ExploreChips layout="pill" onToggle={toggleBar} />}
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
