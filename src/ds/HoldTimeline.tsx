import { Info } from 'lucide-react'

/**
 * HoldTimeline (04b): one horizontal line of dots replacing the deadline / free-release /
 * keep-by-default sentences. Done stops are seat-map green, upcoming stops hollow grey.
 */
export interface HoldTimelineStop {
  key: string
  label: string
  detail: string
  done?: boolean
  link?: { label: string; onClick: () => void }
  onInfo?: () => void
}

export interface HoldTimelineProps {
  stops: HoldTimelineStop[]
  className?: string
}

export default function HoldTimeline({ stops, className = '' }: HoldTimelineProps) {
  const n = stops.length
  const inset = `${100 / (2 * n)}%`
  return (
    <div className={`relative ${className}`} data-testid="hold-timeline">
      {/* Connecting line from the first dot to the last */}
      <div className="absolute top-[5px] h-px" style={{ left: inset, right: inset, backgroundColor: 'var(--border-grey)' }} aria-hidden />
      <ol className="relative flex">
        {stops.map((s) => (
          <li key={s.key} className="flex-1 min-w-0 flex flex-col items-center text-center px-0.5" data-stop={s.key}>
            <span
              className="w-[11px] h-[11px] rounded-full"
              style={
                s.done
                  ? { backgroundColor: 'var(--showtime-green)' }
                  : { backgroundColor: 'var(--bg-surface)', border: '2px solid var(--border-grey)' }
              }
              aria-hidden
            />
            <span className="mt-2 text-[12px] leading-[16px] text-balance" style={{ color: 'var(--text-secondary)' }}>
              {s.label}
            </span>
            {s.onInfo ? (
              <button
                type="button"
                onClick={s.onInfo}
                className="flex items-center gap-1 text-[13px] leading-[18px] font-medium py-1 -my-1"
                style={{ color: 'var(--text-primary)' }}
                aria-label={`${s.label} ${s.detail}: what happens`}
              >
                {s.detail}
                <Info size={13} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              </button>
            ) : (
              <span className="text-[13px] leading-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>
                {s.detail}
              </span>
            )}
            {s.link && (
              <button
                type="button"
                onClick={s.link.onClick}
                className="text-[12px] leading-[16px] font-medium py-1.5 -mb-1.5"
                style={{ color: 'var(--bms-red-text)' }}
              >
                {s.link.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
