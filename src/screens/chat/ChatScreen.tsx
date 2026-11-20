import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Lock, Phone, Plus, SendHorizontal, Users, Video, Camera, Mic } from 'lucide-react'
import { ChatThread } from '@/ds'
import { useDemoStore } from '@/store'
import { selectChatThread, type ChatViewer } from '@/logic/friendFlow'

/**
 * Simulated group chat "Friday movie" (spec §4 step 4), WhatsApp-styled (D-041, D-066).
 * Rohan's view has the pre-filled composer: the first part is editable, the deadline
 * line is locked (spec §3 "Shared-message deadline line is locked").
 */
export interface ChatScreenProps {
  viewer: ChatViewer
  onBack?: () => void
  onPreviewClick?: () => void
  /** Rohan only: called after the message is sent */
  onSent?: () => void
}

const FONT = '-apple-system, "SF Pro Text", system-ui, sans-serif'

export default function ChatScreen({ viewer, onBack, onPreviewClick, onSent }: ChatScreenProps) {
  const state = useDemoStore()
  const dispatch = state.dispatch
  const thread = selectChatThread(state, viewer)
  const [draft, setDraft] = useState(thread.draftEditable)
  const scrollRef = useRef<HTMLDivElement>(null)
  const composing = viewer === 'Rohan' && !thread.sent

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread.messages.length])

  const send = () => {
    const text = draft.trim() || thread.draftEditable
    dispatch({ type: 'SHARE_TO_GROUP', text: `${text}\n${thread.draftLocked}` })
    onSent?.()
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden select-none" style={{ fontFamily: FONT, backgroundColor: 'var(--wa-wallpaper)' }} data-testid={`chat-${viewer.toLowerCase()}`}>
      {/* Header */}
      <header className="shrink-0 h-[54px] flex items-center pl-1 pr-3 gap-1 border-b" style={{ backgroundColor: 'var(--wa-header)', borderColor: 'var(--ios-separator)' }}>
        <button type="button" onClick={onBack} className="w-11 h-11 flex items-center justify-center active:opacity-60" aria-label="Back">
          <ChevronLeft size={28} strokeWidth={1.75} style={{ color: 'var(--ios-airdrop-blue)' }} />
        </button>
        <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--ios-group-pink)', color: 'var(--bms-red-strong)' }} aria-hidden>
          <Users size={18} strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0 ml-1.5">
          <div className="text-[16px] leading-[20px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {thread.title}
          </div>
          <div className="text-[12px] leading-[16px] truncate" style={{ color: 'var(--wa-meta)' }}>
            {thread.members}
          </div>
        </div>
        <span className="flex items-center gap-5 pl-2" style={{ color: 'var(--ios-airdrop-blue)' }} aria-hidden>
          <Video size={24} strokeWidth={1.75} />
          <Phone size={21} strokeWidth={1.75} />
        </span>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar" style={{ overscrollBehavior: 'contain' }}>
        <div className="min-h-full flex flex-col justify-end">
          <ChatThread messages={thread.messages} onPreviewClick={onPreviewClick} />
        </div>
      </div>

      {/* Composer */}
      {composing ? (
        <div className="shrink-0 px-2 pt-2 cta-safe flex items-end gap-2" style={{ backgroundColor: 'var(--wa-header)' }} data-testid="chat-composer">
          <div className="flex-1 min-w-0 rounded-[18px] border px-3 py-2" style={{ backgroundColor: 'var(--wa-composer-bg)', borderColor: 'var(--ios-separator)' }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full resize-none bg-transparent outline-none text-[16px] leading-[21px]"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Message"
              data-testid="chat-draft"
            />
            {/* The deadline line can't be edited */}
            <div className="mt-1 pt-1.5 border-t flex items-center gap-1.5 text-[15px] leading-[20px]" style={{ borderColor: 'var(--ios-separator)', color: 'var(--text-primary)' }} data-testid="chat-locked-line">
              <Lock size={14} strokeWidth={1.75} style={{ color: 'var(--wa-meta)' }} aria-label="Can't be edited" className="shrink-0" />
              <span className="min-w-0">{thread.draftLocked}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={send}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:opacity-80 mb-0.5"
            style={{ backgroundColor: 'var(--whatsapp-green)', color: 'var(--text-on-brand)' }}
            aria-label="Send message"
            data-testid="chat-send"
            data-tour="chat-send"
          >
            <SendHorizontal size={20} strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <div className="shrink-0 px-2 pt-2 cta-safe flex items-center gap-2" style={{ backgroundColor: 'var(--wa-header)' }} aria-hidden>
          <Plus size={26} strokeWidth={1.75} style={{ color: 'var(--ios-airdrop-blue)' }} />
          <div className="flex-1 h-9 rounded-[18px] border" style={{ backgroundColor: 'var(--wa-composer-bg)', borderColor: 'var(--ios-separator)' }} />
          <Camera size={24} strokeWidth={1.75} style={{ color: 'var(--ios-airdrop-blue)' }} />
          <Mic size={24} strokeWidth={1.75} style={{ color: 'var(--ios-airdrop-blue)' }} />
        </div>
      )}
    </div>
  )
}
