export interface PriceBreakdownItem {
  label: string
  amount: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export interface PriceBreakdownProps {
  items: PriceBreakdownItem[]
  totalLabel?: string
  totalAmount: string
  className?: string
}

export default function PriceBreakdown({
  items,
  totalLabel = 'Order total',
  totalAmount,
  className = '',
}: PriceBreakdownProps) {
  return (
    <div
      className={`w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-3 border border-divider shadow-sm ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--divider)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      {/* Items list */}
      <div className="flex flex-col gap-2.5">
        {items.map(item => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-[15px] leading-[22px]">
              <span
                className="text-text-primary font-normal"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.label}
              </span>
              <span
                className="text-text-primary font-normal text-right shrink-0"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.amount}
              </span>
            </div>
            {(item.subtitle || item.actionLabel) && (
              <div className="flex items-center justify-between text-[11px] leading-[14px]">
                {item.subtitle && (
                  <span
                    className="text-text-secondary"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.subtitle}
                  </span>
                )}
                {item.actionLabel && (
                  <button
                    type="button"
                    onClick={item.onAction}
                    className="font-medium text-bms-red-text hover:underline shrink-0"
                    style={{ color: 'var(--bms-red-text)' }}
                  >
                    {item.actionLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dashed divider */}
      <div
        className="w-full border-t border-dashed my-1"
        style={{ borderColor: 'var(--divider)' }}
      />

      {/* Total row */}
      <div className="flex items-center justify-between">
        <span
          className="text-[16px] leading-[22px] font-medium text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {totalLabel}
        </span>
        <span
          className="text-[18px] leading-[24px] font-medium text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {totalAmount}
        </span>
      </div>
    </div>
  )
}
