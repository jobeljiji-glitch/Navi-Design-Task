import { useState } from 'react'
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Info,
  Heart,
  Navigation,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'
import { DEMO_SHOW } from '@/logic/seed'
import { DateStrip, ShowtimePill } from '@/ds'

export interface ShowtimesScreenProps {
  onBack?: () => void
  onSelectShowtime?: (showtime: string) => void
}

export default function ShowtimesScreen({
  onBack,
  onSelectShowtime,
}: ShowtimesScreenProps) {
  const [selectedDateIdx, setSelectedDateIdx] = useState(0)

  const dates = [
    { day: 'FRI', date: 20, month: 'NOV' },
    { day: 'SAT', date: 21, month: 'NOV' },
    { day: 'SUN', date: 22, month: 'NOV' },
    { day: 'MON', date: 23, month: 'NOV' },
    { day: 'TUE', date: 24, month: 'NOV' },
    { day: 'WED', date: 25, month: 'NOV' },
  ]

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

      {/* Date Strip */}
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

      {/* Language / Format Indicator Subheader */}
      <div
        className="px-4 py-2 border-b border-divider bg-bg-surface flex items-center shrink-0"
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

      {/* Filter Chips Bar */}
      <div
        className="w-full flex items-center gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar shrink-0 bg-bg-surface border-b border-divider"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[18px] border border-divider text-[12px] font-normal whitespace-nowrap bg-bg-surface"
          style={{ borderColor: 'var(--divider)' }}
        >
          <ArrowUpDown size={12} strokeWidth={1.75} />
          <span>Sort by</span>
          <ChevronDown size={12} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[18px] border border-divider text-[12px] font-normal whitespace-nowrap bg-bg-surface"
          style={{ borderColor: 'var(--divider)' }}
        >
          <span>Special Formats</span>
          <ChevronDown size={12} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[18px] border border-divider text-[12px] font-normal whitespace-nowrap bg-bg-surface"
          style={{ borderColor: 'var(--divider)' }}
        >
          <span>Cancellable</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[18px] border border-divider text-[12px] font-normal whitespace-nowrap bg-bg-surface"
          style={{ borderColor: 'var(--divider)' }}
        >
          <span>₹0 - ₹500</span>
        </button>
      </div>

      {/* Cinema Listings Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 no-scrollbar">
        {/* Cinema 1: Cineplex Kurla (Active Demo Show) */}
        <div
          className="w-full rounded-[8px] p-3.5 flex flex-col gap-3 border border-divider shadow-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--divider)',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {/* Neutral Cinema Logo Initials */}
              <div
                className="w-10 h-10 rounded-[6px] border border-divider flex items-center justify-center font-bold text-[13px] shrink-0"
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  borderColor: 'var(--divider)',
                  color: 'var(--text-primary)',
                }}
              >
                CP
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h2
                    className="text-[14px] leading-[18px] font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {DEMO_SHOW.cinemaName}
                  </h2>
                  <Info
                    size={14}
                    strokeWidth={1.75}
                    style={{ color: 'var(--text-secondary)' }}
                  />
                </div>

                <div
                  className="flex items-center gap-1.5 text-[12px] mt-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Navigation size={11} strokeWidth={1.75} />
                  <span>{DEMO_SHOW.distanceKm}</span>
                  <span>|</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Cancellation available
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                className="p-1 text-text-secondary hover:text-text-primary"
                aria-label="Favorite cinema"
              >
                <Heart size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <span
                className="text-[10px] font-medium"
                style={{ color: 'var(--text-link)' }}
              >
                Visited
              </span>
            </div>
          </div>

          {/* Active Showtime Pill */}
          <div className="flex items-center gap-3 pt-1">
            <ShowtimePill
              time="09:15 PM"
              badge={DEMO_SHOW.screen}
              onClick={() => onSelectShowtime?.('09:15 PM')}
            />
          </div>
        </div>

        {/* Cinema 2 (Greyed context row) */}
        <div
          className="w-full rounded-[8px] p-3.5 flex flex-col gap-3 border border-divider opacity-60"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--divider)',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-[6px] border border-divider flex items-center justify-center font-bold text-[13px] shrink-0"
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  borderColor: 'var(--divider)',
                  color: 'var(--text-secondary)',
                }}
              >
                IX
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h2
                    className="text-[14px] leading-[18px] font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    INOX: R-City, Ghatkopar
                  </h2>
                  <Info size={14} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div
                  className="flex items-center gap-1.5 text-[12px] mt-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Navigation size={11} strokeWidth={1.75} />
                  <span>4.2 km | Cancellation available</span>
                </div>
              </div>
            </div>
            <Heart size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
          </div>

          <div className="flex items-center gap-3 pt-1 opacity-40 pointer-events-none">
            <ShowtimePill time="12:45 PM" badge="ENG" />
          </div>
        </div>

        {/* Cinema 3 (Greyed context row) */}
        <div
          className="w-full rounded-[8px] p-3.5 flex flex-col gap-3 border border-divider opacity-60"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--divider)',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-[6px] border border-divider flex items-center justify-center font-bold text-[13px] shrink-0"
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  borderColor: 'var(--divider)',
                  color: 'var(--text-secondary)',
                }}
              >
                CN
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h2
                    className="text-[14px] leading-[18px] font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Cinepolis: Magnet Mall, Bhandup (W)
                  </h2>
                  <Info size={14} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div
                  className="flex items-center gap-1.5 text-[12px] mt-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Navigation size={11} strokeWidth={1.75} />
                  <span>1.8 km | Non-cancellable</span>
                </div>
              </div>
            </div>
            <Heart size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
          </div>

          <div className="flex items-center gap-3 pt-1 opacity-40 pointer-events-none">
            <ShowtimePill time="05:50 PM" />
          </div>
        </div>
      </div>

      {/* Subtitle Footer Note */}
      <div
        className="px-4 py-2.5 bg-bg-surface border-t border-divider flex items-center justify-between text-[11px] shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTopColor: 'var(--divider)',
          color: 'var(--text-secondary)',
        }}
      >
        <span>LAN indicates subtitle language, if available</span>
        <span>1/2 ✕</span>
      </div>
    </div>
  )
}
