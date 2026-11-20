import { useState } from 'react'
import { ChevronLeft, Edit3, Tag, ChevronRight } from 'lucide-react'
import { DEMO_SHOW } from '@/logic/seed'
import type { Seat as LogicSeat } from '@/logic/types'
import { formatINR } from '@/logic/money'
import {
  SummaryCard,
  InfoBanner,
  PriceBreakdown,
  BottomCtaBar,
  LoaderSheet,
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

  // Default to 2 Prime seats (G09, G10 at 23000 paise each) if no seats passed, matching reference 11
  const bookingSeats = seats && seats.length > 0 ? seats : [
    { id: 'G09', row: 'G', num: 9, tier: 'prime', price: 23000, state: 'selected' as const },
    { id: 'G10', row: 'G', num: 10, tier: 'prime', price: 23000, state: 'selected' as const },
  ]

  const ticketCount = bookingSeats.length
  const ticketPaise = bookingSeats.reduce((acc, s) => acc + s.price, 0)
  const feePaise = DEMO_SHOW.fee * ticketCount
  const totalPaise = ticketPaise + feePaise

  const seatLabels = `QR-${bookingSeats.map(s => `${s.row}${s.num}`).join(',')}`

  const breakdownItems = [
    {
      label: 'Ticket(s) price',
      amount: formatINR(ticketPaise),
      subtitle: `${ticketCount} ticket${ticketCount > 1 ? 's' : ''}`,
    },
    {
      label: 'Convenience fees',
      amount: formatINR(feePaise),
      subtitle: 'Base fee & taxes',
    },
    {
      label: 'Give to Underprivileged Musicians',
      amount: '₹0.00',
      subtitle: '(₹1 per ticket)',
      actionLabel: `Add ₹${(ticketCount * 1).toFixed(2)}`,
    },
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
      {/* Navigation Header */}
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
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-bg-muted active:opacity-70 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft size={24} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1
          className="text-[17px] leading-[22px] font-medium ml-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Confirm booking
        </h1>
      </header>

      {/* Scrollable Booking Details */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 no-scrollbar">
        {/* Movie Summary Card */}
        <SummaryCard
          title={DEMO_SHOW.filmTitle}
          ticketCount={ticketCount}
          dateTime="Fri, 20 Nov, 2026 | 09:15 PM"
          languageFormat={`${DEMO_SHOW.language} (${DEMO_SHOW.format})`}
          seatDescription={seatLabels}
          cinema={DEMO_SHOW.cinemaName}
          screen={DEMO_SHOW.screen.toUpperCase()}
          ageRating="16+"
          ageRatingText="This movie is only for audience above the age of 16"
        />

        {/* Cancellation Available Banner */}
        <InfoBanner
          title="Cancellation Available"
          body="This venue supports booking cancellation. To know more"
          linkText="view cancellation policy"
        />

        {/* Price Breakdown */}
        <PriceBreakdown
          items={breakdownItems}
          totalLabel="Order total"
          totalAmount={formatINR(totalPaise)}
        />

        {/* Contact Info Card */}
        <div
          className="w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-1 border border-divider shadow-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--divider)',
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[14px] font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              For Sending Booking Details
            </span>
            <button
              type="button"
              className="flex items-center gap-1 text-[12px] font-medium"
              style={{ color: 'var(--bms-red-text)' }}
            >
              <Edit3 size={13} strokeWidth={2} />
              <span>Edit</span>
            </button>
          </div>
          <span
            className="text-[13px] text-text-secondary mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            +91-9876543210 | rohan@okbank
          </span>
          <span
            className="text-[12px] text-text-secondary"
            style={{ color: 'var(--text-secondary)' }}
          >
            Maharashtra (for GST purposes)
          </span>
        </div>

        {/* Club Upsell Card */}
        <div
          className="w-full bg-bg-surface rounded-[8px] border border-amber-300 overflow-hidden shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-text-secondary">bookmyshow</span>
            <span className="text-[11px] font-black text-amber-900">CLUB</span>
            <span className="text-[12px] font-medium text-amber-900 ml-1">
              Get ₹69.00 off instantly with this booking!
            </span>
          </div>
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-text-primary">
                Save up to ₹1800 with Club
              </span>
              <span className="text-[11px] text-text-secondary mt-0.5">
                Plus, you can apply payment offers too
              </span>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-[4px] border border-amber-500 text-[12px] font-medium text-amber-900 bg-amber-50"
            >
              Add Club
            </button>
          </div>
        </div>

        {/* Apply Offers Row */}
        <button
          type="button"
          className="w-full bg-bg-surface rounded-[8px] p-3.5 flex items-center justify-between border border-divider shadow-sm hover:bg-bg-muted"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--divider)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Tag size={18} strokeWidth={1.75} className="text-amber-600" />
            <span
              className="text-[14px] font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Apply Offers
            </span>
          </div>
          <ChevronRight size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Sticky Bottom Bar */}
      <BottomCtaBar
        totalLabel="Total"
        totalAmount={formatINR(totalPaise)}
        ctaText="Continue"
        variant="strong"
        onCtaClick={onContinue}
      />

      {/* Loader Sheet: Confirming your Seats! */}
      <LoaderSheet
        isOpen={isLoaderOpen}
        onClose={() => setIsLoaderOpen(false)}
        message="Confirming your Seats!"
      />
    </div>
  )
}
