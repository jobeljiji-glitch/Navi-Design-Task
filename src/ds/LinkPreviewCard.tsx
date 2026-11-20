import PosterArt from './PosterArt'

/**
 * Link preview inside a chat bubble (spec §4 step 4), laid out like a WhatsApp rich preview:
 * artwork on top, then a grey body with title, description, deadline and domain.
 * Static: values come from `selectLinkPreview`.
 */
export interface LinkPreviewCardProps {
  filmTitle?: string
  headline?: string
  subtitle?: string
  deadlineNote?: string
  domain?: string
  onClick?: () => void
  className?: string
}

export default function LinkPreviewCard({
  filmTitle = 'Monsoon Heist',
  headline = 'Rohan is holding 6 seats for Monsoon Heist',
  subtitle = 'Fri, 9:15 PM · Cineplex Kurla · ₹277.14 each',
  deadlineNote = 'Pick your seat by 7:15 PM today',
  domain = 'bms.link',
  onClick,
  className = '',
}: LinkPreviewCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full block text-left rounded-[8px] overflow-hidden active:opacity-80 ${className}`}
      style={{ backgroundColor: 'var(--wa-preview-bg)' }}
      aria-label={`Open link: ${headline}`}
      data-testid="link-preview"
      data-tour="link-preview"
    >
      <PosterArt title={filmTitle} titleSize={24} tagline="GROUP HOLD · BOOKMYSHOW" className="w-full h-[132px]" />
      <span className="block px-2.5 pt-2 pb-2.5">
        <span className="block text-[15px] leading-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {headline}
        </span>
        <span className="block text-[13px] leading-[18px] mt-0.5" style={{ color: 'var(--wa-meta)' }}>
          {subtitle}
        </span>
        <span className="block text-[13px] leading-[18px]" style={{ color: 'var(--wa-meta)' }}>
          {deadlineNote}
        </span>
        <span className="block text-[12px] leading-[16px] mt-1" style={{ color: 'var(--wa-meta)' }}>
          {domain}
        </span>
      </span>
    </button>
  )
}
