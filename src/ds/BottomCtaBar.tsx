import type { ReactNode } from 'react'
import PrimaryCTA from './PrimaryCTA'
import PinnedFooter from './PinnedFooter'

export interface BottomCtaBarProps {
  totalLabel?: string
  totalAmount?: string
  ctaText: string
  onCtaClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'strong'
  subLabel?: string
  children?: ReactNode
  className?: string
}

export default function BottomCtaBar({
  totalLabel,
  totalAmount,
  ctaText,
  onCtaClick,
  disabled = false,
  variant = 'default',
  subLabel,
  children,
  className = '',
}: BottomCtaBarProps) {
  return (
    <PinnedFooter layout="row" className={`justify-between gap-4 ${className}`}>
      {children ? (
        children
      ) : (
        <>
          {totalAmount && (
            <div className="flex flex-col min-w-0">
              {totalLabel && (
                <span
                  className="text-[12px] leading-[16px] font-normal text-text-secondary truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {totalLabel}
                </span>
              )}
              <span
                className="text-[18px] leading-[24px] font-medium text-text-primary truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {totalAmount}
              </span>
            </div>
          )}

          <div className={totalAmount ? 'flex-1 max-w-[220px]' : 'w-full'}>
            <PrimaryCTA
              onClick={onCtaClick}
              disabled={disabled}
              variant={variant}
              subLabel={subLabel}
            >
              {ctaText}
            </PrimaryCTA>
          </div>
        </>
      )}
    </PinnedFooter>
  )
}
