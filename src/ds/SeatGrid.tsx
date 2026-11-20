import Seat, { type SeatState } from './Seat'

export interface SeatGridRow {
  row: string
  tier: string
  seats: Array<{
    id: string
    num: number
    state: SeatState
    payerName?: string
  }>
}

export interface SeatGridProps {
  rows: SeatGridRow[]
  tierPrices?: Record<string, number>
  onSeatClick?: (seatId: string) => void
  className?: string
}

export default function SeatGrid({
  rows,
  tierPrices,
  onSeatClick,
  className = '',
}: SeatGridProps) {
  // Group rows by tier to render tier headers
  const tiers: Array<{ tierName: string; rows: SeatGridRow[] }> = []
  for (const r of rows) {
    let t = tiers.find(item => item.tierName === r.tier)
    if (!t) {
      t = { tierName: r.tier, rows: [] }
      tiers.push(t)
    }
    t.rows.push(r)
  }

  return (
    <div className={`w-full flex flex-col gap-6 py-2 ${className}`}>
      {tiers.map(group => {
        const price = tierPrices?.[group.tierName]
        return (
          <div key={group.tierName} className="flex flex-col gap-3">
            {/* Tier Header */}
            <div className="flex items-center gap-3 px-4">
              <span
                className="text-[12px] leading-[16px] uppercase tracking-[0.5px] font-normal shrink-0 text-text-secondary"
                style={{ color: 'var(--text-secondary)' }}
              >
                {price != null ? `₹ ${price} ` : ''}
                {group.tierName.toUpperCase()} ROWS
              </span>
              <div
                className="flex-1 h-[1px]"
                style={{ backgroundColor: 'var(--divider)' }}
              />
            </div>

            {/* Rows list */}
            <div className="flex flex-col gap-1.5 px-4">
              {group.rows.map(rowItem => (
                <div key={rowItem.row} className="flex items-center gap-3">
                  {/* Row letter */}
                  <span
                    className="w-4 text-[11px] leading-none font-normal text-text-secondary text-left shrink-0"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {rowItem.row}
                  </span>

                  {/* Seat items on 26pt pitch */}
                  <div className="flex items-center gap-[6px] overflow-x-auto">
                    {rowItem.seats.map(seat => (
                      <Seat
                        key={seat.id}
                        id={seat.id}
                        num={seat.num}
                        state={seat.state}
                        payerName={seat.payerName}
                        onClick={() => onSeatClick?.(seat.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
