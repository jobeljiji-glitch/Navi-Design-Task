import { useState, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { BottomSheet, HoldTimeline, PrimaryCTA, SeatTileRow, SettingsGroup } from '@/ds'
import { useDemoStore } from '@/store'
import { selectHoldSheet, selectShortenOptions } from '@/logic/holdFlow'
import type { PaymentRail } from '@/logic/types'

/**
 * Step 2 hold sheet (04b): picture → timeline → settings → CTA.
 * Sheet anatomy from ref 05/19; every amount appears once; settings open small sheets.
 */
export interface HoldSummarySheetProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

type SubSheet = null | 'seats' | 'cover' | 'rail' | 'shorten' | 'keep'

const RAILS: Array<{ rail: PaymentRail; title: string; sub: (perSeat: string) => string }> = [
  { rail: 'reserve_pay', title: 'UPI · rohan@okbank', sub: () => 'Set money aside now, pay only for seats you keep' },
  { rail: 'card_preauth', title: 'Credit or debit card', sub: () => 'Hold the amount on your card' },
  { rail: 'pay_and_refund', title: 'Pay for all seats now', sub: (p) => `Get ${p} back each time a friend pays` },
]

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
      style={{ borderColor: on ? 'var(--bms-red)' : 'var(--border-grey)' }}
      aria-hidden
    >
      {on && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--bms-red)' }} />}
    </span>
  )
}

function OptionRow({ title, sub, on, onClick }: { title: string; sub: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className="w-full min-h-[56px] py-2.5 flex items-center justify-between gap-3 text-left border-b last:border-b-0"
      style={{ borderColor: 'var(--divider)' }}
    >
      <span className="flex flex-col">
        <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <span className="text-[12px] leading-[16px] text-pretty" style={{ color: 'var(--text-secondary)' }}>{sub}</span>
      </span>
      <Radio on={on} />
    </button>
  )
}

function Body({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-[20px] text-pretty pb-2" style={{ color: 'var(--text-secondary)' }}>{children}</p>
}

export default function HoldSummarySheet({ isOpen, onClose, onConfirm }: HoldSummarySheetProps) {
  // Whole-state subscription: every value comes from selectors
  const state = useDemoStore()
  const { dispatch, errorMessage } = state
  const bankSupportsBlocking = state.settings.bankSupportsBlocking
  const [sub, setSub] = useState<SubSheet>(null)

  const v = selectHoldSheet(state)
  const shorten = selectShortenOptions(state)
  if (!v) return null
  const close = () => setSub(null)

  const header = (
    <div className="px-4 pt-2 pb-3">
      <h2 className="text-[20px] leading-[26px] font-normal text-balance" style={{ color: 'var(--text-primary)' }}>
        {v.title}
      </h2>
      <p className="text-[14px] leading-[20px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
        {v.subtitle}
      </p>
    </div>
  )

  const footer = (
    <div className="flex flex-col gap-2" data-tour="hold-cta">
      <PrimaryCTA size="lg" onClick={onConfirm}>
        {v.cta}
      </PrimaryCTA>
      <p className="text-[12px] leading-[16px] text-center" style={{ color: 'var(--text-secondary)' }} data-testid="hold-caption">
        {v.caption}
      </p>
    </div>
  )

  const stops = v.timeline.map((s) => ({
    ...s,
    link: s.key === 'deadline' && shorten.length > 0 ? { label: 'Shorten', onClick: () => setSub('shorten') } : undefined,
    onInfo: s.key === 'keep' ? () => setSub('keep') : undefined,
  }))

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} header={header} footer={footer} title={v.title} testId="hold-sheet-root">
        <div className="flex flex-col gap-5 pt-1 pb-1" data-testid="hold-sheet">
          {errorMessage && (
            <div
              className="px-4 py-2.5 text-[14px] leading-[20px] text-pretty"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-primary)', borderRadius: 'var(--card-radius)' }}
              role="alert"
              data-testid="hold-error"
            >
              {errorMessage}
            </div>
          )}

          {/* 1. Picture: seats + money as one visual */}
          <section className="flex flex-col gap-2" data-tour="money-ledger" aria-label="Seats and money">
            <SeatTileRow
              tiles={v.tiles}
              onTileClick={(id) => dispatch({ type: 'SET_HOLD_OWNER_SEAT', seatId: id })}
            />
            <p className="text-[12px] leading-[16px] -mt-1" style={{ color: 'var(--text-secondary)' }}>
              Tap a seat to make it yours
            </p>
            {v.fallback ? (
              <p className="text-[14px] leading-[20px] text-pretty" style={{ color: 'var(--text-primary)' }} data-testid="fallback-line">
                {v.fallbackLine}
              </p>
            ) : (
              <>
                <p className="text-[14px] leading-[20px] text-pretty" style={{ color: 'var(--text-primary)' }} data-testid="summary-line">
                  <span className="font-medium">{v.summaryNow}</span> paid now
                  {v.summaryAside && (
                    <>
                      {' · '}
                      <span className="font-medium">{v.summaryAside}</span> set aside in your account
                    </>
                  )}
                </p>
                <p className="text-[13px] leading-[18px] text-pretty" style={{ color: 'var(--text-secondary)' }}>
                  {/* keep "Most you could pay ₹…" on one line (no widow) */}
                  {v.mostLine.split('. ').map((part, i, arr) => (
                    <span key={i} className={i === arr.length - 1 ? 'whitespace-nowrap' : undefined}>
                      {part}
                      {i < arr.length - 1 ? '. ' : ''}
                    </span>
                  ))}
                </p>
              </>
            )}
          </section>

          {/* 2. Timeline */}
          <HoldTimeline stops={stops} />

          {/* 3. Settings */}
          <SettingsGroup
            rows={[
              { key: 'seats', label: 'Seats', value: v.seatsModeLabel, onClick: () => setSub('seats') },
              ...(v.fallback ? [] : [{ key: 'cover', label: 'Cover a friend', value: v.coverLabel, onClick: () => setSub('cover') }]),
              { key: 'rail', label: 'Pay with', value: v.railLabel, onClick: () => setSub('rail') },
            ]}
          />
        </div>
      </BottomSheet>

      {/* Small sheets opened from the settings rows and the timeline */}
      <BottomSheet isOpen={sub === 'seats'} onClose={close} title="Seats" testId="sub-seats">
        <div role="radiogroup">
          <OptionRow
            title="Friends pick their own seat"
            sub="Whoever pays first picks first"
            on={v.assignMode === 'friends_pick'}
            onClick={() => {
              dispatch({ type: 'SET_ASSIGN_MODE', mode: 'friends_pick' })
              close()
            }}
          />
          <OptionRow
            title="Assign seats to friends"
            sub="You choose who sits where"
            on={v.assignMode === 'assigned'}
            onClick={() => {
              dispatch({ type: 'SET_ASSIGN_MODE', mode: 'assigned' })
              close()
            }}
          />
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={sub === 'cover'}
        onClose={close}
        title="Cover a friend"
        testId="sub-cover"
        footer={<PrimaryCTA size="lg" onClick={close}>Done</PrimaryCTA>}
      >
        <Body>Pay for some friends now. Their seats are confirmed straight away and they don't need to pay.</Body>
        <div className="flex items-center justify-between py-2">
          <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
            I'll pay for {v.coverCount} {v.coverCount === 1 ? 'seat' : 'seats'} now
          </span>
          <div className="flex items-center" data-testid="cover-stepper">
            <button
              type="button"
              aria-label="Cover one seat fewer"
              disabled={v.coverCount === 0}
              onClick={() => dispatch({ type: 'SET_COVER_SEATS', count: v.coverCount - 1 })}
              className="w-11 h-11 flex items-center justify-center disabled:opacity-40"
            >
              <span className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: 'var(--border-grey)' }}>
                <Minus size={16} strokeWidth={1.75} />
              </span>
            </button>
            <span className="w-6 text-center text-[16px]" aria-live="polite">{v.coverCount}</span>
            <button
              type="button"
              aria-label="Cover one more seat"
              disabled={v.coverCount >= v.maxCover}
              onClick={() => dispatch({ type: 'SET_COVER_SEATS', count: v.coverCount + 1 })}
              className="w-11 h-11 flex items-center justify-center disabled:opacity-40"
            >
              <span className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: 'var(--border-grey)' }}>
                <Plus size={16} strokeWidth={1.75} />
              </span>
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={sub === 'rail'} onClose={close} title="Pay with" testId="sub-rail">
        <div role="radiogroup">
          {RAILS.filter((r) => bankSupportsBlocking || r.rail !== 'reserve_pay').map((r) => (
            <OptionRow
              key={r.rail}
              title={r.title}
              sub={r.sub(v.perSeat)}
              on={r.rail === v.rail}
              onClick={() => {
                dispatch({ type: 'SET_PAYMENT_RAIL', rail: r.rail })
                if (r.rail === 'pay_and_refund') dispatch({ type: 'SET_COVER_SEATS', count: 0 })
                close()
              }}
            />
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={sub === 'shorten'} onClose={close} title="Shorten the deadline" testId="sub-shorten">
        <Body>You can bring the deadline forward, never push it back.</Body>
        <div className="flex flex-wrap gap-2 pt-1 pb-2">
          {shorten.map((o) => (
            <button
              key={o.deadline}
              type="button"
              onClick={() => {
                dispatch({ type: 'SHORTEN_DEADLINE', newDeadline: o.deadline })
                close()
              }}
              className="h-10 px-4 rounded-[6px] border text-[14px]"
              style={{ borderColor: 'var(--border-grey)', color: 'var(--text-primary)' }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={sub === 'keep'}
        onClose={close}
        title="If a friend doesn't pay"
        testId="sub-keep"
        footer={<PrimaryCTA size="lg" onClick={close}>Got it</PrimaryCTA>}
      >
        <Body>
          At {v.deadlineTime} any unpaid seat stays yours and is paid from the money set aside. Until then you can release
          seats from the end of the row{v.freeReleaseUntil ? `, free until ${v.freeReleaseUntil}` : ''}.
        </Body>
      </BottomSheet>
    </>
  )
}
