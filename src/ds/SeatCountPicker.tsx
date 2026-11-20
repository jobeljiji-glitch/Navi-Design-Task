import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export interface SeatCountPickerProps {
  count: number
  onChange: (count: number) => void
  maxSeats?: number
  className?: string
}

export function preloadVehicleIllustrations(baseUrl: string = import.meta.env.BASE_URL || '/') {
  for (let i = 1; i <= 10; i++) {
    const img = new Image()
    img.src = `${baseUrl}illustrations/seat-count/${i}.webp`
  }
}

export default function SeatCountPicker({
  count,
  onChange,
  maxSeats = 10,
  className = '',
}: SeatCountPickerProps) {
  const numbers = Array.from({ length: maxSeats }, (_, i) => i + 1)
  const baseUrl = import.meta.env.BASE_URL || '/'

  // Ensure preloaded
  useEffect(() => {
    preloadVehicleIllustrations(baseUrl)
  }, [baseUrl])

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      {/* Vehicle Illustration Area (centered, ~130 pt tall, object-fit: contain) */}
      <div className="w-full h-[130px] flex items-center justify-center overflow-hidden relative">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={count}
            src={`${baseUrl}illustrations/seat-count/${count}.webp`}
            alt={`${count} seat vehicle illustration`}
            decoding="async"
            width={280}
            height={120}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="h-[120px] max-w-[280px] object-contain"
          />
        </AnimatePresence>
      </div>

      {/* Number picker row: 1–10 spread evenly across full width */}
      <div className="w-full flex items-center justify-between px-2 pt-3 pb-1">
        {numbers.map(n => {
          const isSelected = n === count
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 font-normal text-[17px]"
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
