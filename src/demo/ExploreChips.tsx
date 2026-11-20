import { useState, type ReactNode } from 'react'
import { ChevronDown, MoreHorizontal, X } from 'lucide-react'
import { useDemoStore } from '@/store'
import { useStageStore } from '@/store/stage'
import { formatClockIST } from '@/logic/holdFlow'
import { personaOf } from '@/logic/tour'
import { ClockControls, FailureList, MomentList, PersonaSwitch } from './Panels'
import { restartDemo, startTour } from './stageActions'

type Menu = 'persona' | 'clock' | 'more' | null

/**
 * Explore mode below 1024 px: a slim demo bar above the app (D-098), so the chips never cover it.
 * Persona chip · clock chip · ⋯ (restart, guided demo, moments, failures).
 */
export default function ExploreChips() {
  const [menu, setMenu] = useState<Menu>(null)
  const path = useStageStore((s) => s.path)
  const now = useDemoStore((s) => s.clock.now)
  const persona = personaOf(path)
  const close = () => setMenu(null)
  const toggle = (m: Menu) => setMenu((x) => (x === m ? null : m))

  const chipCls = 'h-8 px-2.5 rounded-full inline-flex items-center gap-1 text-[13px] font-medium'
  const chipStyle = { backgroundColor: 'var(--chip-bg)', color: 'var(--stage-ink-text)' }

  return (
    <>
      {menu && <button type="button" aria-label="Close menu" className="fixed inset-0 z-[96] cursor-default" onClick={close} />}
      <div
        className="explore-chips fixed left-0 right-0 top-0 z-[97] flex items-center justify-end gap-1 px-2"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', height: 'calc(env(safe-area-inset-top, 0px) + var(--stage-bar))', backgroundColor: 'var(--stage-ink)' }}
        data-stage-overlay
        data-testid="explore-chips"
      >
        <span className="stage-bar-label mr-auto pl-1 text-[13px] font-medium" style={{ color: 'var(--stage-ink-muted)' }}>Group Hold demo</span>
        {/* each chip has a 44 pt hit area around its 32 pt pill */}
        <button type="button" className="p-1.5 -m-1.5" onClick={() => toggle('persona')} aria-haspopup="menu" aria-expanded={menu === 'persona'} aria-label={`Phone: ${persona}. Switch person`} data-testid="persona-chip">
          <span className={chipCls} style={chipStyle}>
            {persona} <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
          </span>
        </button>
        <button type="button" className="p-1.5 -m-1.5 ml-0" onClick={() => toggle('clock')} aria-haspopup="menu" aria-expanded={menu === 'clock'} aria-label={`Clock: ${formatClockIST(now)}. Skip ahead`} data-testid="clock-chip">
          <span className={`${chipCls} tabular-nums`} style={chipStyle}>
            {formatClockIST(now)}
          </span>
        </button>
        <button type="button" className="p-1.5 -m-1.5" onClick={() => toggle('more')} aria-haspopup="menu" aria-expanded={menu === 'more'} aria-label="Demo menu" data-testid="more-chip">
          <span className={`${chipCls} w-8 justify-center px-0`} style={chipStyle}>
            <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden />
          </span>
        </button>
      </div>
      {menu && (
        <Popover onClose={close} title={menu === 'persona' ? 'Whose phone' : menu === 'clock' ? 'Clock' : 'Demo'}>
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

function Popover({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      role="menu"
      aria-label={title}
      className="fixed right-2 left-2 sm:left-auto sm:w-[340px] z-[98] rounded-[14px] p-4 flex flex-col gap-3 overflow-y-auto"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + var(--stage-bar) + 6px)',
        maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 70px)',
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
