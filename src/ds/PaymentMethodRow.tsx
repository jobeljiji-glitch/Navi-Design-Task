import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

/**
 * PaymentMethodRow / PaymentMethodList (09): one payment-method row for every "Pay with" list —
 * Rohan's hold settings, the friend's UPI app choice, the card fallback — and the ref-12 Payment screen.
 * 56 pt row · 32 pt icon tile · 15/400 title + 13 pt grey sub-line · trailing radio or chevron.
 */
export interface PaymentMethodRowProps {
  icon: ReactNode
  title: string
  subtitle?: string
  /** "radio" for a choice inside a sheet, "chevron" for rows that open the next step */
  trailing?: 'radio' | 'chevron' | 'none'
  selected?: boolean
  badge?: string
  onClick?: () => void
  disabled?: boolean
  testId?: string
  /** Ref 12 lists are flush, full-width with a hairline under each row */
  divider?: boolean
}

export function PaymentIconTile({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <span
      className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 text-[12px] leading-none font-medium"
      style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      {children}
    </span>
  )
}

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
      style={{ borderColor: on ? 'var(--bms-red)' : 'var(--border-grey)' }}
      aria-hidden
    >
      {on && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--bms-red)' }} />}
    </span>
  )
}

export default function PaymentMethodRow({
  icon,
  title,
  subtitle,
  trailing = 'chevron',
  selected = false,
  badge,
  onClick,
  disabled = false,
  testId,
  divider = false,
}: PaymentMethodRowProps) {
  const isRadio = trailing === 'radio'
  return (
    <button
      type="button"
      role={isRadio ? 'radio' : undefined}
      aria-checked={isRadio ? selected : undefined}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`w-full min-h-[56px] py-2 flex items-center gap-3 text-left active:opacity-70 disabled:opacity-40 ${divider ? 'border-b' : ''}`}
      style={{ borderBottomColor: 'var(--divider)' }}
    >
      {typeof icon === 'string' ? <PaymentIconTile>{icon}</PaymentIconTile> : icon}
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-[15px] leading-[20px] truncate" style={{ color: 'var(--text-primary)' }}>{title}</span>
          {badge && (
            <span className="text-[10px] leading-none font-medium px-1.5 py-0.5 rounded-[2px] shrink-0" style={{ backgroundColor: 'var(--bg-info)', color: 'var(--text-link)' }}>
              {badge}
            </span>
          )}
        </span>
        {subtitle && (
          <span className="text-[13px] leading-[17px] text-pretty" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </span>
        )}
      </span>
      {isRadio ? <Radio on={selected} /> : trailing === 'chevron' ? <ChevronRight size={18} strokeWidth={1.75} className="shrink-0" style={{ color: 'var(--text-secondary)' }} /> : null}
    </button>
  )
}

export interface PaymentMethodListProps {
  label?: string
  children: ReactNode
  /** radio group semantics when the rows are radios */
  radio?: boolean
  className?: string
}

/** Section label (12 pt uppercase grey, as in ref 12) + rows. */
export function PaymentMethodList({ label, children, radio = false, className = '' }: PaymentMethodListProps) {
  return (
    <section className={`flex flex-col ${className}`} aria-label={label}>
      {label && (
        <h3 className="text-[12px] leading-[16px] uppercase tracking-[0.5px] pt-3 pb-1" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </h3>
      )}
      <div role={radio ? 'radiogroup' : undefined} aria-label={radio ? label : undefined} className="flex flex-col">
        {children}
      </div>
    </section>
  )
}
