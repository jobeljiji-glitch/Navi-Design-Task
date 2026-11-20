import type { ReactNode } from 'react'

/**
 * GroupStatusList (09): one row per seat, names only when BookMyShow knows them —
 * "Amit · D08 · Paid", "Sana · D09 · Opened, not paid", "D10 · Not opened yet", "D06 · Kept".
 * Then "Can't make it" rows (Release a seat / Keep) and the waiting row (Cover seats / Share a reminder).
 * Organiser view only.
 */
export type SeatRowKind = 'you' | 'paid' | 'paying' | 'opened' | 'not_opened' | 'kept' | 'released'

export interface GroupSeatRow {
  key: string
  seatId: string
  name: string | null
  status: string
  note?: string
  kind: SeatRowKind
}

/** @deprecated 08 member rows; kept for the kit page */
export interface GroupMemberItem {
  name: string
  seat?: string
  status: 'paid' | 'paying' | 'declined'
}

export interface GroupStatusListProps {
  rows: GroupSeatRow[]
  declinedNames: string[]
  waitingCount: number
  notOpenedCount: number
  onReleaseSeat?: (name: string) => void
  onKeepSeat?: (name: string) => void
  onCoverSeats?: () => void
  /** Never-opened seats only: opens the iOS share sheet with a BMS-written progress card */
  onShareReminder?: () => void
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

function Action({ children, onClick, tone = 'neutral', disabled = false, testId }: { children: ReactNode; onClick?: () => void; tone?: 'red' | 'neutral'; disabled?: boolean; testId?: string }) {
  return (
    // 44 pt hit area around a 32 pt outlined button
    <button type="button" onClick={onClick} disabled={disabled} className="h-11 flex items-center disabled:opacity-40 active:opacity-70" data-testid={testId}>
      <span
        className="h-8 px-3 rounded-[6px] flex items-center text-[13px] leading-none font-medium border whitespace-nowrap"
        style={tone === 'red' ? { borderColor: 'var(--bms-red)', color: 'var(--bms-red-text)' } : { borderColor: 'var(--border-grey)', color: 'var(--text-primary)' }}
      >
        {children}
      </span>
    </button>
  )
}

const DOT: Record<SeatRowKind, string> = {
  you: 'var(--seat-selected)',
  paid: 'var(--seat-selected)',
  paying: 'var(--seat-held-border)',
  opened: 'var(--seat-held-border)',
  not_opened: 'var(--border-grey)',
  kept: 'var(--text-warning)',
  released: 'var(--border-grey)',
}

const STATUS_COLOR: Record<SeatRowKind, string> = {
  you: 'var(--text-secondary)',
  paid: 'var(--text-secondary)',
  paying: 'var(--text-warning)',
  opened: 'var(--text-secondary)',
  not_opened: 'var(--text-secondary)',
  kept: 'var(--text-warning)',
  released: 'var(--text-secondary)',
}

function Row({ row }: { row: GroupSeatRow }) {
  const lead = row.name ? `${row.name} · ${row.seatId}` : row.seatId
  return (
    <div
      className="min-h-[40px] py-1.5 flex items-start gap-2 text-[14px] leading-[20px]"
      data-testid={`seat-row-${row.seatId}`}
      data-kind={row.kind}
      data-tour={row.kind === 'kept' ? 'kept-row' : undefined}
    >
      <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: DOT[row.kind] }} aria-hidden />
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate" style={{ color: row.kind === 'released' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{lead}</span>
          <span className="shrink-0 text-right" style={{ color: STATUS_COLOR[row.kind] }}>{row.status}</span>
        </span>
        {row.note && (
          <span className="text-[12px] leading-[16px]" style={{ color: 'var(--text-secondary)' }}>
            {row.note}
          </span>
        )}
      </span>
    </div>
  )
}

export default function GroupStatusList({
  rows,
  declinedNames,
  waitingCount,
  notOpenedCount,
  onReleaseSeat,
  onKeepSeat,
  onCoverSeats,
  onShareReminder,
  canRelease = true,
  className = '',
}: GroupStatusListProps) {
  const hr = <div className="h-px" style={{ backgroundColor: 'var(--divider)' }} />
  return (
    <div className={`w-full flex flex-col ${className}`} data-testid="group-status-list">
      <SectionLabel>Seats</SectionLabel>
      <div className="flex flex-col pt-1 pb-2">
        {rows.map((r) => (
          <Row key={r.key} row={r} />
        ))}
      </div>

      {declinedNames.map((name) => (
        <div key={`declined-${name}`} data-testid={`declined-${name}`} data-tour="cant-make-it-row">
          {hr}
          <div className="pt-3 flex flex-col">
            <span className="text-[14px] leading-[20px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {name} can't make it
            </span>
            <span className="text-[13px] leading-[18px]" style={{ color: 'var(--text-secondary)' }}>
              Release a seat, or keep it for someone else?
            </span>
            <div className="flex items-center gap-2">
              {onReleaseSeat && (
                <Action tone="red" onClick={() => onReleaseSeat(name)} disabled={!canRelease}>
                  Release a seat
                </Action>
              )}
              {onKeepSeat && <Action onClick={() => onKeepSeat(name)}>Keep</Action>}
            </div>
          </div>
        </div>
      ))}

      {waitingCount > 0 && (onCoverSeats || (onShareReminder && notOpenedCount > 0)) && (
        <>
          {hr}
          <div className="pt-3 flex flex-col" data-testid="waiting-row">
            <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>
              {waitingCount} {waitingCount === 1 ? 'seat' : 'seats'} waiting
              {notOpenedCount > 0 && <span style={{ color: 'var(--text-secondary)' }}> · {notOpenedCount} not opened</span>}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {onCoverSeats && <Action onClick={onCoverSeats}>Cover seats</Action>}
              {onShareReminder && notOpenedCount > 0 && (
                <Action tone="red" onClick={onShareReminder} testId="share-reminder">
                  Share a reminder
                </Action>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
