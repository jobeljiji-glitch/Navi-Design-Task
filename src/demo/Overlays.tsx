import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useDemoStore } from '@/store'
import { INTRO, TOUR_DONE, selectTourPayoff } from '@/logic/tour'
import { dismissInterstitial, exploreFreely, restartDemo, startTour } from './stageActions'

/** "Meanwhile, on Amit's phone… 📱": covers the phone (framed) or the whole screen (iPhone). Tap to skip. */
export function Interstitial({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.button
          key={text}
          type="button"
          onClick={dismissInterstitial}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="stage-interstitial z-[80] flex flex-col items-center justify-center gap-3 px-8 text-center"
          style={{ backgroundColor: 'var(--stage-ink)', color: 'var(--stage-ink-text)' }}
          data-testid="interstitial"
          aria-label={`${text} Tap to continue`}
        >
          <motion.span
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.3 }}
            className="text-[22px] leading-[30px] font-medium text-balance"
            role="status"
          >
            {text}
          </motion.span>
          <span className="text-[13px] leading-[18px]" style={{ color: 'var(--stage-ink-muted)' }}>
            Tap to skip
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

/** Step 0: the problem in one line, then the two ways in. */
export function Intro() {
  const startRef = useRef<HTMLButtonElement>(null)
  useEffect(() => startRef.current?.focus(), [])
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--scrim)', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      data-stage-overlay
    >
      <motion.div
        role="dialog"
        aria-labelledby="intro-title"
        aria-describedby="intro-sub"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-[370px] rounded-[16px] p-6 flex flex-col gap-5"
        style={{ backgroundColor: 'var(--stage-panel)', boxShadow: 'var(--coach-shadow)', color: 'var(--text-primary)' }}
        data-card
        data-testid="intro"
      >
        <div className="flex flex-col gap-2">
          <span className="text-[12px] leading-[16px] font-medium tracking-wide uppercase" style={{ color: 'var(--bms-red-text)' }}>
            Group Hold · prototype
          </span>
          <h1 id="intro-title" className="text-[22px] leading-[28px] font-medium text-balance">
            {INTRO.problem}
          </h1>
          <p id="intro-sub" className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>
            A 2-minute walk through one Friday night, on Rohan's and his friends' phones. No real payments.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            ref={startRef}
            type="button"
            onClick={startTour}
            className="h-12 rounded-[6px] text-[16px] font-medium"
            style={{ backgroundColor: 'var(--bms-red-strong)', color: 'var(--text-on-brand)' }}
          >
            {INTRO.start}
          </button>
          <button
            type="button"
            onClick={exploreFreely}
            className="h-12 rounded-[6px] text-[16px] font-medium"
            style={{ border: '1px solid var(--bms-red-strong)', color: 'var(--bms-red-text)' }}
          >
            {INTRO.explore}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/** After step 14: the payoff in three numbers, all from selectors. */
export function DoneCard({ wide }: { wide: boolean }) {
  const state = useDemoStore()
  const payoff = selectTourPayoff(state)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => ref.current?.focus({ preventScroll: true }), [])
  if (!payoff) return null
  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-labelledby="done-line"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300, delay: 0.4 }}
      className={`${wide ? 'w-full' : 'fixed left-3 right-3 z-[95]'} rounded-[14px] p-4 flex flex-col gap-3 outline-none`}
      style={{
        backgroundColor: 'var(--stage-panel)',
        boxShadow: 'var(--coach-shadow)',
        color: 'var(--text-primary)',
        ...(wide ? {} : { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }),
      }}
      data-stage-overlay
      data-card
      data-testid="done-card"
    >
      <ul className="flex flex-col">
        {payoff.rows.map((r, i) => (
          <li
            key={r}
            className="py-2 text-[15px] leading-[20px] font-medium"
            style={i ? { borderTop: '1px solid var(--divider)' } : undefined}
            data-testid={`payoff-${i}`}
          >
            {r}
          </li>
        ))}
      </ul>
      <p id="done-line" className="text-[14px] leading-[20px]" style={{ color: 'var(--text-success)' }}>
        {payoff.line}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={exploreFreely}
          className="h-11 rounded-[6px] text-[14px] font-medium"
          style={{ border: '1px solid var(--bms-red-strong)', color: 'var(--bms-red-text)' }}
        >
          {TOUR_DONE.explore}
        </button>
        <button
          type="button"
          onClick={() => restartDemo(true)}
          className="h-11 rounded-[6px] text-[14px] font-medium"
          style={{ backgroundColor: 'var(--bms-red-strong)', color: 'var(--text-on-brand)' }}
        >
          {TOUR_DONE.restart}
        </button>
      </div>
    </motion.div>
  )
}
