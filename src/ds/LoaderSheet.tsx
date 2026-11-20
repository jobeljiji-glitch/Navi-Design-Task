import BottomSheet from './BottomSheet'

export interface LoaderSheetProps {
  isOpen: boolean
  onClose?: () => void
  message?: string
  subMessage?: string
}

export default function LoaderSheet({
  isOpen,
  onClose = () => {},
  message = 'Confirming your Seats!',
  subMessage,
}: LoaderSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} scrimClose={false}>
      <div className="w-full flex flex-col items-center py-6 gap-4 text-center">
        {/* Animated ticket illustration */}
        <div className="w-[120px] h-[64px] flex items-center justify-center">
          <svg
            width="120"
            height="64"
            viewBox="0 0 120 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-pulse"
            aria-hidden="true"
          >
            {/* Back ticket */}
            <rect
              x="16"
              y="10"
              width="76"
              height="44"
              rx="4"
              fill="var(--bg-success)"
              stroke="var(--seat-available-border)"
              strokeWidth="1.5"
            />
            {/* Front ticket */}
            <rect
              x="28"
              y="16"
              width="76"
              height="44"
              rx="4"
              fill="var(--bg-surface)"
              stroke="var(--screen-tint)"
              strokeWidth="2"
            />
            {/* Ticket cutout notches */}
            <circle cx="28" cy="38" r="4" fill="var(--bg-surface)" />
            <circle cx="104" cy="38" r="4" fill="var(--bg-surface)" />
            {/* Text badge */}
            <rect
              x="48"
              y="28"
              width="36"
              height="18"
              rx="2"
              fill="var(--bg-warning)"
            />
            <text
              x="66"
              y="41"
              fill="var(--bms-red)"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              my
            </text>
          </svg>
        </div>

        {/* Message */}
        <h3
          className="text-[17px] leading-[22px] font-semibold text-text-primary"
          style={{ color: 'var(--text-primary)' }}
        >
          {message}
        </h3>

        {subMessage && (
          <p
            className="text-[13px] leading-[18px] text-text-secondary -mt-2 max-w-[280px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {subMessage}
          </p>
        )}

        {/* 3 pulsing red dots */}
        <div className="flex items-center gap-2 mt-1">
          <div
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: 'var(--bms-red)',
              animationDelay: '0ms',
            }}
          />
          <div
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: 'var(--bms-red)',
              animationDelay: '150ms',
            }}
          />
          <div
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: 'var(--bms-red)',
              animationDelay: '300ms',
            }}
          />
        </div>
      </div>
    </BottomSheet>
  )
}
