import PrimaryCTA from './PrimaryCTA'

/**
 * DualCtaBar (step 1b): "Hold for group" (outline) + "Pay ₹X" (filled).
 * Same bar anatomy as the existing seat-layout pay bar: white, top hairline,
 * 16 pt margins, 48 pt buttons, safe-area bottom padding.
 */
export interface DualCtaBarProps {
  leftText: string
  leftSub?: string
  onLeftClick: () => void
  rightText: string
  rightSub?: string
  onRightClick: () => void
  disabled?: boolean
  className?: string
}

export default function DualCtaBar({
  leftText,
  leftSub,
  onLeftClick,
  rightText,
  rightSub,
  onRightClick,
  disabled = false,
  className = '',
}: DualCtaBarProps) {
  return (
    <div
      className={`w-full border-t px-4 pt-2.5 flex items-center gap-3 shrink-0 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTopColor: 'var(--divider)',
        paddingBottom: 'calc(var(--sab, 0px) + 9px)',
      }}
    >
      <div className="flex-1 min-w-0" data-testid="hold-for-group">
        <PrimaryCTA variant="outline" size="lg" onClick={onLeftClick} subLabel={leftSub} disabled={disabled}>
          {leftText}
        </PrimaryCTA>
      </div>
      <div className="flex-1 min-w-0">
        <PrimaryCTA variant="strong" size="lg" onClick={onRightClick} subLabel={rightSub} disabled={disabled}>
          {rightText}
        </PrimaryCTA>
      </div>
    </div>
  )
}
