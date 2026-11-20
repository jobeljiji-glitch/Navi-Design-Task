import type { ReactNode } from 'react'

/**
 * GroupStatusList (step 7): ref-22 list rows inside a Card. Paid · Paying now · Can't make it
 * (Release a seat / Keep) · "N seats waiting" (Cover seats / Send reminder). Organiser view only.
 */
export interface GroupMemberItem {
  name: string
  seat?: string
  status: 'paid' | 'paying' | 'declined'
}

export interface GroupStatusListProps {
  paidMembers: GroupMemberItem[]
  payingMembers: GroupMemberItem[]
  declinedMembers: GroupMemberItem[]
  waitingSeatsCount: number
  waitingLabel?: string
  onReleaseSeat?: (name: string) => void
  onKeepSeat?: (name: string) => void
  onCoverSeats?: () => void
  onSendReminder?: () => void
  /** Release is only possible while an unpaid edge seat exists */
  canRelease?: boolean
  className?: string
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[12px] leading-[16px] uppercase tracking-[0.5px]" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </span>
  )
}

function Action({ children, onClick, tone = 'neutral', disabled = false }: { children: ReactNode; onClick?: () => void; tone?: 'red' | 'neutral'; disabled?: boolean }) {
  return (
    // 44 pt hit area around a 32 pt outlined button
    <button type="button" onClick={onClick} disabled={disabled} className="h-11 flex items-center disabled:opacity-40 active:opacity-70">
      <span
        className="h-8 px-3 rounded-[6px] flex items-center text-[13px] leading-none font-medium border whitespace-nowrap"
        style={tone === 'red' ? { borderColor: 'var(--bms-red)', color: 'var(--bms-red-text)' } : { borderColor: 'var(--border-grey)', color: 'var(--text-primary)' }}
      >
        {children}
      </span>
    </button>
  )
}

function Row({ name, detail, tone }: { name: string; detail?: string; tone: 'paid' | 'paying' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-[14px] leading-[20px]">
      <span className="flex items-center gap-2 min-w-0">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: tone === 'paid' ? 'var(--seat-selected)' : 'var(--seat-held-border)' }}
          aria-hidden
        />
        <span className="truncate" style={{ color: 'var(--text-primary)' }}>{name}</span>
      </span>
      <span className="shrink-0" style={{ color: tone === 'paid' ? 'var(--text-secondary)' : 'var(--text-warning)' }}>
        {detail}
      </span>
    </div>
  )
}

export default function GroupStatusList({
  paidMembers,
  payingMembers,
  declinedMembers,
  waitingSeatsCount,
  waitingLabel,
  onReleaseSeat,
  onKeepSeat,
  onCoverSeats,
  onSendReminder,
  canRelease = true,
  className = '',
}: GroupStatusListProps) {
  const hr = <div className="h-px" style={{ backgroundColor: 'var(--divider)' }} />
  return (
    <div className={`w-full flex flex-col ${className}`} data-testid="group-status-list">
      <SectionLabel>Paid</SectionLabel>
      <div className="flex flex-col pt-1 pb-2">
        {paidMembers.map((m) => (
          <Row key={`paid-${m.name}`} name={m.name} detail={m.seat} tone="paid" />
        ))}
      </div>

      {payingMembers.length > 0 && (
        <>
          {hr}
          <div className="pt-3">
            <SectionLabel>Paying now</SectionLabel>
          </div>
          {payingMembers.map((m) => (
            <Row key={`paying-${m.name}`} name={m.name} detail={m.seat} tone="paying" />
          ))}
        </>
      )}

      {declinedMembers.map((m) => (
        <div key={`declined-${m.name}`} data-testid={`declined-${m.name}`} data-tour="cant-make-it-row">
          {hr}
          <div className="pt-3 flex flex-col">
            <span className="text-[14px] leading-[20px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {m.name} can't make it
            </span>
            <span className="text-[13px] leading-[18px]" style={{ color: 'var(--text-secondary)' }}>
              Release a seat, or keep it for someone else?
            </span>
            <div className="flex items-center gap-2">
              {onReleaseSeat && (
                <Action tone="red" onClick={() => onReleaseSeat(m.name)} disabled={!canRelease}>
                  Release a seat
                </Action>
              )}
              {onKeepSeat && <Action onClick={() => onKeepSeat(m.name)}>Keep</Action>}
            </div>
          </div>
        </div>
      ))}

      {waitingSeatsCount > 0 && (
        <>
          {hr}
          <div className="pt-3 flex flex-col" data-testid="waiting-row">
            <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>
              {waitingLabel ?? `${waitingSeatsCount} ${waitingSeatsCount === 1 ? 'seat' : 'seats'} waiting`}
            </span>
            <div className="flex items-center gap-2">
              {onCoverSeats && <Action onClick={onCoverSeats}>Cover seats</Action>}
              {onSendReminder && <Action tone="red" onClick={onSendReminder}>Send reminder</Action>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
