import PrimaryCTA from './PrimaryCTA'

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
      className={`w-full bg-bg-surface border-t border-divider px-4 py-2.5 flex items-center gap-3 shrink-0 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTopColor: 'var(--divider)',
      }}
    >
      <div className="flex-1 min-w-0">
        <PrimaryCTA
          variant="outline"
          onClick={onLeftClick}
          subLabel={leftSub}
          disabled={disabled}
        >
          {leftText}
        </PrimaryCTA>
      </div>

      <div className="flex-1 min-w-0">
        <PrimaryCTA
          variant="default"
          onClick={onRightClick}
          subLabel={rightSub}
          disabled={disabled}
        >
          {rightText}
        </PrimaryCTA>
      </div>
    </div>
  )
}
