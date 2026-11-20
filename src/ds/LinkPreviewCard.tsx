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
  subtitle = 'Fri 9:15 PM · Cineplex Kurla · ₹277.14 each',
  deadlineNote = 'Pick your seat by 7:15 PM today',
  domain = 'bms.link/g/k7Qx2',
  onClick,
  className = '',
}: LinkPreviewCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[12px] overflow-hidden border transition-transform active:scale-[0.98] cursor-pointer ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--divider)',
      }}
    >
      {/* Artwork banner */}
      <div
        className="w-full h-24 relative p-3 flex flex-col justify-end overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--trending-blue), var(--bms-red-strong))',
        }}
      >
        <span className="text-[10px] font-medium uppercase tracking-wider text-white opacity-80">
          BookMyShow · Group Hold
        </span>
        <h4 className="text-[16px] font-medium text-white leading-tight truncate">
          {filmTitle}
        </h4>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1">
        <span
          className="text-[14px] leading-[18px] font-medium text-text-primary line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {headline}
        </span>
        <span
          className="text-[12px] leading-[16px] text-text-secondary"
          style={{ color: 'var(--text-secondary)' }}
        >
          {subtitle}
        </span>
        <div className="flex items-center justify-between pt-1 mt-1 border-t border-divider">
          <span
            className="text-[11px] font-medium text-text-warning"
            style={{ color: 'var(--text-warning)' }}
          >
            {deadlineNote}
          </span>
          <span
            className="text-[11px] text-text-secondary"
            style={{ color: 'var(--text-secondary)' }}
          >
            {domain}
          </span>
        </div>
      </div>
    </div>
  )
}
