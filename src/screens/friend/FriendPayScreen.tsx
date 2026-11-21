import { useState } from 'react'
import { BellRing, ChevronRight, Minus, Plus } from 'lucide-react'
import { AvatarStack, Band, BottomSheet, Card, Hairline, PinnedFooter, PrimaryCTA, PriceRow, SeatTileRow } from '@/ds'
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
  // 10: "Not sure yet? Remind me before 7:15 PM"
  const [remindOpen, setRemindOpen] = useState(false)
  const [remindPhone, setRemindPhone] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  if (!v) return null
  const remind = v.remind
  const remindDigits = (remindPhone || remind?.demoPhone || '').replace(/\D/g, '')
  const confirmRemind = () => {
    if (!remind) return
    setRemindOpen(false)
    dispatch({ type: 'FRIEND_REMIND_ME', name, ...(remind.needsPhone ? { phone: remindPhone || remind.demoPhone } : {}) })
    setToast(remind.toast)
    setTimeout(() => setToast(null), 2200)
  }

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
      <PinnedFooter testId="friend-pay-footer">
        <div className="w-full" data-tour="friend-pay-cta">
          <PrimaryCTA variant="strong" size="lg" disabled={!v.ctaEnabled} onClick={() => dispatch({ type: 'FRIEND_PAY', name })}>
            {v.cta}
          </PrimaryCTA>
        </div>
        <div className="flex items-center justify-center flex-wrap -mb-1">
          {remind && !remind.requested && (
            <button
              type="button"
              onClick={() => setRemindOpen(true)}
              className="h-11 px-2 text-[13px] active:opacity-70"
              data-testid="remind-me"
              data-tour="remind-me"
            >
              <span style={{ color: 'var(--text-secondary)' }}>{remind.lead} </span>
              <span className="font-medium" style={{ color: 'var(--bms-red-text)' }}>{remind.action}</span>
            </button>
          )}
          {remind?.requested && (
            <span className="h-11 px-2 flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--text-secondary)' }} data-testid="remind-set">
              <BellRing size={14} strokeWidth={1.75} aria-hidden />
              {remind.requestedLine}
            </span>
          )}
          {remind && <span className="text-[13px]" style={{ color: 'var(--divider)' }} aria-hidden>|</span>}
          <button type="button" onClick={() => setDeclineOpen(true)} className="h-11 px-2 text-[13px] font-medium active:opacity-70" style={{ color: 'var(--bms-red-text)' }} data-testid="cant-make-it">
            Can't make it
          </button>
        </div>
      </PinnedFooter>

      {toast && (
        <div className="absolute top-16 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="toast-surface px-4 py-2 rounded-full text-[13px] font-medium shadow-lg text-center" role="status" data-testid="remind-toast">{toast}</div>
        </div>
      )}

      {remind && (
        <BottomSheet
          isOpen={remindOpen}
          onClose={() => setRemindOpen(false)}
          title={remind.sheetTitle}
          subtitle={remind.sheetBody}
          footerDivider={false}
          testId="remind-sheet"
          footer={
            <div className="flex flex-col gap-1">
              <PrimaryCTA variant="strong" size="lg" disabled={remind.needsPhone && remindDigits.length !== 10} onClick={confirmRemind}>
                {remind.confirm}
              </PrimaryCTA>
              <button type="button" onClick={() => setRemindOpen(false)} className="h-11 text-[14px] font-medium" style={{ color: 'var(--bms-red-text)' }}>
                Not now
              </button>
            </div>
          }
        >
          {remind.needsPhone && (
            <div className="pb-2">
              <label className="flex items-stretch h-12 rounded-[6px] border overflow-hidden" style={{ borderColor: 'var(--border-grey)' }}>
                <span className="px-3 flex items-center text-[16px] border-r" style={{ borderColor: 'var(--divider)', color: 'var(--text-secondary)' }}>+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={remindPhone || remind.demoPhone}
                  onChange={(e) => setRemindPhone(e.target.value)}
                  className="flex-1 min-w-0 px-3 text-[16px] outline-none bg-transparent"
                  aria-label="Your phone number"
                  data-testid="remind-phone"
                />
              </label>
              <p className="text-[12px] leading-[16px] mt-2" style={{ color: 'var(--text-secondary)' }}>
                Only used for this reminder and your ticket.
              </p>
            </div>
          )}
        </BottomSheet>
      )}

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
              Yes, let {organiser} know
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
