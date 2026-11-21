import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Info,
  Heart,
  ArrowUpDown,
  ChevronDown,
  X,
} from 'lucide-react'
import { DEMO_SHOW } from '@/logic/seed'
import { Card, DateStrip, ShowtimePill, preloadVehicleIllustrations } from '@/ds'

export interface ShowtimesScreenProps {
  onBack?: () => void
  onSelectShowtime?: (showtime: string) => void
}

const cinemas: {
  name: string
  initials: string
  distance: string
  visited?: boolean
  time: string
  subtitle?: string
  caption?: string
  live?: boolean
}[] = [
  {
    name: DEMO_SHOW.cinemaName,
    initials: 'CP',
    distance: `${DEMO_SHOW.distanceKm} | Cancellation available`,
    visited: true,
    time: '09:15 PM',
    live: true,
  },
  {
    name: 'INOX: R-City, Ghatkopar',
    initials: 'IX',
    distance: '4.2 km | Cancellation available',
    time: '12:45 PM',
    subtitle: 'ENG',
  },
  {
    name: 'Cinepolis: Magnet Mall, Bhandup (W)',
    initials: 'CN',
    distance: '1.8 km | Non-cancellable',
    visited: true,
    time: '05:50 PM',
    caption: 'LASER',
  },
]

/* Diamond "directions" glyph, 16 pt, thin outline */
function DirectionsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" />
      <path d="M8.5 15v-2.5a2 2 0 0 1 2-2h5M13.5 8.5l2.5 2-2.5 2" />
    </svg>
  )
}

export default function ShowtimesScreen({
  onBack,
  onSelectShowtime,
}: ShowtimesScreenProps) {
  const [selectedDateIdx, setSelectedDateIdx] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSubtitleNoticeVisible, setIsSubtitleNoticeVisible] = useState(true)

  // Preload all 10 seat count vehicle webp illustrations on mount
  useEffect(() => {
    preloadVehicleIllustrations()
  }, [])

  const dates = [
    { day: 'FRI', date: 20, month: 'NOV' },
    { day: 'SAT', date: 21, month: 'NOV' },
    { day: 'SUN', date: 22, month: 'NOV' },
    { day: 'MON', date: 23, month: 'NOV' },
    { day: 'TUE', date: 24, month: 'NOV' },
    { day: 'WED', date: 25, month: 'NOV' },
  ]

  const showDemoToast = () => {
    setToastMessage('Demo: only Cineplex Kurla 9:15 PM is live')
    setTimeout(() => {
      setToastMessage(null)
    }, 2800)
  }

  return (
    <div
      className="w-full h-full flex flex-col justify-between overflow-hidden relative select-none"
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Top Header: plain chevron, 24 pt, no grey circle background */}
      <header
        className="flex items-center justify-between px-4 h-[54px] shrink-0 border-b border-divider bg-bg-surface"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="hit-44 p-1 -ml-1 flex items-center justify-center active:opacity-70"
            aria-label="Back"
          >
            <ChevronLeft size={24} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="flex flex-col text-left min-w-0">
            <h1
              className="text-[17px] leading-[22px] font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {DEMO_SHOW.filmTitle}
            </h1>
            <span
              className="text-[12px] leading-[16px] font-normal"
              style={{ color: 'var(--text-secondary)' }}
            >
              Movie runtime: {DEMO_SHOW.duration}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="hit-44 p-1.5 flex items-center justify-center active:opacity-70"
            aria-label="Search"
            data-oos
          >
            <Search size={20} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
          </button>
          <button
            type="button"
            className="hit-44 p-1.5 flex items-center justify-center active:opacity-70"
            aria-label="Filter showtimes"
            data-oos
          >
            <SlidersHorizontal size={20} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>
      </header>

      {/* Date Strip: Borderless, flush left solid red selected tile */}
      <div
        className="border-b border-divider shrink-0 bg-bg-surface"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <DateStrip
          dates={dates}
          selectedIndex={selectedDateIdx}
          onSelectDate={setSelectedDateIdx}
        />
      </div>

      {/* Language / Format Indicator Subheader: 13 pt, weight 500, hairline */}
      <div
        className="px-4 py-2.5 border-b border-divider bg-bg-surface flex items-center shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <span
          className="text-[13px] font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {DEMO_SHOW.language} • {DEMO_SHOW.format}
        </span>
      </div>

      {/* Filter Chips Bar: 32 pt tall, 13 pt text, scrolls horizontally */}
      <div
        className="w-full flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar shrink-0 bg-bg-surface border-b border-divider"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        {/* Sort by: rounded rectangle (radius 8), grey border, red icon + chevron */}
        <button
          type="button"
          className="hit-44 h-[32px] flex items-center gap-1.5 px-3 rounded-[8px] border text-[13px] font-normal whitespace-nowrap bg-bg-surface shrink-0"
          style={{ borderColor: 'var(--border-grey)' }}
          data-oos
        >
          <ArrowUpDown size={14} strokeWidth={1.75} style={{ color: 'var(--bms-red-text)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Sort by</span>
          <ChevronDown size={14} strokeWidth={1.75} style={{ color: 'var(--bms-red-text)' }} />
        </button>

        <div className="w-[1px] h-5 bg-divider shrink-0 mx-0.5" />

        {[
          { label: 'Special Formats', chevron: true },
          { label: 'Cancellable', chevron: false },
          { label: '₹0 - ₹500', chevron: false },
        ].map((chip) => (
          <button
            key={chip.label}
            type="button"
            className="hit-44 h-[32px] flex items-center gap-1.5 px-3 rounded-full border text-[13px] font-normal whitespace-nowrap bg-bg-surface shrink-0"
            style={{ borderColor: 'var(--bms-red)', color: 'var(--bms-red-text)' }}
            data-oos
          >
            <span>{chip.label}</span>
            {chip.chevron && <ChevronDown size={13} strokeWidth={1.75} />}
          </button>
        ))}
      </div>

      {/* Cinema listings: ONE white Card on the grey page (04c surface system: 16 pt margins, radius 8, no border/shadow) */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-sab px-4 pt-3">
        <Card className="flex flex-col gap-[22px]">
          {cinemas.map((c) => (
            <div key={c.name} className="flex flex-col">
              {/* Row 1: logo tile + name + info + heart */}
              <div className="flex items-start gap-2.5">
                <div
                  className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center font-medium text-[13px] shrink-0"
                  style={{
                    backgroundColor: 'var(--bg-muted)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {c.initials}
                </div>
                <h2
                  className="flex-1 min-w-0 text-[15px] leading-[19px] font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {c.name.split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="whitespace-nowrap">
                    {c.name.split(' ').slice(-1)}
                    <Info
                      size={14}
                      strokeWidth={1.75}
                      className="inline-block align-[-2px] ml-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                  </span>
                </h2>
                <button
                  type="button"
                  className="hit-44 w-[44px] h-[44px] -mt-1.5 -mr-2.5 flex items-center justify-center shrink-0"
                  aria-label="Favorite cinema"
                  data-oos
                >
                  <Heart size={20} strokeWidth={1.25} style={{ color: 'var(--icon-light)' }} />
                </button>
              </div>

              {/* Row 2: directions + distance at left edge; Visited tag flush to panel right edge */}
              <div
                className="mt-[14px] flex items-center justify-between gap-1 text-[13px] leading-[17px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <DirectionsIcon />
                  <span>{c.distance}</span>
                </div>
                {c.visited && (
                  <span
                    className="-mr-4 text-[12px] leading-[16px] font-normal px-2 py-px shrink-0"
                    style={{ backgroundColor: 'var(--bg-visited)', color: 'var(--text-visited)' }}
                  >
                    Visited
                  </span>
                )}
              </div>

              {/* Showtime pill, 16 pt below distance */}
              <div className="mt-4 flex items-center" data-tour={c.live ? 'pill-915' : undefined}>
                <ShowtimePill
                  time={c.time}
                  subtitle={c.subtitle}
                  caption={c.caption}
                  onClick={() =>
                    c.live ? onSelectShowtime?.(c.time) : showDemoToast()
                  }
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Floating Demo Toast */}
      {toastMessage && (
        <div className="absolute top-20 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="toast-surface px-4 py-2.5 rounded-full text-[13px] font-medium shadow-lg animate-fade-in backdrop-blur-sm">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Bottom Subtitle Language Toast Bar */}
      {isSubtitleNoticeVisible && (
        <div
          className="w-full px-4 py-2 bg-bg-surface border-t border-divider flex items-center justify-between shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderTopColor: 'var(--divider)',
          }}
        >
          <div className="flex items-center gap-2 text-[12px] text-text-secondary">
            <span className="px-1 py-0.5 rounded border border-divider text-[10px] font-medium leading-none">
              LAN
            </span>
            <span>indicates subtitle language, if available</span>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-text-secondary">
            <span>1/2</span>
            <button
              type="button"
              onClick={() => setIsSubtitleNoticeVisible(false)}
              className="hit-44 w-5 h-5 rounded-full flex items-center justify-center hover:bg-bg-muted"
              aria-label="Dismiss notice"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
