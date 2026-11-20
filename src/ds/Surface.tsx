import type { ReactNode, ElementType } from 'react'

/**
 * Surface system (04c) — the ONE way to contain content (refs 11, 18, 19, 22):
 *
 * - Card       white, radius 8, soft --card-shadow measured on ref 22 (04d), 16 pt padding.
 *              Use on grey pages (--bg-page). `band` slot sits flush on the card's bottom edge.
 * - Band       the ref 22 cancellation band: --bg-success, 14/500 title (+ optional action), 13 pt body.
 * - PriceColumns  the ref 05/19 tier-column pattern (12 pt caps label, 20/500 price, 12 pt status).
 * - SoftGroup  soft grey fill (--bg-muted), radius 8, no border. Use inside white sheets
 *              when something needs containment (e.g. a money summary).
 * - Hairline   1 px divider. `bleed` extends through a 16 pt sheet/page gutter (full-width, like 05/19).
 * - PageStack  16 pt side margins, 12 pt gap between cards.
 *
 * Borders are reserved for interactive/selectable elements (seat tiles, pills, chips,
 * outline buttons, steppers). Shadows only for elevation (sheets, iOS banner, toasts).
 */

interface BaseProps {
  children?: ReactNode
  className?: string
  testId?: string
  as?: ElementType
}

export function Card({
  children,
  className = '',
  testId,
  as: Tag = 'section',
  padded = true,
  band,
}: BaseProps & { padded?: boolean; band?: ReactNode }) {
  return (
    <Tag
      className="w-full overflow-hidden flex flex-col"
      style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--card-radius)', boxShadow: 'var(--card-shadow)' }}
      data-testid={testId}
    >
      <div className={`min-w-0 ${padded ? 'p-4' : ''} ${className}`}>{children}</div>
      {band}
    </Tag>
  )
}

/** Ref 22 cancellation band. Inside a Card's `band` slot it sits flush on the bottom edge; standalone it is rounded. */
export function Band({
  title,
  action,
  children,
  standalone = false,
  testId,
}: {
  title: ReactNode
  action?: ReactNode
  children?: ReactNode
  standalone?: boolean
  testId?: string
}) {
  return (
    <div
      className="px-4 py-3 flex flex-col gap-0.5"
      style={{ backgroundColor: 'var(--bg-success)', borderRadius: standalone ? 'var(--card-radius)' : undefined }}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[14px] leading-[20px] font-medium text-balance" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
        {action}
      </div>
      {children && (
        <p className="text-[13px] leading-[18px] text-pretty" style={{ color: 'var(--text-primary)' }}>
          {children}
        </p>
      )}
    </div>
  )
}

/** Ref 05/19 tier columns: equal columns, left-aligned. */
export function PriceColumns({
  columns,
  testId,
}: {
  columns: Array<{ key: string; label: string; price: string; status: string; tone?: 'green' | 'grey' }>
  testId?: string
}) {
  return (
    <div className="w-full grid gap-2" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }} data-testid={testId}>
      {columns.map((c) => (
        <div key={c.key} className="flex flex-col items-start text-left min-w-0" data-testid={`col-${c.key}`}>
          <span className="text-[12px] leading-[15px] uppercase font-normal" style={{ color: 'var(--text-secondary)' }}>
            {c.label}
          </span>
          <span className="text-[20px] leading-[26px] font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
            {c.price}
          </span>
          <span
            className={`text-[12px] leading-[16px] mt-0.5 ${c.tone === 'green' ? 'font-medium tracking-[0.2px]' : 'font-normal'}`}
            style={{ color: c.tone === 'green' ? 'var(--text-success)' : 'var(--text-secondary)' }}
          >
            {c.status}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SoftGroup({ children, className = '', testId, as: Tag = 'div' }: BaseProps) {
  return (
    <Tag
      className={`w-full px-4 py-3.5 ${className}`}
      style={{ backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--card-radius)' }}
      data-testid={testId}
    >
      {children}
    </Tag>
  )
}

export function Hairline({ bleed = false, dashed = false, className = '' }: { bleed?: boolean; dashed?: boolean; className?: string }) {
  return (
    <div
      role="separator"
      className={`${bleed ? '-mx-4' : ''} ${dashed ? 'border-t border-dashed' : 'h-px'} ${className}`}
      style={dashed ? { borderColor: 'var(--bg-tag)' } : { backgroundColor: 'var(--divider)' }}
    />
  )
}

export function PageStack({ children, className = '', testId }: BaseProps) {
  return (
    <div className={`px-4 flex flex-col gap-3 ${className}`} data-testid={testId}>
      {children}
    </div>
  )
}

/** Price row in the Confirm-booking style (ref 22): grey 14 pt label left, value right, optional 12 pt sub-line. */
export function PriceRow({
  label,
  value,
  sub,
  strong = false,
  testId,
}: {
  label: string
  value: string
  sub?: string
  strong?: boolean
  testId?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3" data-testid={testId}>
      <div className="flex flex-col min-w-0">
        <span
          className={strong ? 'text-[16px] leading-[22px] font-medium' : 'text-[14px] leading-[20px]'}
          style={{ color: strong ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {label}
        </span>
        {sub && (
          <span className="text-[12px] leading-[16px] text-pretty" style={{ color: 'var(--text-secondary)' }}>
            {sub}
          </span>
        )}
      </div>
      <span
        className={`shrink-0 ${strong ? 'text-[16px] leading-[22px] font-medium' : 'text-[14px] leading-[20px]'}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}
