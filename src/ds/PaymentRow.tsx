import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

export interface PaymentRowProps {
  icon: ReactNode
  title: string
  subtitle?: string
  lastUsed?: boolean
  onClick?: () => void
  className?: string
}

export default function PaymentRow({
  icon,
  title,
  subtitle,
  lastUsed = false,
  onClick,
  className = '',
}: PaymentRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 bg-bg-surface border-b border-divider hover:bg-bg-muted active:opacity-80 transition-colors text-left ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottomColor: 'var(--divider)',
      }}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[14px] leading-[20px] font-medium text-text-primary truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </span>
            {lastUsed && (
              <span
                className="text-[10px] leading-none font-semibold px-1.5 py-0.5 rounded-[2px] bg-bg-info text-text-link shrink-0"
                style={{
                  backgroundColor: 'var(--bg-info)',
                  color: 'var(--text-link)',
                }}
              >
                Last Used
              </span>
            )}
          </div>
          {subtitle && (
            <span
              className="text-[12px] leading-[16px] text-text-secondary truncate mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        size={18}
        strokeWidth={1.75}
        className="text-text-secondary shrink-0 ml-2"
        style={{ color: 'var(--text-secondary)' }}
      />
    </button>
  )
}
