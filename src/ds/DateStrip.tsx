export interface DateItem {
  day: string
  date: number
  month: string
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
      className={`w-full flex items-center gap-2 overflow-x-auto py-2 px-4 no-scrollbar ${className}`}
    >
      {dates.map((item, idx) => {
        const isSelected = idx === selectedIndex
        return (
          <button
            key={`${item.day}-${item.date}-${item.month}`}
            type="button"
            onClick={() => onSelectDate(idx)}
            className={`w-[65px] h-[78px] rounded-[4px] flex flex-col items-center justify-center shrink-0 transition-transform active:scale-95 border ${
              isSelected ? 'font-medium' : 'bg-bg-surface'
            }`}
            style={{
              backgroundColor: isSelected
                ? 'var(--bms-red)'
                : 'var(--bg-surface)',
              borderColor: isSelected ? 'var(--bms-red)' : 'var(--divider)',
              color: isSelected
                ? 'var(--text-on-brand)'
                : 'var(--text-secondary)',
            }}
            aria-label={`${item.day} ${item.date} ${item.month}`}
          >
            <span className="text-[12px] uppercase leading-none font-normal">
              {item.day}
            </span>
            <span
              className="text-[20px] leading-tight font-bold my-1"
              style={{
                color: isSelected
                  ? 'var(--text-on-brand)'
                  : 'var(--text-primary)',
              }}
            >
              {item.date}
            </span>
            <span className="text-[12px] uppercase leading-none font-normal">
              {item.month}
            </span>
          </button>
        )
      })}
    </div>
  )
}
