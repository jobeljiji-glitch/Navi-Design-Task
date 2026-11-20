import { QRCodeSVG } from 'qrcode.react'
import { Share2, X, ChevronRight, Users } from 'lucide-react'

export interface TicketCardProps {
  filmTitle?: string
  cinema?: string
  showtime?: string
  languageFormat?: string
  screen?: string
  seat?: string
  bookingId?: string
  ticketCount?: string
  cancellationText?: string
  totalAmount?: string
  groupBannerText?: string
  onClose?: () => void
  onShare?: () => void
  onViewGroup?: () => void
  className?: string
}

export default function TicketCard({
  filmTitle = 'Monsoon Heist (U/A)',
  cinema = 'Cineplex: Phoenix Marketcity, Kurla',
  showtime = 'Fri, 20 Nov | 09:15 PM',
  languageFormat = 'Hindi, 2D',
  screen = 'SCREEN 4',
  seat = 'PP-D09',
  bookingId = 'BOOKING ID: G7HK2Q9',
  ticketCount = '1 Ticket(s)',
  cancellationText = 'Cancellation available till 8:55 PM',
  totalAmount = '₹ 277.14',
  groupBannerText = "You're in, next to Amit · 4 of 6 in",
  onClose,
  onShare,
  onViewGroup,
  className = '',
}: TicketCardProps) {
  return (
    <div
      className={`w-full flex flex-col items-center select-none ${className}`}
      style={{ backgroundColor: '#E5E5E5' }}
    >
      {/* Header bar: "SHARE YOUR TICKET" centered + 36pt red-outline close button */}
      <div className="w-full px-5 pt-4 pb-3 flex items-center justify-between relative">
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 mx-auto text-[#5C5C5C] hover:text-[#1C1C1C] transition-colors"
          style={{ letterSpacing: '0.8px' }}
        >
          <Share2 size={16} strokeWidth={2} />
          <span className="text-[15px] font-medium uppercase">Share Your Ticket</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full border border-[var(--bms-red)] bg-white/50 flex items-center justify-center text-[var(--bms-red)] hover:bg-white active:scale-95 transition-all absolute right-5"
          aria-label="Close ticket"
        >
          <X size={20} strokeWidth={2.2} />
        </button>
      </div>

      {/* Group context slim green strip directly above card */}
      {groupBannerText && (
        <div className="w-full px-5 pb-2.5">
          <div
            className="w-full py-2 px-3 rounded-[8px] flex items-center justify-center gap-2 border shadow-xs"
            style={{
              backgroundColor: 'var(--bg-success)',
              borderColor: '#B3ECC1',
              color: 'var(--text-success)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-[var(--showtime-green)] animate-pulse" />
            <span className="text-[13px] leading-tight font-medium">
              {groupBannerText}
            </span>
          </div>
        </div>
      )}

      {/* Main Ticket Card: White, 16 pt radius, 20 pt side margins */}
      <div className="w-full px-5">
        <div
          className="w-full bg-white rounded-[16px] shadow-md flex flex-col relative overflow-hidden"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {/* Top section: Poster thumb + details + vertical M-Ticket */}
          <div className="p-4 flex gap-3 relative">
            {/* Poster thumbnail: ~80 x 104 pt, radius 8 */}
            <div
              className="w-[80px] h-[104px] rounded-[8px] shrink-0 overflow-hidden flex flex-col justify-end p-2 relative shadow-xs"
              style={{
                background: 'linear-gradient(145deg, #1A1F36 0%, #B82538 100%)',
              }}
            >
              <div className="absolute inset-0 bg-black/15" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-white uppercase leading-tight line-clamp-2">
                  Monsoon Heist
                </span>
                <span className="text-[8px] text-white/80 mt-1 px-1.5 py-0.5 rounded-full bg-black/40">
                  Trailer
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between pr-7 min-w-0">
              <h3 className="text-[20px] leading-[24px] font-medium text-[#1C1C1C] line-clamp-2">
                {filmTitle}
              </h3>
              <div className="flex flex-col gap-0.5 text-[15px] leading-[19px] text-[#5C5C5C]">
                <span>{languageFormat}</span>
                <span>{showtime}</span>
                <span className="truncate">{cinema}</span>
              </div>
            </div>

            {/* Vertical rotated M-Ticket text on right edge */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 origin-center rotate-90 select-none">
              <span className="text-[13px] font-medium text-[#8A8A8A] tracking-[3px] uppercase">
                M-Ticket
              </span>
            </div>
          </div>

          {/* Support Pill above perforation */}
          <div className="px-4 pb-2">
            <button
              type="button"
              className="w-full py-1.5 px-4 rounded-full bg-[#F2F2F2] hover:bg-[#EBEBEB] text-[#5C5C5C] text-[13px] font-normal text-center transition-colors"
            >
              Tap for support, details &amp; more actions
            </button>
          </div>

          {/* Perforation section with two semicircle cutouts */}
          <div className="relative w-full h-[18px] flex items-center justify-between">
            {/* Left cutout notch */}
            <div
              className="w-5 h-5 rounded-full bg-[#E5E5E5] -ml-2.5 z-10 shrink-0 shadow-inner"
              style={{ backgroundColor: '#E5E5E5' }}
            />
            {/* Dotted / dashed tear line */}
            <div className="flex-1 border-b border-dashed border-[#DCDCDC] mx-1" />
            {/* Right cutout notch */}
            <div
              className="w-5 h-5 rounded-full bg-[#E5E5E5] -mr-2.5 z-10 shrink-0 shadow-inner"
              style={{ backgroundColor: '#E5E5E5' }}
            />
          </div>

          {/* Middle section: QR code + Show/Seat Details */}
          <div className="p-4 flex items-center gap-4">
            {/* QR code (~120 pt) */}
            <div className="w-[120px] h-[120px] rounded-[10px] p-2 border border-[#EBEBEB] flex items-center justify-center shrink-0">
              <QRCodeSVG
                value={`BMS-HOLD-${seat}-${bookingId}`}
                size={104}
                level="M"
                fgColor="#1C1C1C"
              />
            </div>

            {/* Centered Column: Ticket count, Screen, Seat, Booking ID */}
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-0.5">
              <span className="text-[14px] leading-tight text-[#5C5C5C]">
                {ticketCount}
              </span>
              <span className="text-[22px] leading-tight font-medium text-[#1C1C1C] tracking-wide">
                {screen}
              </span>
              <span className="text-[15px] leading-tight text-[#5C5C5C] font-normal">
                {seat}
              </span>
              <span className="text-[14px] leading-tight font-medium text-[#1C1C1C] mt-1">
                {bookingId}
              </span>
            </div>
          </div>

          {/* Note band: Grey band reading cancellation window */}
          <div className="w-full py-2 px-3 bg-[#F5F5F5] border-t border-b border-[#EBEBEB] text-center">
            <span className="text-[12px] leading-tight text-[#5C5C5C]">
              {cancellationText}
            </span>
          </div>

          {/* Footer: Total Amount */}
          <div className="px-5 py-3.5 flex items-center justify-between">
            <span className="text-[15px] font-normal text-[#1C1C1C]">
              Total Amount
            </span>
            <span className="text-[18px] font-medium text-[#1C1C1C]">
              {totalAmount}
            </span>
          </div>
        </div>
      </div>

      {/* Below card: White row relabelled "View group" */}
      <div className="w-full px-5 pt-3 pb-6">
        <button
          type="button"
          onClick={onViewGroup}
          className="w-full py-3.5 px-4 bg-white rounded-[10px] shadow-xs flex items-center justify-between hover:bg-white/90 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-info)] flex items-center justify-center text-[var(--bms-red)]">
              <Users size={18} strokeWidth={2} />
            </div>
            <span className="text-[15px] font-medium text-[#1C1C1C]">
              View group
            </span>
          </div>
          <ChevronRight size={18} strokeWidth={2} className="text-[#8A8A8A]" />
        </button>
      </div>
    </div>
  )
}
