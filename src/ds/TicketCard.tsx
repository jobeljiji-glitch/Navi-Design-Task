import { QRCodeSVG } from 'qrcode.react'

export interface TicketCardProps {
  filmTitle?: string
  cinema?: string
  showtime?: string
  seat?: string
  amountPaid?: string
  message?: string
  groupCountSummary?: string
  className?: string
}

export default function TicketCard({
  filmTitle = 'Monsoon Heist',
  cinema = 'Cineplex: Phoenix Marketcity, Kurla',
  showtime = 'Fri, 20 Nov 2026 · 9:15 PM · Screen 4',
  seat = 'D09',
  amountPaid = '₹277.14',
  message = "You're in, next to Amit",
  groupCountSummary = '4 of 6 in · Rohan, Amit, Sana, you',
  className = '',
}: TicketCardProps) {
  return (
    <div
      className={`w-full bg-bg-surface rounded-[16px] overflow-hidden border border-divider shadow-md flex flex-col ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--divider)',
      }}
    >
      {/* Top Banner */}
      <div
        className="p-4 text-center border-b border-divider flex flex-col gap-1"
        style={{
          backgroundColor: 'var(--bg-success)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <span
          className="text-[16px] leading-[22px] font-bold text-text-success"
          style={{ color: 'var(--text-success)' }}
        >
          {message}
        </span>
        <span
          className="text-[12px] leading-[16px] text-text-secondary"
          style={{ color: 'var(--text-secondary)' }}
        >
          {groupCountSummary}
        </span>
      </div>

      {/* Ticket Body */}
      <div className="p-5 flex flex-col items-center gap-4 text-center">
        {/* QR Code */}
        <div
          className="p-3 rounded-[12px] bg-white border shadow-inner"
          style={{ borderColor: 'var(--divider)' }}
        >
          <QRCodeSVG
            value={`BMS-TICKET-${seat}-${filmTitle}`}
            size={130}
            level="H"
            fgColor="var(--text-primary)"
          />
        </div>

        {/* Seat Badge */}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-[12px] uppercase font-semibold text-text-secondary tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Seat
          </span>
          <span
            className="text-[26px] font-bold leading-tight text-text-primary"
            style={{ color: 'var(--text-primary)' }}
          >
            {seat}
          </span>
        </div>

        {/* Perforated Divider */}
        <div
          className="w-full border-t border-dashed my-1"
          style={{ borderColor: 'var(--divider)' }}
        />

        {/* Film & Show Info */}
        <div className="flex flex-col gap-1 w-full text-left">
          <h4
            className="text-[16px] font-bold text-text-primary"
            style={{ color: 'var(--text-primary)' }}
          >
            {filmTitle}
          </h4>
          <span
            className="text-[13px] text-text-secondary"
            style={{ color: 'var(--text-secondary)' }}
          >
            {showtime}
          </span>
          <span
            className="text-[12px] text-text-secondary truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {cinema}
          </span>
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-divider">
            <span
              className="text-[12px] text-text-secondary"
              style={{ color: 'var(--text-secondary)' }}
            >
              1 ticket · Paid
            </span>
            <span
              className="text-[14px] font-bold text-text-primary"
              style={{ color: 'var(--text-primary)' }}
            >
              {amountPaid}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
