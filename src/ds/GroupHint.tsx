import { Users } from 'lucide-react'

export interface GroupHintProps {
  text?: string
  onClick?: () => void
  className?: string
}

export default function GroupHint({
  text = 'Booking for a group? You can hold seats and let friends pay their own share.',
  onClick,
  className = '',
}: GroupHintProps) {
  return (
    <div
      onClick={onClick}
      className={`w-full rounded-[8px] p-3 flex items-start gap-2.5 transition-opacity ${
        onClick ? 'cursor-pointer hover:opacity-90' : ''
      } ${className}`}
      style={{
        backgroundColor: 'var(--bg-info)',
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ color: 'var(--text-link)' }}
      >
        <Users size={16} strokeWidth={2} />
      </div>

      <p
        className="text-[12px] leading-[17px] font-normal text-text-primary"
        style={{ color: 'var(--text-primary)' }}
      >
        {text}
      </p>
    </div>
  )
}
