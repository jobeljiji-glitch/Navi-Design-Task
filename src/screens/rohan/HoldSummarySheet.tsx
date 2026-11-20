import { useState, type ReactNode } from 'react'
import { Armchair, ChevronDown, ChevronRight, Clock, CreditCard, Minus, Plus, Smartphone, UserCheck, Users, Wallet } from 'lucide-react'
import { Band, BottomSheet, Hairline, PaymentIconTile, PaymentMethodList, PaymentMethodRow, PrimaryCTA, PriceRow, SeatTileRow, SoftGroup } from '@/ds'
import { useDemoStore } from '@/store'
import { selectHoldSheet, selectShortenOptions } from '@/logic/holdFlow'
import { availableRails, selectHoldingLine, selectLadderNotice } from '@/logic/failureFlow'
import type { PaymentRail } from '@/logic/types'

/**
 * Step 2 hold sheet (09): fits at 874 pt with no scrolling.
 *  header + seat tiles
 *  → one money line "₹1,662.84 blocked · ₹277.14 charged now ⌄" (expands to the breakdown)
 *  → two compact rule rows (deadline + Shorten; kept + free release)
 *  → one settings summary row (opens the Hold settings sheet)
 *  → pinned two-line CTA + caption.
 */
export interface HoldSummarySheetProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

type SubSheet = null | 'settings' | 'shorten'

const RAILS: Array<{ rail: PaymentRail; title: string; sub: (perSeat: string) => string; icon: typeof Smartphone }> = [
  { rail: 'reserve_pay', title: 'UPI · rohan@okbank', sub: () => 'Blocked now, charged only for kept seats', icon: Smartphone },
  { rail: 'card_preauth', title: 'Credit or debit card', sub: () => 'Held on your card, charged only for kept seats', icon: CreditCard },
  { rail: 'pay_and_refund', title: 'Pay for all seats now', sub: (p) => `${p} refunded each time a friend pays`, icon: Wallet },
]

const red = { color: 'var(--bms-red-text)' }
const ICON = { size: 20, strokeWidth: 1.75 } as const

function Tile({ children }: { children: ReactNode }) {
  return <PaymentIconTile>{children}</PaymentIconTile>
}

export default function HoldSummarySheet({ isOpen, onClose, onConfirm }: HoldSummarySheetProps) {
  // Whole-state subscription: every value comes from selectors
  const state = useDemoStore()
  const { dispatch, errorMessage } = state
  const rails = availableRails(state)
  const ladder = selectLadderNotice(state)
  const holdingLine = selectHoldingLine(state)
  const [sub, setSub] = useState<SubSheet>(null)
  const [moneyOpen, setMoneyOpen] = useState(false)

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
    <div className="flex flex-col gap-1" data-tour="hold-cta">
      <PrimaryCTA size="xl" onClick={onConfirm} subLabel={v.ctaSub ?? undefined}>
        {v.ctaTitle}
      </PrimaryCTA>
      <p className="text-[12px] leading-[16px] text-center" style={{ color: 'var(--text-secondary)' }} data-testid="hold-caption">
        {v.caption}
      </p>
    </div>
  )

  const [deadlineRule, keptRule] = v.rules

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} header={header} footer={footer} title={v.title} testId="hold-sheet-root">
        <div className="flex flex-col gap-4 pt-1 pb-1" data-testid="hold-sheet">
          {errorMessage && (
            <div
              className="px-4 py-3 flex flex-col gap-1 text-pretty"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-primary)', borderRadius: 'var(--card-radius)' }}
              role="alert"
              data-testid="hold-error"
            >
              <p className="text-[14px] leading-[20px] font-medium">{errorMessage}</p>
              {holdingLine && (
                <p className="text-[13px] leading-[18px]" style={{ color: 'var(--text-secondary)' }} data-testid="holding-line">
                  {holdingLine}
                </p>
              )}
              {!v.fallback && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'SET_PAYMENT_RAIL', rail: 'pay_and_refund' })
                    dispatch({ type: 'SET_COVER_SEATS', count: 0 })
                    dispatch({ type: 'CLEAR_ERROR' })
                  }}
                  className="self-start min-h-[44px] -mb-2 text-[14px] leading-[20px] font-medium"
                  style={red}
                  data-testid="pay-for-all"
                >
                  Pay for all {v.seatIds.length} instead
                </button>
              )}
            </div>
          )}

          {/* 08 fallback ladder: why this isn't UPI Reserve Pay */}
          {ladder && !errorMessage && <Band standalone tone="warning" testId="ladder-band" title={ladder.title}>{ladder.body}</Band>}

          {/* Seat tiles */}
          <section className="flex flex-col gap-1.5" aria-label="Your group's seats">
            <SeatTileRow tiles={v.tiles} onTileClick={(id) => dispatch({ type: 'SET_HOLD_OWNER_SEAT', seatId: id })} />
            <p className="text-[12px] leading-[16px]" style={{ color: 'var(--text-secondary)' }}>
              Tap a seat to make it yours
            </p>
          </section>

          {/* One money line, expands to the breakdown */}
          <section data-tour="money-ledger" aria-label="Money">
            <SoftGroup className="!p-0">
              <button
                type="button"
                onClick={() => setMoneyOpen((o) => !o)}
                aria-expanded={moneyOpen}
                aria-controls="hold-money-breakdown"
                className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 text-left"
                data-testid="money-line"
              >
                <span className="text-[15px] leading-[20px] font-medium" style={{ color: 'var(--text-primary)' }}>{v.moneyLine}</span>
                <ChevronDown
                  size={18}
                  strokeWidth={1.75}
                  className="shrink-0 transition-transform"
                  style={{ color: 'var(--text-secondary)', transform: moneyOpen ? 'rotate(180deg)' : undefined }}
                  aria-hidden
                />
              </button>
              {moneyOpen && (
                <div id="hold-money-breakdown" className="px-4 pb-3 flex flex-col gap-3" data-testid="money-breakdown">
                  <Hairline />
                  {v.breakdown.map((r) =>
                    r.key === 'total' ? (
                      <div key={r.key} className="flex flex-col gap-3">
                        <Hairline dashed />
                        <PriceRow label={r.label} value={r.value} strong />
                      </div>
                    ) : (
                      <PriceRow key={r.key} label={r.label} value={r.value} sub={r.sub} />
                    ),
                  )}
                </div>
              )}
            </SoftGroup>
          </section>

          {/* Two compact rule rows */}
          <section className="flex flex-col" aria-label="How the hold works" data-testid="rules-band">
            <div className="min-h-[44px] flex items-center gap-3">
              <Clock {...ICON} className="shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden />
              <span className="flex-1 text-[14px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>{deadlineRule.text}</span>
              {shorten.length > 0 && (
                <button type="button" onClick={() => setSub('shorten')} className="h-11 -mr-2 px-2 text-[14px] leading-[20px] font-medium shrink-0" style={red}>
                  Shorten
                </button>
              )}
            </div>
            <div className="min-h-[44px] flex items-center gap-3">
              <Armchair {...ICON} className="shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden />
              <span className="flex-1 text-[14px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>{keptRule.text}</span>
            </div>
          </section>

          {/* One settings summary row */}
          <button
            type="button"
            onClick={() => setSub('settings')}
            className="w-full min-h-[48px] -mt-1 flex items-center gap-3 text-left border-t"
            style={{ borderTopColor: 'var(--divider)' }}
            data-testid="edit-settings"
            aria-label={`Hold settings: ${v.settingsSummary}`}
          >
            <span className="flex-1 min-w-0 text-[14px] leading-[20px] truncate" style={{ color: 'var(--text-primary)' }} data-testid="settings-summary">
              {v.settingsSummary}
            </span>
            <ChevronRight size={18} strokeWidth={1.75} className="shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden />
          </button>
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
        <PaymentMethodList label="Seats" radio>
          <PaymentMethodRow
            icon={<Tile><Users size={18} strokeWidth={1.75} /></Tile>}
            title="Friends pick their own seat"
            subtitle="Whoever pays first picks first"
            trailing="radio"
            selected={v.assignMode === 'friends_pick'}
            onClick={() => dispatch({ type: 'SET_ASSIGN_MODE', mode: 'friends_pick' })}
          />
          <PaymentMethodRow
            icon={<Tile><UserCheck size={18} strokeWidth={1.75} /></Tile>}
            title="Assign seats to friends"
            subtitle="You choose who sits where"
            trailing="radio"
            selected={v.assignMode === 'assigned'}
            onClick={() => dispatch({ type: 'SET_ASSIGN_MODE', mode: 'assigned' })}
          />
        </PaymentMethodList>

        {!v.fallback && (
          <>
            <Hairline bleed className="mt-2" />
            <PaymentMethodList label="Cover a friend">
              <div className="min-h-[56px] flex items-center justify-between gap-3">
                <span className="flex flex-col">
                  <span className="text-[15px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>
                    I'll pay for {v.coverCount} {v.coverCount === 1 ? 'seat' : 'seats'} now
                  </span>
                  <span className="text-[13px] leading-[17px] text-pretty" style={{ color: 'var(--text-secondary)' }}>
                    Charged now, confirmed straight away
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
            </PaymentMethodList>
          </>
        )}

        <Hairline bleed className="mt-2" />
        <PaymentMethodList label="Pay with" radio>
          {RAILS.filter((r) => rails.includes(r.rail)).map((r) => {
            const Icon = r.icon
            return (
              <PaymentMethodRow
                key={r.rail}
                icon={<Tile><Icon size={18} strokeWidth={1.75} /></Tile>}
                title={r.title}
                subtitle={r.sub(v.perSeat)}
                trailing="radio"
                selected={r.rail === v.rail}
                testId={`rail-${r.rail}`}
                onClick={() => {
                  dispatch({ type: 'SET_PAYMENT_RAIL', rail: r.rail })
                  if (r.rail === 'pay_and_refund') dispatch({ type: 'SET_COVER_SEATS', count: 0 })
                }}
              />
            )
          })}
        </PaymentMethodList>
      </BottomSheet>

      <BottomSheet isOpen={sub === 'shorten'} onClose={close} title="Shorten the deadline" subtitle="You can bring it forward, never push it back." testId="sub-shorten">
        <div className="flex flex-wrap gap-2 pt-1 pb-2">
          {shorten.map((o) => (
            <button
              key={o.deadline}
              type="button"
              onClick={() => {
                dispatch({ type: 'SHORTEN_DEADLINE', newDeadline: o.deadline })
                close()
              }}
              className="h-11 px-4 rounded-[6px] border text-[14px]"
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
