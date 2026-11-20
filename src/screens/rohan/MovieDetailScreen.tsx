import { ChevronLeft, Share2, Star, ChevronRight, TrendingUp } from 'lucide-react'
import { DEMO_SHOW } from '@/logic/seed'

export interface MovieDetailScreenProps {
  onBack?: () => void
  onBookTickets?: () => void
}

export default function MovieDetailScreen({
  onBack,
  onBookTickets,
}: MovieDetailScreenProps) {
  return (
    <div
      className="w-full h-full flex flex-col justify-between overflow-hidden relative select-none"
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Top App Header */}
      <header
        className="flex items-center justify-between px-4 h-[54px] shrink-0 border-b border-divider"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1 -ml-1 flex items-center justify-center active:opacity-70"
            aria-label="Back"
          >
            <ChevronLeft size={24} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1
            className="text-[17px] leading-[22px] font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {DEMO_SHOW.filmTitle}
          </h1>
        </div>
        <button
          type="button"
          className="p-1.5 flex items-center justify-center active:opacity-70"
          aria-label="Share movie"
        >
          <Share2 size={20} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 flex flex-col gap-3.5 no-scrollbar">
        {/* Generated Abstract Movie Poster */}
        <div
          className="w-full h-[200px] rounded-[12px] relative overflow-hidden shadow-sm flex flex-col justify-between shrink-0"
          style={{
            background: 'linear-gradient(145deg, #0f2b38 0%, #153b50 35%, #1e293b 70%, #0f172a 100%)',
          }}
        >
          {/* Subtle stylized rain overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(105deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 14px)',
            }}
          />

          {/* Title Graphic */}
          <div className="relative z-10 p-4 flex flex-col items-center justify-center flex-1 text-center">
            <span
              className="text-[28px] leading-[32px] font-black uppercase tracking-tight text-white drop-shadow-md"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              MONSOON HEIST
            </span>
            <span className="text-[11px] font-medium text-slate-300 tracking-wide mt-1">
              THE VAULT DOESN'T WAIT FOR SUNSHINE
            </span>

            {/* Trailers pill */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 text-white text-[12px] font-medium backdrop-blur-sm border border-white/20">
              <span className="text-[10px]">▶</span>
              <span>Trailers (3)</span>
            </div>
          </div>

          {/* In Cinemas Bottom Ribbon */}
          <div className="w-full py-1.5 bg-black text-center text-white text-[12px] font-medium tracking-wide z-10 shrink-0">
            In cinemas
          </div>
        </div>

        {/* Rating Chip */}
        <div
          className="w-full rounded-[8px] px-3.5 py-2.5 flex items-center justify-between cursor-pointer"
          style={{ backgroundColor: 'var(--bg-muted)' }}
        >
          <div className="flex items-center gap-2">
            <Star
              size={18}
              strokeWidth={1.75}
              fill="var(--bms-star)"
              style={{ color: 'var(--bms-star)' }}
            />
            <span
              className="text-[15px] font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {DEMO_SHOW.rating}
            </span>
            <span
              className="text-[13px] font-normal"
              style={{ color: 'var(--text-secondary)' }}
            >
              ({DEMO_SHOW.votes})
            </span>
          </div>
          <ChevronRight
            size={18}
            strokeWidth={1.75}
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>

        {/* Metadata Line */}
        <div
          className="text-[13px] leading-[18px] font-normal"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>{DEMO_SHOW.duration}</span>
          <span> • Action, Thriller • UA16+ • 20 Nov, 2026</span>
        </div>

        {/* Format & Language Tags */}
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-[3px] text-[11px] font-medium"
            style={{
              backgroundColor: 'var(--bg-tag)',
              color: 'var(--text-primary)',
            }}
          >
            2D, EPIQ
          </span>
          <span
            className="px-2 py-0.5 rounded-[3px] text-[11px] font-medium"
            style={{
              backgroundColor: 'var(--bg-tag)',
              color: 'var(--text-primary)',
            }}
          >
            {DEMO_SHOW.language}
          </span>
        </div>

        {/* Short Description */}
        <p
          className="text-[13px] leading-[19px] text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          A high-stakes monsoon heist unfolds across the rain-swept streets of Mumbai as an elite crew races against time to pull off the ultimate city-wide breach.{' '}
          <span
            className="font-medium cursor-pointer"
            style={{ color: 'var(--bms-red-text)' }}
          >
            ...Read more
          </span>
        </p>

        {/* Trending Banner */}
        <div
          className="w-full rounded-[6px] border border-divider p-1.5 flex items-center gap-2"
          style={{ borderColor: 'var(--divider)' }}
        >
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-white text-[12px] font-medium shrink-0"
            style={{ backgroundColor: 'var(--trending-blue)' }}
          >
            <TrendingUp size={14} strokeWidth={2} />
            <span>Trending</span>
          </div>
          <span
            className="text-[12px] font-medium truncate"
            style={{ color: 'var(--text-success)' }}
          >
            36.03K tickets booked in last 24 hours
          </span>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div
        className="px-4 py-3 border-t border-divider shrink-0 flex items-center justify-center"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTopColor: 'var(--divider)',
          paddingBottom: 'calc(var(--sab, 0px) + 9px)',
        }}
      >
        <button
          type="button"
          onClick={onBookTickets}
          className="w-full h-[48px] rounded-[6px] flex items-center justify-center font-medium text-[16px] text-white shadow-sm transition-transform active:scale-[0.99]"
          style={{ backgroundColor: 'var(--bms-red-strong)' }}
        >
          Book tickets
        </button>
      </div>
    </div>
  )
}
