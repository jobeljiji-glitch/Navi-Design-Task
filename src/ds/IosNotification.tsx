import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Film, MessageSquare } from 'lucide-react'

export interface IosNotificationProps {
  title: string
  body: string
  time?: string
  /** bms = BookMyShow app tile; sms = generic Messages tile (bank SMS) */
  app?: 'bms' | 'sms'
  visible?: boolean
  onClick?: () => void
  onDismiss?: () => void
  autoDismissMs?: number
  className?: string
  /** Render into DeviceFrame's [data-frame-overlay] so the banner sits over the status bar, like iOS */
  inFrameOverlay?: boolean
}

export default function IosNotification({
  title,
  body,
  time = 'now',
  app = 'bms',
  visible = true,
  onClick,
  onDismiss,
  autoDismissMs = 4000,
  className = '',
  inFrameOverlay = false,
}: IosNotificationProps) {
  const dismissRef = useRef(onDismiss)
  dismissRef.current = onDismiss
  useEffect(() => {
    if (!visible || autoDismissMs <= 0) return
    const timer = setTimeout(() => dismissRef.current?.(), autoDismissMs)
    return () => clearTimeout(timer)
  }, [visible, autoDismissMs])

  const anchorRef = useRef<HTMLSpanElement>(null)
  const [target, setTarget] = useState<Element | null>(null)
  useLayoutEffect(() => {
    if (!inFrameOverlay || !anchorRef.current) return
    const frame = anchorRef.current.closest('.device-frame-desktop, .device-frame-mobile')
    setTarget(frame?.querySelector('[data-frame-overlay]') ?? null)
  }, [inFrameOverlay])

  const banner = (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          onClick={onClick}
          className={`absolute top-3 left-3 right-3 z-50 pointer-events-auto rounded-[22px] p-3.5 flex items-start gap-3 backdrop-blur-xl shadow-lg cursor-pointer active:scale-[0.98] transition-transform select-none ${className}`}
          style={{
            backgroundColor: 'var(--ios-notif-bg)',
            color: 'var(--text-on-brand)',
          }}
          role="alert"
          aria-live="polite"
        >
          {/* App icon tile */}
          <div
            className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: app === 'sms' ? 'var(--showtime-green)' : 'var(--bms-red)' }}
          >
            {app === 'sms' ? (
              <MessageSquare size={20} strokeWidth={1.75} className="text-white" />
            ) : (
              <Film size={20} strokeWidth={1.75} className="text-white" />
            )}
          </div>

          {/* Notification text */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] leading-tight font-medium truncate text-white">
                {title}
              </span>
              <span className="text-[12px] leading-none opacity-60 text-white shrink-0">
                {time}
              </span>
            </div>
            <p className="text-[13px] leading-[17px] opacity-90 line-clamp-2 mt-0.5 text-white">
              {body}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (!inFrameOverlay) return banner
  return (
    <>
      <span ref={anchorRef} hidden />
      {target ? createPortal(banner, target) : banner}
    </>
  )
}
