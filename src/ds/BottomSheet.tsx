import type { ReactNode } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'motion/react'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  scrimClose?: boolean
  className?: string
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  scrimClose = true,
  className = '',
}: BottomSheetProps) {
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 overflow-hidden flex flex-col justify-end">
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 cursor-pointer"
            style={{ backgroundColor: 'var(--scrim)' }}
            onClick={scrimClose ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`relative z-10 w-full bg-bg-surface rounded-t-[16px] shadow-2xl flex flex-col max-h-[85%] select-none ${className}`}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderTopLeftRadius: 'var(--sheet-radius)',
              borderTopRightRadius: 'var(--sheet-radius)',
            }}
          >
            {/* Grabber */}
            <div className="pt-2 pb-1 flex justify-center cursor-grab active:cursor-grabbing w-full">
              <div
                className="w-9 h-1 rounded-[2px]"
                style={{ backgroundColor: 'var(--sheet-handle)' }}
              />
            </div>

            {/* Header */}
            {title && (
              <div className="px-4 pt-2 pb-3">
                <h2
                  className="text-[18px] leading-[24px] font-medium text-text-primary"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {title}
                </h2>
              </div>
            )}

            {/* Content body */}
            <div className="px-4 pb-6 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
