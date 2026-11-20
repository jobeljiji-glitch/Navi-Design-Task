export interface ShowtimePillProps {
  time: string
  subtitle?: string // e.g. "ENG" as small boxed inline icon
  caption?: string // e.g. "LASER" as 10 pt grey caption UNDER the time
  sublabel?: string // backwards-compatibility alias for caption or subtitle
  badge?: string // backwards-compatibility alias
  selected?: boolean
  size?: 'normal' | 'large'
  onClick?: () => void
  className?: string
}

export default function ShowtimePill({
  time,
  subtitle,
  caption,
  sublabel,
  selected = false,
  onClick,
  className = '',
}: ShowtimePillProps) {
  // Determine subtitle (inline badge e.g. ENG) and caption (under-time e.g. LASER)
  const effectiveSubtitle = subtitle || (sublabel === 'ENG' ? 'ENG' : undefined)
  const effectiveCaption = caption || (sublabel && sublabel !== 'ENG' ? sublabel : undefined)

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
        <span className="text-[15px] leading-none font-normal text-white tracking-wide whitespace-nowrap">
          {time}
        </span>
      </button>
    )
  }

  // 110 x 39 pt, 1 pt green border, 4 pt green left bar, time on one line 15 pt weight 400
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-[110px] h-[39px] bg-white rounded-[3px] flex items-center overflow-hidden transition-transform active:scale-95 border border-solid ${className}`}
      style={{
        borderColor: 'var(--showtime-green)',
        backgroundColor: '#FFFFFF',
      }}
      aria-label={`Showtime ${time}${effectiveSubtitle ? ` ${effectiveSubtitle}` : ''}${effectiveCaption ? ` ${effectiveCaption}` : ''}`}
    >
      {/* 4pt solid green bar on the left */}
      <div
        className="w-[4px] h-full absolute left-0 top-0 bottom-0 shrink-0"
        style={{ backgroundColor: 'var(--showtime-green)' }}
      />

      {/* Centred Time + optional inline subtitle + optional caption underneath */}
      <div className="flex-1 flex flex-col items-center justify-center pl-1.5 pr-0.5 select-none leading-none">
        <div className="flex items-center justify-center gap-1">
          <span
            className="text-[14px] font-normal whitespace-nowrap leading-none"
            style={{ color: 'var(--text-pill)' }}
          >
            {time}
          </span>
          {effectiveSubtitle && (
            <svg
              width="18"
              height="14"
              viewBox="0 0 18 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              <path d="M1.5 1.5h15v8.5H8l-3 2.5V10H1.5Z" />
              <text x="9" y="7.8" textAnchor="middle" fontSize="5" fontWeight="500" fill="currentColor" stroke="none">{effectiveSubtitle}</text>
            </svg>
          )}
        </div>

        {effectiveCaption && (
          <span
            className="text-[9px] uppercase font-normal tracking-wide text-text-secondary mt-1 leading-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            {effectiveCaption}
          </span>
        )}
      </div>
    </button>
  )
}
