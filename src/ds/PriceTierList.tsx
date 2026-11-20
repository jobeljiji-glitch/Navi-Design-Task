export interface PriceTier {
  name: string
  price: number
  status?: string
}

export interface PriceTierListProps {
  tiers: PriceTier[]
  className?: string
}

export default function PriceTierList({
  tiers,
  className = '',
}: PriceTierListProps) {
  return (
    <div
      className={`w-full grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-t border-divider ${className}`}
      style={{ borderTopColor: 'var(--divider)' }}
    >
      {tiers.map(tier => (
        <div key={tier.name} className="flex flex-col items-center text-center">
          <span
            className="text-[11px] leading-[14px] uppercase tracking-[0.5px] font-normal text-text-secondary truncate w-full"
            style={{ color: 'var(--text-secondary)' }}
          >
            {tier.name}
          </span>
          <span
            className="text-[18px] leading-[22px] font-bold text-text-primary mt-1"
            style={{ color: 'var(--text-primary)' }}
          >
            ₹{tier.price}
          </span>
          <span
            className="text-[11px] leading-[14px] font-semibold tracking-[0.3px] text-text-success mt-0.5"
            style={{ color: 'var(--text-success)' }}
          >
            {tier.status ?? 'AVAILABLE'}
          </span>
        </div>
      ))}
    </div>
  )
}
