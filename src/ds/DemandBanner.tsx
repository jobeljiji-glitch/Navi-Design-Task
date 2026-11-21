/**
 * DemandBanner (step 1b): full-width band under the seat-map header strip.
 * Styled like the cancellation band in ref 22: tinted fill, 16 pt side margin,
 * 500 lead phrase + 400 rest, no icon. Copy verbatim from spec §4 step 1b.
 */
export type DemandTierType = 'low' | 'medium' | 'high'

export interface DemandBannerProps {
  tier: DemandTierType
  pctLeft?: number
  /** "3h", "8h", "90 min" (10) */
  holdLabel?: string
  className?: string
}

function demandBannerParts(tier: DemandTierType, pctLeft?: number, holdLabel?: string): [string, string] {
  switch (tier) {
    case 'low':
      return ['Plenty of seats', ` · group hold: ${holdLabel ?? '8h'}`]
    case 'high':
      return ['Filling fast', ` · ${pctLeft ?? 18}% left · group hold: ${holdLabel ?? '90 min'}`]
    case 'medium':
    default:
      return ['Selling steadily', ` · ${pctLeft ?? 41}% left · group hold: ${holdLabel ?? '3h'}`]
  }
}

export default function DemandBanner({ tier, pctLeft, holdLabel, className = '' }: DemandBannerProps) {
  const [lead, rest] = demandBannerParts(tier, pctLeft, holdLabel)
  return (
    <div
      data-testid="demand-banner"
      className={`w-full px-4 py-2 shrink-0 text-[13px] leading-[18px] ${className}`}
      style={{
        backgroundColor: 'var(--bg-warning)',
        color: 'var(--text-primary)',
      }}
    >
      <span className="font-medium">{lead}</span>
      <span className="font-normal">{rest}</span>
    </div>
  )
}
