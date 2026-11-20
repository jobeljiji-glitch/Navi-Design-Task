import type { ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, FastForward, RotateCcw, Play } from 'lucide-react'
import { useDemoStore } from '@/store'
import { useStageStore } from '@/store/stage'
import { formatClockIST } from '@/logic/holdFlow'
import { INTRO, MOMENTS, PERSONAS, TOUR_STEPS, personaOf } from '@/logic/tour'
import {
  FAILURES,
  clockSkips,
  clockTo,
  jumpTo,
  jumpToMoment,
  plus15,
  restartDemo,
  runFailure,
  startTour,
  switchPersona,
} from './stageActions'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2" aria-label={title}>
      <h2 className="text-[12px] leading-[16px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

const chip = 'min-h-[36px] px-3 rounded-[6px] text-[13px] leading-[18px] text-left disabled:opacity-40'
const chipStyle = { border: '1px solid var(--divider)', color: 'var(--text-primary)', backgroundColor: 'var(--stage-panel)' }

/** Left column (≥ 1024 px): the story, one row per tour step. */
export function StoryPanel() {
  const { mode, step } = useStageStore()
  const touring = mode === 'tour'
  return (
    <nav className="flex flex-col gap-4" aria-label="Story steps">
      <div className="flex flex-col gap-1">
        <span className="text-[12px] leading-[16px] font-medium uppercase tracking-wide" style={{ color: 'var(--bms-red-text)' }}>
          Group Hold · prototype
        </span>
        <p className="text-[15px] leading-[21px] font-medium text-balance">{INTRO.problem}</p>
      </div>
      <ol className="flex flex-col">
        {TOUR_STEPS.map((s, i) => {
          const current = touring && i === step
          const past = (touring && i < step) || mode === 'done'
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => jumpTo(i)}
                aria-current={current ? 'step' : undefined}
                className="w-full min-h-[40px] py-1.5 px-2 -mx-2 rounded-[6px] flex items-center gap-2.5 text-left text-[13px] leading-[18px]"
                style={{
                  backgroundColor: current ? 'var(--bg-success)' : undefined,
                  color: current ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: current ? 500 : 400,
                }}
                data-testid={`story-${i + 1}`}
              >
                <span
                  aria-hidden
                  className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-medium"
                  style={{
                    backgroundColor: past ? 'var(--text-success)' : current ? 'var(--bms-red-strong)' : 'var(--bg-muted)',
                    color: past || current ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                  }}
                >
                  {past ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                </span>
                <span>
                  {s.label}
                  <span className="sr-only"> ({s.persona}'s phone)</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      {(mode === 'explore' || mode === 'done') && (
        <button
          type="button"
          onClick={startTour}
          className="h-11 rounded-[6px] text-[14px] font-medium flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--bms-red-strong)', color: 'var(--text-on-brand)' }}
        >
          <Play size={16} strokeWidth={1.75} aria-hidden /> {INTRO.start}
        </button>
      )}
    </nav>
  )
}

export function PersonaSwitch({ onPick }: { onPick?: () => void }) {
  const path = useStageStore((s) => s.path)
  const current = personaOf(path)
  return (
    <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Whose phone">
      {PERSONAS.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={p === current}
          onClick={() => {
            switchPersona(p)
            onPick?.()
          }}
          className="min-h-[40px] rounded-[6px] text-[13px] font-medium"
          style={
            p === current
              ? { backgroundColor: 'var(--bms-red-strong)', color: 'var(--text-on-brand)' }
              : chipStyle
          }
          data-testid={`persona-${p}`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

export function ClockControls({ onPick }: { onPick?: () => void }) {
  const now = useDemoStore((s) => s.clock.now)
  const skips = clockSkips()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[24px] leading-[30px] font-medium" data-testid="stage-clock">{formatClockIST(now)}</span>
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Fri, 20 Nov · show 9:15 PM</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <button type="button" className={chip} style={chipStyle} onClick={() => { plus15(); onPick?.() }}>
          +15 min
        </button>
        {skips.map((c) => (
          <button
            key={c.label}
            type="button"
            disabled={c.disabled}
            className={`${chip} inline-flex items-center gap-1`}
            style={chipStyle}
            onClick={() => {
              clockTo(c.h, c.m)
              onPick?.()
            }}
            aria-label={`Skip to ${c.label}`}
          >
            <FastForward size={12} strokeWidth={1.75} aria-hidden /> {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MomentList({ onPick }: { onPick?: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {MOMENTS.map((m) => (
        <button
          key={m.id}
          type="button"
          className={chip}
          style={chipStyle}
          onClick={() => {
            jumpToMoment(m.id)
            onPick?.()
          }}
          data-testid={`moment-${m.id}`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

export function FailureList({ onPick }: { onPick?: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {FAILURES.map((f) => (
        <button
          key={f.id}
          type="button"
          className={chip}
          style={chipStyle}
          onClick={() => {
            runFailure(f)
            onPick?.()
          }}
          data-testid={`failure-${f.id}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

function Log() {
  const log = useStageStore((s) => s.log)
  if (!log.length) return <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Nothing yet.</p>
  return (
    <ul className="flex flex-col gap-1" aria-live="polite">
      {log.slice(0, 6).map((l) => (
        <li key={l.id} className="text-[13px] leading-[18px] flex gap-2">
          <span className="shrink-0 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {formatClockIST(l.at)}
          </span>
          <span>{l.text}</span>
        </li>
      ))}
    </ul>
  )
}

/** Right column (≥ 1024 px): persona, clock, moments, failures, log, QR, restart. */
export function ControlPanel({ top }: { top?: ReactNode }) {
  const friendUrl = `${window.location.origin}${window.location.pathname}#/friend/amit`
  return (
    <aside className="flex flex-col gap-5" aria-label="Demo controls">
      {top}
      <Section title="Whose phone">
        <PersonaSwitch />
      </Section>
      <Section title="Clock">
        <ClockControls />
      </Section>
      <Section title="Jump to moment">
        <MomentList />
      </Section>
      <Section title="Try a failure">
        <FailureList />
      </Section>
      <Section title="What just happened">
        <Log />
      </Section>
      <Section title="Amit's link on your phone">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-[6px]" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--divider)' }}>
            <QRCodeSVG value={friendUrl} size={72} aria-label="QR code for Amit's pay page" />
          </div>
          <p className="text-[12px] leading-[16px]" style={{ color: 'var(--text-secondary)' }}>
            Scan to open the friend page on a real phone.
          </p>
        </div>
      </Section>
      <button
        type="button"
        onClick={() => restartDemo(true)}
        className="min-h-[44px] rounded-[6px] text-[14px] font-medium inline-flex items-center justify-center gap-2"
        style={{ border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
      >
        <RotateCcw size={16} strokeWidth={1.75} aria-hidden /> Restart demo
      </button>
    </aside>
  )
}
