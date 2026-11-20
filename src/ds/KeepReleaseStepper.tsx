import { Plus, Minus } from 'lucide-react'

/**
 * KeepReleaseStepper (step 8): two linked counters in SoftGroup fills (inside a white sheet).
 * Keep (n) · Release now (m); changing one changes the other. 44 pt round buttons.
 */
export interface KeepReleaseStepperProps {
  totalSeats: number
  keepCount: number
  onChange: (keepCount: number) => void
  /** Lowest keep allowed (seats that can't be released, e.g. a middle seat) */
  minKeep?: number
  keepCaption?: string
  releaseCaption?: string
  className?: string
}

function Counter({
  label,
  value,
  caption,
  onMinus,
  onPlus,
  minusDisabled,
  plusDisabled,
  what,
}: {
  label: string
  value: number
  caption: string
  onMinus: () => void
  onPlus: () => void
  minusDisabled: boolean
  plusDisabled: boolean
  what: string
}) {
  const btn = 'w-11 h-11 rounded-full border flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform'
  const btnStyle = { borderColor: 'var(--border-grey)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }
  return (
    <div className="flex-1 min-w-0 px-3 py-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--card-radius)' }} data-testid={`counter-${what}`}>
      <span className="text-[14px] leading-[20px] font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onMinus} disabled={minusDisabled} className={btn} style={btnStyle} aria-label={`Fewer seats to ${what}`}>
          <Minus size={18} strokeWidth={1.75} />
        </button>
        <span className="text-[20px] leading-[26px] font-medium" style={{ color: 'var(--text-primary)' }} aria-live="polite">{value}</span>
        <button type="button" onClick={onPlus} disabled={plusDisabled} className={btn} style={btnStyle} aria-label={`More seats to ${what}`}>
          <Plus size={18} strokeWidth={1.75} />
        </button>
      </div>
      <span className="text-[12px] leading-[16px] text-pretty" style={{ color: 'var(--text-secondary)' }}>{caption}</span>
    </div>
  )
}

export default function KeepReleaseStepper({
  totalSeats,
  keepCount,
  onChange,
  minKeep = 0,
  keepCaption = 'Charged from your block at the deadline',
  releaseCaption = 'Back on sale, from the end of the row',
  className = '',
}: KeepReleaseStepperProps) {
  const release = Math.max(0, totalSeats - keepCount)
  const set = (k: number) => onChange(Math.max(minKeep, Math.min(totalSeats, k)))
  return (
    <div className={`w-full flex gap-2 ${className}`} data-testid="keep-release-stepper">
      <Counter
        label="Keep"
        what="keep"
        value={keepCount}
        caption={keepCaption}
        onMinus={() => set(keepCount - 1)}
        onPlus={() => set(keepCount + 1)}
        minusDisabled={keepCount <= minKeep}
        plusDisabled={keepCount >= totalSeats}
      />
      <Counter
        label="Release now"
        what="release"
        value={release}
        caption={releaseCaption}
        onMinus={() => set(keepCount + 1)}
        onPlus={() => set(keepCount - 1)}
        minusDisabled={release <= 0}
        plusDisabled={keepCount <= minKeep}
      />
    </div>
  )
}
