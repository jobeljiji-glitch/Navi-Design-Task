export interface MoneyLedgerProps {
  debitedNow: string
  blockedAmount: string
  mostPayable: string
  helperText?: string
  fallbackMode?: boolean
  className?: string
}

export default function MoneyLedger({
  debitedNow,
  blockedAmount,
  mostPayable,
  helperText = 'Each time a friend pays, ₹277.14 is unblocked. Works like an IPO application.',
  fallbackMode = false,
  className = '',
}: MoneyLedgerProps) {
  if (fallbackMode) {
    return (
      <div
        className={`w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-2.5 border border-divider ${className}`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--divider)',
          borderRadius: 'var(--card-radius)',
        }}
      >
        <div className="flex items-center justify-between text-[14px] leading-[20px]">
          <span className="text-text-primary" style={{ color: 'var(--text-primary)' }}>
            Pay now
          </span>
          <span className="font-semibold text-text-primary" style={{ color: 'var(--text-primary)' }}>
            {mostPayable}
          </span>
        </div>
        <p className="text-[12px] leading-[16px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
          Get {debitedNow} back each time a friend pays their share.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-2.5 border border-divider shadow-sm ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--divider)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      {/* Row 1: Leaves your account now */}
      <div className="flex items-center justify-between text-[14px] leading-[20px]">
        <span
          className="text-text-secondary font-normal"
          style={{ color: 'var(--text-secondary)' }}
        >
          Leaves your account now
        </span>
        <span
          className="font-medium text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {debitedNow}
        </span>
      </div>

      {/* Row 2: Blocked, not taken */}
      <div className="flex items-center justify-between text-[14px] leading-[20px]">
        <span
          className="text-text-secondary font-normal"
          style={{ color: 'var(--text-secondary)' }}
        >
          Blocked, not taken
        </span>
        <span
          className="font-medium text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {blockedAmount}
        </span>
      </div>

      {/* Divider */}
      <div
        className="w-full h-[1px] my-0.5"
        style={{ backgroundColor: 'var(--divider)' }}
      />

      {/* Row 3: Most you could pay */}
      <div className="flex items-center justify-between text-[15px] leading-[22px]">
        <span
          className="font-semibold text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          Most you could pay
        </span>
        <span
          className="font-bold text-[17px] text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {mostPayable}
        </span>
      </div>

      {/* Helper text */}
      {helperText && (
        <p
          className="text-[12px] leading-[16px] text-text-secondary mt-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {helperText}
        </p>
      )}
    </div>
  )
}
