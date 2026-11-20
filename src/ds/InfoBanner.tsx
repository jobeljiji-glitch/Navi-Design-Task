export interface InfoBannerProps {
  title: string
  body: string
  linkText?: string
  onLinkClick?: () => void
  variant?: 'success' | 'warning' | 'info'
  className?: string
}

export default function InfoBanner({
  title,
  body,
  linkText,
  onLinkClick,
  variant = 'success',
  className = '',
}: InfoBannerProps) {
  const getColors = () => {
    switch (variant) {
      case 'warning':
        return {
          bg: 'var(--bg-warning)',
          titleColor: 'var(--text-warning)',
        }
      case 'info':
        return {
          bg: 'var(--bg-info)',
          titleColor: 'var(--text-link)',
        }
      case 'success':
      default:
        return {
          bg: 'var(--bg-success)',
          titleColor: 'var(--text-success)',
        }
    }
  }

  const { bg, titleColor } = getColors()

  return (
    <div
      className={`w-full rounded-[6px] p-3 flex flex-col gap-1 ${className}`}
      style={{ backgroundColor: bg }}
    >
      <span
        className="text-[13px] leading-[18px] font-semibold"
        style={{ color: titleColor }}
      >
        {title}
      </span>
      <p
        className="text-[12px] leading-[16px] text-text-primary"
        style={{ color: 'var(--text-primary)' }}
      >
        {body}{' '}
        {linkText && (
          <button
            type="button"
            onClick={onLinkClick}
            className="font-medium underline hover:opacity-80"
            style={{ color: 'var(--text-link)' }}
          >
            {linkText}
          </button>
        )}
      </p>
    </div>
  )
}
