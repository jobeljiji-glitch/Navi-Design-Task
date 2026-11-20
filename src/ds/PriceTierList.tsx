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
      className={`w-full grid grid-cols-4 gap-2 pt-3 pb-4 ${className}`}
    >
      {tiers.slice(0, 4).map(tier => (
        <div key={tier.name} className="flex flex-col items-start text-left min-w-0">
          {/* Label: 12 pt, weight 400, grey, uppercase, wrapping to 2 lines without truncation */}
          <span
            className="text-[12px] leading-[15px] uppercase font-normal text-text-secondary break-words line-clamp-2 min-h-[30px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {tier.name}
          </span>

          {/* Price: 20 pt, weight 500 */}
          <span
            className="text-[20px] leading-[26px] font-medium text-text-primary mt-1"
            style={{ color: 'var(--text-primary)' }}
          >
            ₹{tier.price}
          </span>

          {/* Status: 12 pt, weight 500, green */}
          <span
            className="text-[12px] leading-[16px] font-medium tracking-[0.2px] mt-0.5"
            style={{ color: 'var(--showtime-green)' }}
          >
            {tier.status ?? 'AVAILABLE'}
          </span>
        </div>
      ))}
    </div>
  )
}
