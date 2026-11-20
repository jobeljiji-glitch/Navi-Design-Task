import type { ReactNode } from 'react'
import PrimaryCTA from './PrimaryCTA'

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
    <div
      className={`w-full bg-bg-surface border-t border-divider px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTopColor: 'var(--divider)',
      }}
    >
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
    </div>
  )
}
