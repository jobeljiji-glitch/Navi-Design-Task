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
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {/* Ordered timestamp */}
      <span
        className="text-[12px] leading-[16px] text-text-secondary px-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        Ordered on: {orderedDate}
      </span>

      {/* Main card */}
      <div
        onClick={onClick}
        className="w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-3 border border-divider shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--divider)',
          borderRadius: 'var(--card-radius)',
        }}
      >
        {/* Top section: Poster + Details */}
        <div className="flex gap-3">
          {/* Fictional abstract poster thumb (72 x 96 pt, radius 4) */}
          <div
            className="w-[72px] h-[96px] rounded-[4px] shrink-0 flex flex-col justify-end p-2 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--trending-blue), var(--bms-red-strong))',
            }}
          >
            <div className="absolute inset-0 bg-black/10" />
            <span className="relative z-10 text-[9px] font-bold text-white uppercase leading-tight line-clamp-2">
              {movieTitle}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-start justify-between gap-1">
                <h3
                  className="text-[17px] leading-[22px] font-medium text-text-primary truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {movieTitle}
                </h3>
                <span
                  className="text-[12px] leading-[16px] text-text-secondary shrink-0"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  M-Ticket
                </span>
              </div>
              <span
                className="text-[13px] leading-[18px] text-text-secondary block"
                style={{ color: 'var(--text-secondary)' }}
              >
                {language}
              </span>
            </div>

            <div>
              <span
                className="text-[16px] leading-[20px] font-medium text-text-primary block truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {showtime}
              </span>
              <span
                className="text-[13px] leading-[18px] text-text-secondary block truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {cinema}
              </span>
            </div>

            <div className="flex items-center justify-between text-[14px] leading-[18px] font-medium text-text-primary pt-1">
              <span className="truncate">{seats}</span>
              <span
                className="text-[12px] font-normal text-text-secondary uppercase shrink-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                {screen}
              </span>
            </div>
          </div>
        </div>

        {/* Hairline */}
        <div
          className="w-full h-[1px]"
          style={{ backgroundColor: 'var(--divider)' }}
        />

        {/* Footer: StatusBadge + message */}
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
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
