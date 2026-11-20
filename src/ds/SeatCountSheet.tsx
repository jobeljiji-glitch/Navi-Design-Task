import { motion, AnimatePresence, type PanInfo } from 'motion/react'
import SeatCountPicker from './SeatCountPicker'
import PriceTierList, { type PriceTier } from './PriceTierList'
import PrimaryCTA from './PrimaryCTA'
import GroupHint from './GroupHint'

export interface SeatCountSheetProps {
  isOpen: boolean
  onClose: () => void
  count: number
  onChangeCount: (count: number) => void
  onSelectSeats?: () => void
  tiers?: PriceTier[]
  className?: string
}

const DEFAULT_TIERS: PriceTier[] = [
  { name: 'RECLINER ROWS', price: 500, status: 'AVAILABLE' },
  { name: 'PRIME PLUS ROWS', price: 250, status: 'AVAILABLE' },
  { name: 'PRIME ROWS', price: 230, status: 'AVAILABLE' },
  { name: 'CLASSIC ROWS', price: 210, status: 'AVAILABLE' },
]

export default function SeatCountSheet({
  isOpen,
  onClose,
  count,
  onChangeCount,
  onSelectSeats,
  tiers = DEFAULT_TIERS,
  className = '',
}: SeatCountSheetProps) {
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`absolute inset-0 z-50 overflow-hidden flex flex-col justify-end ${className}`}>
          {/* Dimmed scrim over backdrop */}
          <motion.div
            data-testid="seat-count-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 cursor-pointer"
            style={{ backgroundColor: 'var(--scrim)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Full-width bottom sheet flush to screen edges */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 32,
              stiffness: 320,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative z-10 w-full bg-bg-surface rounded-t-[16px] shadow-2xl flex flex-col select-none overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
            }}
          >
            {/* Grabber handle */}
            <div className="pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing w-full">
              <div
                className="w-10 h-1 rounded-[2px]"
                style={{ backgroundColor: 'var(--sheet-handle)' }}
              />
            </div>

            {/* Title: "How many seats?" 22 pt, weight 400, left aligned, 16 pt margin */}
            <div className="px-4 pt-2 pb-1 text-left">
              <h2
                className="text-[22px] leading-[28px] font-normal text-text-primary"
                style={{ color: 'var(--text-primary)' }}
              >
                How many seats?
              </h2>
            </div>

            {/* Vehicle & Number Picker */}
            <div className="px-3 pt-2">
              <SeatCountPicker
                count={count}
                onChange={onChangeCount}
              />
            </div>

            {/* Divider: hairline full-width line under number row */}
            <div
              className="w-full h-[1px] my-3"
              style={{ backgroundColor: 'var(--divider)' }}
            />

            {/* Tiers: up to 4 equal columns, left-aligned, no truncation */}
            <div className="px-4">
              <PriceTierList tiers={tiers} />
            </div>

            {/* Step 1a: group hint above the CTA when 3 or more seats */}
            {count >= 3 && (
              <div className="px-4 pt-3" data-testid="group-hint">
                <GroupHint />
              </div>
            )}

            {/* CTA Button pinned at the bottom with 16 pt side margins and home-indicator safe area */}
            <div
              className="px-4 pt-2 pb-4"
              style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}
            >
              <PrimaryCTA
                onClick={() => {
                  onSelectSeats?.()
                  onClose()
                }}
              >
                Select seats
              </PrimaryCTA>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
