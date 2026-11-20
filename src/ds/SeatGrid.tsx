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
    <div className={`w-full flex flex-col gap-5 py-2 ${className}`} data-seat-grid>
      {tiers.map(group => {
        const price = tierPrices?.[group.tierName]
        return (
          <div key={group.tierName} className="flex flex-col gap-2.5">
            {/* Tier Header: 13 pt, weight 400, grey, letter-spaced, hairline to the right */}
            <div className="sticky left-0 flex items-center gap-2.5 pl-4 pr-2 z-20">
              <span
                className="text-[13px] leading-[18px] uppercase tracking-[0.5px] font-normal shrink-0"
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
            <div className="flex flex-col gap-[6px]">
              {group.rows.map(rowItem => (
                <div key={rowItem.row} className="flex items-center" data-tour={`seat-row-${rowItem.row}`}>
                  {/* Sticky Row letter on the left */}
                  <div
                    className="sticky left-0 z-10 w-7 pl-4 pr-1 py-0.5 flex items-center justify-start shrink-0"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    <span
                      className="text-[11px] leading-none font-normal text-left"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {rowItem.row}
                    </span>
                  </div>

                  {/* Seat items on 26pt pitch: 20x20 tile + 6px gap */}
                  <div className="flex items-center gap-[6px] pl-1 pr-6">
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
