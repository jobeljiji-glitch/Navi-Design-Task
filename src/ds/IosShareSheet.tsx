import { useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { X, Copy, Bookmark, BookOpen, Printer, Folder, FileText, Search, Mail, Users, MoreHorizontal, Ticket } from 'lucide-react'
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'motion/react'

/**
 * iOS share sheet, laid out from ref 17 (1 pt ≈ 1.83 px):
 * 32 pt side inset, 64 pt preview tile, 45 pt close circle, inset hairlines,
 * people row (66 pt circles, 91 pt pitch, 2-line names, chat badges), apps row
 * (AirDrop, Messages, Mail, WhatsApp, More), actions row, grouped list, Edit Actions.
 * WhatsApp is a stylised tile drawn here (user-approved, D-041), not an official logo file.
 */
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
  /** @deprecated ref 17 shows a single preview line; kept for compatibility */
  previewTitle?: string
  contacts?: IosShareContact[]
  onSelectContact?: (contact: IosShareContact) => void
  onSelectApp?: (appName: string) => void
  onCopy?: () => void
  /** 09: a BookMyShow-written progress card (no names) shown as the preview, e.g. the reminder */
  card?: { title: string; body: string; link: string }
  className?: string
}

const DEFAULT_CONTACTS: IosShareContact[] = [
  { id: '1', name: 'Friday movie', isGroup: true },
  { id: '2', name: 'Amit', initials: 'AM' },
  { id: '3', name: 'Sana', initials: 'SA' },
  { id: '4', name: 'Priya', initials: 'PR' },
]

const FONT = '-apple-system, "SF Pro Text", system-ui, sans-serif'

/** Own drawing: white phone handset inside a speech bubble (stylised, not the official mark). */
function ChatPhoneGlyph({ size, bubble, phone }: { size: number; bubble: string; phone: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M16 3a13 13 0 0 0-11.3 19.4L3 29l6.8-1.7A13 13 0 1 0 16 3z" fill={bubble} />
      <path
        d="M12.2 9.6c.4 0 .7.2.9.6l1.2 2.7c.1.4 0 .8-.2 1.1l-.9 1c.8 1.6 2.1 2.9 3.7 3.7l1-.9c.3-.3.7-.3 1.1-.2l2.7 1.2c.4.2.6.5.6.9v1.4c0 .9-.7 1.6-1.6 1.6C14.6 23.1 8.9 17.4 8.9 11.2c0-.9.7-1.6 1.6-1.6h1.7z"
        fill={phone}
      />
    </svg>
  )
}

function Hairline() {
  return <div className="mx-8 h-px" style={{ backgroundColor: 'var(--ios-separator)' }} />
}

function Item({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center shrink-0 w-[76px] active:opacity-70"
      aria-label={label.replace('\n', ' ')}
    >
      {children}
      <span
        className="mt-2 w-full h-[34px] text-[13px] leading-[17px] text-center line-clamp-2 whitespace-pre-line"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </span>
    </button>
  )
}

function AppTile({ children, bg = 'var(--ios-icon-dark)' }: { children: ReactNode; bg?: string }) {
  return (
    <span className="w-[66px] h-[66px] rounded-[15px] flex items-center justify-center" style={{ backgroundColor: bg }}>
      {children}
    </span>
  )
}

function ActionCircle({ children }: { children: ReactNode }) {
  return (
    <span className="w-[66px] h-[66px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ios-action-bg)' }}>
      {children}
    </span>
  )
}

export default function IosShareSheet({
  isOpen,
  onClose,
  message = 'Held 6 seats for Monsoon Heist, Fri, 9:15 PM…',
  contacts = DEFAULT_CONTACTS,
  onSelectContact,
  onSelectApp,
  onCopy,
  card,
  className = '',
}: IosShareSheetProps) {
  const controls = useDragControls()
  const ref = useRef<HTMLDivElement>(null)
  const startDrag = (e: ReactPointerEvent) => controls.start(e)
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const h = ref.current?.offsetHeight ?? 700
    if (info.offset.y > h * 0.3 || info.velocity.y > 800) onClose()
  }
  const iconColor = { color: 'var(--text-primary)' }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`absolute inset-0 z-50 overflow-hidden flex flex-col justify-end select-none ${className}`} style={{ fontFamily: FONT }}>
          <motion.div
            data-testid="share-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 cursor-pointer"
            style={{ backgroundColor: 'var(--scrim)', touchAction: 'none' }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label="Share"
            data-testid="share-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            dragSnapToOrigin
            onDragEnd={handleDragEnd}
            className="relative z-10 w-full flex flex-col max-h-full"
            style={{ backgroundColor: 'var(--ios-sheet-bg)', borderTopLeftRadius: 38, borderTopRightRadius: 38 }}
          >
            {/* Header (drag handle): 64 pt preview tile, one grey line, 45 pt close circle */}
            <div className="shrink-0 pl-8 pr-4 pt-4 flex items-start gap-4" onPointerDown={startDrag} style={{ touchAction: 'none' }}>
              {card ? (
                <div className="mt-4 flex-1 min-w-0 flex items-start gap-3 p-3 rounded-[14px]" style={{ backgroundColor: 'var(--bg-surface)' }} data-testid="share-card">
                  <span className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bms-red-strong)' }} aria-hidden>
                    <Ticket size={22} strokeWidth={1.75} style={{ color: 'var(--text-on-brand)' }} />
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[15px] leading-[20px] font-medium text-pretty" style={{ color: 'var(--text-primary)' }}>{card.title}</span>
                    <span className="text-[13px] leading-[18px]" style={{ color: 'var(--ios-label-secondary)' }}>{card.body}</span>
                    <span className="text-[13px] leading-[18px]" style={{ color: 'var(--ios-label-secondary)' }}>{card.link}</span>
                  </span>
                </div>
              ) : (
                <>
                  <div
                    className="mt-4 w-16 h-16 rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                    aria-hidden
                  >
                    <span className="text-[30px] leading-none font-normal" style={{ color: 'var(--ios-label-secondary)' }}>A|</span>
                  </div>
                  <p className="flex-1 min-w-0 mt-[38px] text-[15px] leading-[20px] truncate" style={{ color: 'var(--ios-label-secondary)' }}>
                    {message}
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-[45px] h-[45px] rounded-full flex items-center justify-center shrink-0 border active:opacity-70"
                style={{ backgroundColor: 'var(--ios-sheet-bg)', borderColor: 'var(--ios-separator)' }}
                aria-label="Close share sheet"
              >
                <X size={22} strokeWidth={1.75} style={iconColor} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar" style={{ overscrollBehavior: 'contain' }}>
              <div className="h-4" />
              <Hairline />

              {/* People row */}
              <div className="pl-[27px] pr-4 pt-4 pb-3 flex gap-[15px] overflow-x-auto no-scrollbar" data-testid="share-people">
                {contacts.map((c) => (
                  <Item key={c.id} label={c.name} onClick={() => onSelectContact?.(c)}>
                    <span className="relative">
                      <span
                        className="w-[66px] h-[66px] rounded-full flex items-center justify-center text-[24px] font-normal"
                        style={{
                          backgroundColor: c.isGroup ? 'var(--ios-group-pink)' : 'var(--ios-avatar-bg)',
                          color: c.isGroup ? 'var(--bms-red-strong)' : 'var(--text-primary)',
                        }}
                      >
                        {c.isGroup ? <Users size={30} strokeWidth={1.75} /> : c.initials || c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span
                        className="absolute -right-0.5 -bottom-0.5 w-[22px] h-[22px] rounded-[6px] flex items-center justify-center"
                        style={{ backgroundColor: 'var(--whatsapp-green)', boxShadow: '0 0 0 2px var(--ios-sheet-bg)' }}
                        aria-hidden
                      >
                        <ChatPhoneGlyph size={15} bubble="white" phone="var(--whatsapp-green)" />
                      </span>
                    </span>
                  </Item>
                ))}
              </div>

              <Hairline />

              {/* Apps row */}
              <div className="pl-[27px] pr-4 pt-4 pb-3 flex gap-[15px] overflow-x-auto no-scrollbar" data-testid="share-apps">
                <Item label="AirDrop" onClick={() => onSelectApp?.('AirDrop')}>
                  <AppTile>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
                      <circle cx="20" cy="20" r="15" stroke="var(--ios-airdrop-blue)" strokeWidth="3" opacity="0.45" />
                      <circle cx="20" cy="20" r="9.5" stroke="var(--ios-airdrop-blue)" strokeWidth="3" opacity="0.75" />
                      <circle cx="20" cy="20" r="4.5" fill="var(--ios-airdrop-blue)" />
                    </svg>
                  </AppTile>
                </Item>
                <Item label="Messages" onClick={() => onSelectApp?.('Messages')}>
                  <AppTile>
                    <svg width="42" height="36" viewBox="0 0 42 36" aria-hidden>
                      <path d="M21 2C10.5 2 2 8.9 2 17.4c0 4.9 2.8 9.2 7.2 12L7.5 34l7.3-3.2c1.9.5 4 .8 6.2.8 10.5 0 19-6.9 19-15.4S31.5 2 21 2z" fill="var(--ios-messages-green)" />
                    </svg>
                  </AppTile>
                </Item>
                <Item label="Mail" onClick={() => onSelectApp?.('Mail')}>
                  <AppTile>
                    <Mail size={40} strokeWidth={1.75} style={{ color: 'var(--ios-airdrop-blue)' }} />
                  </AppTile>
                </Item>
                <Item label="WhatsApp" onClick={() => onSelectApp?.('WhatsApp')}>
                  <AppTile bg="var(--whatsapp-green)">
                    <ChatPhoneGlyph size={42} bubble="white" phone="var(--whatsapp-green)" />
                  </AppTile>
                </Item>
                <Item label="More" onClick={() => onSelectApp?.('More')}>
                  <AppTile bg="var(--ios-action-bg)">
                    <MoreHorizontal size={30} strokeWidth={1.75} style={iconColor} />
                  </AppTile>
                </Item>
              </div>

              <Hairline />

              {/* Actions row */}
              <div className="pl-[27px] pr-4 pt-4 pb-3 flex gap-[15px] overflow-x-auto no-scrollbar">
                <Item label="Copy" onClick={onCopy}>
                  <ActionCircle><Copy size={26} strokeWidth={1.75} style={iconColor} /></ActionCircle>
                </Item>
                <Item label={'New Quick\nNote'}>
                  <ActionCircle><FileText size={26} strokeWidth={1.75} style={iconColor} /></ActionCircle>
                </Item>
                <Item label="Save to Files">
                  <ActionCircle><Folder size={26} strokeWidth={1.75} style={iconColor} /></ActionCircle>
                </Item>
                <Item label="Search Web">
                  <ActionCircle><Search size={26} strokeWidth={1.75} style={iconColor} /></ActionCircle>
                </Item>
              </div>

              {/* Grouped list */}
              <div className="px-4 pt-3">
                <div className="rounded-[20px] overflow-hidden" style={{ backgroundColor: 'var(--ios-group-bg)' }}>
                  {[
                    { label: 'Add to Reading List', Icon: BookOpen },
                    { label: 'Add Bookmark', Icon: Bookmark },
                    { label: 'Print', Icon: Printer },
                  ].map(({ label, Icon }, i, arr) => (
                    <button key={label} type="button" className="w-full h-[53px] pl-5 flex items-center text-left active:opacity-70">
                      <Icon size={24} strokeWidth={1.75} style={iconColor} className="shrink-0" />
                      <span
                        className="flex-1 h-full ml-4 flex items-center text-[17px]"
                        style={{
                          color: 'var(--text-primary)',
                          borderBottom: i < arr.length - 1 ? '1px solid var(--ios-separator)' : undefined,
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Actions */}
              <div className="pt-5 flex justify-center cta-safe">
                <button
                  type="button"
                  className="h-[37px] px-6 rounded-full border text-[17px] active:opacity-70"
                  style={{ backgroundColor: 'var(--ios-sheet-bg)', borderColor: 'var(--ios-separator)', color: 'var(--text-primary)' }}
                >
                  Edit Actions
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
