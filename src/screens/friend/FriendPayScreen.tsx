import { useState } from 'react'
import { ChevronRight, Minus, Plus } from 'lucide-react'
import { AvatarStack, Band, BottomSheet, Card, Hairline, PrimaryCTA, PriceRow, SeatTileRow } from '@/ds'
import { useDemoStore } from '@/store'
import { selectFriendPage, type FriendName } from '@/logic/friendFlow'
import FriendHeader from './FriendHeader'

/**
 * Friend pay page (spec §4 step 5). Same surfaces as Rohan's 04d screen:
 * grey page, white 8 pt cards, ref-22 price card with the green band, pinned strong-red CTA.
 */
export default function FriendPayScreen({ name }: { name: FriendName }) {
  const state = useDemoStore()
  const dispatch = state.dispatch
  const v = selectFriendPage(state, name)
  const [declineOpen, setDeclineOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!v) return null

  const organiser = state.hold?.organiser.name ?? 'Rohan'
  const stepBtn = 'w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-40 active:opacity-70'

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative select-none" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} data-testid="friend-pay">
      <FriendHeader title="Group hold" onBack={() => dispatch({ type: 'FRIEND_BACK', name })} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-3 no-scrollbar [&>*]:shrink-0" style={{ overscrollBehavior: 'contain' }}>
        {/* Card 1: who's holding, the show, who's in */}
        <Card className="flex flex-col gap-3">
          <div>
            <p className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>{v.kicker}</p>
            <h2 className="text-[18px] leading-[24px] font-medium mt-0.5">{v.film}</h2>
            <p className="text-[14px] leading-[20px] mt-0.5 text-pretty" style={{ color: 'var(--text-secondary)' }}>{v.meta}</p>
          </div>
          <Hairline />
          <div className="flex items-center gap-3" data-tour="avatar-stack" data-testid="whos-in-line">
            <AvatarStack avatars={v.avatars.map((n) => ({ name: n }))} size={32} />
            <p className="text-[14px] leading-[20px] min-w-0">
              <span className="font-medium">{v.whoNames}</span>
              <span style={{ color: 'var(--text-secondary)' }}> · {v.whoRest}</span>
            </p>
          </div>
        </Card>

        {/* Card 2: the block's mini seat map */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[16px] leading-[22px] font-medium">{v.pickTitle}</h3>
            <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>Tap a seat</span>
          </div>
          <SeatTileRow
            tiles={v.tiles.map((t) => ({ id: t.id, kind: t.kind, caption: t.caption }))}
            onTileClick={(id) => dispatch({ type: 'FRIEND_PICK_SEAT', name, seatId: id })}
            isTappable={(t) => v.tiles.find((x) => x.id === t.id)?.tappable ?? false}
          />
          {v.conflict && (
            <p
              className="px-3 py-2 text-[13px] leading-[18px] text-pretty"
              style={{ backgroundColor: 'var(--bg-warning)', color: 'var(--text-warning)', borderRadius: 'var(--card-radius)' }}
              role="alert"
              data-testid="seat-conflict"
            >
              {v.conflict}
            </p>
          )}
        </Card>

        {/* Card 3: ref-22 price card, band flush on the bottom edge */}
        <Card className="flex flex-col gap-3" band={<Band title={v.heldUntil} testId="held-until" />}>
          <PriceRow label={v.seatLabel} value={v.price} sub={v.priceSub} testId="your-seat-row" />
          {v.seatIds.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>Pay for more seats</span>
              <span className="text-[12px] leading-[16px]" style={{ color: 'var(--text-secondary)' }}>
                {v.maxExtra > 0 ? `${v.perSeat} each · up to ${v.maxExtra} more` : 'No other seats free'}
              </span>
            </div>
            <div className="flex items-center rounded-full border" style={{ borderColor: 'var(--divider)' }} data-testid="more-seats-stepper">
              <button type="button" className={stepBtn} disabled={v.extra === 0} onClick={() => dispatch({ type: 'FRIEND_SET_EXTRA', name, count: v.extra - 1 })} aria-label="One seat fewer">
                <Minus size={18} strokeWidth={1.75} style={{ color: 'var(--bms-red)' }} />
              </button>
              <span className="w-6 text-center text-[16px] font-medium" aria-live="polite">{v.extra}</span>
              <button type="button" className={stepBtn} disabled={v.extra >= v.maxExtra} onClick={() => dispatch({ type: 'FRIEND_SET_EXTRA', name, count: v.extra + 1 })} aria-label="One more seat">
                <Plus size={18} strokeWidth={1.75} style={{ color: 'var(--bms-red)' }} />
              </button>
            </div>
          </div>
          )}
          <Hairline dashed />
          <button type="button" onClick={() => setCancelOpen(true)} className="-my-2 min-h-11 flex items-center justify-between text-left active:opacity-70">
            <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>{v.cancellation}</span>
            <ChevronRight size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </Card>
      </div>

      {/* Pinned footer (ref 22 bar: white + hairline) */}
      <div className="shrink-0 px-4 pt-3 cta-safe flex flex-col items-center border-t" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--divider)' }}>
        <div className="w-full" data-tour="friend-pay-cta">
          <PrimaryCTA variant="strong" size="lg" disabled={!v.ctaEnabled} onClick={() => dispatch({ type: 'FRIEND_PAY', name })}>
            {v.cta}
          </PrimaryCTA>
        </div>
        <button type="button" onClick={() => setDeclineOpen(true)} className="h-11 px-4 text-[14px] font-medium active:opacity-70" style={{ color: 'var(--bms-red-text)' }} data-testid="cant-make-it">
          Can't make it
        </button>
      </div>

      <BottomSheet
        isOpen={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title={`Let ${organiser} know you can't make it?`}
        subtitle={`Only ${organiser} is told.`}
        footerDivider={false}
        footer={
          <div className="flex flex-col gap-1">
            <PrimaryCTA
              variant="strong"
              size="lg"
              onClick={() => {
                setDeclineOpen(false)
                dispatch({ type: 'FRIEND_CANT_MAKE_IT', name })
              }}
            >
              Yes, let him know
            </PrimaryCTA>
            <button type="button" onClick={() => setDeclineOpen(false)} className="h-11 text-[14px] font-medium" style={{ color: 'var(--bms-red-text)' }}>
              Cancel
            </button>
          </div>
        }
      />

      <BottomSheet isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancellation" footerDivider={false} footer={<PrimaryCTA variant="strong" size="lg" onClick={() => setCancelOpen(false)}>Got it</PrimaryCTA>}>
        <p className="text-[14px] leading-[20px] pb-2 text-pretty" style={{ color: 'var(--text-secondary)' }} data-testid="cancellation-sheet">
          {v.cancellationBody}
        </p>
      </BottomSheet>
    </div>
  )
}
