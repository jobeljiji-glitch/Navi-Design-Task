import { useState } from 'react'
import { BadgeCheck, Delete, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

/**
 * Generic bank UPI app (step 3). Deliberately NOT BookMyShow-styled:
 * system font, neutral greys, link-blue accent, no brand marks.
 * Copy verbatim from spec §4 step 3; `mode="payment"` is the fallback rail.
 */
export interface UpiMandateScreenProps {
  amount: string
  /** block = Reserve Pay (organiser), card = card pre-auth (08 ladder), payment = pay-and-refund fallback, pay = a friend's one-off payment (05) */
  mode?: 'block' | 'card' | 'payment' | 'pay'
  /** Card rung: "ending 4021" (fictional card) */
  cardLabel?: string
  /** 08: the bank is slow (timeout failure): show "Waiting for your bank…" before answering */
  slowBank?: boolean
  debitedNow?: string
  furtherDebits?: string
  blockEnds?: string
  refundLine?: string
  showDetails?: string
  payerVpa?: string
  plainNote?: string
  onApprove: (pin: string) => void
  onDecline: () => void
  className?: string
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b text-[15px] leading-[20px]" style={{ borderColor: 'var(--divider)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-right font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

export default function UpiMandateScreen({
  amount,
  mode = 'block',
  debitedNow = '₹277.14',
  furtherDebits = 'Only for seats you keep',
  blockEnds = 'Today, 7:45 PM',
  refundLine = '₹277.14 each time a friend pays',
  showDetails = 'Group hold · Monsoon Heist · Fri 9:15 PM',
  payerVpa = 'rohan@okbank',
  plainNote = "This money stays in your account — it's only set aside. You're only charged for seats your friends don't pay for.",
  cardLabel = 'ending 4021',
  slowBank = false,
  onApprove,
  onDecline,
  className = '',
}: UpiMandateScreenProps) {
  const [pinOpen, setPinOpen] = useState(false)
  const [pin, setPin] = useState('')
  const isCard = mode === 'card'
  const isBlock = mode === 'block' || isCard
  const [waiting, setWaiting] = useState(false)

  const press = (key: string) => {
    if (key === 'del') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (!key || pin.length >= 4) return
    const next = pin + key
    setPin(next)
    if (next.length === 4) {
      if (slowBank) {
        setWaiting(true)
        setTimeout(() => onApprove(next), 1800)
      } else setTimeout(() => onApprove(next), 250)
    }
  }

  return (
    <div
      className={`relative w-full h-full flex flex-col select-none ${className}`}
      style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'var(--font-system)' }}
      data-testid="upi-app"
    >
      {/* App bar */}
      <div className="h-[52px] shrink-0 flex items-center justify-between px-2 border-b" style={{ borderColor: 'var(--divider)' }}>
        <button type="button" onClick={onDecline} className="w-11 h-11 flex items-center justify-center" aria-label="Close and decline">
          <X size={22} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
        </button>
        <span className="text-[16px] font-medium">{isCard ? 'Card check' : 'UPI'}</span>
        <span className="w-11" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4 flex flex-col">
        <h1 className="text-[22px] leading-[28px] font-normal text-balance">{isCard ? 'Approve a hold on your card' : isBlock ? 'Approve a block request' : 'Approve a payment'}</h1>

        {/* Merchant */}
        <div className="flex items-center gap-3 mt-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[16px] font-medium shrink-0" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
            B
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[16px] leading-[22px] font-medium">BookMyShow</span>
              <BadgeCheck size={16} strokeWidth={1.75} style={{ color: 'var(--text-link)' }} aria-label="Verified merchant" />
            </div>
            <p className="text-[13px] leading-[18px]" style={{ color: 'var(--text-secondary)' }}>{showDetails}</p>
          </div>
        </div>

        {/* Amount */}
        <div className="mt-5 py-5 flex flex-col items-center" style={{ backgroundColor: 'var(--bg-page)', borderRadius: 'var(--card-radius)' }}>
          <span className="text-[34px] leading-[40px] font-medium" data-testid="upi-amount">{amount}</span>
          <span className="text-[14px] leading-[20px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isCard ? `will be held on your card ${cardLabel}` : isBlock ? 'will be blocked in your account' : 'will be debited from your account'}
          </span>
        </div>

        {/* Details */}
        <div className="mt-2">
          {isCard ? (
            <>
              <DetailRow label="Charged now" value={debitedNow} />
              <DetailRow label="Further charges" value={furtherDebits} />
              <DetailRow label="Hold ends" value={blockEnds} />
              <DetailRow label="Type" value="Card pre-authorisation" />
            </>
          ) : isBlock ? (
            <>
              <DetailRow label="Debited now" value={debitedNow} />
              <DetailRow label="Further debits" value={furtherDebits} />
              <DetailRow label="Block ends" value={blockEnds} />
              <DetailRow label="Type" value="UPI Reserve Pay" />
            </>
          ) : mode === 'pay' ? (
            <>
              <DetailRow label="Debited now" value={amount} />
              <DetailRow label="From" value={payerVpa} />
              <DetailRow label="Type" value="UPI payment" />
            </>
          ) : (
            <>
              <DetailRow label="Debited now" value={amount} />
              <DetailRow label="Refunds" value={refundLine} />
              <DetailRow label="Type" value="UPI payment" />
            </>
          )}
        </div>

        {isBlock && (
          <div className="mt-4 px-4 py-3 text-[14px] leading-[20px]" style={{ backgroundColor: 'var(--bg-info)', borderRadius: 'var(--card-radius)' }} data-testid="upi-plain-note">
            {plainNote}
          </div>
        )}
        {mode !== 'pay' && (
          <p className="mt-3 text-[13px] leading-[18px]" style={{ color: 'var(--text-secondary)' }}>
            {isCard
              ? 'Unused money is unblocked automatically when the hold ends.'
              : isBlock
              ? 'Unused money is unblocked automatically. You can cancel this block from Mandates.'
              : 'Each time a friend pays, their share comes back to this account.'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 px-4 pt-3 pb-3 flex gap-3 border-t" style={{ borderColor: 'var(--divider)' }}>
        <button
          type="button"
          onClick={onDecline}
          className="flex-1 h-12 rounded-[8px] border text-[16px] font-medium"
          style={{ borderColor: 'var(--border-grey)', color: 'var(--text-primary)' }}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => setPinOpen(true)}
          className="flex-1 h-12 rounded-[8px] text-[16px] font-medium"
          style={{ backgroundColor: 'var(--text-link)', color: 'var(--text-on-brand)' }}
          data-testid="approve-with-pin"
        >
          {isCard ? 'Approve with OTP' : 'Approve with PIN'}
        </button>
      </div>

      {/* PIN pad */}
      <AnimatePresence>
        {pinOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 z-50 flex flex-col"
            style={{ backgroundColor: 'var(--bg-surface)' }}
            data-testid="upi-pin"
          >
            <div className="h-[52px] shrink-0 flex items-center px-2 border-b" style={{ borderColor: 'var(--divider)' }}>
              <button type="button" onClick={() => { setPinOpen(false); setPin('') }} className="w-11 h-11 flex items-center justify-center" aria-label="Close PIN entry">
                <X size={22} strokeWidth={1.75} />
              </button>
              <span className="text-[15px] ml-1" style={{ color: 'var(--text-secondary)' }}>{isCard ? `Card ${cardLabel}` : payerVpa}</span>
            </div>

            <div className="flex-1 flex flex-col items-center pt-8 px-4">
              <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                {isCard ? 'Hold' : isBlock ? 'Block' : 'Pay'} {amount} · BookMyShow
              </span>
              <span className="text-[20px] leading-[26px] font-medium mt-6">{isCard ? 'Enter the 4-digit code sent to your phone' : 'Enter 4-digit UPI PIN'}</span>
              <div className="flex gap-5 mt-6" aria-label={`${pin.length} of 4 digits entered`}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-9 flex flex-col items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: i < pin.length ? 'var(--text-primary)' : 'transparent' }} />
                    <span className="w-9 h-[2px]" style={{ backgroundColor: i < pin.length ? 'var(--text-primary)' : 'var(--border-grey)' }} />
                  </div>
                ))}
              </div>
              {waiting && (
                <p className="mt-8 text-[15px]" role="status" style={{ color: 'var(--text-secondary)' }} data-testid="upi-waiting">
                  Waiting for your bank…
                </p>
              )}
            </div>

            <div className="shrink-0 grid grid-cols-3 gap-[6px] p-[6px]" style={{ backgroundColor: 'var(--bg-tag)' }}>
              {KEYS.map((k, i) =>
                k === '' ? (
                  <span key={i} />
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => press(k)}
                    className="h-[52px] rounded-[6px] flex items-center justify-center text-[24px] font-normal active:opacity-60"
                    style={{ backgroundColor: k === 'del' ? 'transparent' : 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    aria-label={k === 'del' ? 'Delete digit' : `Digit ${k}`}
                    data-testid={`pin-key-${k}`}
                  >
                    {k === 'del' ? <Delete size={24} strokeWidth={1.75} /> : k}
                  </button>
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
