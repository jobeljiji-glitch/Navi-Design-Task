export interface BlockMeterProps {
  youPaidPaise: number
  friendsPaidPaise: number
  stillBlockedPaise: number
  youPaidLabel?: string
  friendsPaidLabel?: string
  stillBlockedLabel?: string
  className?: string
}

export default function BlockMeter({
  youPaidPaise,
  friendsPaidPaise,
  stillBlockedPaise,
  youPaidLabel = 'You paid',
  friendsPaidLabel = 'Friends paid',
  stillBlockedLabel = 'Still blocked',
  className = '',
}: BlockMeterProps) {
  const total = youPaidPaise + friendsPaidPaise + stillBlockedPaise
  const youPct = total > 0 ? (youPaidPaise / total) * 100 : 0
  const friendsPct = total > 0 ? (friendsPaidPaise / total) * 100 : 0
  const blockedPct = total > 0 ? (stillBlockedPaise / total) * 100 : 0

  const formatAmount = (paise: number) => `₹${(paise / 100).toFixed(2)}`

  return (
    <div
      className={`w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-3 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--divider)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      {/* Stacked Progress Bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-bg-muted">
        {/* You paid segment */}
        {youPct > 0 && (
          <div
            style={{
              width: `${youPct}%`,
              backgroundColor: 'var(--seat-selected)',
            }}
            title={`You paid: ${formatAmount(youPaidPaise)}`}
          />
        )}
        {/* Friends paid segment */}
        {friendsPct > 0 && (
          <div
            style={{
              width: `${friendsPct}%`,
              backgroundColor: 'var(--text-success)',
            }}
            title={`Friends paid: ${formatAmount(friendsPaidPaise)}`}
          />
        )}
        {/* Still blocked segment */}
        {blockedPct > 0 && (
          <div
            style={{
              width: `${blockedPct}%`,
              backgroundColor: 'var(--seat-held-border)',
            }}
            title={`Still blocked: ${formatAmount(stillBlockedPaise)}`}
          />
        )}
      </div>

      {/* Legend with amounts */}
      <div className="flex items-center justify-between text-[11px] leading-tight flex-wrap gap-2 pt-1">
        {/* You paid */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: 'var(--seat-selected)' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            {youPaidLabel} ({formatAmount(youPaidPaise)})
          </span>
        </div>

        {/* Friends paid */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: 'var(--text-success)' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            {friendsPaidLabel} ({formatAmount(friendsPaidPaise)})
          </span>
        </div>

        {/* Still blocked */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: 'var(--seat-held-border)' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            {stillBlockedLabel} ({formatAmount(stillBlockedPaise)})
          </span>
        </div>
      </div>
    </div>
  )
}
