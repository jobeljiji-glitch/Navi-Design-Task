import { CheckCircle2, Clock, XCircle, Bell, ShieldCheck } from 'lucide-react'

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
  onReleaseSeat?: () => void
  onKeepSeat?: () => void
  onCoverSeats?: () => void
  onSendReminder?: () => void
  className?: string
}

export default function GroupStatusList({
  paidMembers,
  payingMembers,
  declinedMembers,
  waitingSeatsCount,
  onReleaseSeat,
  onKeepSeat,
  onCoverSeats,
  onSendReminder,
  className = '',
}: GroupStatusListProps) {
  return (
    <div
      className={`w-full bg-bg-surface rounded-[8px] p-4 flex flex-col gap-4 border border-divider shadow-sm ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--divider)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      <h3
        className="text-[15px] leading-[20px] font-semibold text-text-primary"
        style={{ color: 'var(--text-primary)' }}
      >
        Group Member Status
      </h3>

      <div className="flex flex-col gap-3">
        {/* Paid members */}
        {paidMembers.map(m => (
          <div key={m.name} className="flex items-center justify-between text-[14px]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} strokeWidth={2} style={{ color: 'var(--text-success)' }} />
              <span className="font-medium text-text-primary" style={{ color: 'var(--text-primary)' }}>
                {m.name}
              </span>
            </div>
            <span
              className="text-[12px] px-2 py-0.5 rounded font-medium"
              style={{ backgroundColor: 'var(--bg-success)', color: 'var(--text-success)' }}
            >
              Seat {m.seat ?? 'Paid'}
            </span>
          </div>
        ))}

        {/* Paying members (locked) */}
        {payingMembers.map(m => (
          <div key={m.name} className="flex items-center justify-between text-[14px]">
            <div className="flex items-center gap-2">
              <Clock size={16} strokeWidth={2} style={{ color: 'var(--text-warning)' }} className="animate-spin" />
              <span className="font-medium text-text-primary" style={{ color: 'var(--text-primary)' }}>
                {m.name}
              </span>
            </div>
            <span
              className="text-[12px] px-2 py-0.5 rounded font-medium"
              style={{ backgroundColor: 'var(--bg-warning)', color: 'var(--text-warning)' }}
            >
              Paying for {m.seat ?? 'seat'}…
            </span>
          </div>
        ))}

        {/* Declined members ("Can't make it") */}
        {declinedMembers.map(m => (
          <div key={m.name} className="flex flex-col gap-1.5 p-2 rounded bg-bg-muted">
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2">
                <XCircle size={15} strokeWidth={2} style={{ color: 'var(--bms-red)' }} />
                <span className="font-medium text-text-primary" style={{ color: 'var(--text-primary)' }}>
                  {m.name} can't make it
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {onReleaseSeat && (
                <button
                  type="button"
                  onClick={onReleaseSeat}
                  className="text-[12px] px-2.5 py-1 rounded font-medium border"
                  style={{ borderColor: 'var(--bms-red)', color: 'var(--bms-red)' }}
                >
                  Release a seat
                </button>
              )}
              {onKeepSeat && (
                <button
                  type="button"
                  onClick={onKeepSeat}
                  className="text-[12px] px-2.5 py-1 rounded font-medium border"
                  style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}
                >
                  Keep
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Waiting seats count */}
        {waitingSeatsCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-divider">
            <span className="text-[13px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
              {waitingSeatsCount} {waitingSeatsCount === 1 ? 'seat' : 'seats'} waiting
            </span>
            <div className="flex items-center gap-2">
              {onCoverSeats && (
                <button
                  type="button"
                  onClick={onCoverSeats}
                  className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded font-medium border"
                  style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}
                >
                  <ShieldCheck size={13} strokeWidth={2} />
                  <span>Cover seats</span>
                </button>
              )}
              {onSendReminder && (
                <button
                  type="button"
                  onClick={onSendReminder}
                  className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded font-medium border"
                  style={{ borderColor: 'var(--bms-red)', color: 'var(--bms-red)' }}
                >
                  <Bell size={13} strokeWidth={2} />
                  <span>Send reminder</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
