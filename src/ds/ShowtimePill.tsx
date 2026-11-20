export interface ShowtimePillProps {
  time: string
  sublabel?: string
  badge?: string
  selected?: boolean
  size?: 'normal' | 'large'
  onClick?: () => void
  className?: string
}

export default function ShowtimePill({
  time,
  sublabel,
  selected = false,
  onClick,
  className = '',
}: ShowtimePillProps) {
  if (selected) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-[110px] h-[39px] rounded-[3px] flex items-center justify-center transition-all active:scale-95 ${className}`}
        style={{
          backgroundColor: 'var(--showtime-green)',
          color: 'var(--text-on-brand)',
        }}
        aria-label={`Showtime ${time}`}
      >
        <span className="text-[15px] leading-none font-medium text-white tracking-wide">
          {time}
        </span>
      </button>
    )
  }

  // 110 x 39 pt, 1 pt green border, 4 pt green left bar, time 15 pt centred
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-[110px] h-[39px] bg-white rounded-[3px] flex items-center overflow-hidden transition-transform active:scale-95 border border-solid shadow-sm ${className}`}
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

      {/* Centred Time & optional sublabel */}
      <div className="flex-1 flex flex-col items-center justify-center pl-1 pr-0.5 select-none">
        <div className="flex items-center gap-1">
          <span
            className="text-[15px] leading-none font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {time}
          </span>
          {sublabel && (
            <span
              className="text-[9px] uppercase font-normal tracking-wide px-0.5 py-0.2 border border-divider rounded-[2px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {sublabel}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
