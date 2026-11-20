export interface SeatCountPickerProps {
  count: number
  onChange: (count: number) => void
  maxSeats?: number
  className?: string
}

export default function SeatCountPicker({
  count,
  onChange,
  maxSeats = 10,
  className = '',
}: SeatCountPickerProps) {
  const numbers = Array.from({ length: maxSeats }, (_, i) => i + 1)

  return (
    <div className={`w-full flex flex-col items-center gap-6 ${className}`}>
      {/* Scooter Illustration */}
      <div className="w-[120px] h-[72px] flex items-center justify-center">
        <svg
          width="120"
          height="72"
          viewBox="0 0 120 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Ground shadow */}
          <ellipse
            cx="60"
            cy="66"
            rx="45"
            ry="4"
            fill="var(--divider)"
            opacity="0.8"
          />

          {/* Rear wheel */}
          <circle
            cx="34"
            cy="54"
            r="12"
            fill="var(--text-primary)"
          />
          <circle
            cx="34"
            cy="54"
            r="8"
            fill="var(--seat-held-border)"
          />
          <circle
            cx="34"
            cy="54"
            r="4"
            fill="var(--bg-surface)"
          />

          {/* Front wheel */}
          <circle
            cx="86"
            cy="54"
            r="12"
            fill="var(--text-primary)"
          />
          <circle
            cx="86"
            cy="54"
            r="8"
            fill="var(--seat-held-border)"
          />
          <circle
            cx="86"
            cy="54"
            r="4"
            fill="var(--bg-surface)"
          />

          {/* Scooter Body */}
          <path
            d="M32 36C32 30 38 26 48 26H70L62 48H36C33.8 48 32 46.2 32 44V36Z"
            fill="var(--bms-red)"
          />

          {/* Footboard / engine base */}
          <path
            d="M48 48H76C78 48 80 46 80 44L78 36H66"
            stroke="var(--text-secondary)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Seat */}
          <path
            d="M30 25C30 23 33 21 38 21H56C58 21 60 23 58 25L54 27H32L30 25Z"
            fill="var(--text-primary)"
          />

          {/* Handlebar & stem */}
          <path
            d="M80 48L72 16"
            stroke="var(--text-secondary)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M68 16H78"
            stroke="var(--text-primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Headlight */}
          <circle
            cx="76"
            cy="18"
            r="4"
            fill="var(--bg-amount)"
            stroke="var(--seat-held-border)"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Number picker row */}
      <div className="w-full flex items-center justify-between px-2">
        {numbers.map(n => {
          const isSelected = n === count
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isSelected
                  ? 'scale-105 font-semibold text-[16px]'
                  : 'font-normal text-[14px] hover:bg-bg-muted'
              }`}
              style={{
                backgroundColor: isSelected ? 'var(--bms-red)' : 'transparent',
                color: isSelected
                  ? 'var(--text-on-brand)'
                  : 'var(--text-primary)',
              }}
              aria-label={`${n} seats`}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
