import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, FastForward, X } from 'lucide-react'
import { TOUR_LENGTH, type TourStep } from '@/logic/tour'

/**
 * 07 coach bubble: anchored to the real UI, never covering it.
 * - The anchor is the first visible `[data-tour~=id]` / `[data-testid=id]` on the phone (priority order).
 * - Placement: beside the phone on wide screens, else below/above the anchor; the first spot that
 *   fits the viewport without touching the anchor wins (D-097).
 * - A ring marks the anchor; it ignores pointer events so the real element stays tappable.
 * - Keyboard: focus moves to the bubble on each step; Esc skips, ←/→ go back/next.
 */

type Rect = { left: number; top: number; width: number; height: number }
const GAP = 14
const ANCHOR_WAIT_MS = 15000
const EDGE = 12

/** The phone screen that is actually on screen (DeviceFrame renders a framed and a full-screen copy). */
export function visiblePhone(): HTMLElement | null {
  const frames = document.querySelectorAll<HTMLElement>('[data-phone] .device-frame-desktop, [data-phone] .device-frame-mobile')
  for (const f of frames) {
    const r = f.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return f
  }
  return null
}

export function findAnchor(ids: string[]): HTMLElement | null {
  const phone = visiblePhone()
  if (!phone) return null
  for (const id of ids) {
    const els = phone.querySelectorAll<HTMLElement>(`[data-tour~="${id}"], [data-testid="${id}"]`)
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el
    }
  }
  return null
}

function intersect(a: Rect, b: Rect): Rect | null {
  const left = Math.max(a.left, b.left)
  const top = Math.max(a.top, b.top)
  const right = Math.min(a.left + a.width, b.left + b.width)
  const bottom = Math.min(a.top + a.height, b.top + b.height)
  return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null
}

type Side = 'right' | 'left' | 'below' | 'above' | 'free'
interface Placement {
  x: number
  y: number
  side: Side
  /** arrow offset along the bubble edge */
  arrow: number
}

function place(anchor: Rect | null, phone: Rect | null, w: number, h: number, W: number, H: number): Placement {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  if (!anchor) {
    // Nothing to point at yet (screen still loading): park at the bottom of the phone / beside it.
    if (phone && W >= 1024) return { x: phone.left + phone.width + 28, y: clamp(phone.top + 120, EDGE, H - h - EDGE), side: 'free', arrow: 0 }
    return { x: clamp((W - w) / 2, EDGE, W - w - EDGE), y: H - h - 96, side: 'free', arrow: 0 }
  }
  const cx = anchor.left + anchor.width / 2
  const cy = anchor.top + anchor.height / 2
  const fitsX = (x: number) => x >= EDGE && x + w <= W - EDGE
  const fitsY = (y: number) => y >= EDGE && y + h <= H - EDGE
  const yBeside = clamp(cy - h / 2, EDGE, H - h - EDGE)
  const arrowY = clamp(cy - yBeside, 18, h - 18)

  // Wide screens: beside the phone, so the bubble is never on top of it.
  if (phone && W >= 1024) {
    const xr = phone.left + phone.width + 28
    if (fitsX(xr)) return { x: xr, y: yBeside, side: 'right', arrow: arrowY }
    const xl = phone.left - 28 - w
    if (fitsX(xl)) return { x: xl, y: yBeside, side: 'left', arrow: arrowY }
  }
  const x = clamp(cx - w / 2, EDGE, W - w - EDGE)
  const arrowX = clamp(cx - x, 18, w - 18)
  const below = anchor.top + anchor.height + GAP
  const above = anchor.top - GAP - h
  const spaceBelow = H - (anchor.top + anchor.height)
  const spaceAbove = anchor.top
  const order: Array<['below' | 'above', number]> = spaceBelow >= spaceAbove ? [['below', below], ['above', above]] : [['above', above], ['below', below]]
  for (const [side, y] of order) if (fitsY(y)) return { x, y, side, arrow: arrowX }
  // Beside the anchor (tall anchors on tablets).
  const xr = anchor.left + anchor.width + GAP
  if (fitsX(xr)) return { x: xr, y: yBeside, side: 'right', arrow: arrowY }
  const xl = anchor.left - GAP - w
  if (fitsX(xl)) return { x: xl, y: yBeside, side: 'left', arrow: arrowY }
  // Last resort: the larger gap, pinned to the screen edge (may touch a very tall anchor).
  return spaceBelow >= spaceAbove
    ? { x, y: H - h - EDGE, side: 'below', arrow: arrowX }
    : { x, y: EDGE, side: 'above', arrow: arrowX }
}

const same = (a: Rect | null, b: Rect | null) =>
  a === b || (!!a && !!b && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5)

export default function CoachBubble({
  step,
  index,
  hidden,
  onNext,
  onBack,
  onSkip,
}: {
  step: TourStep
  index: number
  hidden?: boolean
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<Rect | null>(null)
  const [phone, setPhone] = useState<Rect | null>(null)
  const [size, setSize] = useState({ w: 320, h: 180, W: window.innerWidth, H: window.innerHeight })
  const scrolledFor = useRef<string | null>(null)
  // Until the anchor is on screen (a screen still loading, the settlement animation), the bubble waits,
  // so it never describes something that isn't there yet. After ANCHOR_WAIT_MS it shows anyway.
  const [waiting, setWaiting] = useState(true)

  // Track the anchor every frame (screens animate, sheets slide, the clock re-renders).
  useEffect(() => {
    let raf = 0
    let lastA: Rect | null | undefined = undefined // undefined: force the first frame to publish
    let lastP: Rect | null | undefined = undefined
    const started = performance.now()
    setWaiting(true)
    const tick = () => {
      const el = findAnchor(step.anchors)
      const ph = visiblePhone()
      const pr = ph ? ph.getBoundingClientRect() : null
      const p: Rect | null = pr ? { left: pr.left, top: pr.top, width: pr.width, height: pr.height } : null
      let a: Rect | null = null
      if (el) {
        const key = `${index}:${el.getAttribute('data-tour') ?? el.getAttribute('data-testid')}`
        if (scrolledFor.current !== key) {
          scrolledFor.current = key
          el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }
        const r = el.getBoundingClientRect()
        const raw = { left: r.left, top: r.top, width: r.width, height: r.height }
        a = p ? intersect(raw, p) : raw
      }
      if (a || performance.now() - started > ANCHOR_WAIT_MS) setWaiting(false)
      if (lastA === undefined || !same(a, lastA)) {
        lastA = a
        setAnchor(a)
      }
      if (lastP === undefined || !same(p, lastP)) {
        lastP = p
        setPhone(p)
      }
      const b = bubbleRef.current
      if (b && b.offsetWidth > 0) {
        const w = b.offsetWidth
        const h = b.offsetHeight
        setSize((s) => (s.w === w && s.h === h && s.W === window.innerWidth && s.H === window.innerHeight ? s : { w, h, W: window.innerWidth, H: window.innerHeight }))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step, index])

  // Focus the bubble on each new step (keyboard and screen-reader users land on it).
  useLayoutEffect(() => {
    if (!hidden && !waiting) bubbleRef.current?.focus({ preventScroll: true })
  }, [index, hidden, waiting])
  const off = hidden || waiting

  // Esc skips, → / ← are Next / Back while focus is in the bubble or nowhere in particular
  // (between steps the new bubble may not have focus yet).
  const keys = useRef({ onNext, onBack, onSkip, index })
  keys.current = { onNext, onBack, onSkip, index }
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const a = document.activeElement
      if (a && a !== document.body && !bubbleRef.current?.contains(a)) return
      const k = keys.current
      if (e.key === 'Escape') k.onSkip()
      else if (e.key === 'ArrowRight') k.onNext()
      else if (e.key === 'ArrowLeft' && k.index > 0) k.onBack()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pos = place(anchor, phone, size.w, size.h, size.W, size.H)
  const titleId = `coach-title-${index}`

  return (
    <>
      {anchor && !off && (
        <div
          aria-hidden
          className="coach-ring fixed pointer-events-none z-[90] rounded-[10px]"
          style={{
            // 4 pt outside the anchor, but never off the screen edge
            left: Math.max(3, anchor.left - 4),
            top: Math.max(3, anchor.top - 4),
            width: Math.min(size.W - 3, anchor.left + anchor.width + 4) - Math.max(3, anchor.left - 4),
            height: Math.min(size.H - 3, anchor.top + anchor.height + 4) - Math.max(3, anchor.top - 4),
            boxShadow: '0 0 0 2px var(--coach-ring), 0 0 0 7px var(--coach-glow)',
          }}
          data-testid="coach-ring"
        />
      )}
      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="coach-bubble"
        data-side={pos.side}
        data-stage-overlay
        className="fixed z-[95] w-[min(340px,calc(100vw-24px))] rounded-[14px] p-4 flex flex-col gap-2 outline-none coach-bubble"
        style={{ display: off ? 'none' : undefined, left: pos.x, top: pos.y, backgroundColor: 'var(--stage-panel)', boxShadow: 'var(--coach-shadow)', color: 'var(--text-primary)' }}
      >
        <Arrow side={pos.side} offset={pos.arrow} />
        <div className="flex items-center justify-between">
          <span className="text-[12px] leading-[16px] font-medium" style={{ color: 'var(--bms-red-text)' }} data-testid="coach-progress">
            Step {index + 1} of {TOUR_LENGTH}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[44px] -my-3 -mr-2 px-2 flex items-center gap-1 text-[13px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Skip tutorial <X size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <p id={titleId} className="text-[15px] leading-[21px] font-medium">{step.text}</p>
        <p className="text-[13px] leading-[18px]" style={{ color: 'var(--text-secondary)' }} data-testid="coach-why">
          {step.why}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          {index > 0 ? (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] px-2 -ml-2 flex items-center gap-1 text-[14px] font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden /> Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onNext}
            className="min-h-[44px] px-4 rounded-[6px] text-[14px] font-medium inline-flex items-center"
            style={{ backgroundColor: 'var(--bms-red-strong)', color: 'var(--text-on-brand)' }}
            data-testid="coach-next"
          >
            {step.nextLabel?.startsWith('⏩') ? (
              <span className="inline-flex items-center gap-1.5">
                <FastForward size={16} strokeWidth={1.75} aria-hidden /> {step.nextLabel.replace('⏩ ', '')}
              </span>
            ) : (
              step.nextLabel ?? 'Next'
            )}
          </button>
        </div>
      </div>
      {/* Screen readers hear each step once */}
      <div className="sr-only" aria-live="polite">
        {off ? '' : `Step ${index + 1} of ${TOUR_LENGTH}. ${step.text}`}
      </div>
    </>
  )
}

function Arrow({ side, offset }: { side: Side; offset: number }) {
  if (side === 'free') return null
  const base = 'absolute w-3 h-3 rotate-45'
  const style = { backgroundColor: 'var(--stage-panel)' }
  if (side === 'below') return <span aria-hidden className={base} style={{ ...style, top: -6, left: offset - 6 }} />
  if (side === 'above') return <span aria-hidden className={base} style={{ ...style, bottom: -6, left: offset - 6 }} />
  if (side === 'right') return <span aria-hidden className={base} style={{ ...style, left: -6, top: offset - 6 }} />
  return <span aria-hidden className={base} style={{ ...style, right: -6, top: offset - 6 }} />
}
