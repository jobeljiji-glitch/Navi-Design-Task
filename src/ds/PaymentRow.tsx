import type { ReactNode } from 'react'
import PaymentMethodRow from './PaymentMethodRow'

/**
 * Ref-12 Payment screen row: a full-width, flush PaymentMethodRow (09: one payment-row component).
 * The icon keeps its own artwork (no tile fill) as in the reference.
 */
export interface PaymentRowProps {
  icon: ReactNode
  title: string
  subtitle?: string
  lastUsed?: boolean
  onClick?: () => void
  className?: string
}

export default function PaymentRow({ icon, title, subtitle, lastUsed = false, onClick, className = '' }: PaymentRowProps) {
  return (
    <div className={`w-full px-4 ${className}`} style={{ backgroundColor: 'var(--bg-surface)' }}>
      <PaymentMethodRow
        icon={<span className="w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0">{icon}</span>}
        title={title}
        subtitle={subtitle}
        badge={lastUsed ? 'Last Used' : undefined}
        onClick={onClick}
        trailing="chevron"
        divider
      />
    </div>
  )
}
