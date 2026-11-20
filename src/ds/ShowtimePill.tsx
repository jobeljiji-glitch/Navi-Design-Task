export interface ShowtimePillProps {
  time: string
  sublabel?: string
  badge?: string // Kept for backwards compatibility if needed, but not rendered if empty
  selected?: boolean
  size?: 'normal' | 'large'
  onClick?: () => void
  className?: string
}

export default function ShowtimePill({
  time,
  sublabel,
  selected = false,
  size = 'large',
  onClick,
  className = '',
}: ShowtimePillProps) {
  if (selected || size === 'normal') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-[110px] h-[40px] rounded-[3px] flex items-center justify-center transition-all active:scale-95 ${className}`}
        style={{
          backgroundColor: 'var(--showtime-green)',
          color: 'var(--text-on-brand)',
        }}
        aria-label={`Showtime ${time}`}
      >
        <span className="text-[14px] leading-none font-medium text-white tracking-wide">
          {time}
        </span>
      </button>
    )
  }

  // Large showtimes list pill: ~200 x 72 pt, white, 1 pt green border, 4 pt green bar on left, centred 17 pt time
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-[200px] h-[72px] bg-white rounded-[4px] flex items-center overflow-hidden transition-transform active:scale-[0.98] border border-solid shadow-sm ${className}`}
      style={{
        borderColor: 'var(--showtime-green)',
        backgroundColor: '#FFFFFF',
      }}
      aria-label={`Showtime ${time}${sublabel ? ` ${sublabel}` : ''}`}
    >
      {/* 4pt solid green bar on the left */}
      <div
        className="w-[4px] h-full absolute left-0 top-0 bottom-0 shrink-0"
        style={{ backgroundColor: 'var(--showtime-green)' }}
      />

      {/* Centred Time & optional sublabel (ENG / LASER) */}
      <div className="flex-1 flex flex-col items-center justify-center pl-2 pr-1 select-none">
        <span
          className="text-[17px] leading-none font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {time}
        </span>
        {sublabel && (
          <span
            className="text-[10px] uppercase font-normal tracking-wider mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </button>
  )
}
