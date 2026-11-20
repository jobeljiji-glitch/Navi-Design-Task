import { useState, useMemo } from 'react'
import { ChevronLeft, Edit3 } from 'lucide-react'
import { DEMO_SHOW, createInitialSeats } from '@/logic/seed'
import type { Seat as LogicSeat, SeatTier } from '@/logic/types'
import {
  SeatGrid,
  ScreenShape,
  SeatLegend,
  BottomCtaBar,
  SeatCountSheet,
  type SeatGridRow,
  type SeatState,
} from '@/ds'

export interface SeatLayoutScreenProps {
  onBack?: () => void
  onPay?: (selectedSeats: LogicSeat[]) => void
  initialSelectedSeatIds?: string[]
  initialSeatCount?: number
  isCountSheetOpenInitially?: boolean
}

const TIER_DISPLAY_NAMES: Record<SeatTier, string> = {
  recliner: 'Recliner',
  primePlus: 'Prime Plus',
  prime: 'Prime',
  classic: 'Classic',
}

const TIER_PRICES: Record<string, number> = {
  'Recliner': 500,
  'Prime Plus': 250,
  'Prime': 230,
  'Classic': 210,
}

// Fixed order of rows A to L
const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function SeatLayoutScreen({
  onBack,
  onPay,
  initialSelectedSeatIds = [],
  initialSeatCount = 2,
  isCountSheetOpenInitially = false,
}: SeatLayoutScreenProps) {
  const [seatCount, setSeatCount] = useState(initialSeatCount)
  const [isCountSheetOpen, setIsCountSheetOpen] = useState(isCountSheetOpenInitially)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(initialSelectedSeatIds)

  // Initial seat map from seed.ts
  const initialSeats = useMemo(() => createInitialSeats(), [])

  // Dynamic seat state map based on user selections
  const currentSeats = useMemo(() => {
    const map = { ...initialSeats }
    for (const id of selectedSeatIds) {
      if (map[id] && map[id].state === 'available') {
        map[id] = { ...map[id], state: 'selected' }
      }
    }
    return map
  }, [initialSeats, selectedSeatIds])

  // Convert currentSeats into SeatGridRow[] grouped by row
  const gridRows: SeatGridRow[] = useMemo(() => {
    const allSeats = Object.values(currentSeats)
    return ROW_LETTERS.map(rowLetter => {
      const seatsInThisRow = allSeats
        .filter(s => s.row === rowLetter)
        .sort((a, b) => a.num - b.num)

      const tierKey = seatsInThisRow[0]?.tier || 'prime'
      const tierDisplay = TIER_DISPLAY_NAMES[tierKey] || 'Prime'

      return {
        row: rowLetter,
        tier: tierDisplay,
        seats: seatsInThisRow.map(s => ({
          id: s.id,
          num: s.num,
          state: s.state as SeatState,
        })),
      }
    })
  }, [currentSeats])

  // Toggle seat selection
  const handleSeatClick = (seatId: string) => {
    const seat = currentSeats[seatId]
    if (!seat || (seat.state !== 'available' && seat.state !== 'selected')) return

    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds(prev => prev.filter(id => id !== seatId))
    } else {
      if (selectedSeatIds.length < seatCount) {
        setSelectedSeatIds(prev => [...prev, seatId])
      } else {
        // Replace oldest or shift
        setSelectedSeatIds(prev => [...prev.slice(1), seatId])
      }
    }
  }

  // Calculate total ticket price from selected seats (never hardcoded)
  const selectedSeatsList = useMemo(() => {
    return selectedSeatIds.map(id => initialSeats[id]).filter(Boolean)
  }, [selectedSeatIds, initialSeats])

  const totalPaise = useMemo(() => {
    return selectedSeatsList.reduce((acc, s) => acc + s.price, 0)
  }, [selectedSeatsList])

  const totalRupees = Math.floor(totalPaise / 100)

  return (
    <div
      className="w-full h-full flex flex-col justify-between overflow-hidden relative select-none"
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        width: 402,
        height: 874,
      }}
    >
      {/* Navigation Bar */}
      <header
        className="flex items-center justify-between px-4 h-[54px] shrink-0 border-b border-divider"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-bg-muted active:opacity-70 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeft size={24} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="flex flex-col text-left min-w-0">
            <h1
              className="text-[17px] leading-[22px] font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {DEMO_SHOW.filmTitle} - {DEMO_SHOW.language}
            </h1>
            <span
              className="text-[12px] leading-[16px] font-normal truncate"
              style={{ color: 'var(--text-secondary)' }}
            >
              {DEMO_SHOW.cinemaName}
            </span>
          </div>
        </div>

        {/* Edit Tickets count button */}
        <button
          type="button"
          onClick={() => setIsCountSheetOpen(true)}
          className="flex items-center gap-1 text-[13px] font-medium px-2 py-1 rounded-[4px] hover:bg-bg-muted shrink-0"
          style={{ color: 'var(--bms-red-text)' }}
          aria-label="Edit ticket count"
        >
          <Edit3 size={13} strokeWidth={2} />
          <span>{seatCount} Tickets</span>
        </button>
      </header>

      {/* Date & Showtime Strip */}
      <div
        className="px-4 py-2 flex items-center justify-between border-b border-divider shrink-0"
        style={{
          backgroundColor: 'var(--bg-header-strip)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <span
          className="text-[13px] font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          Fri, 20 Nov
        </span>
        <div
          className="px-3 py-1 rounded-[2px] text-[12px] font-semibold tracking-wide"
          style={{
            backgroundColor: 'var(--showtime-green)',
            color: 'var(--text-on-brand)',
          }}
        >
          09:15 PM
        </div>
      </div>

      {/* Scrollable Seat Grid Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto px-1 pt-[96px] pb-4 flex flex-col no-scrollbar">
        <div className="min-w-[390px] flex flex-col items-center">
          <SeatGrid
            rows={gridRows}
            tierPrices={TIER_PRICES}
            onSeatClick={handleSeatClick}
          />

          {/* Screen shape at bottom */}
          <div className="w-full mt-6 mb-4 flex justify-center">
            <ScreenShape />
          </div>

          {/* Seat Legend */}
          <div className="w-full mb-3">
            <SeatLegend />
          </div>
        </div>
      </div>

      {/* Club Membership Strip (when seats are selected, matching ref 08) */}
      {selectedSeatIds.length > 0 && (
        <div
          className="px-4 py-2.5 flex items-center justify-between border-t border-divider shrink-0"
          style={{
            backgroundColor: 'var(--bg-club)',
            borderTopColor: 'var(--divider)',
          }}
        >
          <div className="flex flex-col text-left pr-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-text-secondary leading-none">bookmyshow</span>
              <span className="text-[11px] font-black tracking-wider text-amber-900 leading-none">CLUB</span>
            </div>
            <span
              className="text-[11px] leading-[14px] font-medium mt-0.5"
              style={{ color: 'var(--text-primary)' }}
            >
              Add Club membership at ₹159 for 60 days and get instant 15% off
            </span>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-[4px] bg-white border border-amber-500 text-[12px] font-medium text-amber-900 shrink-0 shadow-sm"
          >
            Add Club
          </button>
        </div>
      )}

      {/* Bottom CTA Bar */}
      {selectedSeatIds.length > 0 && (
        <BottomCtaBar
          ctaText={`Pay ₹ ${totalRupees}`}
          onCtaClick={() => onPay?.(selectedSeatsList)}
        />
      )}

      {/* Seat Count Picker Bottom Sheet */}
      <SeatCountSheet
        isOpen={isCountSheetOpen}
        onClose={() => setIsCountSheetOpen(false)}
        count={seatCount}
        onChangeCount={setSeatCount}
        onSelectSeats={() => setIsCountSheetOpen(false)}
      />
    </div>
  )
}
