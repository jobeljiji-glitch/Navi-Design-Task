import { ChevronLeft } from 'lucide-react'
import { BookingCard } from '@/ds'
import { useDemoStore } from '@/store'
import { selectOrderCard } from '@/logic/boardFlow'

/** "Your Bookings & Purchases" (ref 14) with the group-hold card. Tap: board while live, receipt after. */
export default function OrdersScreen({ onBack, onOpen }: { onBack?: () => void; onOpen?: (live: boolean) => void }) {
  const state = useDemoStore()
  const card = selectOrderCard(state)
  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative select-none" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} data-testid="orders">
      <header className="flex items-center px-4 h-[54px] shrink-0">
        <button type="button" onClick={onBack} className="w-11 h-11 -ml-2.5 flex items-center justify-center active:opacity-70" aria-label="Back">
          <ChevronLeft size={24} strokeWidth={1.75} />
        </button>
        <h1 className="text-[20px] leading-[26px] font-normal ml-0.5 truncate">Your Bookings &amp; Purchases</h1>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-1 pb-sab flex flex-col gap-4 no-scrollbar [&>*]:shrink-0">
        {card ? (
          <BookingCard
            movieTitle={card.movieTitle}
            language={card.language}
            showtime={card.showtime}
            cinema={card.cinema}
            seats={card.seats}
            screen={card.screen}
            status={card.status}
            statusMessage={card.statusMessage}
            orderedDate={card.orderedDate}
            onClick={() => onOpen?.(card.live)}
          />
        ) : (
          <p className="text-[14px] pt-6 text-center" style={{ color: 'var(--text-secondary)' }}>No bookings yet</p>
        )}
      </div>
    </div>
  )
}
