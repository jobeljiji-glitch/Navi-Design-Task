import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface PriceBreakdownItem {
  label: string
  amount: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export interface PriceBreakdownProps {
  items?: PriceBreakdownItem[]
  ticketPrice?: string
  convenienceFee?: string
  feeBreakdown?: Array<{ label: string; amount: string }>
  musiciansFee?: string
  musiciansAddText?: string
  onAddMusicians?: () => void
  totalLabel?: string
  totalAmount: string
  className?: string
}

export default function PriceBreakdown({
  items,
  ticketPrice,
  convenienceFee,
  feeBreakdown = [
    { label: 'Base convenience fee', amount: '₹138.00' },
    { label: 'Integrated GST (18%)', amount: '₹24.84' },
  ],
  musiciansFee = '₹0.00',
  musiciansAddText = 'Add ₹6.00',
  onAddMusicians,
  totalLabel = 'Order total',
  totalAmount,
  className = '',
}: PriceBreakdownProps) {
  const [isFeeExpanded, setIsFeeExpanded] = useState(false)

  // If classic items list provided (e.g. from KitPage)
  if (items && items.length > 0) {
    return (
      <div
        className={`w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-3 ${className}`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--card-radius)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <div key={item.label} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[14px] leading-[20px]">
                <span
                  className="font-normal"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {item.label}
                </span>
                <span
                  className="font-normal"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.amount}
                </span>
              </div>
              {(item.subtitle || item.actionLabel) && (
                <div className="flex items-center justify-between text-[11px] leading-[14px]">
                  {item.subtitle && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.subtitle}
                    </span>
                  )}
                  {item.actionLabel && (
                    <button
                      type="button"
                      onClick={item.onAction}
                      className="font-medium hover:underline shrink-0"
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

        <div
          className="w-full border-t border-dashed my-0.5"
          style={{ borderColor: 'var(--divider)' }}
        />

        <div className="flex items-center justify-between">
          <span
            className="text-[16px] leading-[22px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {totalLabel}
          </span>
          <span
            className="text-[16px] leading-[22px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {totalAmount}
          </span>
        </div>
      </div>
    )
  }

  // Modern fidelity matching reference 22
  return (
    <div
      className={`w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-3 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex flex-col gap-2.5">
        {/* Row 1: Ticket(s) price in grey 14 pt, value in black 14 pt */}
        <div className="flex items-center justify-between text-[14px] leading-[20px]">
          <span
            className="font-normal"
            style={{ color: 'var(--text-secondary)' }}
          >
            Ticket(s) price
          </span>
          <span
            className="font-normal"
            style={{ color: 'var(--text-primary)' }}
          >
            {ticketPrice ?? '₹1,500.00'}
          </span>
        </div>

        {/* Row 2: Convenience fees ⌄ in grey 14 pt, value in black 14 pt */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setIsFeeExpanded(prev => !prev)}
            className="flex items-center justify-between text-[14px] leading-[20px] text-left w-full hover:opacity-90"
          >
            <div className="flex items-center gap-1">
              <span
                className="font-normal"
                style={{ color: 'var(--text-secondary)' }}
              >
                Convenience fees
              </span>
              {isFeeExpanded ? (
                <ChevronUp size={15} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <ChevronDown size={15} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              )}
            </div>
            <span
              className="font-normal"
              style={{ color: 'var(--text-primary)' }}
            >
              {convenienceFee ?? '₹162.84'}
            </span>
          </button>

          {/* Expanded Fee Details */}
          {isFeeExpanded && (
            <div className="flex flex-col gap-1 pl-3 pt-1.5 text-[12px] border-l-2 border-divider my-1">
              {feeBreakdown.map(item => (
                <div key={item.label} className="flex items-center justify-between text-text-secondary">
                  <span>{item.label}</span>
                  <span>{item.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 3: Give to Underprivileged Musicians (14 pt black), (₹1 per ticket) VIEW T&C (12 pt grey underlined), ₹0.00 / Add ₹6.00 in red */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span
              className="text-[14px] leading-[19px] font-normal"
              style={{ color: 'var(--text-primary)' }}
            >
              Give to Underprivileged Musicians
            </span>
            <div className="flex items-center gap-1 text-[12px] leading-[16px]">
              <span style={{ color: 'var(--text-secondary)' }}>(₹1 per ticket)</span>
              <button
                type="button"
                className="underline hover:opacity-85 font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                VIEW T&C
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span
              className="text-[14px] leading-[19px] font-normal"
              style={{ color: 'var(--text-primary)' }}
            >
              {musiciansFee}
            </span>
            <button
              type="button"
              onClick={onAddMusicians}
              className="text-[12px] leading-[16px] font-medium hover:opacity-85"
              style={{ color: 'var(--bms-red-text)' }}
            >
              {musiciansAddText}
            </button>
          </div>
        </div>
      </div>

      {/* Dashed divider */}
      <div
        className="w-full border-t border-dashed my-0.5"
        style={{ borderColor: 'var(--divider)' }}
      />

      {/* Order total: 16 pt, weight 500 on both label and amount */}
      <div className="flex items-center justify-between">
        <span
          className="text-[16px] leading-[22px] font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {totalLabel}
        </span>
        <span
          className="text-[16px] leading-[22px] font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {totalAmount}
        </span>
      </div>
    </div>
  )
}
