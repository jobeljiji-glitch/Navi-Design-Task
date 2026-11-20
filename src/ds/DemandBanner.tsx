import { Clock, TrendingUp, Zap } from 'lucide-react'

export type DemandTierType = 'low' | 'medium' | 'high'

export interface DemandBannerProps {
  tier: DemandTierType
  pctLeft?: number
  holdHours?: number
  className?: string
}

export default function DemandBanner({
  tier,
  pctLeft,
  holdHours,
  className = '',
}: DemandBannerProps) {
  const getDetails = () => {
    switch (tier) {
      case 'low':
        return {
          icon: Clock,
          text: `Plenty of seats · group hold: ${holdHours ?? 24}h`,
        }
      case 'high':
        return {
          icon: Zap,
          text: `Filling fast · ${pctLeft ?? 18}% left · group hold: ${holdHours ?? 2}h`,
        }
      case 'medium':
      default:
        return {
          icon: TrendingUp,
          text: `Selling steadily · ${pctLeft ?? 41}% left · group hold: ${holdHours ?? 6}h`,
        }
    }
  }

  const { icon: Icon, text } = getDetails()

  return (
    <div
      className={`w-full px-4 py-2 flex items-center justify-center gap-2 border-b border-divider ${className}`}
      style={{
        backgroundColor: 'var(--bg-warning)',
        borderBottomColor: 'var(--divider)',
      }}
    >
      <Icon
        size={14}
        strokeWidth={2}
        style={{ color: 'var(--text-warning)' }}
        className="shrink-0"
      />
      <span
        className="text-[12px] leading-[16px] font-medium text-center truncate"
        style={{ color: 'var(--text-warning)' }}
      >
        {text}
      </span>
    </div>
  )
}
