import { Fragment, type ReactNode } from 'react'
import LinkPreviewCard, { type LinkPreviewCardProps } from './LinkPreviewCard'

/**
 * Simulated group chat (spec §4 step 4), WhatsApp-styled (user-approved exception, D-041):
 * wallpaper, a centred "Chat (simulated)" notice chip, incoming white bubbles with coloured
 * sender names, outgoing green bubbles with time and read ticks. System font, like the iOS app.
 */
export interface ChatBubble {
  id: string
  from: string
  mine: boolean
  text: string
  time: string
  preview?: Omit<LinkPreviewCardProps, 'onClick' | 'className'> & { title?: string }
}

export interface ChatThreadProps {
  messages?: ChatBubble[]
  onPreviewClick?: () => void
  /** @deprecated kit compatibility */
  onCardClick?: () => void
  notice?: string
  className?: string
  children?: ReactNode
}

const NAME_COLORS = ['var(--wa-name-1)', 'var(--wa-name-2)', 'var(--wa-name-3)', 'var(--wa-name-4)']
const FONT = '-apple-system, "SF Pro Text", system-ui, sans-serif'

const DEMO_MESSAGES: ChatBubble[] = [
  { id: 'a', from: 'Amit', mine: false, text: 'Friday movie? Monsoon Heist is out 🍿', time: '12:41 PM' },
  {
    id: 'b',
    from: 'Rohan',
    mine: true,
    text: 'Held 6 seats for Monsoon Heist, Fri, 9:15 PM. Pick your seat and pay your share:\nPay by 7:15 PM today · bms.link/g/k7Qx2',
    time: '1:16 PM',
    preview: {},
  },
]

const FIXED_COLORS: Record<string, string> = {
  Amit: NAME_COLORS[3],
  Sana: NAME_COLORS[0],
  Priya: NAME_COLORS[1],
  Neha: NAME_COLORS[2],
  Kabir: NAME_COLORS[3],
  Rohan: NAME_COLORS[1],
}

function nameColor(name: string): string {
  if (FIXED_COLORS[name]) return FIXED_COLORS[name]
  let h = 0
  for (const c of name) h = (h + c.charCodeAt(0)) % NAME_COLORS.length
  return NAME_COLORS[h]
}

/** Highlights links (bms.link/…) the way the chat app does. */
function renderText(text: string) {
  const parts = text.split(/(bms\.link\/\S+)/g)
  return parts.map((p, i) =>
    /^bms\.link\//.test(p) ? (
      <span key={i} style={{ color: 'var(--wa-link)' }}>
        {p}
      </span>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  )
}

export function ReadTicks() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" aria-label="Read" className="inline-block shrink-0">
      <path d="M1 6l3 3 6-7" fill="none" stroke="var(--wa-tick)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6l3 3 6-7" fill="none" stroke="var(--wa-tick)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SimulatedNotice({ text = 'Chat (simulated)' }: { text?: string }) {
  return (
    <div className="flex justify-center py-1">
      <span
        className="px-3 py-1 rounded-[8px] text-[12px] leading-[16px] text-center"
        style={{ backgroundColor: 'var(--wa-notice-bg)', color: 'var(--wa-notice-text)' }}
        data-testid="chat-simulated-label"
      >
        {text}
      </span>
    </div>
  )
}

export default function ChatThread({
  messages = DEMO_MESSAGES,
  onPreviewClick,
  onCardClick,
  notice = 'Chat (simulated)',
  className = '',
  children,
}: ChatThreadProps) {
  const openPreview = onPreviewClick ?? onCardClick
  return (
    <div
      className={`w-full flex flex-col gap-1.5 px-3 py-3 select-none ${className}`}
      style={{ fontFamily: FONT }}
      data-testid="chat-thread"
    >
      <SimulatedNotice text={notice} />
      {messages.map((m, i) => {
        const firstOfRun = i === 0 || messages[i - 1].from !== m.from
        return (
          <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'} ${firstOfRun ? 'mt-1.5' : ''}`}>
            <div
              className={`max-w-[82%] rounded-[10px] px-2 pt-1.5 pb-1 ${m.preview ? 'w-[82%]' : ''}`}
              style={{
                backgroundColor: m.mine ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)',
                boxShadow: 'var(--wa-bubble-shadow)',
                borderTopRightRadius: m.mine && firstOfRun ? 2 : undefined,
                borderTopLeftRadius: !m.mine && firstOfRun ? 2 : undefined,
              }}
              data-testid={m.preview ? 'chat-share-bubble' : undefined}
            >
              {!m.mine && firstOfRun && (
                <div className="text-[13px] leading-[18px] font-semibold px-0.5" style={{ color: nameColor(m.from) }}>
                  {m.from}
                </div>
              )}
              {m.preview && (
                <div className="pb-1.5">
                  <LinkPreviewCard {...m.preview} filmTitle={m.preview.title ?? m.preview.filmTitle} onClick={openPreview} />
                </div>
              )}
              <p className="px-0.5 text-[16px] leading-[21px] whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {renderText(m.text)}
                {/* Spacer so the time never overlaps the last line */}
                <span className="inline-block w-[70px]" aria-hidden />
              </p>
              <div className="-mt-4 flex items-center justify-end gap-1 text-[11px] leading-[14px]" style={{ color: 'var(--wa-meta)' }}>
                <span>{m.time}</span>
                {m.mine && <ReadTicks />}
              </div>
            </div>
          </div>
        )
      })}
      {children}
    </div>
  )
}
