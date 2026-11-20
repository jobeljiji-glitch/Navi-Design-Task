/**
 * DemandBanner (step 1b): full-width band under the seat-map header strip.
 * Styled like the cancellation band in ref 22: tinted fill, 16 pt side margin,
 * 500 lead phrase + 400 rest, no icon. Copy verbatim from spec §4 step 1b.
 */
export type DemandTierType = 'low' | 'medium' | 'high'

export interface DemandBannerProps {
  tier: DemandTierType
  pctLeft?: number
  holdHours?: number
  className?: string
}

function demandBannerParts(tier: DemandTierType, pctLeft?: number, holdHours?: number): [string, string] {
  switch (tier) {
    case 'low':
      return ['Plenty of seats', ` · group hold: ${holdHours ?? 24}h`]
    case 'high':
      return ['Filling fast', ` · ${pctLeft ?? 18}% left · group hold: ${holdHours ?? 2}h`]
    case 'medium':
    default:
      return ['Selling steadily', ` · ${pctLeft ?? 41}% left · group hold: ${holdHours ?? 6}h`]
  }
}

export default function DemandBanner({ tier, pctLeft, holdHours, className = '' }: DemandBannerProps) {
  const [lead, rest] = demandBannerParts(tier, pctLeft, holdHours)
  return (
    <div
      data-testid="demand-banner"
      className={`w-full px-4 py-2 shrink-0 text-[13px] leading-[18px] ${className}`}
      style={{
        backgroundColor: tier === 'high' ? 'var(--bg-warning)' : 'var(--bg-success)',
        color: 'var(--text-primary)',
      }}
    >
      <span className="font-medium">{lead}</span>
      <span className="font-normal">{rest}</span>
    </div>
  )
}
