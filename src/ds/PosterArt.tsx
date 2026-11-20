/**
 * Generated poster for the fictional film (spec §1): teal-to-indigo gradient, rain streaks,
 * bold condensed title. Same artwork as the movie-detail poster, sized by the parent.
 */
export interface PosterArtProps {
  title?: string
  /** Title size in pt */
  titleSize?: number
  tagline?: string
  className?: string
}

export default function PosterArt({ title = 'Monsoon Heist', titleSize = 18, tagline, className = '' }: PosterArtProps) {
  return (
    <div
      className={`relative overflow-hidden flex flex-col items-center justify-center text-center ${className}`}
      style={{ background: 'linear-gradient(145deg, var(--poster-1) 0%, var(--poster-2) 35%, var(--poster-3) 70%, var(--poster-4) 100%)' }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(105deg, var(--poster-rain) 0px, var(--poster-rain) 1px, transparent 1px, transparent 12px)',
        }}
      />
      <span
        className="relative px-2 font-black uppercase tracking-tight"
        style={{ fontSize: titleSize, lineHeight: 1.05, color: 'var(--text-on-brand)', fontFamily: 'system-ui, sans-serif' }}
      >
        {title}
      </span>
      {tagline && (
        <span className="relative mt-1 text-[10px] font-medium tracking-wide" style={{ color: 'var(--text-on-brand)', opacity: 0.75 }}>
          {tagline}
        </span>
      )}
    </div>
  )
}
