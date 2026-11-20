/**
 * MoneyLedger (kit only): charged now / blocked / total block.
 * Visual language copied from the price card in ref 11/22: grey 14 pt labels,
 * values right-aligned, dashed divider, total row in primary text weight 500.
 */
export interface MoneyLedgerProps {
  debitedNow: string
  blockedAmount: string
  mostPayable: string
  helperText?: string
  fallbackMode?: boolean
  /** Fallback (bank can't block) single line, e.g. "Pay ₹1,662.84 now · get ₹277.14 back each time a friend pays" */
  fallbackLine?: string
  className?: string
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[14px] leading-[20px]">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="shrink-0" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function Dashed() {
  return <div className="w-full border-t border-dashed" style={{ borderColor: 'var(--bg-tag)' }} />
}

export default function MoneyLedger({
  debitedNow,
  blockedAmount,
  mostPayable,
  helperText = 'Blocked, not charged. Unused money is unblocked at showtime.',
  fallbackMode = false,
  fallbackLine,
  className = '',
}: MoneyLedgerProps) {
  return (
    <div
      className={`w-full px-4 py-3.5 flex flex-col gap-3 ${className}`}
      style={{
        // 04c surface system: soft grey group (used inside white sheets), no border
        backgroundColor: 'var(--bg-muted)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      {fallbackMode ? (
        <p className="text-[15px] leading-[20px]" style={{ color: 'var(--text-primary)' }} data-testid="fallback-line">
          {fallbackLine ?? `Pay ${mostPayable} now · ${debitedNow} refunded each time a friend pays`}
        </p>
      ) : (
        <>
          <Row label="Charged now" value={debitedNow} />
          <Row label="Blocked, not charged" value={blockedAmount} />
          <Dashed />
          <div className="flex items-center justify-between text-[15px] leading-[20px] font-medium" style={{ color: 'var(--text-primary)' }}>
            <span>Blocked on UPI</span>
            <span>{mostPayable}</span>
          </div>
          {helperText && (
            <p className="text-[13px] leading-[18px]" style={{ color: 'var(--text-secondary)' }}>
              {helperText}
            </p>
          )}
        </>
      )}
    </div>
  )
}
