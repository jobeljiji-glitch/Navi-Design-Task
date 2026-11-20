import PrimaryCTA from './PrimaryCTA'
import PinnedFooter from './PinnedFooter'

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
    <PinnedFooter layout="row" className={className}>
      <div className="flex-1 min-w-0" data-testid="hold-for-group">
        <PrimaryCTA variant="outline" size="xl" onClick={onLeftClick} subLabel={leftSub} disabled={disabled}>
          {leftText}
        </PrimaryCTA>
      </div>
      <div className="flex-1 min-w-0">
        <PrimaryCTA variant="strong" size="xl" onClick={onRightClick} subLabel={rightSub} disabled={disabled}>
          {rightText}
        </PrimaryCTA>
      </div>
    </PinnedFooter>
  )
}
