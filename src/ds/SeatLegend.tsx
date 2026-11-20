export interface SeatLegendItem {
  label: string
  state: 'available' | 'selected' | 'sold' | 'held' | 'paying'
}

export interface SeatLegendProps {
  items?: SeatLegendItem[]
  className?: string
}

const DEFAULT_ITEMS: SeatLegendItem[] = [
  { label: 'Available', state: 'available' },
  { label: 'Selected', state: 'selected' },
  { label: 'Sold', state: 'sold' },
]

export default function SeatLegend({
  items = DEFAULT_ITEMS,
  className = '',
}: SeatLegendProps) {
  const getBadgeStyle = (state: SeatLegendItem['state']) => {
    switch (state) {
      case 'available':
        return {
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--seat-available-border)',
        }
      case 'selected':
        return {
          backgroundColor: 'var(--seat-selected)',
          border: '1px solid var(--seat-selected)',
        }
      case 'sold':
        return {
          backgroundColor: 'var(--seat-sold)',
          border: '1px solid var(--seat-sold)',
        }
      case 'held':
        return {
          backgroundColor: 'var(--seat-held-fill)',
          border: '1px dashed var(--seat-held-border)',
        }
      case 'paying':
        return {
          backgroundColor: 'var(--seat-paying-fill)',
          border: '1px solid var(--seat-held-border)',
        }
    }
  }

  return (
    <div
      className={`flex items-center justify-center gap-4 py-3 flex-wrap ${className}`}
    >
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="w-[14px] h-[14px] rounded-[2px]"
            style={getBadgeStyle(item.state)}
          />
          <span
            className="text-[12px] leading-[16px] font-normal text-text-secondary"
            style={{ color: 'var(--text-secondary)' }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
