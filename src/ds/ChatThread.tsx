import LinkPreviewCard from './LinkPreviewCard'

export interface ChatThreadProps {
  senderName?: string
  messageText?: string
  time?: string
  onCardClick?: () => void
  className?: string
}

export default function ChatThread({
  senderName = 'Rohan',
  messageText = 'Held 6 seats for Monsoon Heist, Fri 9:15 PM. Pick your seat and pay your share:\nPay by 7:15 PM today · bms.link/g/k7Qx2',
  time = '1:16 PM',
  onCardClick,
  className = '',
}: ChatThreadProps) {
  return (
    <div
      className={`w-full h-full flex flex-col bg-bg-page select-none ${className}`}
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      {/* Simulated Chat Header Banner */}
      <div
        className="w-full py-2 px-4 text-center border-b border-divider"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <span
          className="text-[12px] font-medium uppercase tracking-wider text-text-secondary"
          style={{ color: 'var(--text-secondary)' }}
        >
          Chat (simulated)
        </span>
      </div>

      {/* Message bubble stream */}
      <div className="flex-1 p-4 flex flex-col justify-end gap-3">
        {/* Outgoing or Incoming bubble */}
        <div className="max-w-[85%] self-end flex flex-col gap-1.5">
          <div
            className="p-3 rounded-[16px] rounded-br-[4px] shadow-sm flex flex-col gap-2.5"
            style={{
              backgroundColor: 'var(--bg-success)',
              color: 'var(--text-primary)',
            }}
          >
            <span className="text-[11px] font-semibold text-text-success" style={{ color: 'var(--text-success)' }}>
              {senderName}
            </span>
            <p className="text-[13px] leading-[18px] whitespace-pre-wrap">
              {messageText}
            </p>

            {/* Embedded Link Preview */}
            <LinkPreviewCard onClick={onCardClick} />

            <span className="text-[10px] text-right opacity-60">
              {time}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
