export interface DateItem {
  day: string
  date: number
  month: string
  available?: boolean
}

export interface DateStripProps {
  dates: DateItem[]
  selectedIndex?: number
  onSelectDate: (index: number) => void
  className?: string
}

export default function DateStrip({
  dates,
  selectedIndex = 0,
  onSelectDate,
  className = '',
}: DateStripProps) {
  return (
    <div
      className={`w-full flex items-stretch gap-0 overflow-x-auto no-scrollbar bg-bg-surface ${className}`}
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {dates.map((item, idx) => {
        const isSelected = idx === selectedIndex
        const isAvailable = item.available !== false && item.date <= 22

        return (
          <button
            key={`${item.day}-${item.date}-${item.month}`}
            type="button"
            onClick={() => onSelectDate(idx)}
            className={`w-[65px] h-[76px] flex flex-col items-center justify-center shrink-0 transition-opacity active:opacity-85 ${
              isSelected ? 'font-medium' : ''
            }`}
            style={{
              backgroundColor: isSelected
                ? 'var(--bms-red)'
                : 'var(--bg-surface)',
              color: isSelected
                ? 'var(--text-on-brand)'
                : isAvailable
                  ? 'var(--text-primary)'
                  : 'var(--text-disabled, #A3A3A3)',
            }}
            aria-label={`${item.day} ${item.date} ${item.month}`}
          >
            <span
              className="text-[12px] uppercase leading-none font-normal"
              style={{
                color: isSelected
                  ? 'var(--text-on-brand)'
                  : isAvailable
                    ? 'var(--text-secondary)'
                    : 'var(--text-disabled, #A3A3A3)',
              }}
            >
              {item.day}
            </span>
            <span
              className="text-[20px] leading-tight font-medium my-1"
              style={{
                color: isSelected
                  ? 'var(--text-on-brand)'
                  : isAvailable
                    ? 'var(--text-primary)'
                    : 'var(--text-disabled, #A3A3A3)',
              }}
            >
              {item.date}
            </span>
            <span
              className="text-[12px] uppercase leading-none font-normal"
              style={{
                color: isSelected
                  ? 'var(--text-on-brand)'
                  : isAvailable
                    ? 'var(--text-secondary)'
                    : 'var(--text-disabled, #A3A3A3)',
              }}
            >
              {item.month}
            </span>
          </button>
        )
      })}
    </div>
  )
}
