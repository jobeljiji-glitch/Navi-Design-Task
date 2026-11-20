import { Lock, Check } from 'lucide-react'

export type SeatState =
  | 'available'
  | 'selected'
  | 'sold'
  | 'held'
  | 'locked'
  | 'paying'
  | 'paid_owner'
  | 'paid_friend'
  | 'covered'
  | 'kept'
  | 'released'

export interface SeatProps {
  id?: string
  num?: number | string
  state: SeatState
  payerName?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export default function Seat({
  id,
  num,
  state,
  payerName,
  onClick,
  disabled = false,
  className = '',
}: SeatProps) {
  const isInteractive =
    !disabled &&
    (state === 'available' ||
      state === 'selected' ||
      state === 'held' ||
      state === 'locked')

  const getStyle = () => {
    switch (state) {
      case 'available':
        return {
          backgroundColor: 'transparent',
          border: '1px solid var(--seat-available-border)',
          color: 'var(--seat-number)',
        }
      case 'selected':
        return {
          backgroundColor: 'var(--seat-selected)',
          border: '1px solid var(--seat-selected)',
          color: 'var(--text-on-brand)',
        }
      case 'sold':
      case 'released':
        return {
          backgroundColor: 'var(--seat-sold)',
          border: '1px solid var(--seat-sold)',
          color: 'var(--seat-sold-text)',
        }
      case 'held':
        return {
          backgroundColor: 'var(--seat-held-fill)',
          border: '1px dashed var(--seat-held-border)',
          color: 'var(--text-warning)',
        }
      case 'locked':
        return {
          backgroundColor: 'var(--seat-paying-fill)',
          border: '1px solid var(--seat-held-border)',
          color: 'var(--text-warning)',
        }
      case 'paying':
        return {
          backgroundColor: 'var(--seat-paying-fill)',
          border: '1px solid var(--seat-held-border)',
          color: 'var(--text-warning)',
        }
      case 'paid_owner':
        return {
          backgroundColor: 'var(--seat-selected)',
          border: '1px solid var(--seat-selected)',
          color: 'var(--text-on-brand)',
        }
      case 'paid_friend':
        return {
          backgroundColor: 'var(--seat-paid-friend)',
          border: '1px solid var(--seat-paid-friend)',
          color: 'var(--text-on-brand)',
        }
      case 'covered':
        return {
          backgroundColor: 'var(--seat-selected)',
          border: '1px solid var(--seat-selected)',
          color: 'var(--text-on-brand)',
        }
      case 'kept':
        return {
          backgroundColor: 'var(--seat-selected)',
          border: '1px solid var(--seat-selected)',
          color: 'var(--text-on-brand)',
        }
      default:
        return {}
    }
  }

  const renderContent = () => {
    if (state === 'locked') {
      return <Lock size={10} strokeWidth={2.5} />
    }
    if (state === 'covered') {
      return <Check size={11} strokeWidth={2.5} />
    }
    if (state === 'paid_owner') {
      return 'You'
    }
    if (state === 'paid_friend' && payerName) {
      return payerName.slice(0, 2)
    }
    if (state === 'kept') {
      return 'K'
    }
    return num != null ? String(num).padStart(2, '0') : ''
  }

  return (
    <button
      type="button"
      id={id}
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      className={`relative w-[20px] h-[20px] rounded-[3px] flex items-center justify-center text-[9px] leading-none font-normal select-none transition-transform active:scale-95 ${
        isInteractive ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
      } ${state === 'paying' ? 'animate-pulse' : ''} ${className}`}
      style={getStyle()}
      aria-label={`Seat ${num ?? ''} (${state}${payerName ? `: ${payerName}` : ''})`}
      title={payerName ? `${num ?? ''} - ${payerName}` : undefined}
    >
      {renderContent()}
    </button>
  )
}
