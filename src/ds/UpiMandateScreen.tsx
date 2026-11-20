import { useState } from 'react'
import { CheckCircle2, Shield, X } from 'lucide-react'
import PrimaryCTA from './PrimaryCTA'

export interface UpiMandateScreenProps {
  amount: string
  debitedNow?: string
  furtherDebits?: string
  blockEnds?: string
  showDetails?: string
  onApprove: (pin: string) => void
  onDecline: () => void
  className?: string
}

export default function UpiMandateScreen({
  amount,
  debitedNow = '₹277.14',
  furtherDebits = 'Only for seats you keep',
  blockEnds = 'Today, 7:45 PM',
  showDetails = 'Group hold · Monsoon Heist · Fri 9:15 PM',
  onApprove,
  onDecline,
  className = '',
}: UpiMandateScreenProps) {
  const [pinSheetOpen, setPinSheetOpen] = useState(false)
  const [pin, setPin] = useState('')

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit
      setPin(nextPin)
      if (nextPin.length === 4) {
        setTimeout(() => {
          onApprove(nextPin)
        }, 200)
      }
    }
  }

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1))
  }

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between p-6 select-none ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} strokeWidth={2} style={{ color: 'var(--text-success)' }} />
            <span
              className="text-[14px] font-semibold tracking-tight uppercase"
              style={{ color: 'var(--text-secondary)' }}
            >
              UPI Reserve Pay
            </span>
          </div>
          <button
            type="button"
            onClick={onDecline}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-bg-muted"
            aria-label="Decline request"
          >
            <X size={18} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="flex flex-col gap-1 pt-2">
          <span className="text-[14px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
            Approve a block request from
          </span>
          <div className="flex items-center gap-1.5">
            <h2 className="text-[18px] font-bold text-text-primary" style={{ color: 'var(--text-primary)' }}>
              BookMyShow
            </h2>
            <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: 'var(--showtime-green)' }} />
          </div>
          <span className="text-[13px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
            {showDetails}
          </span>
        </div>

        {/* Big Block Amount Box */}
        <div
          className="rounded-[12px] p-4 flex flex-col items-center justify-center gap-1 border my-2"
          style={{
            backgroundColor: 'var(--bg-page)',
            borderColor: 'var(--divider)',
          }}
        >
          <span className="text-[12px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
            Total amount to be blocked
          </span>
          <span className="text-[30px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {amount}
          </span>
        </div>

        {/* Breakdown Rows */}
        <div className="flex flex-col gap-2.5 text-[13px] pt-1">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Debited now</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{debitedNow}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Further debits</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{furtherDebits}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Block ends</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{blockEnds}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Type</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>UPI Reserve Pay</span>
          </div>
        </div>

        <p className="text-[11px] leading-[15px] text-text-secondary mt-1" style={{ color: 'var(--text-secondary)' }}>
          Unused money is unblocked automatically. You can cancel this block from Mandates.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="button"
          onClick={onDecline}
          className="flex-1 h-[40px] rounded-[6px] font-medium text-[15px] border"
          style={{
            borderColor: 'var(--divider)',
            color: 'var(--text-secondary)',
          }}
        >
          Decline
        </button>
        <div className="flex-1">
          <PrimaryCTA onClick={() => setPinSheetOpen(true)}>
            Approve with PIN
          </PrimaryCTA>
        </div>
      </div>

      {/* UPI PIN Sheet Overlay */}
      {pinSheetOpen && (
        <div
          className="absolute inset-0 z-50 flex flex-col justify-end"
          style={{ backgroundColor: 'var(--scrim)' }}
        >
          <div
            className="w-full rounded-t-[18px] p-6 flex flex-col items-center gap-5 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[14px] font-semibold text-text-primary" style={{ color: 'var(--text-primary)' }}>
                Enter 4-digit UPI PIN
              </span>
              <button
                type="button"
                onClick={() => setPinSheetOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-bg-muted"
              >
                <X size={16} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* PIN Dots */}
            <div className="flex items-center gap-4 my-2">
              {[0, 1, 2, 3].map(idx => (
                <div
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border transition-all"
                  style={{
                    backgroundColor: idx < pin.length ? 'var(--text-primary)' : 'transparent',
                    borderColor: 'var(--text-primary)',
                  }}
                />
              ))}
            </div>

            {/* 3x4 Number Pad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handlePinDigit(d)}
                  className="h-12 rounded-[8px] text-[20px] font-medium flex items-center justify-center border hover:bg-bg-muted active:scale-95"
                  style={{
                    borderColor: 'var(--divider)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {d}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="h-12 rounded-[8px] text-[20px] font-medium flex items-center justify-center border hover:bg-bg-muted active:scale-95"
                style={{
                  borderColor: 'var(--divider)',
                  color: 'var(--text-primary)',
                }}
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-[8px] text-[14px] font-medium flex items-center justify-center border hover:bg-bg-muted active:scale-95"
                style={{
                  borderColor: 'var(--divider)',
                  color: 'var(--text-secondary)',
                }}
                aria-label="Delete digit"
              >
                Del
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
