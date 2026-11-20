import type { ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Share2, X, ChevronRight, Users } from 'lucide-react'
import PosterArt from './PosterArt'

/**
 * M-Ticket (ref 16): grey page, white 16 pt card with poster + details, support pill,
 * perforation, QR + screen/seat, grey note band, total. Tokens only (05).
 */
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
  /** Large line above the card (friend ticket: "You're in, next to Amit") */
  headline?: string
  /** Replaces the "View group" row under the card */
  footer?: ReactNode
  qrValue?: string
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
  headline,
  footer,
  qrValue,
  onClose,
  onShare,
  onViewGroup,
  className = '',
}: TicketCardProps) {
  const secondary = { color: 'var(--text-secondary)' }
  const primary = { color: 'var(--text-primary)' }
  const cutout = { backgroundColor: 'var(--ticket-page-bg)' }
  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`} style={{ backgroundColor: 'var(--ticket-page-bg)' }}>
      {/* Header: "SHARE YOUR TICKET" centred + red-outline close */}
      <div className="w-full px-5 pt-4 pb-3 flex items-center justify-between relative min-h-[60px]">
        {onShare && (
          <button type="button" onClick={onShare} className="flex items-center gap-1.5 mx-auto active:opacity-70" style={{ ...secondary, letterSpacing: '0.8px' }}>
            <Share2 size={16} strokeWidth={1.75} />
            <span className="text-[15px] font-medium uppercase">Share Your Ticket</span>
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full border flex items-center justify-center active:scale-95 transition-transform absolute right-4"
            style={{ borderColor: 'var(--bms-red)', color: 'var(--bms-red)' }}
            aria-label="Close ticket"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {headline && (
        <h1 className="w-full px-5 pb-3 text-[22px] leading-[28px] font-medium text-center text-balance" style={primary} data-testid="ticket-headline">
          {headline}
        </h1>
      )}

      {/* Group context strip */}
      {groupBannerText && (
        <div className="w-full px-5 pb-2.5">
          <div className="w-full py-2 px-3 rounded-[8px] flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-success)', color: 'var(--text-success)' }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--showtime-green)' }} />
            <span className="text-[13px] leading-tight font-medium">{groupBannerText}</span>
          </div>
        </div>
      )}

      {/* Ticket card */}
      <div className="w-full px-5">
        <div className="w-full rounded-[16px] flex flex-col relative overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--card-shadow)' }}>
          <div className="p-4 flex gap-3 relative">
            <PosterArt title="Monsoon Heist" titleSize={13} className="w-[80px] h-[104px] rounded-[8px] shrink-0" />
            <div className="flex-1 flex flex-col justify-between pr-7 min-w-0">
              <h3 className="text-[20px] leading-[24px] font-medium line-clamp-2" style={primary}>{filmTitle}</h3>
              <div className="flex flex-col gap-0.5 text-[15px] leading-[19px]" style={secondary}>
                <span>{languageFormat}</span>
                <span>{showtime}</span>
                <span className="truncate">{cinema}</span>
              </div>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90">
              <span className="text-[13px] font-medium tracking-[3px] uppercase" style={{ color: 'var(--text-tertiary)' }}>M-Ticket</span>
            </div>
          </div>

          <div className="px-4 pb-2">
            <div className="w-full py-1.5 px-4 rounded-full text-[13px] text-center" style={{ backgroundColor: 'var(--bg-muted)', ...secondary }}>
              Tap for support, details &amp; more actions
            </div>
          </div>

          {/* Perforation */}
          <div className="relative w-full h-[18px] flex items-center justify-between">
            <div className="w-5 h-5 rounded-full -ml-2.5 shrink-0" style={cutout} />
            <div className="flex-1 border-b border-dashed mx-1" style={{ borderColor: 'var(--bg-tag)' }} />
            <div className="w-5 h-5 rounded-full -mr-2.5 shrink-0" style={cutout} />
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-[120px] h-[120px] rounded-[10px] p-2 border flex items-center justify-center shrink-0" style={{ borderColor: 'var(--divider)' }}>
              <QRCodeSVG value={qrValue ?? `BMS-HOLD-${seat}-${bookingId}`} size={104} level="M" fgColor="currentColor" style={primary} />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-0.5 min-w-0">
              <span className="text-[14px] leading-tight" style={secondary}>{ticketCount}</span>
              <span className="text-[22px] leading-tight font-medium tracking-wide" style={primary}>{screen}</span>
              <span className="text-[15px] leading-tight" style={secondary}>{seat}</span>
              {bookingId && <span className="text-[14px] leading-tight font-medium mt-1" style={primary}>{bookingId}</span>}
            </div>
          </div>

          <div className="w-full py-2 px-3 text-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
            <span className="text-[12px] leading-tight" style={secondary} data-testid="ticket-note">{cancellationText}</span>
          </div>

          <div className="px-5 py-3.5 flex items-center justify-between">
            <span className="text-[15px]" style={primary}>Total Amount</span>
            <span className="text-[18px] font-medium" style={primary}>{totalAmount}</span>
          </div>
        </div>
      </div>

      {footer ?? (
        <div className="w-full px-5 pt-3 pb-6">
          <button
            type="button"
            onClick={onViewGroup}
            className="w-full py-3.5 px-4 rounded-[10px] flex items-center justify-between active:scale-[0.99] transition-transform"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--bms-red)' }}>
                <Users size={18} strokeWidth={1.75} />
              </div>
              <span className="text-[15px] font-medium" style={primary}>View group</span>
            </div>
            <ChevronRight size={18} strokeWidth={1.75} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>
      )}
    </div>
  )
}
