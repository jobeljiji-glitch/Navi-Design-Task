import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronLeft, Edit3 } from 'lucide-react'
import { DEMO_SHOW, createInitialSeats } from '@/logic/seed'
import type { Seat as LogicSeat, SeatTier } from '@/logic/types'
import { pickSeats } from '@/logic/seatPick'
import {
  SeatGrid,
  ScreenShape,
  SeatLegend,
  SeatCountSheet,
  LoaderSheet,
  ShowtimePill,
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
  initialSeatCount = 6,
  isCountSheetOpenInitially = false,
}: SeatLayoutScreenProps) {
  const [seatCount, setSeatCount] = useState(initialSeatCount)
  const [isCountSheetOpen, setIsCountSheetOpen] = useState(isCountSheetOpenInitially)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(initialSelectedSeatIds)
  const [isLoaderOpen, setIsLoaderOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  // Center target seat block (D05-D10) horizontally on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const targetElement = scrollContainerRef.current.querySelector('#D07') as HTMLElement
      if (targetElement) {
        const containerWidth = scrollContainerRef.current.clientWidth
        const targetLeft = targetElement.offsetLeft
        scrollContainerRef.current.scrollLeft = Math.max(0, targetLeft - containerWidth / 2 + 10)
      } else {
        // Fallback default horizontal scroll
        scrollContainerRef.current.scrollLeft = 80
      }
    }
  }, [])

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

  // Handle seat clicks using group seat picking logic
  const handleSeatClick = (seatId: string) => {
    const result = pickSeats(initialSeats, selectedSeatIds, seatId, seatCount)
    setSelectedSeatIds([...result])

    if (result.message) {
      setToastMessage(result.message)
      setTimeout(() => {
        setToastMessage(null)
      }, 2500)
    }
  }

  // Calculate total ticket price from selected seats
  const selectedSeatsList = useMemo(() => {
    return selectedSeatIds.map(id => initialSeats[id]).filter(Boolean)
  }, [selectedSeatIds, initialSeats])

  const totalPaise = useMemo(() => {
    return selectedSeatsList.reduce((acc, s) => acc + s.price, 0)
  }, [selectedSeatsList])

  const totalRupees = Math.floor(totalPaise / 100)

  // Handle Pay action: show loader for 1,200 ms, then transition to confirm booking
  const handlePayClick = () => {
    if (selectedSeatsList.length === 0) return
    setIsLoaderOpen(true)
    setTimeout(() => {
      setIsLoaderOpen(false)
      onPay?.(selectedSeatsList)
    }, 1200)
  }

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
      {/* Navigation Header: title 17 pt wt 500, cinema 15 pt grey. No ticket control here. */}
      <header
        className="flex items-center px-4 h-[54px] shrink-0 border-b border-divider bg-bg-surface"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="p-1 -ml-1 flex items-center justify-center active:opacity-70 shrink-0"
          aria-label="Back"
        >
          <ChevronLeft size={24} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
        </button>

        <div className="flex flex-col text-left min-w-0 ml-1">
          <h1
            className="text-[17px] leading-[22px] font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {DEMO_SHOW.filmTitle} - {DEMO_SHOW.language}
          </h1>
          <span
            className="text-[15px] leading-[20px] font-normal truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {DEMO_SHOW.cinemaName}
          </span>
        </div>
      </header>

      {/* Strip under header: light-grey background. Fri, 20 Nov on left, ✎ N Tickets in red on right */}
      <div
        className="px-4 py-2.5 flex flex-col gap-2 border-b border-divider shrink-0"
        style={{
          backgroundColor: 'var(--bg-header-strip, #F2F3F5)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[14px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Fri, 20 Nov
          </span>

          <button
            type="button"
            onClick={() => setIsCountSheetOpen(true)}
            className="flex items-center gap-1 text-[13px] font-medium hover:opacity-85 shrink-0"
            style={{ color: 'var(--bms-red-text)' }}
            aria-label="Edit ticket count"
          >
            <Edit3 size={13} strokeWidth={2} />
            <span>{seatCount} Tickets</span>
          </button>
        </div>

        {/* Selected green showtime pill on next line, left-aligned, ~110 x 40 pt */}
        <div className="flex items-center">
          <ShowtimePill
            time="09:15 PM"
            size="normal"
            selected
          />
        </div>
      </div>

      {/* Main Horizontally & Vertically Scrollable Seat Grid Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
        }}
      >
        <div className="min-w-[540px] flex flex-col pb-6">
          {/* True size seat grid */}
          <SeatGrid
            rows={gridRows}
            tierPrices={TIER_PRICES}
            onSeatClick={handleSeatClick}
          />

          {/* Under last row: Screen shape trapezoid and "All eyes this way please!" */}
          <div className="w-full mt-4 flex justify-center">
            <ScreenShape label="All eyes this way please!" />
          </div>

          {/* Seat Legend */}
          <div className="w-full mb-3">
            <SeatLegend />
          </div>

          {/* Static Club Banner */}
          <div
            className="mx-4 my-2 px-4 py-2.5 rounded-[6px] flex items-center justify-between border border-divider shadow-sm"
            style={{
              backgroundColor: 'var(--bg-club, #FFFBEB)',
              borderColor: '#FDE68A',
            }}
          >
            <div className="flex flex-col text-left pr-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-text-secondary leading-none">bookmyshow</span>
                <span className="text-[11px] font-black tracking-wider text-amber-900 leading-none">CLUB</span>
              </div>
              <span
                className="text-[12px] leading-[15px] font-medium mt-0.5"
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
        </div>
      </div>

      {/* Floating toast for seat selection info */}
      {toastMessage && (
        <div className="absolute top-36 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-black/85 text-white px-4 py-2 rounded-full text-[13px] font-medium shadow-lg animate-fade-in backdrop-blur-sm">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Sticky Bottom Pay bar: appears only once at least 1 seat is selected. 48 pt high, strong red */}
      {selectedSeatIds.length > 0 && (
        <div
          className="w-full px-4 py-2.5 bg-bg-surface border-t border-divider shrink-0 shadow-lg flex items-center justify-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderTopColor: 'var(--divider)',
            paddingBottom: 'calc(var(--safe-bottom) + 10px)',
          }}
        >
          <button
            type="button"
            onClick={handlePayClick}
            className="w-full h-[48px] rounded-[6px] flex items-center justify-center font-medium text-[16px] text-white shadow-sm transition-transform active:scale-[0.99]"
            style={{ backgroundColor: 'var(--bms-red-strong)' }}
          >
            Pay ₹{totalRupees.toLocaleString('en-IN')}
          </button>
        </div>
      )}

      {/* "How many seats?" Sheet */}
      <SeatCountSheet
        isOpen={isCountSheetOpen}
        onClose={() => setIsCountSheetOpen(false)}
        count={seatCount}
        onChangeCount={setSeatCount}
        onSelectSeats={() => setIsCountSheetOpen(false)}
      />

      {/* Loader Sheet: 1,200 ms "Confirming your Seats!" */}
      <LoaderSheet
        isOpen={isLoaderOpen}
        message="Confirming your Seats!"
      />
    </div>
  )
}
