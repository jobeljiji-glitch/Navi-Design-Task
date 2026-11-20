import { X, Copy, Share2, MessageCircle, Mail, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export interface IosShareContact {
  id: string
  name: string
  subtitle?: string
}

export interface IosShareSheetProps {
  isOpen: boolean
  onClose: () => void
  message: string
  previewTitle?: string
  contacts?: IosShareContact[]
  onSelectContact?: (contact: IosShareContact) => void
  onSelectApp?: (appName: string) => void
  onCopy?: () => void
}

const DEFAULT_CONTACTS: IosShareContact[] = [
  { id: '1', name: 'Friday movie', subtitle: 'Group' },
  { id: '2', name: 'Amit', subtitle: 'Friend' },
  { id: '3', name: 'Sana', subtitle: 'Friend' },
  { id: '4', name: 'Priya', subtitle: 'Friend' },
]

export default function IosShareSheet({
  isOpen,
  onClose,
  message,
  previewTitle = 'Monsoon Heist - Group Hold Link',
  contacts = DEFAULT_CONTACTS,
  onSelectContact,
  onSelectApp,
  onCopy,
}: IosShareSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 overflow-hidden flex flex-col justify-end">
          {/* Dimmed scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--scrim)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* iOS Share Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative z-10 w-full rounded-t-[20px] p-4 flex flex-col gap-4 max-h-[85%] overflow-y-auto select-none"
            style={{ backgroundColor: 'var(--ios-sheet-bg)' }}
          >
            {/* Header: Preview tile + close button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--divider)',
                  }}
                >
                  <Share2 size={24} strokeWidth={1.75} className="text-text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-[15px] leading-tight font-medium text-text-primary truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {previewTitle}
                  </span>
                  <span
                    className="text-[12px] leading-snug text-text-secondary line-clamp-1 mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {message}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 shrink-0"
                style={{ backgroundColor: 'var(--ios-group-bg)' }}
                aria-label="Close share sheet"
              >
                <X size={18} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Row 2: Suggested Contacts */}
            <div className="flex items-center gap-4 overflow-x-auto py-1 no-scrollbar">
              {contacts.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectContact?.(c)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group active:scale-95"
                >
                  <div className="relative">
                    <div
                      className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-[18px] font-semibold text-text-primary"
                      style={{
                        backgroundColor: 'var(--ios-group-bg)',
                        border: '1.5px solid var(--bg-surface)',
                      }}
                    >
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    {/* Small generic chat icon badge */}
                    <div
                      className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center shadow"
                      style={{ backgroundColor: 'var(--showtime-green)' }}
                    >
                      <MessageCircle size={11} strokeWidth={2.5} className="text-white" />
                    </div>
                  </div>
                  <span
                    className="text-[12px] leading-none text-text-primary max-w-[64px] truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {c.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Row 3: App Icons */}
            <div
              className="rounded-[14px] p-3 flex items-center gap-4 overflow-x-auto no-scrollbar"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              {[
                { name: 'AirDrop', icon: Send },
                { name: 'Chat', icon: MessageCircle },
                { name: 'Messages', icon: MessageCircle },
                { name: 'Mail', icon: Mail },
              ].map(app => {
                const Icon = app.icon
                return (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => onSelectApp?.(app.name)}
                    className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95"
                  >
                    <div
                      className="w-12 h-12 rounded-[12px] flex items-center justify-center text-text-primary"
                      style={{ backgroundColor: 'var(--ios-group-bg)' }}
                    >
                      <Icon size={22} strokeWidth={1.75} />
                    </div>
                    <span
                      className="text-[11px] leading-none text-text-secondary"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {app.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Row 4: Actions list */}
            <div
              className="rounded-[14px] overflow-hidden flex flex-col"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <button
                type="button"
                onClick={onCopy}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-bg-muted active:opacity-75"
              >
                <span
                  className="text-[15px] font-normal text-text-primary"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Copy Link
                </span>
                <Copy size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
