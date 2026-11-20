export interface ShowtimePillProps {
  time: string
  badge?: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

export default function ShowtimePill({
  time,
  badge,
  selected = false,
  onClick,
  className = '',
}: ShowtimePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-[110px] h-[39px] rounded-[2px] flex items-center overflow-hidden transition-all active:scale-95 ${
        selected ? 'shadow-sm' : ''
      } ${className}`}
      style={{
        border: '1px solid var(--showtime-green)',
        backgroundColor: selected ? 'var(--showtime-green)' : 'transparent',
      }}
      aria-label={`Showtime ${time}${badge ? ` ${badge}` : ''}`}
    >
      {/* 4pt solid green left bar (visible when unselected) */}
      {!selected && (
        <div
          className="w-1 self-stretch shrink-0"
          style={{ backgroundColor: 'var(--showtime-green)' }}
        />
      )}

      {/* Centred Time & Badge */}
      <div className="flex-1 flex items-center justify-center gap-1 px-1.5 min-w-0">
        <span
          className="text-[13px] leading-none font-medium whitespace-nowrap"
          style={{
            color: selected ? 'var(--text-on-brand)' : 'var(--text-primary)',
          }}
        >
          {time}
        </span>
        {badge && (
          <span
            className="text-[9px] leading-none uppercase font-semibold px-1 py-0.5 rounded-[2px] border shrink-0"
            style={{
              borderColor: selected ? 'var(--text-on-brand)' : 'var(--divider)',
              color: selected ? 'var(--text-on-brand)' : 'var(--text-secondary)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </button>
  )
}
