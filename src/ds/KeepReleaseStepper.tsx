import { Plus, Minus } from 'lucide-react'

export interface KeepReleaseStepperProps {
  totalSeats: number
  keepCount: number
  onChange: (keepCount: number) => void
  pricePerSeat?: string
  className?: string
}

export default function KeepReleaseStepper({
  totalSeats,
  keepCount,
  onChange,
  pricePerSeat = '₹277.14',
  className = '',
}: KeepReleaseStepperProps) {
  const releaseCount = Math.max(0, totalSeats - keepCount)

  const handleDecrementKeep = () => {
    if (keepCount > 0) onChange(keepCount - 1)
  }

  const handleIncrementKeep = () => {
    if (keepCount < totalSeats) onChange(keepCount + 1)
  }

  return (
    <div
      className={`w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-4 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--divider)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      <div className="flex flex-col gap-1">
        <h3
          className="text-[16px] leading-[22px] font-medium text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          Keep or Release Unpaid Seats
        </h3>
        <span
          className="text-[12px] leading-[16px] text-text-secondary"
          style={{ color: 'var(--text-secondary)' }}
        >
          {totalSeats} {totalSeats === 1 ? 'seat is' : 'seats are'} still unpaid ({pricePerSeat} each)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Keep counter */}
        <div
          className="p-3 rounded-[6px] flex flex-col gap-2 border"
          style={{
            backgroundColor: 'var(--bg-page)',
            borderColor: 'var(--divider)',
          }}
        >
          <span
            className="text-[13px] font-medium text-text-primary"
            style={{ color: 'var(--text-primary)' }}
          >
            Keep
          </span>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleDecrementKeep}
              disabled={keepCount <= 0}
              className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-30 active:scale-95"
              style={{
                borderColor: 'var(--divider)',
                backgroundColor: 'var(--bg-surface)',
              }}
              aria-label="Decrease kept seats"
            >
              <Minus size={14} strokeWidth={2} />
            </button>
            <span
              className="text-[18px] font-medium text-text-primary"
              style={{ color: 'var(--text-primary)' }}
            >
              {keepCount}
            </span>
            <button
              type="button"
              onClick={handleIncrementKeep}
              disabled={keepCount >= totalSeats}
              className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-30 active:scale-95"
              style={{
                borderColor: 'var(--divider)',
                backgroundColor: 'var(--bg-surface)',
              }}
              aria-label="Increase kept seats"
            >
              <Plus size={14} strokeWidth={2} />
            </button>
          </div>
          <span
            className="text-[11px] leading-[14px] text-text-secondary mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Charged from block at deadline
          </span>
        </div>

        {/* Release counter (derived) */}
        <div
          className="p-3 rounded-[6px] flex flex-col gap-2 border"
          style={{
            backgroundColor: 'var(--bg-page)',
            borderColor: 'var(--divider)',
          }}
        >
          <span
            className="text-[13px] font-medium text-text-primary"
            style={{ color: 'var(--text-primary)' }}
          >
            Release now
          </span>
          <div className="flex items-center justify-center h-8">
            <span
              className="text-[18px] font-medium text-text-primary"
              style={{ color: 'var(--text-primary)' }}
            >
              {releaseCount}
            </span>
          </div>
          <span
            className="text-[11px] leading-[14px] text-text-secondary mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Back on sale, from end of row
          </span>
        </div>
      </div>
    </div>
  )
}
