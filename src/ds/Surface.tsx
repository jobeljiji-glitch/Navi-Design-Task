import type { ReactNode, ElementType } from 'react'

/**
 * Surface system (04c) — the ONE way to contain content (refs 11, 18, 19, 22):
 *
 * - Card       white, radius 8, NO border, NO shadow. Use on grey pages (--bg-page).
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

export function Card({ children, className = '', testId, as: Tag = 'section', padded = true }: BaseProps & { padded?: boolean }) {
  return (
    <Tag
      className={`w-full overflow-hidden ${padded ? 'p-4' : ''} ${className}`}
      style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--card-radius)' }}
      data-testid={testId}
    >
      {children}
    </Tag>
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
