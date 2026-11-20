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
  // If 4 tiers and names contain 'ROWS', use 3 on top + 1 centered on bottom (matching ref 05)
  const is3Plus1 = tiers.length === 4 && tiers.some(t => t.name.toUpperCase().includes('ROWS'))

  if (is3Plus1) {
    const topThree = tiers.slice(0, 3)
    const fourth = tiers[3]

    return (
      <div className={`w-full flex flex-col pt-3 pb-2 ${className}`}>
        {/* Row 1: 3 equal columns */}
        <div className="w-full grid grid-cols-3 gap-3 text-center">
          {topThree.map(tier => (
            <div key={tier.name} className="flex flex-col items-center min-w-0">
              <span
                className="text-[12px] leading-[15px] uppercase font-normal text-text-secondary break-words line-clamp-2 min-h-[30px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {tier.name}
              </span>
              <span
                className="text-[20px] leading-[26px] font-medium text-text-primary mt-1"
                style={{ color: 'var(--text-primary)' }}
              >
                ₹{tier.price}
              </span>
              <span
                className="text-[12px] leading-[16px] font-medium tracking-[0.2px] mt-0.5"
                style={{ color: 'var(--showtime-green)' }}
              >
                {tier.status ?? 'AVAILABLE'}
              </span>
            </div>
          ))}
        </div>

        {/* Row 2: 1 centered column */}
        {fourth && (
          <div className="w-full flex justify-center mt-3 text-center">
            <div className="flex flex-col items-center min-w-0 max-w-[120px]">
              <span
                className="text-[12px] leading-[15px] uppercase font-normal text-text-secondary break-words line-clamp-2 min-h-[30px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {fourth.name}
              </span>
              <span
                className="text-[20px] leading-[26px] font-medium text-text-primary mt-1"
                style={{ color: 'var(--text-primary)' }}
              >
                ₹{fourth.price}
              </span>
              <span
                className="text-[12px] leading-[16px] font-medium tracking-[0.2px] mt-0.5"
                style={{ color: 'var(--showtime-green)' }}
              >
                {fourth.status ?? 'AVAILABLE'}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

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
