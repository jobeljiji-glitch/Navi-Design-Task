export interface CoachMarkProps {
  stepNumber: number
  totalSteps?: number
  text: string
  title?: string
  position?: 'above' | 'below'
  onNext?: () => void
  onBack?: () => void
  onSkip?: () => void
  className?: string
}

export default function CoachMark({
  stepNumber,
  totalSteps = 17,
  text,
  title,
  position = 'below',
  onNext,
  onBack,
  onSkip,
  className = '',
}: CoachMarkProps) {
  return (
    <div
      className={`relative z-50 w-full max-w-[340px] rounded-[14px] p-4 shadow-xl flex flex-col gap-3 select-none ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--divider)',
      }}
      role="tooltip"
    >
      {/* Arrow pointing up or down */}
      <div
        className={`absolute left-8 w-3 h-3 rotate-45 border-l border-t ${
          position === 'below'
            ? '-top-1.5 border-divider bg-bg-surface'
            : '-bottom-1.5 border-r border-b border-divider bg-bg-surface'
        }`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--divider)',
        }}
      />

      {/* Header with step count and Skip */}
      <div className="flex items-center justify-between">
        <span
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--bms-red)' }}
        >
          {stepNumber} of {totalSteps}
        </span>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-[12px] font-normal text-text-secondary hover:underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            Skip tour
          </button>
        )}
      </div>

      {/* Body text */}
      {title && (
        <h4
          className="text-[15px] font-semibold text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h4>
      )}
      <p
        className="text-[13px] leading-[18px] text-text-primary font-normal"
        style={{ color: 'var(--text-primary)' }}
      >
        {text}
      </p>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-divider">
        {onBack && stepNumber > 0 ? (
          <button
            type="button"
            onClick={onBack}
            className="text-[13px] font-medium px-3 py-1.5 rounded hover:bg-bg-muted"
            style={{ color: 'var(--text-secondary)' }}
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="text-[13px] font-semibold px-4 py-1.5 rounded-[6px] transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--bms-red)',
              color: 'var(--text-on-brand)',
            }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
