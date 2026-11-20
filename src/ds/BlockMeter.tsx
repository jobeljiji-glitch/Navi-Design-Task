import { formatINR } from '@/logic/money'

/**
 * BlockMeter (step 7): one stacked 8 pt bar (you paid · friends paid · still blocked) and a legend
 * in the ref-22 price-row style (grey 14 pt label, value right). No card chrome: it sits inside a Card.
 */
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
  const pct = (p: number) => (total > 0 ? (p / total) * 100 : 0)
  const parts = [
    { key: 'you', label: youPaidLabel, paise: youPaidPaise, color: 'var(--text-success)', dashed: false },
    { key: 'friends', label: friendsPaidLabel, paise: friendsPaidPaise, color: 'var(--seat-selected)', dashed: false },
    { key: 'blocked', label: stillBlockedLabel, paise: stillBlockedPaise, color: 'var(--seat-held-fill)', dashed: true },
  ]

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`} data-testid="block-meter">
      <div
        className="w-full h-2 rounded-full flex gap-0.5"
        style={{ backgroundColor: 'var(--bg-muted)' }}
        role="img"
        aria-label={parts.map((p) => `${p.label} ${formatINR(p.paise)}`).join(', ')}
      >
        {parts
          .filter((p) => p.paise > 0)
          .map((p) => (
            <div
              key={p.key}
              className="h-full rounded-full first:rounded-l-full"
              style={{
                width: `${pct(p.paise)}%`,
                backgroundColor: p.color,
                border: p.dashed ? '1px dashed var(--seat-held-border)' : undefined,
              }}
            />
          ))}
      </div>
      <div className="flex flex-col gap-2">
        {parts.map((p) => (
          <div key={p.key} className="flex items-center justify-between gap-3 text-[14px] leading-[20px]" data-testid={`meter-${p.key}`}>
            <span className="flex items-center gap-2 min-w-0" style={{ color: 'var(--text-secondary)' }}>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: p.color, border: p.dashed ? '1px dashed var(--seat-held-border)' : undefined }}
                aria-hidden
              />
              {p.label}
            </span>
            <span className="shrink-0" style={{ color: 'var(--text-primary)' }}>{formatINR(p.paise)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
