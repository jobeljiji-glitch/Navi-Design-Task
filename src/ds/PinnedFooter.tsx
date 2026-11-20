import type { ReactNode } from 'react'

/**
 * PinnedFooter (09): the one bottom bar for every screen and sheet. The CTA (+ caption) sits outside
 * the scroll area, so it never scrolls away. White, top hairline, 16 pt margins, 10 pt above,
 * `cta-safe` below (home-indicator inset + 9 pt, D-039).
 *
 * `layout="stack"` (default): CTA(s) full width, caption centred under them.
 * `layout="row"`: children side by side (seat-layout total + Pay, Decline / Approve).
 */
export interface PinnedFooterProps {
  children: ReactNode
  caption?: ReactNode
  layout?: 'stack' | 'row'
  divider?: boolean
  className?: string
  testId?: string
}

export default function PinnedFooter({ children, caption, layout = 'stack', divider = true, className = '', testId }: PinnedFooterProps) {
  return (
    <div
      data-pinned-footer
      data-testid={testId}
      className={`w-full shrink-0 px-4 pt-2.5 cta-safe ${divider ? 'border-t' : ''} ${
        layout === 'row' ? 'flex items-center gap-3' : 'flex flex-col items-stretch gap-1'
      } ${className}`}
      style={{ backgroundColor: 'var(--bg-surface)', borderTopColor: 'var(--divider)' }}
    >
      {children}
      {caption && (
        <p className="text-[12px] leading-[16px] text-center text-balance" style={{ color: 'var(--text-secondary)' }}>
          {caption}
        </p>
      )}
    </div>
  )
}
