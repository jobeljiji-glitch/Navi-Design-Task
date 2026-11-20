import { X, Copy, Bookmark, BookOpen, Printer, Folder, FileText, Search } from 'lucide-react'
import { motion, AnimatePresence, type PanInfo } from 'motion/react'

export interface IosShareContact {
  id: string
  name: string
  initials?: string
  isGroup?: boolean
  bgColor?: string
}

export interface IosShareSheetProps {
  isOpen: boolean
  onClose: () => void
  message?: string
  previewTitle?: string
  contacts?: IosShareContact[]
  onSelectContact?: (contact: IosShareContact) => void
  onSelectApp?: (appName: string) => void
  onCopy?: () => void
  className?: string
}

const DEFAULT_CONTACTS: IosShareContact[] = [
  { id: '1', name: 'Friday movie gang', isGroup: true, bgColor: '#FFD6DF' },
  { id: '2', name: 'Amit', initials: 'AM', bgColor: '#D0E8FF' },
  { id: '3', name: 'Sana', initials: 'SA', bgColor: '#EAE0FF' },
  { id: '4', name: 'Priya', initials: 'PR', bgColor: '#D4F0DE' },
]

export default function IosShareSheet({
  isOpen,
  onClose,
  message = 'Rohan is holding 6 seats for Monsoon Heist…',
  previewTitle = 'Monsoon Heist - Group Hold Link',
  contacts = DEFAULT_CONTACTS,
  onSelectContact,
  onSelectApp,
  onCopy,
  className = '',
}: IosShareSheetProps) {
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`absolute inset-0 z-50 overflow-hidden flex flex-col justify-end select-none ${className}`}
          style={{
            fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
          }}
        >
          {/* Dimmed backdrop */}
          <motion.div
            data-testid="share-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 cursor-pointer"
            style={{ backgroundColor: 'var(--scrim)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* iOS Share Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 34,
              stiffness: 340,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative z-10 w-full flex flex-col max-h-[88%] overflow-y-auto no-scrollbar shadow-2xl"
            style={{
              backgroundColor: '#F2F2F7',
              borderTopLeftRadius: '38px',
              borderTopRightRadius: '38px',
            }}
          >
            {/* Header: Preview tile + message + 44pt circular close button */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* 60 pt white rounded-square preview tile */}
                <div
                  className="w-[60px] h-[60px] rounded-[14px] bg-white border border-black/5 shadow-sm flex flex-col items-center justify-center shrink-0 p-1 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F7 100%)',
                  }}
                >
                  <div className="w-8 h-8 rounded-[8px] bg-[#EB4E63]/10 border border-[#EB4E63]/20 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-[#EB4E63] tracking-tighter">BMS</span>
                  </div>
                  <span className="text-[9px] font-medium text-[#8E8E93] mt-0.5 leading-none">Hold</span>
                </div>

                {/* One or two grey lines: preview title + message, truncated */}
                <div className="flex flex-col min-w-0">
                  {previewTitle && (
                    <span className="text-[12px] leading-tight text-[#8E8E93] truncate font-normal">
                      {previewTitle}
                    </span>
                  )}
                  <span className="text-[15px] leading-tight text-[#6C6C70] truncate">
                    {message}
                  </span>
                </div>
              </div>

              {/* 44 pt circular close button: white with hairline border and black X */}
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-sm shrink-0 active:opacity-70 transition-opacity"
                aria-label="Close share sheet"
              >
                <X size={20} strokeWidth={2.2} className="text-black" />
              </button>
            </div>

            {/* Hairline separator inset 20 pt */}
            <div className="mx-5 h-[0.5px] bg-[#C6C6C8]" />

            {/* People row: 4 visible horizontally */}
            <div className="px-5 py-3.5 flex items-start gap-4 overflow-x-auto no-scrollbar">
              {contacts.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectContact?.(c)}
                  className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] active:scale-95 transition-transform"
                >
                  <div className="relative">
                    {/* 64 pt circular avatar */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center font-medium text-[20px] text-[#1C1C1E] shadow-sm"
                      style={{ backgroundColor: c.bgColor || '#E5E5EA' }}
                    >
                      {c.isGroup ? (
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2C2C2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      ) : (
                        c.initials || c.name.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    {/* 22 pt rounded squircle WhatsApp-green badge with white chat glyph */}
                    <div
                      className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shadow"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Name below in 2 lines max, 13 pt, black, centred */}
                  <span className="text-[13px] leading-[15px] font-normal text-black text-center line-clamp-2 w-full">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Hairline separator inset 20 pt */}
            <div className="mx-5 h-[0.5px] bg-[#C6C6C8]" />

            {/* Apps row: 64 pt squircles with 14 pt radius */}
            <div className="px-5 py-3.5 flex items-start gap-4 overflow-x-auto no-scrollbar">
              {/* AirDrop */}
              <button
                type="button"
                onClick={() => onSelectApp?.('AirDrop')}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-[14px] bg-[#1C1C1E] flex items-center justify-center shadow-sm">
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                    <circle cx="17" cy="17" r="4" fill="#007AFF" />
                    <path d="M11 23C7.5 19.5 7.5 14.5 11 11" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M23 11C26.5 14.5 26.5 19.5 23 23" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M13.5 20.5C11.5 18.5 11.5 15.5 13.5 13.5" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" />
                    <path d="M20.5 13.5C22.5 15.5 22.5 18.5 20.5 20.5" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[13px] text-black text-center">AirDrop</span>
              </button>

              {/* Messages */}
              <button
                type="button"
                onClick={() => onSelectApp?.('Messages')}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-[14px] bg-[#34C759] flex items-center justify-center shadow-sm">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
                <span className="text-[13px] text-black text-center">Messages</span>
              </button>

              {/* Mail */}
              <button
                type="button"
                onClick={() => onSelectApp?.('Mail')}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-[14px] bg-[#007AFF] flex items-center justify-center shadow-sm">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <span className="text-[13px] text-black text-center">Mail</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => onSelectApp?.('WhatsApp')}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-[14px] bg-[#1C1C1E] flex items-center justify-center shadow-sm">
                  <div className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z" />
                    </svg>
                  </div>
                </div>
                <span className="text-[13px] text-black text-center">WhatsApp</span>
              </button>
            </div>

            {/* Hairline separator inset 20 pt */}
            <div className="mx-5 h-[0.5px] bg-[#C6C6C8]" />

            {/* Actions row: 64 pt light-grey circles with black line icons */}
            <div className="px-5 py-3.5 flex items-start gap-4 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={onCopy}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-[#E5E5EA] flex items-center justify-center shadow-sm">
                  <Copy size={24} strokeWidth={1.8} className="text-black" />
                </div>
                <span className="text-[13px] text-black text-center">Copy</span>
              </button>

              <button
                type="button"
                onClick={() => alert('New Quick Note')}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-[#E5E5EA] flex items-center justify-center shadow-sm">
                  <FileText size={24} strokeWidth={1.8} className="text-black" />
                </div>
                <span className="text-[13px] text-black text-center leading-tight">New Quick Note</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Save to Files')}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-[#E5E5EA] flex items-center justify-center shadow-sm">
                  <Folder size={24} strokeWidth={1.8} className="text-black" />
                </div>
                <span className="text-[13px] text-black text-center leading-tight">Save to Files</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Search on Google')}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-[#E5E5EA] flex items-center justify-center shadow-sm">
                  <Search size={24} strokeWidth={1.8} className="text-black" />
                </div>
                <span className="text-[13px] text-black text-center leading-tight">Search Web</span>
              </button>
            </div>

            {/* Grouped list: rounded 12 pt #E9E9EB block with generic rows */}
            <div className="px-5 py-2">
              <div className="rounded-[12px] bg-[#E9E9EB] overflow-hidden flex flex-col">
                <button
                  type="button"
                  onClick={() => alert('Add to Reading List')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left active:bg-[#DEDEE0]"
                >
                  <span className="text-[17px] font-normal text-black">Add to Reading List</span>
                  <BookOpen size={22} strokeWidth={1.75} className="text-[#3C3C43]" />
                </button>
                <div className="ml-4 h-[0.5px] bg-[#C6C6C8]" />

                <button
                  type="button"
                  onClick={() => alert('Add Bookmark')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left active:bg-[#DEDEE0]"
                >
                  <span className="text-[17px] font-normal text-black">Add Bookmark</span>
                  <Bookmark size={22} strokeWidth={1.75} className="text-[#3C3C43]" />
                </button>
                <div className="ml-4 h-[0.5px] bg-[#C6C6C8]" />

                <button
                  type="button"
                  onClick={() => alert('Print')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left active:bg-[#DEDEE0]"
                >
                  <span className="text-[17px] font-normal text-black">Print</span>
                  <Printer size={22} strokeWidth={1.75} className="text-[#3C3C43]" />
                </button>
              </div>
            </div>

            {/* "Edit Actions": pill button centred at bottom */}
            <div className="px-5 pt-3 pb-6 flex justify-center">
              <button
                type="button"
                onClick={() => alert('Edit Actions')}
                className="px-6 py-2 rounded-full bg-white border border-black/10 text-[15px] font-medium text-black shadow-sm active:bg-[#E5E5EA]"
              >
                Edit Actions
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
