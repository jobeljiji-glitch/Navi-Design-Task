export interface AmountHeaderProps {
  label?: string
  amount: string
  className?: string
}

export default function AmountHeader({
  label = 'Amount Payable',
  amount,
  className = '',
}: AmountHeaderProps) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Yellow header strip */}
      <div
        className="w-full px-4 pt-3 pb-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-amount)' }}
      >
        <span
          className="text-[14px] leading-[20px] font-normal text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </span>
        <span
          className="text-[20px] leading-[26px] font-bold text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {amount}
        </span>
      </div>

      {/* Zigzag / serrated bottom border (repeated SVG triangles) */}
      <div
        className="w-full h-[6px] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-page)' }}
      >
        <svg
          viewBox="0 0 400 6"
          preserveAspectRatio="none"
          className="w-full h-full block"
          fill="var(--bg-amount)"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <pattern
            id="zigzag-pattern"
            width="12"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <polygon points="0,0 6,6 12,0" />
          </pattern>
          <rect width="100%" height="6" fill="url(#zigzag-pattern)" />
        </svg>
      </div>
    </div>
  )
}
