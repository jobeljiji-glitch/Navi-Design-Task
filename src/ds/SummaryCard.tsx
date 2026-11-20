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
      className={`w-full bg-bg-surface rounded-[8px] flex flex-col border border-divider shadow-sm ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--divider)',
        borderRadius: '8px',
      }}
    >
      <div className="p-[14px] flex flex-col gap-2">
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

        {/* Line 3+: Grey info lines at 14 pt */}
        <div
          className="flex flex-col gap-0.5 text-[14px] leading-[19px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>{languageFormat}</span>
          <span>{seatDescription}</span>
          <span>
            {cinema}
            {screen ? ` (${screen})` : ''}
          </span>
        </div>

        {/* Age Warning Row: 22 pt red circle, 14 pt black text, fully visible (no clip) */}
        {ageRating && (
          <div className="flex items-center gap-2 pt-1">
            <div
              className="w-[22px] h-[22px] rounded-full border border-bms-red-strong flex items-center justify-center shrink-0"
              style={{ borderColor: 'var(--bms-red-strong)' }}
            >
              <span
                className="text-[11px] font-bold"
                style={{ color: 'var(--bms-red-strong)' }}
              >
                {ageRating}
              </span>
            </div>
            <span
              className="text-[14px] leading-[19px] font-normal"
              style={{ color: 'var(--text-primary)' }}
            >
              {ageRatingText}
            </span>
          </div>
        )}
      </div>

      {/* Cancellation Band: INSIDE the summary card, flush to bottom edge, sharing bottom radius */}
      {showCancellationBand && (
        <div
          className="px-[14px] py-2.5 flex flex-col gap-0.5 rounded-b-[8px]"
          style={{
            backgroundColor: '#EAF8F1',
          }}
        >
          <span
            className="text-[14px] leading-[19px] font-medium"
            style={{ color: '#047857' }}
          >
            Cancellation Available
          </span>
          <span
            className="text-[14px] leading-[19px]"
            style={{ color: '#065F46' }}
          >
            {cancellationText}
          </span>
        </div>
      )}
    </div>
  )
}
