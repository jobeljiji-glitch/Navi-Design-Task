import { useState, type ReactNode } from 'react'
import { Clock, Minus, Plus, RotateCcw, Ticket, type LucideIcon } from 'lucide-react'
import { BottomSheet, Hairline, PrimaryCTA, PriceRow, SeatTileRow, SettingsGroup, SoftGroup } from '@/ds'
import { useDemoStore } from '@/store'
import { selectHoldSheet, selectShortenOptions } from '@/logic/holdFlow'
import type { PaymentRail } from '@/logic/types'

/**
 * Step 2 hold sheet (04c): seats → money (Confirm-booking price rows in a soft grey group)
 * → how the hold works (BMS info rows) → settings → two-line CTA.
 * Sheet anatomy from ref 05/19: no outlined cards; sections split by full-width hairlines.
 */
export interface HoldSummarySheetProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

type SubSheet = null | 'seats' | 'cover' | 'rail' | 'shorten'

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

function InfoRow({ icon: Icon, children, action }: { icon: LucideIcon; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon size={20} strokeWidth={1.75} className="shrink-0 mt-px" style={{ color: 'var(--text-secondary)' }} aria-hidden />
      <p className="flex-1 text-[14px] leading-[20px] text-pretty" style={{ color: 'var(--text-primary)' }}>{children}</p>
      {action}
    </div>
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
        <div className="flex flex-col gap-5 pt-1" data-testid="hold-sheet">
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

          {/* a) Seats */}
          <section className="flex flex-col gap-2" aria-label="Your group's seats">
            <SeatTileRow tiles={v.tiles} onTileClick={(id) => dispatch({ type: 'SET_HOLD_OWNER_SEAT', seatId: id })} />
            <p className="text-[12px] leading-[16px] -mt-1" style={{ color: 'var(--text-secondary)' }}>
              Tap a seat to make it yours
            </p>
          </section>

          {/* b) Money: Confirm-booking price rows (ref 22) in a soft grey group */}
          <section className="flex flex-col gap-2" data-tour="money-ledger" aria-label="Money">
            <SoftGroup testId="money-summary" className="flex flex-col gap-3">
              {v.moneyRows.map((r) => (
                <PriceRow key={r.key} label={r.label} value={r.value} sub={r.sub} testId={`money-${r.key}`} />
              ))}
              <Hairline dashed />
              <PriceRow label={v.moneyTotalLabel} value={v.moneyTotal} strong testId="money-total" />
            </SoftGroup>
            <p className="text-[12px] leading-[16px] text-pretty" style={{ color: 'var(--text-secondary)' }}>
              {v.moneyCaption}
            </p>
          </section>

          <Hairline bleed />

          {/* c) How the hold works: BMS info rows */}
          <section aria-label="How the hold works" data-testid="how-it-works">
            <h3 className="text-[16px] leading-[22px] font-medium" style={{ color: 'var(--text-primary)' }}>How the hold works</h3>
            <div className="mt-1">
              <InfoRow
                icon={Clock}
                action={
                  shorten.length > 0 ? (
                    <button type="button" onClick={() => setSub('shorten')} className="text-[14px] leading-[20px] font-medium shrink-0 py-2.5 -my-2.5" style={{ color: 'var(--bms-red-text)' }}>
                      Shorten
                    </button>
                  ) : undefined
                }
              >
                {v.howDeadline}
              </InfoRow>
              <Hairline />
              <InfoRow icon={Ticket}>{v.howKeep}</InfoRow>
              <Hairline />
              <InfoRow icon={RotateCcw}>{v.howRelease}</InfoRow>
            </div>
          </section>

          <Hairline bleed />

          {/* 3. Settings */}
          <SettingsGroup
            className="-mt-5 -mb-3"
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

    </>
  )
}
