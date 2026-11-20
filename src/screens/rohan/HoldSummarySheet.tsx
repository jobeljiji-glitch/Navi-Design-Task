import { useState, type ReactNode } from 'react'
import { Edit3, Minus, Plus } from 'lucide-react'
import { Band, BottomSheet, Hairline, PriceColumns, PrimaryCTA, SeatTileRow } from '@/ds'
import { useDemoStore } from '@/store'
import { selectHoldSheet, selectShortenOptions } from '@/logic/holdFlow'
import type { PaymentRail } from '@/logic/types'

/**
 * Step 2 hold sheet (04d), built from BMS booking-flow patterns:
 *  header + seat tiles (unchanged)
 *  → price columns (the "How many seats?" tier columns, refs 05/19)
 *  → rules band (the Confirm-booking cancellation band, ref 22)
 *  → settings summary (ref 22 "For Sending Booking Details ✎ Edit")
 *  → two-line CTA. 24 pt between blocks; no line items, no outlined boxes.
 */
export interface HoldSummarySheetProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

type SubSheet = null | 'settings' | 'shorten'

const RAILS: Array<{ rail: PaymentRail; title: string; sub: (perSeat: string) => string }> = [
  { rail: 'reserve_pay', title: 'UPI · rohan@okbank', sub: () => 'Set money aside now, pay only for seats you keep' },
  { rail: 'card_preauth', title: 'Credit or debit card', sub: () => 'Hold the amount on your card' },
  { rail: 'pay_and_refund', title: 'Pay for all seats now', sub: (p) => `Get ${p} back each time a friend pays` },
]

const red = { color: 'var(--bms-red-text)' }

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
    <button type="button" role="radio" aria-checked={on} onClick={onClick} className="w-full min-h-[52px] py-2 flex items-center justify-between gap-3 text-left">
      <span className="flex flex-col">
        <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <span className="text-[12px] leading-[16px] text-pretty" style={{ color: 'var(--text-secondary)' }}>{sub}</span>
      </span>
      <Radio on={on} />
    </button>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[12px] leading-[15px] uppercase pt-4 pb-1" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </h3>
  )
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
      <PrimaryCTA size="xl" onClick={onConfirm} subLabel={v.ctaSub ?? undefined}>
        {v.ctaTitle}
      </PrimaryCTA>
      <p className="text-[12px] leading-[16px] text-center" style={{ color: 'var(--text-secondary)' }} data-testid="hold-caption">
        {v.caption}
      </p>
    </div>
  )

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} header={header} footer={footer} title={v.title} testId="hold-sheet-root">
        <div className="flex flex-col gap-6 pt-1 pb-1" data-testid="hold-sheet">
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

          {/* Seat tiles (unchanged) */}
          <section className="flex flex-col gap-2" aria-label="Your group's seats">
            <SeatTileRow tiles={v.tiles} onTileClick={(id) => dispatch({ type: 'SET_HOLD_OWNER_SEAT', seatId: id })} />
            <p className="text-[12px] leading-[16px] -mt-1" style={{ color: 'var(--text-secondary)' }}>
              Tap a seat to make it yours
            </p>
          </section>

          {/* a) Price columns: the tier-column pattern from "How many seats?" */}
          <section className="flex flex-col gap-3" data-tour="money-ledger" aria-label="Money">
            <PriceColumns columns={v.columns} testId="price-columns" />
            <p className="text-[12px] leading-[16px] text-center" style={{ color: 'var(--text-secondary)' }}>
              {v.columnsCaption}
            </p>
          </section>

          {/* b) Rules band: the Confirm-booking cancellation band */}
          <Band
            standalone
            testId="rules-band"
            title={v.rulesTitle}
            action={
              shorten.length > 0 ? (
                <button type="button" onClick={() => setSub('shorten')} className="text-[14px] leading-[20px] font-medium shrink-0 py-2 -my-2" style={red}>
                  Shorten
                </button>
              ) : undefined
            }
          >
            {v.rulesBody}
          </Band>

          {/* c) Settings summary: "For Sending Booking Details ✎ Edit" */}
          <section aria-label="Hold settings" data-testid="settings-summary">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] leading-[20px] font-medium" style={{ color: 'var(--text-primary)' }}>Hold settings</h3>
              <button
                type="button"
                onClick={() => setSub('settings')}
                className="flex items-center gap-1 text-[14px] leading-[20px] font-medium py-2 -my-2 pl-3"
                style={red}
                data-testid="edit-settings"
              >
                <Edit3 size={14} strokeWidth={1.75} />
                Edit
              </button>
            </div>
            <p className="mt-1 text-[13px] leading-[18px] text-pretty" style={{ color: 'var(--text-secondary)' }}>{v.settingsLine1}</p>
            <p className="text-[13px] leading-[18px] text-pretty" style={{ color: 'var(--text-secondary)' }}>{v.settingsLine2}</p>
          </section>
        </div>
      </BottomSheet>

      {/* Edit settings: seats / cover a friend / pay with */}
      <BottomSheet
        isOpen={sub === 'settings'}
        onClose={close}
        title="Hold settings"
        testId="sub-settings"
        footer={<PrimaryCTA size="lg" onClick={close}>Done</PrimaryCTA>}
      >
        <SectionLabel>Seats</SectionLabel>
        <div role="radiogroup" aria-label="Seats">
          <OptionRow
            title="Friends pick their own seat"
            sub="Whoever pays first picks first"
            on={v.assignMode === 'friends_pick'}
            onClick={() => dispatch({ type: 'SET_ASSIGN_MODE', mode: 'friends_pick' })}
          />
          <OptionRow
            title="Assign seats to friends"
            sub="You choose who sits where"
            on={v.assignMode === 'assigned'}
            onClick={() => dispatch({ type: 'SET_ASSIGN_MODE', mode: 'assigned' })}
          />
        </div>

        {!v.fallback && (
          <>
            <Hairline bleed className="mt-2" />
            <SectionLabel>Cover a friend</SectionLabel>
            <div className="flex items-center justify-between gap-3 py-1">
              <span className="flex flex-col">
                <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>
                  I'll pay for {v.coverCount} {v.coverCount === 1 ? 'seat' : 'seats'} now
                </span>
                <span className="text-[12px] leading-[16px] text-pretty" style={{ color: 'var(--text-secondary)' }}>
                  Their seats are confirmed straight away
                </span>
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
          </>
        )}

        <Hairline bleed className="mt-2" />
        <SectionLabel>Pay with</SectionLabel>
        <div role="radiogroup" aria-label="Pay with">
          {RAILS.filter((r) => bankSupportsBlocking || r.rail !== 'reserve_pay').map((r) => (
            <OptionRow
              key={r.rail}
              title={r.title}
              sub={r.sub(v.perSeat)}
              on={r.rail === v.rail}
              onClick={() => {
                dispatch({ type: 'SET_PAYMENT_RAIL', rail: r.rail })
                if (r.rail === 'pay_and_refund') dispatch({ type: 'SET_COVER_SEATS', count: 0 })
              }}
            />
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={sub === 'shorten'} onClose={close} title="Shorten the deadline" testId="sub-shorten">
        <p className="text-[14px] leading-[20px] text-pretty pb-2" style={{ color: 'var(--text-secondary)' }}>
          You can bring the deadline forward, never push it back.
        </p>
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
    </>
  )
}
