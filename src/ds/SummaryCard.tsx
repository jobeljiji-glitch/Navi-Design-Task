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
  showCancellationBand?: boolean
  cancellationText?: string
  onEditTicket?: () => void
  className?: string
}

export default function SummaryCard({
  title,
  ticketCount = 6,
  dateTime,
  languageFormat = 'Hindi (2D)',
  seatDescription,
  cinema,
  screen,
  ageRating = '16+',
  ageRatingText = 'This movie is only for audience above the age of 16',
  showCancellationBand = true,
  cancellationText = 'This venue supports booking cancellation.',
  onEditTicket,
  className = '',
}: SummaryCardProps) {
  return (
    <div
      className={`w-full shrink-0 bg-bg-surface rounded-[8px] flex flex-col ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--card-shadow)',
      }}
      data-card
    >
      <div className="p-4 flex flex-col gap-2">
        {/* Line 1: Title & Ticket Count Row at 18 pt, weight 500 */}
        <div className="flex items-start justify-between gap-2">
          <h2
            className="text-[18px] leading-[23px] font-medium text-text-primary"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          <span
            className="text-[18px] leading-[23px] font-medium text-text-primary shrink-0"
            style={{ color: 'var(--text-primary)' }}
          >
            {ticketCount}
          </span>
        </div>

        {/* Line 2: Date & M-Ticket Row at 16 pt, weight 500 */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[16px] leading-[21px] font-medium text-text-primary"
            style={{ color: 'var(--text-primary)' }}
          >
            {dateTime}
          </span>
          <button
            type="button"
            onClick={onEditTicket}
            className="flex items-center gap-1 text-[13px] leading-none font-medium hover:opacity-80 shrink-0"
            style={{ color: 'var(--bms-red-text)' }}
          >
            <Edit3 size={13} strokeWidth={2} />
            <span>M-Ticket</span>
          </button>
        </div>

        {/* Line 3+: Grey info lines at 14 pt, gap 4 pt */}
        <div
          className="flex flex-col gap-1 text-[14px] leading-[19px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>{languageFormat}</span>
          <span>{seatDescription}</span>
          <span>
            {cinema}
            {screen ? ` (${screen})` : ''}
          </span>
        </div>

        {/* Age Warning Row: 22 pt red circle, 13 pt black text on one line */}
        {ageRating && (
          <div className="flex items-center gap-2 pt-1">
            {/* 06: sized to its content (pill once the text outgrows the 22 pt circle), never overflowing */}
            <div
              className="min-w-[22px] min-h-[22px] px-[3px] rounded-full border border-bms-red-strong flex items-center justify-center shrink-0"
              style={{ borderColor: 'var(--bms-red-strong)' }}
              data-testid="age-badge"
            >
              <span
                className="text-[11px] leading-[14px] font-medium whitespace-nowrap"
                style={{ color: 'var(--bms-red-strong)' }}
              >
                {ageRating}
              </span>
            </div>
            <span
              className="text-[13px] leading-[18px] font-normal truncate whitespace-nowrap"
              style={{ color: 'var(--text-primary)' }}
            >
              {ageRatingText}
            </span>
          </div>
        )}
      </div>

      {/* Cancellation Band: INSIDE the summary card, flush to bottom edge, sharing bottom radius (padding 12 pt 16 pt) */}
      {showCancellationBand && (
        <div
          className="px-4 py-3 flex flex-col gap-0.5 rounded-b-[8px]"
          style={{
            backgroundColor: 'var(--bg-success)',
          }}
        >
          <span
            className="text-[14px] leading-[19px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Cancellation Available
          </span>
          <span
            className="text-[13px] leading-[18px]"
            style={{ color: 'var(--text-primary)' }}
          >
            {cancellationText}
          </span>
        </div>
      )}
    </div>
  )
}
