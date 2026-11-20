import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'motion/react'

/**
 * BottomSheet (ref 05 / 19 anatomy).
 * - Max 88% tall, pinned to the bottom, flex column.
 * - Header (grabber + title/subtitle or custom header) and footer are fixed;
 *   ONLY the middle scrolls (overscroll contained), so nothing slides under the header.
 * - Closes on scrim tap, or when the grabber/header is dragged down past 30% of the
 *   sheet height (or flicked). Otherwise springs back. Scrolling the body never drags.
 */
export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children?: ReactNode
  /** Fixed footer outside the scroll area (CTA + caption). Bottom inset via --sab. */
  footer?: ReactNode
  /** Custom header node replacing title/subtitle (still part of the drag handle) */
  header?: ReactNode
  scrimClose?: boolean
  /** Hide the grabber and disable drag (e.g. loaders) */
  locked?: boolean
  bodyClassName?: string
  /** Hairline above the footer (off for ref 05 seat-count sheet) */
  footerDivider?: boolean
  className?: string
  testId?: string
}

const SPRING = { type: 'spring' as const, damping: 30, stiffness: 300 }

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  header,
  scrimClose = true,
  locked = false,
  bodyClassName = '',
  footerDivider = true,
  className = '',
  testId,
}: BottomSheetProps) {
  const controls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)

  const startDrag = (e: ReactPointerEvent) => {
    if (!locked) controls.start(e)
  }

  // 08: a11y. Focus moves into the open sheet, Tab cycles inside it, Escape closes, focus returns on close.
  // Only the visible copy takes focus (DeviceFrame renders its children twice).
  useEffect(() => {
    if (!isOpen) return
    const before = document.activeElement as HTMLElement | null
    const t = setTimeout(() => {
      const el = sheetRef.current
      if (el && el.offsetParent !== null && !el.contains(document.activeElement)) el.focus({ preventScroll: true })
    }, 0)
    return () => {
      clearTimeout(t)
      if (before && before.isConnected && before.offsetParent !== null) before.focus({ preventScroll: true })
    }
  }, [isOpen])

  const trapKeys = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape' && !locked) {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !sheetRef.current) return
    const items = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ).filter((x) => x.offsetParent !== null)
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === sheetRef.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const h = sheetRef.current?.offsetHeight ?? 600
    if (info.offset.y > h * 0.3 || info.velocity.y > 800) onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 overflow-hidden flex flex-col justify-end" style={{ overscrollBehavior: 'contain' }}>
          {/* Scrim: taps close; touch-action none so the page behind never scrolls */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 cursor-pointer"
            style={{ backgroundColor: 'var(--scrim)', touchAction: 'none' }}
            onClick={scrimClose ? onClose : undefined}
            aria-hidden="true"
          />

          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-testid={testId}
            tabIndex={-1}
            onKeyDown={trapKeys}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SPRING}
            drag={locked ? false : 'y'}
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            dragSnapToOrigin
            dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
            onDragEnd={handleDragEnd}
            className={`relative z-10 w-full flex flex-col max-h-[88%] select-none outline-none ${className}`}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderTopLeftRadius: 'var(--sheet-radius)',
              borderTopRightRadius: 'var(--sheet-radius)',
            }}
          >
            {/* Fixed header = drag handle */}
            <div
              className="shrink-0"
              onPointerDown={startDrag}
              style={{ touchAction: locked ? 'auto' : 'none', cursor: locked ? 'default' : 'grab' }}
              data-sheet-handle
            >
              {!locked && (
                <div className="pt-2.5 pb-1 flex justify-center w-full">
                  <div className="w-10 h-1 rounded-[2px]" style={{ backgroundColor: 'var(--sheet-handle)' }} />
                </div>
              )}
              {header}
              {!header && title && (
                <div className="px-4 pt-2 pb-3">
                  <h2 className="text-[20px] leading-[26px] font-normal text-balance" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-[14px] leading-[20px] mt-0.5 text-pretty" style={{ color: 'var(--text-secondary)' }}>
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Only the middle scrolls */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 ${footer ? 'pb-3' : 'cta-safe'} ${bodyClassName}`}
              style={{ overscrollBehavior: 'contain' }}
              data-sheet-body
            >
              {children}
            </div>

            {/* Fixed footer */}
            {footer && (
              <div className={`shrink-0 px-4 pt-2.5 cta-safe ${footerDivider ? 'border-t' : ''}`} style={{ borderTopColor: 'var(--divider)' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
