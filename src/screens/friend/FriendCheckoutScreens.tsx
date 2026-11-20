import { useState } from 'react'
import { motion } from 'motion/react'
import { AlertCircle, CreditCard, Check, MessageCircle } from 'lucide-react'
import { AmountHeader, Card, OtpInput, PaymentRow, PrimaryCTA, TicketCard, UpiMandateScreen } from '@/ds'
import { useDemoStore } from '@/store'
import { selectFriendCheckout, selectFriendPage, selectFriendTicket, type FriendName } from '@/logic/friendFlow'
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
        <div className="shrink-0 px-4 pt-3 cta-safe">
          <PrimaryCTA variant="strong" size="lg" disabled={digits.length !== 10} onClick={() => dispatch({ type: 'FRIEND_PHONE_SUBMIT', name, phone })}>
            Continue
          </PrimaryCTA>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 6b: "Pay ₹277.14 with" (ref 12 anatomy)
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
        <p className="px-4 pt-4 pb-2 text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>{v.payWith}</p>
        <div className="px-4 grid grid-cols-3 gap-2">
          {UPI_APPS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => choose(a.name)}
              className="h-[96px] flex flex-col items-center justify-center gap-2 active:opacity-70"
              style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--card-radius)', boxShadow: 'var(--card-shadow)' }}
              data-testid={`upi-app-${a.id}`}
            >
              <span className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[14px] font-medium" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                {a.initials}
              </span>
              <span className="text-[13px] leading-[16px]">{a.name}</span>
            </button>
          ))}
        </div>
        <p className="px-4 pt-5 pb-2 text-[13px] leading-[18px] uppercase tracking-[0.3px]" style={{ color: 'var(--text-secondary)' }}>Other payment options</p>
        <PaymentRow icon={<CreditCard size={24} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />} title="Card or net banking" onClick={() => choose('Card or net banking')} />
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

  return (
    <div className={page} style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} data-testid={failed ? 'friend-failed' : 'friend-pending'}>
      <FriendHeader title="Payment" onBack={failed ? () => dispatch({ type: 'FRIEND_BACK', name }) : undefined} />
      <div className="flex-1 min-h-0 px-4 pt-2">
        <Card className="flex flex-col items-center text-center gap-3 py-8">
          {failed ? (
            <AlertCircle size={40} strokeWidth={1.75} style={{ color: 'var(--bms-red)' }} />
          ) : (
            <div className="h-10 flex items-center"><Dots /></div>
          )}
          {!failed && <h2 className="text-[20px] leading-[26px] font-normal">{v.pendingTitle}</h2>}
          <p className={`${failed ? 'text-[16px] leading-[22px]' : 'text-[14px] leading-[20px]'} text-pretty max-w-[300px]`} style={{ color: failed ? 'var(--text-primary)' : 'var(--text-secondary)' }} role={failed ? 'alert' : 'status'}>
            {failed ? v.failedBody : v.pendingBody}
          </p>
          {!failed && (
            <p className="text-[14px] leading-[20px] font-medium">{v.amount}</p>
          )}
        </Card>
      </div>
      {failed && (
        <div className="shrink-0 px-4 pt-3 cta-safe flex flex-col items-center">
          <PrimaryCTA variant="strong" size="lg" onClick={() => dispatch({ type: 'FRIEND_RETRY', name })}>Try again</PrimaryCTA>
          <button type="button" onClick={() => dispatch({ type: 'FRIEND_GOTO', name, screen: 'pay' })} className="h-11 px-4 text-[14px] font-medium" style={{ color: 'var(--bms-red-text)' }}>
            Pick another seat
          </button>
        </div>
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
  const [kept, setKept] = useState(false)
  if (!t) return null
  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar select-none" style={{ backgroundColor: 'var(--ticket-page-bg)' }} data-testid="friend-ticket" data-tour="friend-ticket">
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
        cancellationText={t.seatLine}
        totalAmount={t.amount}
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
        <Card className="flex flex-col items-center text-center gap-3 py-8">
          <MessageCircle size={36} strokeWidth={1.75} style={{ color: 'var(--text-success)' }} />
          <h2 className="text-[20px] leading-[26px] font-normal">Thanks. {organiser}'s been told.</h2>
        </Card>
      </div>
    </div>
  )
}

export function FriendEndedScreen({ name }: { name: FriendName }) {
  const state = useDemoStore()
  const dispatch = state.dispatch
  const v = selectFriendPage(state, name)
  return (
    <div className={page} style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} data-testid="friend-ended">
      <FriendHeader title="Group hold" onBack={() => dispatch({ type: 'FRIEND_GOTO', name, screen: 'chat' })} />
      <div className="px-4 pt-2">
        <Card className="flex flex-col gap-1 py-6">
          <h2 className="text-[18px] leading-[24px] font-medium">{v?.endedTitle ?? 'This hold has ended.'}</h2>
          <p className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>{v?.film}</p>
        </Card>
      </div>
    </div>
  )
}
