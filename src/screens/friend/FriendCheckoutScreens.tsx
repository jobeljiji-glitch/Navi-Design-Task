import { useState } from 'react'
import { motion } from 'motion/react'
import { AlertCircle, CreditCard, Check, MessageCircle } from 'lucide-react'
import { AmountHeader, Band, Card, OtpInput, PaymentIconTile, PaymentMethodList, PaymentMethodRow, PinnedFooter, PriceRow, PrimaryCTA, TicketCard, UpiMandateScreen } from '@/ds'
import { useDemoStore } from '@/store'
import { selectCutoffCheckout } from '@/logic/failureFlow'
import { selectFriendCheckout, selectFriendTicket, type FriendName } from '@/logic/friendFlow'
import { selectFriendSetLine, selectLatePage, selectTransferNote } from '@/logic/boardFlow'
import FriendHeader from './FriendHeader'

/** Fictional UPI apps (initials only, no brand marks): D-070. */
export const UPI_APPS = [
  { id: 'okbank', name: 'OKBANK UPI', initials: 'OK' },
  { id: 'kite', name: 'Kite Pay', initials: 'KP' },
  { id: 'mango', name: 'Mango Pay', initials: 'MP' },
]

const page = 'w-full h-full flex flex-col overflow-hidden relative select-none'

// ---------------------------------------------------------------------------
// Step 6a: phone + OTP (skipped when logged in)
// ---------------------------------------------------------------------------

export function FriendPhoneScreen({ name }: { name: FriendName }) {
  const state = useDemoStore()
  const dispatch = state.dispatch
  const v = selectFriendCheckout(state, name)
  const session = state.friendFlow.sessions[name]
  const [phone, setPhone] = useState(session.phone || v.demoPhone)
  const [otp, setOtp] = useState('')
  const isOtp = session.screen === 'otp'
  const digits = phone.replace(/\D/g, '')

  return (
    <div className={page} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }} data-testid={isOtp ? 'friend-otp' : 'friend-phone'}>
      <FriendHeader title={isOtp ? 'Verify your number' : 'Pay for your seat'} onBack={() => dispatch({ type: 'FRIEND_BACK', name })} />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 flex flex-col">
        {!isOtp ? (
          <>
            <h2 className="text-[20px] leading-[26px] font-normal">{v.phoneTitle}</h2>
            <p className="text-[14px] leading-[20px] mt-1" style={{ color: 'var(--text-secondary)' }}>{v.phoneSub}</p>
            <label className="mt-5 flex items-stretch h-12 rounded-[6px] border overflow-hidden" style={{ borderColor: 'var(--border-grey)' }}>
              <span className="px-3 flex items-center text-[16px] border-r" style={{ borderColor: 'var(--divider)', color: 'var(--text-secondary)' }}>+91</span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 min-w-0 px-3 text-[16px] outline-none bg-transparent"
                aria-label={v.phoneTitle}
                data-testid="phone-input"
              />
            </label>
            <p className="text-[12px] leading-[16px] mt-2" style={{ color: 'var(--text-secondary)' }}>
              No account needed. We'll send a 4-digit code.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-[20px] leading-[26px] font-normal">{v.otpTitle}</h2>
            <p className="text-[14px] leading-[20px] mt-1" style={{ color: 'var(--text-secondary)' }}>Sent to +91 {session.phone}</p>
            <OtpInput
              className="mt-6 !justify-start"
              value={otp}
              onChange={setOtp}
              onComplete={() => setTimeout(() => dispatch({ type: 'FRIEND_OTP_OK', name }), 250)}
            />
            <p className="text-[12px] leading-[16px] mt-3" style={{ color: 'var(--text-secondary)' }}>Any 4 digits work in this prototype.</p>
          </>
        )}
      </div>
      {!isOtp && (
        <PinnedFooter divider={false}>
          <PrimaryCTA variant="strong" size="lg" disabled={digits.length !== 10} onClick={() => dispatch({ type: 'FRIEND_PHONE_SUBMIT', name, phone })}>
            Continue
          </PrimaryCTA>
        </PinnedFooter>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 6b: "Pay ₹277.14 with" (ref 12 anatomy, 09: the shared PaymentMethodRow list)
// ---------------------------------------------------------------------------

export function FriendUpiChoiceScreen({ name }: { name: FriendName }) {
  const state = useDemoStore()
  const dispatch = state.dispatch
  const v = selectFriendCheckout(state, name)
  const choose = (app: string) => dispatch({ type: 'FRIEND_CHOOSE_UPI', name, app })

  return (
    <div className={page} style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} data-testid="friend-upi-choice">
      <div style={{ backgroundColor: 'var(--bg-surface)' }}>
        <FriendHeader title="Payment" onBack={() => dispatch({ type: 'FRIEND_BACK', name })} white />
      </div>
      <AmountHeader amount={v.amount} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="mt-3 px-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <PaymentMethodList label={v.payWith}>
            {UPI_APPS.map((a) => (
              <PaymentMethodRow key={a.id} icon={<PaymentIconTile>{a.initials}</PaymentIconTile>} title={a.name} subtitle="UPI app" onClick={() => choose(a.name)} testId={`upi-app-${a.id}`} divider />
            ))}
          </PaymentMethodList>
          <PaymentMethodList label="Other payment options">
            <PaymentMethodRow
              icon={<PaymentIconTile><CreditCard size={18} strokeWidth={1.75} /></PaymentIconTile>}
              title="Card or net banking"
              subtitle="Credit, debit or net banking"
              onClick={() => choose('Card or net banking')}
            />
          </PaymentMethodList>
        </div>
        <p className="px-4 pt-4 text-[12px] leading-[16px]" style={{ color: 'var(--text-secondary)' }}>{v.seats} is held for you while you pay.</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 6c: generic UPI app
// ---------------------------------------------------------------------------

export function FriendApproveScreen({ name }: { name: FriendName }) {
  const state = useDemoStore()
  const dispatch = state.dispatch
  const v = selectFriendCheckout(state, name)
  return (
    <UpiMandateScreen
      mode="pay"
      amount={v.amount}
      showDetails={v.upiDetails}
      payerVpa={`${name.toLowerCase()}@okbank`}
      onApprove={() => dispatch({ type: 'FRIEND_APPROVE', name })}
      onDecline={() => dispatch({ type: 'FRIEND_BACK', name })}
    />
  )
}

// ---------------------------------------------------------------------------
// Step 6d: pending / failed
// ---------------------------------------------------------------------------

function Dots() {
  return (
    <span className="flex gap-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: 'var(--bms-red)' }}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  )
}

export function FriendPendingScreen({ name }: { name: FriendName }) {
  const state = useDemoStore()
  const dispatch = state.dispatch
  const v = selectFriendCheckout(state, name)
  const failed = state.friendFlow.sessions[name].screen === 'failed'
  // 09: a late payment after the 9:00 PM cut-off (10-min grace, then no retry)
  const showtime = selectCutoffCheckout(state, name)

  return (
    <div className={page} style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} data-testid={failed ? 'friend-failed' : 'friend-pending'}>
      <FriendHeader title="Payment" onBack={failed ? () => dispatch({ type: 'FRIEND_BACK', name }) : undefined} />
      <div className="flex-1 min-h-0 px-4 pt-2">
        <Card className="flex flex-col items-center text-center gap-3">
          {failed ? (
            <AlertCircle size={40} strokeWidth={1.75} style={{ color: 'var(--bms-red)' }} />
          ) : (
            <div className="h-10 flex items-center"><Dots /></div>
          )}
          {!failed && <h2 className="text-[20px] leading-[26px] font-normal">{v.pendingTitle}</h2>}
          <p className={`${failed ? 'text-[16px] leading-[22px]' : 'text-[14px] leading-[20px]'} text-pretty max-w-[300px]`} style={{ color: failed ? 'var(--text-primary)' : 'var(--text-secondary)' }} role={failed ? 'alert' : 'status'}>
            {failed ? (showtime.failedBody ?? v.failedBody) : (showtime.pendingBody ?? v.pendingBody)}
          </p>
          {!failed && (
            <p className="text-[14px] leading-[20px] font-medium">{v.amount}</p>
          )}
        </Card>
      </div>
      {failed && !showtime.canRetry && (
        <PinnedFooter>
          <PrimaryCTA variant="strong" size="lg" onClick={() => dispatch({ type: 'FRIEND_GOTO', name, screen: 'chat' })}>Back to the chat</PrimaryCTA>
        </PinnedFooter>
      )}
      {failed && showtime.canRetry && (
        <PinnedFooter>
          <PrimaryCTA variant="strong" size="lg" onClick={() => dispatch({ type: 'FRIEND_RETRY', name })}>Try again</PrimaryCTA>
          <button type="button" onClick={() => dispatch({ type: 'FRIEND_GOTO', name, screen: 'pay' })} className="self-center h-11 px-4 text-[14px] font-medium" style={{ color: 'var(--bms-red-text)' }}>
            Pick another seat
          </button>
        </PinnedFooter>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 6e: ticket
// ---------------------------------------------------------------------------

export function FriendTicketScreen({ name }: { name: FriendName }) {
  const state = useDemoStore()
  const dispatch = state.dispatch
  const t = selectFriendTicket(state, name)
  const setLine = selectFriendSetLine(state, name)
  const transfer = selectTransferNote(state, name)
  const [kept, setKept] = useState(false)
  if (!t) return null
  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar select-none" style={{ backgroundColor: 'var(--ticket-page-bg)' }} data-testid="friend-ticket" data-tour="friend-ticket">
      {setLine && (
        <div className="px-5 pt-4 -mb-2">
          <Band standalone title={setLine} testId="group-set-band" />
        </div>
      )}
      <TicketCard
        headline={t.headline}
        filmTitle={`${t.film} (U/A)`}
        languageFormat={t.meta}
        showtime={t.dateLine}
        cinema={t.cinema}
        screen={t.screen}
        seat={t.seats}
        ticketCount={t.ticketCount}
        bookingId={t.bookingId}
        cancellationText={transfer?.seatLine ?? t.seatLine}
        totalAmount={transfer?.amount ?? t.amount}
        groupBannerText={t.groupLine}
        qrValue={t.qrValue}
        onClose={() => dispatch({ type: 'FRIEND_GOTO', name, screen: 'chat' })}
        footer={
          <div className="w-full px-5 pt-4 cta-safe flex flex-col items-center gap-1">
            <PrimaryCTA variant="strong" size="lg" onClick={() => setKept(true)}>
              {kept ? (
                <span className="flex items-center gap-1.5"><Check size={18} strokeWidth={1.75} /> Saved to Your Bookings</span>
              ) : (
                'Keep it in the BookMyShow app'
              )}
            </PrimaryCTA>
          </div>
        }
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Declined / ended
// ---------------------------------------------------------------------------

export function FriendDeclinedScreen({ name }: { name: FriendName }) {
  const state = useDemoStore()
  const dispatch = state.dispatch
  const organiser = state.hold?.organiser.name ?? 'Rohan'
  return (
    <div className={page} style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} data-testid="friend-declined">
      <FriendHeader title="Group hold" onBack={() => dispatch({ type: 'FRIEND_BACK', name })} />
      <div className="px-4 pt-2">
        <Card className="flex flex-col items-center text-center gap-3">
          <MessageCircle size={36} strokeWidth={1.75} style={{ color: 'var(--text-success)' }} />
          <h2 className="text-[20px] leading-[26px] font-normal">Thanks. {organiser}'s been told.</h2>
        </Card>
      </div>
    </div>
  )
}

/**
 * After the deadline (spec §4 step 9): the kept-seat page ("Rohan kept a seat for you"),
 * "This hold has ended." (released / nothing kept) or "This show has started.".
 * Never names a friend who hasn't paid.
 */
export function FriendEndedScreen({ name }: { name: FriendName }) {
  const state = useDemoStore()
  const dispatch = state.dispatch
  const v = selectLatePage(state, name)
  const [toast, setToast] = useState<string | null>(null)
  if (!v) return null
  const late = v.view === 'late'
  return (
    <div className={page} style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} data-testid={late ? 'friend-late' : 'friend-ended'} data-tour={late ? 'late-pay' : undefined}>
      <FriendHeader title="Group hold" onBack={() => dispatch({ type: 'FRIEND_GOTO', name, screen: 'chat' })} />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-3 no-scrollbar [&>*]:shrink-0">
        <Card className="flex flex-col gap-3">
          <div>
            {v.kicker && <p className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>{v.kicker}</p>}
            <h2 className="text-[18px] leading-[24px] font-medium mt-0.5 text-balance" data-testid="late-title">{v.title}</h2>
            <p className="text-[14px] leading-[20px] mt-0.5 text-pretty" style={{ color: 'var(--text-secondary)' }}>{v.film} · {v.meta}</p>
          </div>
          {!late && v.body && (
            <p className="text-[14px] leading-[20px] text-pretty" data-testid="ended-body">{v.body}</p>
          )}
        </Card>
        {late && v.seatId && (
          <Card className="flex flex-col gap-3" band={<Band title={v.availability} testId="late-band" />}>
            <PriceRow label={`Your seat ${v.seatId}`} value={v.price} sub="incl. fees" testId="late-seat-row" />
            <p className="text-[14px] leading-[20px] text-pretty" style={{ color: 'var(--text-secondary)' }}>{v.body}</p>
          </Card>
        )}
      </div>
      {v.cta && (
        <PinnedFooter testId="late-footer">
          <div data-tour="late-pay-cta">
          <PrimaryCTA
            variant="strong"
            size="lg"
            onClick={() => {
              if (late) dispatch({ type: 'FRIEND_LATE_PAY_START', name })
              else {
                setToast(v.view === 'started' ? 'Opens Monsoon Heist showtimes in BookMyShow' : 'Opens this show in BookMyShow')
                setTimeout(() => setToast(null), 2000)
              }
            }}
          >
            {v.cta}
          </PrimaryCTA>
          </div>
        </PinnedFooter>
      )}
      {toast && (
        <div className="absolute top-16 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-black/85 text-white px-4 py-2 rounded-full text-[13px] font-medium shadow-lg" role="status">{toast}</div>
        </div>
      )}
    </div>
  )
}
