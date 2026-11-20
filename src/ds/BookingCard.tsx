import StatusBadge, { type BookingStatus } from './StatusBadge'

export interface BookingCardProps {
  movieTitle: string
  language: string
  showtime: string
  cinema: string
  seats: string
  screen: string
  status: BookingStatus
  statusMessage: string
  posterUrl?: string
  orderedDate?: string
  onClick?: () => void
  className?: string
}

export default function BookingCard({
  movieTitle,
  language,
  showtime,
  cinema,
  seats,
  screen,
  status,
  statusMessage,
  orderedDate = '20 Nov, 2026 at 11:04:56 AM',
  onClick,
  className = '',
}: BookingCardProps) {
  return (
    <div className={`w-full flex flex-col gap-1.5 select-none ${className}`}>
      {/* Ordered timestamp sitting outside the card */}
      <span
        className="text-[13px] leading-[17px] text-text-secondary px-0.5"
        style={{ color: 'var(--text-secondary)' }}
      >
        Ordered on: {orderedDate}
      </span>

      {/* Main card */}
      <div
        onClick={onClick}
        className="w-full shrink-0 bg-bg-surface rounded-[8px] p-4 flex flex-col gap-3 cursor-pointer relative"
        data-card
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--card-radius)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {/* Top section: Poster + Details */}
        <div className="flex gap-3">
          {/* Fictional abstract poster thumb (72 x 96 pt, radius 4) */}
          <div
            className="w-[72px] h-[96px] rounded-[4px] shrink-0 flex flex-col justify-end p-2 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #2D142C, #801336, #C72C41)',
            }}
          >
            <div className="absolute inset-0 bg-black/15" />
            <span className="relative z-10 text-[9px] font-medium text-white uppercase leading-tight line-clamp-2">
              {movieTitle}
            </span>
          </div>

          {/* Details column */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-start justify-between gap-1">
                {/* Title: 17 pt, weight 500 */}
                <h3
                  className="text-[17px] leading-[22px] font-medium text-text-primary truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {movieTitle}
                </h3>
                {/* M-Ticket label: top right, grey, 13 pt */}
                <span
                  className="text-[13px] leading-[18px] text-text-secondary shrink-0 font-normal"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  M-Ticket
                </span>
              </div>

              {/* Language: 15 pt grey */}
              <span
                className="text-[15px] leading-[20px] text-text-secondary block mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {language}
              </span>
            </div>

            <div>
              {/* Date line: 17 pt, weight 500 */}
              <span
                className="text-[17px] leading-[22px] font-medium text-text-primary block truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {showtime}
              </span>
              {/* Cinema line: 15 pt grey */}
              <span
                className="text-[15px] leading-[20px] text-text-secondary block truncate mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {cinema}
              </span>
            </div>

            {/* Ticket line & Screen: 15 pt weight 500 & 13 pt uppercase */}
            <div className="flex items-center justify-between pt-1">
              <span
                className="text-[15px] leading-[20px] font-medium text-text-primary truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {seats}
              </span>
              <span
                className="text-[13px] leading-[18px] font-medium text-text-secondary uppercase shrink-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                {screen}
              </span>
            </div>
          </div>
        </div>

        {/* Full-width hairline divider above footer */}
        <div
          className="-mx-4 h-[1px]"
          style={{ backgroundColor: 'var(--divider)' }}
        />

        {/* Footer: StatusBadge + 1 pt vertical divider + message */}
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <div
            className="w-[1px] h-4 shrink-0"
            style={{ backgroundColor: 'var(--divider)' }}
          />
          <span
            className="text-[13px] leading-[18px] text-text-secondary truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {statusMessage}
          </span>
        </div>
      </div>
    </div>
  )
}
