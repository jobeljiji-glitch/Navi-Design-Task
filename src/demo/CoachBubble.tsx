import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, FastForward, Minus, X } from 'lucide-react'
import { TOUR_LENGTH, type TourStep } from '@/logic/tour'

/**
 * 07/09 coach bubble: anchored to the real UI, never covering it.
 * - The anchor is the first visible `[data-tour~=id]` / `[data-testid=id]` on the phone (priority order).
 * - Placement (09): beside the phone on wide screens (never on it). On a phone, the emptiest region that
 *   intersects neither the anchor, the pinned CTA footer nor an open sheet's content; if none fits, the
 *   bubble collapses to a small "Step 4/14 ›" pill at the screen edge instead of covering anything.
 * - Minimise (–) collapses it to the same pill; tap the pill to restore. The choice carries across steps.
 * - A ring marks the anchor; it ignores pointer events so the real element stays tappable.
 * - Keyboard: focus moves to the bubble on each step; Esc skips, ←/→ go back/next.
 */

type Rect = { left: number; top: number; width: number; height: number }
const GAP = 14
const ANCHOR_WAIT_MS = 15000
const EDGE = 12

/** The user's minimise choice survives the per-step remount (the stage keys the bubble by step). */
let minimisedPref = false

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

/**
 * Bring the anchor into view by scrolling only real scroll containers (overflow auto/scroll).
 * `scrollIntoView` also scrolls overflow-hidden wrappers, which shifted open sheets off their bottom edge (09).
 */
function revealAnchor(el: HTMLElement) {
  let p = el.parentElement
  while (p) {
    const oy = getComputedStyle(p).overflowY
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) {
      const pr = p.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      if (r.top < pr.top) p.scrollTop -= pr.top - r.top + 8
      else if (r.bottom > pr.bottom) p.scrollTop += Math.min(r.bottom - pr.bottom + 8, r.top - pr.top - 8)
      return
    }
    p = p.parentElement
  }
}

/**
 * Rects the bubble must never cover: the pinned CTA footer and any open sheet's content (09).
 * A footer that contains the anchor (the tour points at the CTA itself) is left out; sheet content never is.
 */
function avoidRects(phone: HTMLElement | null, anchorEl: HTMLElement | null): Rect[] {
  if (!phone) return []
  const out: Rect[] = []
  for (const el of phone.querySelectorAll<HTMLElement>('[data-pinned-footer], [data-sheet-body], [data-testid="share-sheet"]')) {
    if (anchorEl && el.hasAttribute('data-pinned-footer') && el.contains(anchorEl)) continue
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) out.push({ left: r.left, top: r.top, width: r.width, height: r.height })
  }
  return out
}

function intersect(a: Rect, b: Rect): Rect | null {
  const left = Math.max(a.left, b.left)
  const top = Math.max(a.top, b.top)
  const right = Math.min(a.left + a.width, b.left + b.width)
  const bottom = Math.min(a.top + a.height, b.top + b.height)
  return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null
}

type Side = 'right' | 'left' | 'below' | 'above' | 'free' | 'none'
interface Placement {
  x: number
  y: number
  side: Side
  /** arrow offset along the bubble edge */
  arrow: number
}

function place(anchor: Rect | null, phone: Rect | null, avoid: Rect[], w: number, h: number, W: number, H: number): Placement {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const wide = !!phone && W >= 1024
  // Wide screens: beside the phone, never on it.
  if (wide && phone) {
    const cy = anchor ? anchor.top + anchor.height / 2 : phone.top + 160
    const y = clamp(cy - h / 2, EDGE, H - h - EDGE)
    const arrow = anchor ? clamp(cy - y, 18, h - 18) : 0
    const side: Side = anchor ? 'right' : 'free'
    const xr = phone.left + phone.width + 28
    if (xr + w <= W - EDGE) return { x: xr, y, side, arrow }
    const xl = phone.left - 28 - w
    if (xl >= EDGE) return { x: xl, y, side: anchor ? 'left' : 'free', arrow }
  }
  const blocked = [...(anchor ? [anchor] : []), ...avoid]
  const clear = (x: number, y: number) => {
    const r = { left: x, top: y, width: w, height: h }
    return x >= EDGE && x + w <= W - EDGE && y >= EDGE && y + h <= H - EDGE && blocked.every((b) => !intersect(r, b))
  }
  if (!anchor) {
    // Nothing to point at yet (screen still loading): park where nothing is covered.
    const x = clamp((W - w) / 2, EDGE, W - w - EDGE)
    for (const y of [H - h - 96, EDGE + 56]) if (clear(x, y)) return { x, y, side: 'free', arrow: 0 }
    return { x, y: H - h - 96, side: 'none', arrow: 0 }
  }
  const cx = anchor.left + anchor.width / 2
  const cy = anchor.top + anchor.height / 2
  const x = clamp(cx - w / 2, EDGE, W - w - EDGE)
  const arrowX = clamp(cx - x, 18, w - 18)
  const yBeside = clamp(cy - h / 2, EDGE, H - h - EDGE)
  const arrowY = clamp(cy - yBeside, 18, h - 18)
  const footerTop = Math.min(H, ...avoid.map((a) => a.top))
  const spaceBelow = footerTop - (anchor.top + anchor.height)
  const spaceAbove = anchor.top
  const nextTo: Array<[Side, number, number]> = [
    ['below', x, anchor.top + anchor.height + GAP],
    ['above', x, anchor.top - GAP - h],
  ]
  if (spaceAbove > spaceBelow) nextTo.reverse()
  for (const [side, cx2, y] of nextTo) if (clear(cx2, y)) return { x: cx2, y, side, arrow: arrowX }
  // Beside the anchor (tall anchors, tablets)
  if (clear(anchor.left + anchor.width + GAP, yBeside)) return { x: anchor.left + anchor.width + GAP, y: yBeside, side: 'right', arrow: arrowY }
  if (clear(anchor.left - GAP - w, yBeside)) return { x: anchor.left - GAP - w, y: yBeside, side: 'left', arrow: arrowY }
  // The emptiest remaining band, no arrow
  const bands = [EDGE + 56, footerTop - GAP - h, (H - h) / 2]
  for (const y of bands) if (clear(x, y)) return { x, y, side: 'free', arrow: 0 }
  // Nowhere clear: collapse to the pill rather than cover anything
  return { x, y: EDGE, side: 'none', arrow: 0 }
}

const same = (a: Rect | null, b: Rect | null) =>
  a === b || (!!a && !!b && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5)
const sameList = (a: Rect[], b: Rect[]) => a.length === b.length && a.every((r, i) => same(r, b[i]))

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
  const pillRef = useRef<HTMLButtonElement>(null)
  const [anchor, setAnchor] = useState<Rect | null>(null)
  const [phone, setPhone] = useState<Rect | null>(null)
  const [avoid, setAvoid] = useState<Rect[]>([])
  const [size, setSize] = useState({ w: 320, h: 180, W: window.innerWidth, H: window.innerHeight })
  const [minimised, setMinimised] = useState(minimisedPref)
  /** The user restored the pill although nothing is clear: show the bubble anyway (last resort). */
  const [forced, setForced] = useState(false)
  const scrolledFor = useRef<string | null>(null)
  // Until the anchor is on screen (a screen still loading, the settlement animation), the bubble waits,
  // so it never describes something that isn't there yet. After ANCHOR_WAIT_MS it shows anyway.
  const [waiting, setWaiting] = useState(true)

  const setMin = (m: boolean) => {
    minimisedPref = m
    setMinimised(m)
  }

  // Track the anchor every frame (screens animate, sheets slide, the clock re-renders).
  useEffect(() => {
    let raf = 0
    let lastA: Rect | null | undefined = undefined // undefined: force the first frame to publish
    let lastP: Rect | null | undefined = undefined
    let lastV: Rect[] = []
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
          revealAnchor(el)
        }
        const r = el.getBoundingClientRect()
        const raw = { left: r.left, top: r.top, width: r.width, height: r.height }
        a = p ? intersect(raw, p) : raw
      }
      const v = avoidRects(ph, el)
      if (a || performance.now() - started > ANCHOR_WAIT_MS) setWaiting(false)
      if (lastA === undefined || !same(a, lastA)) {
        lastA = a
        setAnchor(a)
      }
      if (lastP === undefined || !same(p, lastP)) {
        lastP = p
        setPhone(p)
      }
      if (!sameList(v, lastV)) {
        lastV = v
        setAvoid(v)
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

  const auto = place(anchor, phone, avoid, size.w, size.h, size.W, size.H)
  const pos = auto.side === 'none' && forced ? { ...place(anchor, phone, [], size.w, size.h, size.W, size.H), side: 'free' as Side } : auto
  const collapsed = minimised || (auto.side === 'none' && !forced)
  const off = hidden || waiting

  // Focus the bubble (or the pill) on each new step (keyboard and screen-reader users land on it).
  useLayoutEffect(() => {
    if (off) return
    if (collapsed) pillRef.current?.focus({ preventScroll: true })
    else bubbleRef.current?.focus({ preventScroll: true })
  }, [index, off, collapsed])

  // Esc skips, → / ← are Next / Back while focus is in the bubble, on the pill, or nowhere in particular.
  const keys = useRef({ onNext, onBack, onSkip, index })
  keys.current = { onNext, onBack, onSkip, index }
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const a = document.activeElement
      if (a && a !== document.body && !bubbleRef.current?.contains(a) && a !== pillRef.current) return
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

  const titleId = `coach-title-${index}`

  // Pill: beside the phone on wide screens, else on the right screen edge, clear of the anchor and the footer.
  const pillH = 36
  const pillX = phone && size.W >= 1024 ? phone.left + phone.width + 28 : size.W - 8 - 112
  const footerTop = Math.min(size.H, ...avoid.map((a) => a.top))
  const pillYs = [(phone?.top ?? 0) + 64, footerTop - pillH - 12, size.H / 2]
  const pillY =
    pillYs.find((y) => !anchor || !intersect({ left: pillX, top: y, width: 112, height: pillH }, anchor)) ?? pillYs[0]

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
      {!off && collapsed && (
        <button
          ref={pillRef}
          type="button"
          onClick={() => {
            setMin(false)
            setForced(true)
          }}
          className="fixed z-[95] h-11 flex items-center outline-none"
          style={{ left: pillX, top: pillY - 4 }}
          aria-label={`Show tip: step ${index + 1} of ${TOUR_LENGTH}. ${step.text}`}
          data-testid="coach-pill"
          data-stage-overlay
        >
          <span
            className="h-9 pl-3 pr-2 rounded-full flex items-center gap-0.5 text-[13px] leading-none font-medium whitespace-nowrap"
            style={{ backgroundColor: 'var(--stage-panel)', boxShadow: 'var(--coach-shadow)', color: 'var(--bms-red-text)' }}
          >
            Step {index + 1}/{TOUR_LENGTH}
            <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
          </span>
        </button>
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
        style={{
          // Measured while collapsed (visibility hidden) so a restore lands in the right place at once
          display: off ? 'none' : undefined,
          visibility: collapsed ? 'hidden' : undefined,
          pointerEvents: collapsed ? 'none' : undefined,
          left: pos.x,
          top: pos.y,
          backgroundColor: 'var(--stage-panel)',
          boxShadow: 'var(--coach-shadow)',
          color: 'var(--text-primary)',
        }}
        aria-hidden={collapsed || undefined}
      >
        <Arrow side={pos.side} offset={pos.arrow} />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] leading-[16px] font-medium" style={{ color: 'var(--bms-red-text)' }} data-testid="coach-progress">
            Step {index + 1} of {TOUR_LENGTH}
          </span>
          <span className="flex items-center -my-3 -mr-2">
            <button
              type="button"
              onClick={() => setMin(true)}
              className="w-11 h-11 flex items-center justify-center"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Minimise tip"
              data-testid="coach-minimise"
            >
              <Minus size={16} strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="min-h-[44px] px-2 flex items-center gap-1 text-[13px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Skip tutorial <X size={14} strokeWidth={1.75} aria-hidden />
            </button>
          </span>
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
  if (side === 'free' || side === 'none') return null
  const base = 'absolute w-3 h-3 rotate-45'
  const style = { backgroundColor: 'var(--stage-panel)' }
  if (side === 'below') return <span aria-hidden className={base} style={{ ...style, top: -6, left: offset - 6 }} />
  if (side === 'above') return <span aria-hidden className={base} style={{ ...style, bottom: -6, left: offset - 6 }} />
  if (side === 'right') return <span aria-hidden className={base} style={{ ...style, left: -6, top: offset - 6 }} />
  return <span aria-hidden className={base} style={{ ...style, right: -6, top: offset - 6 }} />
}
