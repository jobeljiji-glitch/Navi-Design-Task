import { useState, type ReactNode } from 'react'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { BottomSheet, MoneyLedger, PrimaryCTA } from '@/ds'
import { useDemoStore } from '@/store'
import { selectHoldSheet, selectShortenOptions } from '@/logic/holdFlow'
import type { PaymentRail } from '@/logic/types'

/**
 * Step 2: Hold summary bottom sheet.
 * Sheet anatomy from ref 05/19 (grabber, 22 pt / 400 title, 16 pt margins, pinned CTA);
 * rows from the price card in ref 11/22 (grey 14 pt labels, right values, hairlines).
 */
export interface HoldSummarySheetProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const linkStyle = { color: 'var(--bms-red-text)' }

function Row({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`py-3 border-b last:border-b-0 ${className}`} style={{ borderColor: 'var(--divider)' }}>
      {children}
    </div>
  )
}

const RAILS: Array<{ rail: PaymentRail; title: string; sub: (perSeat: string) => string }> = [
  { rail: 'reserve_pay', title: 'UPI · rohan@okbank', sub: () => 'Block now, pay only for seats you keep' },
  { rail: 'card_preauth', title: 'Credit or debit card', sub: () => 'Hold the amount on your card' },
  { rail: 'pay_and_refund', title: 'Pay for all seats now', sub: (p) => `Get ${p} back each time a friend pays` },
]

export default function HoldSummarySheet({ isOpen, onClose, onConfirm }: HoldSummarySheetProps) {
  // Whole-state subscription: every value on the sheet comes from selectors
  const state = useDemoStore()
  const { dispatch, errorMessage } = state
  const bankSupportsBlocking = state.settings.bankSupportsBlocking
  const [open, setOpen] = useState<null | 'seat' | 'shorten' | 'rail'>(null)

  const v = selectHoldSheet(state)
  const shorten = selectShortenOptions(state)
  if (!v) return null

  const toggle = (k: 'seat' | 'shorten' | 'rail') => setOpen((o) => (o === k ? null : k))
  const railTitle = v.rail === 'card_preauth' ? 'Card' : v.fallback ? 'UPI · rohan@okbank · pay now' : 'UPI · rohan@okbank'

  const header = (
    <div className="px-4 pt-2 pb-3">
      <h2 className="text-[22px] leading-[28px] font-normal" style={{ color: 'var(--text-primary)' }}>
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
      <p className="text-[12px] leading-[16px] text-center" style={{ color: 'var(--text-secondary)' }}>
        One UPI PIN. Cancel the hold anytime before friends pay.
      </p>
    </div>
  )

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} header={header} footer={footer}>
      <div className="flex flex-col gap-3" data-testid="hold-sheet">
        {errorMessage && (
          <div
            className="px-4 py-2.5 text-[14px] leading-[20px]"
            style={{ backgroundColor: 'var(--bg-warning)', color: 'var(--text-primary)', borderRadius: 'var(--card-radius)' }}
            role="alert"
            data-testid="hold-error"
          >
            {errorMessage}
          </div>
        )}

        {/* Your seat / friends' seats */}
        <div className="px-4 border" style={{ borderColor: 'var(--divider)', borderRadius: 'var(--card-radius)' }}>
          <Row>
            <div className="flex items-center justify-between text-[14px] leading-[20px]">
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-secondary)' }}>Your seat</span>
                <button
                  type="button"
                  onClick={() => toggle('seat')}
                  className="flex items-center gap-0.5 font-medium min-h-[32px] px-1 -mx-1"
                  style={linkStyle}
                  aria-label={`Your seat ${v.ownerSeatId}, change`}
                  aria-expanded={open === 'seat'}
                >
                  {v.ownerSeatId}
                  <ChevronDown size={16} strokeWidth={1.75} />
                </button>
              </div>
              <span style={{ color: 'var(--text-primary)' }}>{v.ownNow}</span>
            </div>
            {open === 'seat' && (
              <div className="flex flex-wrap gap-2 pt-3" role="listbox" aria-label="Pick your seat">
                {v.seatIds.map((id) => {
                  const on = id === v.ownerSeatId
                  return (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => {
                        dispatch({ type: 'SET_HOLD_OWNER_SEAT', seatId: id })
                        setOpen(null)
                      }}
                      className="h-9 min-w-[52px] px-2 rounded-[3px] text-[13px] border"
                      style={
                        on
                          ? { backgroundColor: 'var(--seat-selected)', borderColor: 'var(--seat-selected)', color: 'var(--text-on-brand)' }
                          : { borderColor: 'var(--seat-available-border)', color: 'var(--seat-number)' }
                      }
                    >
                      {id}
                    </button>
                  )
                })}
              </div>
            )}
          </Row>
          <Row>
            <div className="flex items-center justify-between gap-3 text-[14px] leading-[20px]">
              <span style={{ color: 'var(--text-secondary)' }}>{v.friendsLabel}</span>
              <span className="text-right" style={{ color: 'var(--text-primary)' }}>
                {v.fallback ? 'Paid now' : v.friendsValue}
              </span>
            </div>
          </Row>
        </div>

        <div data-tour="money-ledger">
          <MoneyLedger
            debitedNow={v.leavesNow}
            blockedAmount={v.blockedNotTaken}
            mostPayable={v.mostYouCouldPay}
            helperText={v.helper}
            fallbackMode={v.fallback}
            fallbackLine={v.fallbackLine}
          />
        </div>

        {!v.fallback && (
          <div
            className="px-4 py-2.5 text-[14px] leading-[20px]"
            style={{ backgroundColor: 'var(--bg-info)', color: 'var(--text-primary)', borderRadius: 'var(--card-radius)' }}
            data-testid="plain-note"
          >
            You're only charged for seats your friends don't pay for.
          </div>
        )}

        {/* Info rows */}
        <div className="px-4 border" style={{ borderColor: 'var(--divider)', borderRadius: 'var(--card-radius)' }}>
          <Row>
            <div className="flex items-start justify-between gap-3 text-[14px] leading-[20px]">
              <p style={{ color: 'var(--text-primary)' }}>
                Friends have until <span className="font-medium">{v.deadlineTime}{v.deadlineDay ? ` ${v.deadlineDay}` : ''}</span> ({v.windowLabel}).
                After that, you keep or release each unpaid seat.
              </p>
              {shorten.length > 0 && (
                <button type="button" onClick={() => toggle('shorten')} className="font-medium shrink-0 py-2.5 -my-2.5" style={linkStyle} aria-expanded={open === 'shorten'}>
                  Shorten
                </button>
              )}
            </div>
            {open === 'shorten' && (
              <div className="flex flex-wrap gap-2 pt-3">
                {shorten.map((o) => (
                  <button
                    key={o.deadline}
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'SHORTEN_DEADLINE', newDeadline: o.deadline })
                      setOpen(null)
                    }}
                    className="h-9 px-3 rounded-[6px] border text-[13px]"
                    style={{ borderColor: 'var(--border-grey)', color: 'var(--text-primary)' }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </Row>

          <Row>
            <div className="flex items-start justify-between gap-3 text-[14px] leading-[20px]">
              <p style={{ color: 'var(--text-primary)' }}>
                {v.assignMode === 'friends_pick' ? 'Friends pick their own seat.' : 'You assign each seat to a friend.'}
              </p>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: 'SET_ASSIGN_MODE', mode: v.assignMode === 'friends_pick' ? 'assigned' : 'friends_pick' })
                }
                className="font-medium shrink-0 py-2.5 -my-2.5 text-right"
                style={linkStyle}
              >
                {v.assignMode === 'friends_pick' ? 'Assign seats instead' : 'Let friends pick instead'}
              </button>
            </div>
          </Row>

          {v.freeReleaseUntil && (
            <Row>
              <p className="text-[14px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>
                Release free until {v.freeReleaseUntil}
              </p>
            </Row>
          )}

          {!v.fallback && (
            <Row>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col text-[14px] leading-[20px]">
                  <span style={{ color: 'var(--text-primary)' }}>Cover seats</span>
                  <span className="text-[13px] leading-[18px]" style={{ color: 'var(--text-secondary)' }}>
                    I'll pay for {v.coverCount} {v.coverCount === 1 ? 'seat' : 'seats'} now
                  </span>
                </div>
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
            </Row>
          )}
        </div>

        {/* Pay with */}
        <div className="px-4 border" style={{ borderColor: 'var(--divider)', borderRadius: 'var(--card-radius)' }}>
          <Row>
            <button
              type="button"
              onClick={() => toggle('rail')}
              className="w-full flex items-center justify-between text-[14px] leading-[20px] min-h-[32px]"
              aria-expanded={open === 'rail'}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Pay with</span>
              <span className="flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                {railTitle}
                <ChevronDown size={16} strokeWidth={1.75} />
              </span>
            </button>
            {open === 'rail' && (
              <div className="flex flex-col pt-1">
                {RAILS.filter((r) => bankSupportsBlocking || r.rail !== 'reserve_pay').map((r) => {
                  const on = r.rail === v.rail
                  return (
                    <button
                      key={r.rail}
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'SET_PAYMENT_RAIL', rail: r.rail })
                        if (r.rail === 'pay_and_refund') dispatch({ type: 'SET_COVER_SEATS', count: 0 })
                        setOpen(null)
                      }}
                      className="flex items-center justify-between py-2.5 text-left min-h-[44px]"
                    >
                      <span className="flex flex-col">
                        <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>{r.title}</span>
                        <span className="text-[12px] leading-[16px]" style={{ color: 'var(--text-secondary)' }}>{r.sub(v.perSeat)}</span>
                      </span>
                      <span
                        className="w-[18px] h-[18px] rounded-full border-2 shrink-0"
                        style={{ borderColor: on ? 'var(--bms-red)' : 'var(--border-grey)', boxShadow: on ? 'inset 0 0 0 3px var(--bg-surface), inset 0 0 0 9px var(--bms-red)' : undefined }}
                        aria-hidden
                      />
                    </button>
                  )
                })}
              </div>
            )}
          </Row>
        </div>
      </div>
    </BottomSheet>
  )
}
