export type BookingStatus =
  | 'FAILED'
  | 'FINISHED'
  | 'GROUP HOLD'
  | 'CONFIRMED'

export interface StatusBadgeProps {
  status: BookingStatus
  className?: string
}

export default function StatusBadge({
  status,
  className = '',
}: StatusBadgeProps) {
  const getBadgeBg = () => {
    switch (status) {
      case 'FAILED':
        return 'var(--badge-failed)'
      case 'FINISHED':
        return 'var(--badge-finished)'
      case 'GROUP HOLD':
        return 'var(--badge-hold)'
      case 'CONFIRMED':
        return 'var(--badge-confirmed)'
      default:
        return 'var(--badge-finished)'
    }
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-[4px] text-[13px] leading-none font-medium tracking-wide uppercase select-none ${className}`}
      style={{
        backgroundColor: getBadgeBg(),
        color: 'var(--badge-text)',
      }}
    >
      {status}
    </span>
  )
}
