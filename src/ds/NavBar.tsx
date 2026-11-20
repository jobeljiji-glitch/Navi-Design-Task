import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

export interface NavBarProps {
  title: string
  subtitle?: string
  onBack?: () => void
  actions?: ReactNode
  className?: string
}

export default function NavBar({
  title,
  subtitle,
  onBack,
  actions,
  className = '',
}: NavBarProps) {
  return (
    <header
      className={`relative flex items-center justify-between px-4 h-[54px] bg-bg-surface border-b border-divider shrink-0 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottomColor: 'var(--divider)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-11 h-11 -ml-2 text-text-primary rounded-full hover:bg-bg-muted active:opacity-70 transition-opacity"
            aria-label="Back"
            style={{ color: 'var(--text-primary)' }}
          >
            <ChevronLeft size={24} strokeWidth={1.75} />
          </button>
        )}
        <div className="flex flex-col min-w-0 text-left">
          <h1
            className="text-[17px] leading-[22px] font-normal truncate text-text-primary"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <span
              className="text-[13px] leading-[18px] font-normal truncate text-text-secondary"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0">{actions}</div>
      )}
    </header>
  )
}
