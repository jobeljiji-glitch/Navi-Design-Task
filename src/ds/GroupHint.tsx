/**
 * GroupHint (step 1a): an info band in the seat-count sheet.
 * Styled like the "Cancellation Available" band in ref 22: tinted fill,
 * 8 pt radius, 500 title line + 400 body line, no icon.
 * Copy (spec): "Booking for a group? You can hold seats and let friends pay their own share."
 */
export interface GroupHintProps {
  title?: string
  text?: string
  onClick?: () => void
  className?: string
}

export default function GroupHint({
  title = 'Booking for a group?',
  text = 'You can hold seats and let friends pay their own share.',
  onClick,
  className = '',
}: GroupHintProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 flex flex-col ${className}`}
      style={{ backgroundColor: 'var(--bg-success)', borderRadius: 'var(--card-radius)' }}
    >
      <span className="text-[14px] leading-[20px] font-medium" style={{ color: 'var(--text-primary)' }}>
        {title}
      </span>
      <span className="text-[14px] leading-[20px] font-normal text-pretty" style={{ color: 'var(--text-primary)' }}>
        {text}
      </span>
    </Tag>
  )
}
