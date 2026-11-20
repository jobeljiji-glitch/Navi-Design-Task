import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Info,
  Heart,
  Navigation,
  ArrowUpDown,
  ChevronDown,
  X,
} from 'lucide-react'
import { DEMO_SHOW } from '@/logic/seed'
import { DateStrip, ShowtimePill, preloadVehicleIllustrations } from '@/ds'

export interface ShowtimesScreenProps {
  onBack?: () => void
  onSelectShowtime?: (showtime: string) => void
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
        width: 402,
        height: 874,
      }}
    >
      {/* Top Header */}
      <header
        className="flex items-center justify-between px-4 h-[54px] shrink-0 border-b border-divider bg-bg-surface"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-bg-muted active:opacity-70 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeft size={24} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="flex flex-col text-left">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-bg-muted active:opacity-70"
            aria-label="Search"
          >
            <Search size={19} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-bg-muted active:opacity-70"
            aria-label="Filter showtimes"
          >
            <SlidersHorizontal size={19} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
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

      {/* Language / Format Indicator Subheader: 15 pt, weight 500, hairline */}
      <div
        className="px-4 py-2.5 border-b border-divider bg-bg-surface flex items-center shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <span
          className="text-[15px] font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {DEMO_SHOW.language} • {DEMO_SHOW.format}
        </span>
      </div>

      {/* Filter Chips Bar */}
      <div
        className="w-full flex items-center gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar shrink-0 bg-bg-surface border-b border-divider"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        {/* Sort by chip: grey outline, red sort icon, chevron */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-divider text-[15px] font-normal whitespace-nowrap bg-bg-surface"
          style={{ borderColor: 'var(--divider)' }}
        >
          <ArrowUpDown size={15} strokeWidth={1.75} style={{ color: 'var(--bms-red-text)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Sort by</span>
          <ChevronDown size={14} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
        </button>

        {/* Vertical divider */}
        <div className="w-[1px] h-6 bg-divider shrink-0 mx-0.5" />

        {/* Red outline & red text chips: 15 pt, fully rounded */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[15px] font-normal whitespace-nowrap bg-bg-surface"
          style={{
            borderColor: 'var(--bms-red)',
            color: 'var(--bms-red-text)',
          }}
        >
          <span>Special Formats</span>
          <ChevronDown size={14} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[15px] font-normal whitespace-nowrap bg-bg-surface"
          style={{
            borderColor: 'var(--bms-red)',
            color: 'var(--bms-red-text)',
          }}
        >
          <span>Cancellable</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[15px] font-normal whitespace-nowrap bg-bg-surface"
          style={{
            borderColor: 'var(--bms-red)',
            color: 'var(--bms-red-text)',
          }}
        >
          <span>₹0 - ₹500</span>
        </button>
      </div>

      {/* Cinema Listings Content: sitting on light-grey page, ~22 pt side margins */}
      <div className="flex-1 overflow-y-auto px-[22px] py-4 flex flex-col gap-4 no-scrollbar">
        {/* Cinema 1: Cineplex Kurla (Active Demo Show) */}
        <div
          className="w-full rounded-[8px] p-3.5 flex flex-col gap-3.5 border border-divider shadow-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--divider)',
          }}
        >
          <div className="flex items-start gap-3">
            {/* 56 pt logo tile: rounded 8, light border, brand initials */}
            <div
              className="w-[56px] h-[56px] rounded-[8px] border border-divider flex items-center justify-center font-bold text-[16px] shrink-0"
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderColor: 'var(--divider)',
                color: 'var(--text-primary)',
              }}
            >
              CP
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[56px]">
              {/* Line 1: Name + Info + Heart */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 min-w-0">
                  <h2
                    className="text-[16px] leading-[20px] font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {DEMO_SHOW.cinemaName}
                  </h2>
                  <Info
                    size={15}
                    strokeWidth={1.75}
                    style={{ color: 'var(--text-secondary)' }}
                    className="shrink-0"
                  />
                </div>
                <button
                  type="button"
                  className="p-0.5 text-text-secondary hover:text-text-primary shrink-0"
                  aria-label="Favorite cinema"
                >
                  <Heart size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              {/* Line 2: Distance & Cancellation + Visited tag */}
              <div
                className="flex items-center justify-between gap-1 text-[13px] mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Navigation size={12} strokeWidth={1.75} className="shrink-0" />
                  <span className="truncate">{DEMO_SHOW.distanceKm} | Cancellation available</span>
                </div>
                <span
                  className="text-[11px] font-medium px-1.5 py-0.5 rounded-[2px] shrink-0"
                  style={{
                    backgroundColor: '#EBF4FF',
                    color: '#2563EB',
                  }}
                >
                  Visited
                </span>
              </div>
            </div>
          </div>

          {/* Active Showtime Pill: 200 x 72 pt, no SCREEN 4 badge, centred 17 pt time */}
          <div className="flex items-center gap-3 pt-1">
            <ShowtimePill
              time="09:15 PM"
              onClick={() => onSelectShowtime?.('09:15 PM')}
            />
          </div>
        </div>

        {/* Cinema 2: INOX R-City, Ghatkopar (Context cinema, normal-looking, not greyed out) */}
        <div
          className="w-full rounded-[8px] p-3.5 flex flex-col gap-3.5 border border-divider shadow-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--divider)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-[56px] h-[56px] rounded-[8px] border border-divider flex items-center justify-center font-bold text-[16px] shrink-0"
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderColor: 'var(--divider)',
                color: '#D97706',
              }}
            >
              PVR
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[56px]">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 min-w-0">
                  <h2
                    className="text-[16px] leading-[20px] font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    INOX: R-City, Ghatkopar
                  </h2>
                  <Info
                    size={15}
                    strokeWidth={1.75}
                    style={{ color: 'var(--text-secondary)' }}
                    className="shrink-0"
                  />
                </div>
                <button
                  type="button"
                  className="p-0.5 text-text-secondary hover:text-text-primary shrink-0"
                  aria-label="Favorite cinema"
                >
                  <Heart size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              <div
                className="flex items-center justify-between gap-1 text-[13px] mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Navigation size={12} strokeWidth={1.75} className="shrink-0" />
                  <span className="truncate">4.2 km | Cancellation available</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <ShowtimePill
              time="12:45 PM"
              sublabel="ENG"
              onClick={showDemoToast}
            />
          </div>
        </div>

        {/* Cinema 3: Cinepolis Magnet Mall (Context cinema, normal-looking) */}
        <div
          className="w-full rounded-[8px] p-3.5 flex flex-col gap-3.5 border border-divider shadow-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--divider)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-[56px] h-[56px] rounded-[8px] border border-divider flex items-center justify-center font-bold text-[16px] shrink-0"
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderColor: 'var(--divider)',
                color: '#0284C7',
              }}
            >
              CN
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[56px]">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 min-w-0">
                  <h2
                    className="text-[16px] leading-[20px] font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Cinepolis: Magnet Mall, Bhandup (W)
                  </h2>
                  <Info
                    size={15}
                    strokeWidth={1.75}
                    style={{ color: 'var(--text-secondary)' }}
                    className="shrink-0"
                  />
                </div>
                <button
                  type="button"
                  className="p-0.5 text-text-secondary hover:text-text-primary shrink-0"
                  aria-label="Favorite cinema"
                >
                  <Heart size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              <div
                className="flex items-center justify-between gap-1 text-[13px] mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Navigation size={12} strokeWidth={1.75} className="shrink-0" />
                  <span className="truncate">1.8 km | Non-cancellable</span>
                </div>
                <span
                  className="text-[11px] font-medium px-1.5 py-0.5 rounded-[2px] shrink-0"
                  style={{
                    backgroundColor: '#EBF4FF',
                    color: '#2563EB',
                  }}
                >
                  Visited
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <ShowtimePill
              time="05:50 PM"
              sublabel="LASER"
              onClick={showDemoToast}
            />
          </div>
        </div>
      </div>

      {/* Floating Demo Toast */}
      {toastMessage && (
        <div className="absolute top-20 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-black/85 text-white px-4 py-2.5 rounded-full text-[13px] font-medium shadow-lg animate-fade-in backdrop-blur-sm">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Bottom Subtitle Language Toast Bar */}
      {isSubtitleNoticeVisible && (
        <div
          className="w-full px-4 py-2 bg-bg-surface border-t border-divider flex items-center justify-between shrink-0 shadow-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderTopColor: 'var(--divider)',
          }}
        >
          <div className="flex items-center gap-2 text-[12px] text-text-secondary">
            <span className="px-1 py-0.5 rounded border border-divider text-[10px] font-semibold leading-none">
              LAN
            </span>
            <span>indicates subtitle language, if available</span>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-text-secondary">
            <span>1/2</span>
            <button
              type="button"
              onClick={() => setIsSubtitleNoticeVisible(false)}
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-bg-muted"
              aria-label="Dismiss notice"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
