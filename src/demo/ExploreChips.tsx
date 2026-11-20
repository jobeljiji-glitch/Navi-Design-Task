import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, MoreHorizontal, X } from 'lucide-react'
import { useDemoStore } from '@/store'
import { useStageStore } from '@/store/stage'
import { formatClockIST } from '@/logic/holdFlow'
import { personaOf } from '@/logic/tour'
import { ClockControls, FailureList, MomentList, PersonaSwitch } from './Panels'
import { restartDemo, startTour } from './stageActions'

type Menu = 'persona' | 'clock' | 'more' | null

/**
 * Demo controls below 1024 px (07b, D-106).
 * - `bar` (phone, open): a 40 pt row in the stage's column above the app viewport, below the top inset.
 *   Tapping the title (or ⌃) collapses it.
 * - `pill` (phone, collapsed): a 28 pt tab at the top-right edge, over the app; it takes no height.
 * - `float` (431–1023 px): the chips float top-right, outside the framed phone.
 * Persona chip · clock chip · ⋯ (restart, guided demo, moments, failures).
 */
export default function ExploreChips({ layout = 'float', onToggle }: { layout?: 'bar' | 'pill' | 'float'; onToggle?: () => void }) {
  const [menu, setMenu] = useState<Menu>(null)
  const path = useStageStore((s) => s.path)
  const now = useDemoStore((s) => s.clock.now)
  const persona = personaOf(path)
  const close = () => setMenu(null)
  const toggle = (m: Menu) => setMenu((x) => (x === m ? null : m))

  const chipCls = 'h-7 px-2.5 rounded-full inline-flex items-center gap-1 text-[13px] font-medium'
  const chipStyle = { backgroundColor: layout === 'float' ? 'var(--stage-ink)' : 'var(--chip-bg)', color: 'var(--stage-ink-text)' }
  const menuTop = layout === 'bar' ? 'calc(var(--sat) + var(--stage-bar) + 6px)' : 'calc(var(--sat) + 46px)'

  if (layout === 'pill') {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={false}
        aria-label="Show demo controls"
        className="fixed right-0 z-[97] pl-2 pr-1 py-2"
        style={{ top: 'calc(var(--sat) + 2px)' }}
        data-stage-overlay
        data-testid="demo-pill"
      >
        <span className="h-7 pl-2.5 pr-2 rounded-l-full inline-flex items-center gap-1 text-[13px] font-medium" style={{ backgroundColor: 'var(--stage-ink)', color: 'var(--stage-ink-text)', boxShadow: 'var(--coach-shadow)' }}>
          Demo <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
        </span>
      </button>
    )
  }

  return (
    <>
      {menu && <button type="button" aria-label="Close menu" className="fixed inset-0 z-[96] cursor-default" onClick={close} />}
      <div
        className={
          layout === 'bar'
            ? 'relative shrink-0 z-[97] flex items-center gap-1 px-2'
            : 'fixed right-2 top-2 z-[97] flex items-center gap-1'
        }
        style={
          layout === 'bar'
            ? { paddingTop: 'var(--sat)', height: 'calc(var(--sat) + var(--stage-bar))', backgroundColor: 'var(--stage-ink)' }
            : undefined
        }
        data-stage-overlay
        data-testid="explore-chips"
      >
        {layout === 'bar' && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded
            aria-label="Group Hold demo. Hide demo controls"
            className="mr-auto h-10 pl-1 pr-2 inline-flex items-center gap-1 text-[13px] font-medium"
            style={{ color: 'var(--stage-ink-muted)' }}
            data-testid="demo-bar-title"
          >
            Group Hold demo <ChevronUp size={14} strokeWidth={1.75} aria-hidden />
          </button>
        )}
        {/* chips are 28 pt pills inside 40 pt+ hit areas */}
        <button type="button" className="py-1.5 px-0.5" onClick={() => toggle('persona')} aria-haspopup="menu" aria-expanded={menu === 'persona'} aria-label={`Phone: ${persona}. Switch person`} data-testid="persona-chip">
          <span className={chipCls} style={chipStyle}>
            {persona} <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
          </span>
        </button>
        <button type="button" className="py-1.5 px-0.5 ml-0" onClick={() => toggle('clock')} aria-haspopup="menu" aria-expanded={menu === 'clock'} aria-label={`Clock: ${formatClockIST(now)}. Skip ahead`} data-testid="clock-chip">
          <span className={`${chipCls} tabular-nums`} style={chipStyle}>
            {formatClockIST(now)}
          </span>
        </button>
        <button type="button" className="py-1.5 px-0.5" onClick={() => toggle('more')} aria-haspopup="menu" aria-expanded={menu === 'more'} aria-label="Demo menu" data-testid="more-chip">
          <span className={`${chipCls} w-8 justify-center px-0`} style={chipStyle}>
            <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden />
          </span>
        </button>
      </div>
      {menu && (
        <Popover top={menuTop} onClose={close} title={menu === 'persona' ? 'Whose phone' : menu === 'clock' ? 'Clock' : 'Demo'}>
          {menu === 'persona' && <PersonaSwitch onPick={close} />}
          {menu === 'clock' && <ClockControls onPick={close} />}
          {menu === 'more' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    close()
                    startTour()
                  }}
                  className="min-h-[44px] rounded-[6px] text-[14px] font-medium"
                  style={{ backgroundColor: 'var(--bms-red-strong)', color: 'var(--text-on-brand)' }}
                >
                  Start guided demo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close()
                    restartDemo(true)
                  }}
                  className="min-h-[44px] rounded-[6px] text-[14px] font-medium"
                  style={{ border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
                >
                  Restart demo
                </button>
              </div>
              <Group title="Jump to moment">
                <MomentList onPick={close} />
              </Group>
              <Group title="Try a failure">
                <FailureList onPick={close} />
              </Group>
            </div>
          )}
        </Popover>
      )}
    </>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[12px] leading-[16px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Popover({ title, top, onClose, children }: { title: string; top: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      role="menu"
      aria-label={title}
      className="fixed right-2 left-2 sm:left-auto sm:w-[340px] z-[98] rounded-[14px] p-4 flex flex-col gap-3 overflow-y-auto"
      style={{
        top,
        maxHeight: 'calc(var(--app-h) - 24px)',
        backgroundColor: 'var(--stage-panel)',
        boxShadow: 'var(--coach-shadow)',
        color: 'var(--text-primary)',
      }}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      data-stage-overlay
      data-testid="explore-menu"
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-medium">{title}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="w-11 h-11 -m-3 flex items-center justify-center">
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>
      {children}
    </div>
  )
}
