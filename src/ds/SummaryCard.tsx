import { Edit3 } from 'lucide-react'

export interface SummaryCardProps {
  title: string
  ticketCount?: number
  dateTime: string
  languageFormat?: string
  seatDescription: string
  cinema: string
  screen?: string
  ageRating?: string
  ageRatingText?: string
  onEditTicket?: () => void
  className?: string
}

export default function SummaryCard({
  title,
  ticketCount = 2,
  dateTime,
  languageFormat = 'Malayalam (2D)',
  seatDescription,
  cinema,
  screen,
  ageRating = '18+',
  ageRatingText = 'This movie is only for audience above the age of 18',
  onEditTicket,
  className = '',
}: SummaryCardProps) {
  return (
    <div
      className={`w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-2.5 border border-divider shadow-sm ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--divider)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      {/* Title & Ticket Count Row */}
      <div className="flex items-start justify-between gap-2">
        <h2
          className="text-[17px] leading-[22px] font-medium text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
        <span
          className="text-[18px] leading-[22px] font-medium text-text-primary shrink-0"
          style={{ color: 'var(--text-primary)' }}
        >
          {ticketCount}
        </span>
      </div>

      {/* Date & M-Ticket Row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[14px] leading-[18px] font-medium text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {dateTime}
        </span>
        <button
          type="button"
          onClick={onEditTicket}
          className="flex items-center gap-1 text-[12px] leading-none font-medium text-bms-red-text hover:opacity-80 shrink-0"
          style={{ color: 'var(--bms-red-text)' }}
        >
          <Edit3 size={13} strokeWidth={2} />
          <span>M-Ticket</span>
        </button>
      </div>

      {/* Meta text */}
      <div
        className="flex flex-col gap-0.5 text-[13px] leading-[18px] text-text-secondary"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span>{languageFormat}</span>
        <span>{seatDescription}</span>
        <span>
          {cinema}
          {screen ? ` (${screen})` : ''}
        </span>
      </div>

      {/* Age Warning */}
      {ageRating && (
        <div className="flex items-center gap-2 pt-2 border-t border-divider">
          <div
            className="w-5 h-5 rounded-full border border-bms-red-strong flex items-center justify-center shrink-0"
            style={{ borderColor: 'var(--bms-red-strong)' }}
          >
            <span
              className="text-[10px] font-bold"
              style={{ color: 'var(--bms-red-strong)' }}
            >
              {ageRating}
            </span>
          </div>
          <span
            className="text-[12px] leading-[16px] text-text-secondary"
            style={{ color: 'var(--text-secondary)' }}
          >
            {ageRatingText}
          </span>
        </div>
      )}
    </div>
  )
}
