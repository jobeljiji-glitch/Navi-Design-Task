import { useState } from 'react'
import { ChevronLeft, Edit3 } from 'lucide-react'
import { DEMO_SHOW } from '@/logic/seed'
import type { Seat as LogicSeat } from '@/logic/types'
import { formatINR } from '@/logic/money'
import {
  SummaryCard,
  PriceBreakdown,
  LoaderSheet,
  Card,
} from '@/ds'

export interface ConfirmBookingScreenProps {
  onBack?: () => void
  onContinue?: () => void
  seats?: LogicSeat[]
  showLoaderInitially?: boolean
}

export default function ConfirmBookingScreen({
  onBack,
  onContinue,
  seats,
  showLoaderInitially = false,
}: ConfirmBookingScreenProps) {
  const [isLoaderOpen, setIsLoaderOpen] = useState(showLoaderInitially)

  // Default to 6 Prime Plus seats (D05-D10 at 25000 paise each) if no seats passed
  const bookingSeats = seats && seats.length > 0 ? seats : [
    { id: 'D05', row: 'D', num: 5, tier: 'primePlus', price: 25000, state: 'selected' as const },
    { id: 'D06', row: 'D', num: 6, tier: 'primePlus', price: 25000, state: 'selected' as const },
    { id: 'D07', row: 'D', num: 7, tier: 'primePlus', price: 25000, state: 'selected' as const },
    { id: 'D08', row: 'D', num: 8, tier: 'primePlus', price: 25000, state: 'selected' as const },
    { id: 'D09', row: 'D', num: 9, tier: 'primePlus', price: 25000, state: 'selected' as const },
    { id: 'D10', row: 'D', num: 10, tier: 'primePlus', price: 25000, state: 'selected' as const },
  ]

  const ticketCount = bookingSeats.length
  const ticketPaise = bookingSeats.reduce((acc, s) => acc + s.price, 0)
  const feePaise = DEMO_SHOW.fee * ticketCount
  const totalPaise = ticketPaise + feePaise

  const tierName = bookingSeats[0]?.tier === 'primePlus' ? 'PRIME PLUS' : 'PRIME'
  const seatIdsFormatted = bookingSeats.map(s => s.id).join(', ')
  const seatDescription = `${tierName} - ${seatIdsFormatted}`

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
      {/* Header: sits on same grey, no white bar, 20 pt wt 400 */}
      <header
        className="flex items-center px-3 h-[54px] shrink-0"
        style={{ backgroundColor: 'var(--bg-page)' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="p-1 -ml-1 flex items-center justify-center active:opacity-70"
          aria-label="Back"
        >
          <ChevronLeft size={24} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1
          className="text-[20px] leading-[26px] font-normal ml-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Confirm booking
        </h1>
      </header>

      {/* Scrollable Booking Details with 12 pt side margins (px-3) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 flex flex-col gap-3 no-scrollbar [&>*]:shrink-0">
        {/* Movie Summary Card with cancellation band inside (no fixed height, no clipping) */}
        <SummaryCard
          title={DEMO_SHOW.filmTitle}
          ticketCount={ticketCount}
          dateTime="Fri, 20 Nov, 2026 | 09:15 PM"
          languageFormat={`${DEMO_SHOW.language} (${DEMO_SHOW.format})`}
          seatDescription={seatDescription}
          cinema={DEMO_SHOW.cinemaName}
          screen={DEMO_SHOW.screen.toUpperCase()}
          ageRating="16+"
          ageRatingText="This movie is only for audience above the age of 16"
          showCancellationBand={true}
          cancellationText="This venue supports booking cancellation."
        />

        {/* Price Card */}
        <PriceBreakdown
          ticketPrice={formatINR(ticketPaise)}
          convenienceFee={formatINR(feePaise)}
          feeBreakdown={[
            { label: 'Base convenience fee', amount: formatINR(Math.round(feePaise * 0.8475)) },
            { label: 'Integrated GST (18%)', amount: formatINR(Math.round(feePaise * 0.1525)) },
          ]}
          musiciansFee="₹0.00"
          musiciansAddText={`Add ₹${ticketCount}.00`}
          totalLabel="Order total"
          totalAmount={formatINR(totalPaise)}
        />

        {/* For Sending Booking Details Card */}
        <Card className="flex flex-col gap-1" testId="sending-details">
          <div className="flex items-center justify-between">
            <span
              className="text-[16px] leading-[21px] font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              For Sending Booking Details
            </span>
            <button
              type="button"
              className="flex items-center gap-1 text-[13px] font-medium hover:opacity-85"
              style={{ color: 'var(--bms-red-text)' }}
            >
              <Edit3 size={13} strokeWidth={1.75} />
              <span>Edit</span>
            </button>
          </div>
          <span
            className="text-[14px] leading-[20px] mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            +91-98XXXXXX10 | rohan.m@gmail.com
          </span>
          <span
            className="text-[14px] leading-[20px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Maharashtra (for GST purposes)
          </span>
        </Card>
      </div>

      {/* Bottom Bar: Total (13 pt grey) / ₹1,662.84 (20 pt, wt 500) | Continue button ~46% wide, 48 pt high, radius 6, strong red */}
      <div
        className="px-4 py-3 bg-bg-surface border-t border-divider shrink-0 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTopColor: 'var(--divider)',
          paddingBottom: 'calc(var(--sab, 0px) + 9px)',
        }}
      >
        <div className="flex flex-col text-left">
          <span
            className="text-[13px] leading-[18px] font-normal"
            style={{ color: 'var(--text-secondary)' }}
          >
            Total
          </span>
          <span
            className="text-[20px] leading-[26px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatINR(totalPaise)}
          </span>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-[46%] h-[48px] rounded-[6px] flex items-center justify-center font-medium text-[16px] text-white transition-transform active:scale-[0.99]"
          style={{ backgroundColor: 'var(--bms-red-strong)' }}
        >
          Continue
        </button>
      </div>

      {/* Loader Sheet */}
      <LoaderSheet
        isOpen={isLoaderOpen}
        onClose={() => setIsLoaderOpen(false)}
        message="Confirming your Seats!"
      />
    </div>
  )
}
