import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DeviceFrame from '@/demo/DeviceFrame'
import MovieDetailScreen from './MovieDetailScreen'
import ShowtimesScreen from './ShowtimesScreen'
import SeatLayoutScreen from './SeatLayoutScreen'
import ConfirmBookingScreen from './ConfirmBookingScreen'
import PaymentScreen from './PaymentScreen'
import HoldSummarySheet from './HoldSummarySheet'
import HoldSuccessScreen from './HoldSuccessScreen'
import type { Seat as LogicSeat } from '@/logic/types'
import { DEMO_SHOW } from '@/logic/seed'
import { selectHoldSheet } from '@/logic/holdFlow'
import { useDemoStore } from '@/store'
import { IosNotification, LoaderSheet, UpiMandateScreen } from '@/ds'
import ChatScreen from '@/screens/chat/ChatScreen'
import { selectLatestFriendNotification, selectShareDraft } from '@/logic/friendFlow'

const DEMO_GROUP = ['D05', 'D06', 'D07', 'D08', 'D09', 'D10']
const ALREADY_HOLDING = "You're already holding seats for this show."
const UPI_OPENING_MS = 600
const CHAT_TO_BOARD_MS = 900

export default function RohanFlow() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = useDemoStore()
  const { dispatch, hold } = state
  const holdView = selectHoldSheet(state)
  const holdPaths = ['/rohan/hold', '/rohan/upi-opening', '/rohan/upi', '/rohan/held', '/rohan/chat', '/rohan/board']
  const activePaths = ['/rohan/held', '/rohan/chat', '/rohan/board']
  const friendNotif = selectLatestFriendNotification(state)
  const [bannerId, setBannerId] = useState<string | null>(null)
  const seenNotif = useRef<string | null | undefined>(undefined)

  // Selected seats state across the booking flow (defaulting to 6 seats: D05-D10)
  const [selectedSeats, setSelectedSeats] = useState<LogicSeat[]>([
    { id: 'D05', row: 'D', num: 5, tier: 'primePlus', price: 25000, state: 'selected' },
    { id: 'D06', row: 'D', num: 6, tier: 'primePlus', price: 25000, state: 'selected' },
    { id: 'D07', row: 'D', num: 7, tier: 'primePlus', price: 25000, state: 'selected' },
    { id: 'D08', row: 'D', num: 8, tier: 'primePlus', price: 25000, state: 'selected' },
    { id: 'D09', row: 'D', num: 9, tier: 'primePlus', price: 25000, state: 'selected' },
    { id: 'D10', row: 'D', num: 10, tier: 'primePlus', price: 25000, state: 'selected' },
  ])

  // Current route extraction
  const path = location.pathname.replace(/\/+$/, '')

  // Calculate total amount in paise from selected seats
  const ticketPaise = selectedSeats.reduce((acc, s) => acc + s.price, 0)
  const feePaise = DEMO_SHOW.fee * selectedSeats.length
  const totalPaise = ticketPaise + feePaise

  // Deep links (screenshots, tutorial "restart from step"): seed the demo hold if the store has none.
  // `?fallback=1` turns bank blocking off first. Lives here, not in screens: DeviceFrame mounts children twice.
  useEffect(() => {
    if (!holdPaths.includes(path)) return
    const s = useDemoStore.getState()
    if (!s.hold) {
      if (new URLSearchParams(location.search).get('fallback') === '1') {
        s.dispatch({ type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false })
      }
      s.dispatch({ type: 'BEGIN_GROUP_HOLD', seatIds: DEMO_GROUP })
      if (path === '/rohan/upi' || path === '/rohan/upi-opening') s.dispatch({ type: 'OPEN_UPI' })
      if (activePaths.includes(path)) {
        s.dispatch({ type: 'OPEN_UPI' })
        s.dispatch({ type: 'APPROVE_HOLD', pin: '0000' })
      }
      if (path === '/rohan/board') {
        const d = selectShareDraft(useDemoStore.getState())
        if (d) s.dispatch({ type: 'SHARE_TO_GROUP', text: `${d.editable}\n${d.locked}` })
      }
    } else if (path === '/rohan/hold' && (s.hold.status === 'active' || s.hold.status === 'resolving')) {
      navigate('/rohan/held', { replace: true })
    }
  }, [path]) // eslint-disable-line react-hooks/exhaustive-deps

  // Friend events reach Rohan as iOS banners (spec §4 step 6 "Simultaneously on Rohan").
  // Only notifications that arrive after mount; the first render just records the latest id.
  useEffect(() => {
    const id = friendNotif?.id ?? null
    if (seenNotif.current === undefined) {
      seenNotif.current = id
      return
    }
    if (id && id !== seenNotif.current) {
      seenNotif.current = id
      setBannerId(id)
    }
  }, [friendNotif?.id])

  // Step 4: after sending in the chat, Rohan lands on the board (placeholder until prompt 06)
  const sentAt = state.friendFlow.share?.sentAt
  useEffect(() => {
    if (path !== '/rohan/chat' || !sentAt) return
    const t = setTimeout(() => navigate('/rohan/board'), CHAT_TO_BOARD_MS)
    return () => clearTimeout(t)
  }, [path, sentAt]) // eslint-disable-line react-hooks/exhaustive-deps

  // Step 3 transition: "Opening your UPI app…" for 600 ms
  useEffect(() => {
    if (path !== '/rohan/upi-opening') return
    const t = setTimeout(() => navigate('/rohan/upi', { replace: true }), UPI_OPENING_MS)
    return () => clearTimeout(t)
  }, [path]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleHoldForGroup = (seatIds: string[]) => {
    dispatch({ type: 'BEGIN_GROUP_HOLD', seatIds })
    const s = useDemoStore.getState()
    if (s.errorMessage && (!s.hold || s.hold.status !== 'draft')) {
      const message = s.errorMessage
      dispatch({ type: 'CLEAR_ERROR' })
      return { message, viewHold: message === ALREADY_HOLDING }
    }
    navigate('/rohan/hold')
    return null
  }

  const seatLayoutCommon = {
    onBack: () => navigate('/rohan/showtimes'),
    onHoldForGroup: handleHoldForGroup,
    onViewHold: () => navigate('/rohan/held'),
    initialSeatCount: 6,
    onPay: (seats: LogicSeat[]) => {
      setSelectedSeats(seats)
      navigate('/rohan/confirm')
    },
  }
  const holdSeatIds = hold?.seatIds ?? DEMO_GROUP

  const renderActiveScreen = () => {
    switch (path) {
      case '/rohan/hold':
        return (
          <SeatLayoutScreen {...seatLayoutCommon} initialSelectedSeatIds={holdSeatIds} initialSeatCount={holdSeatIds.length}>
            <HoldSummarySheet
              isOpen={!!hold && hold.status === 'draft'}
              onClose={() => {
                dispatch({ type: 'CLEAR_ERROR' })
                navigate('/rohan/seats', { state: { selectedSeatIds: holdSeatIds } })
              }}
              onConfirm={() => {
                dispatch({ type: 'OPEN_UPI' })
                navigate('/rohan/upi-opening')
              }}
            />
          </SeatLayoutScreen>
        )

      case '/rohan/upi-opening':
        return (
          <SeatLayoutScreen {...seatLayoutCommon} initialSelectedSeatIds={holdSeatIds} initialSeatCount={holdSeatIds.length}>
            <LoaderSheet isOpen message="Opening your UPI app…" />
          </SeatLayoutScreen>
        )

      case '/rohan/upi':
        if (!holdView) return null
        return (
          <UpiMandateScreen
            mode={holdView.fallback ? 'payment' : 'block'}
            amount={holdView.upiAmount}
            debitedNow={holdView.leavesNow}
            blockEnds={holdView.blockEnds}
            refundLine={`${holdView.perSeat} each time a friend pays`}
            showDetails={`Group hold · ${DEMO_SHOW.filmTitle} · Fri 9:15 PM`}
            onApprove={(pin) => {
              dispatch({ type: 'APPROVE_HOLD', pin })
              navigate('/rohan/held', { replace: true })
            }}
            onDecline={() => {
              dispatch({ type: 'UPI_DECLINED' })
              navigate('/rohan/hold', { replace: true })
            }}
          />
        )

      case '/rohan/held':
        return <HoldSuccessScreen onBack={() => navigate('/rohan/seats')} onOpenChat={() => navigate('/rohan/chat')} />

      case '/rohan/chat':
        return <ChatScreen viewer="Rohan" onBack={() => navigate('/rohan/held')} />

      // Status board: prompt 06. Until then the live hold screen stands in (D-068).
      case '/rohan/board':
        return <HoldSuccessScreen showSms={false} onBack={() => navigate('/rohan/chat')} onOpenChat={() => navigate('/rohan/chat')} />

      case '/rohan/showtimes':
        return (
          <ShowtimesScreen
            onBack={() => navigate('/rohan/movie')}
            onSelectShowtime={() => {
              navigate('/rohan/seats', { state: { fromShowtime: true } })
            }}
          />
        )

      case '/rohan/seat-count':
        return (
          <SeatLayoutScreen
            onBack={() => navigate('/rohan/showtimes')}
            isCountSheetOpenInitially={true}
            initialSeatCount={6}
            onPay={(seats) => {
              setSelectedSeats(seats)
              navigate('/rohan/confirm')
            }}
          />
        )

      case '/rohan/seats': {
        const navState = location.state as { fromShowtime?: boolean; selectedSeatIds?: string[] } | null
        const fromShowtime = Boolean(navState?.fromShowtime)
        const keep = navState?.selectedSeatIds ?? []
        return (
          <SeatLayoutScreen
            key={location.key}
            {...seatLayoutCommon}
            initialSelectedSeatIds={keep}
            initialSeatCount={keep.length || 6}
            isCountSheetOpenInitially={fromShowtime}
          />
        )
      }

      case '/rohan/seats-selected':
        return (
          <SeatLayoutScreen
            {...seatLayoutCommon}
            initialSelectedSeatIds={DEMO_GROUP}
            isCountSheetOpenInitially={false}
          />
        )

      case '/rohan/confirm':
        return (
          <ConfirmBookingScreen
            seats={selectedSeats}
            onBack={() => navigate('/rohan/seats')}
            onContinue={() => navigate('/rohan/payment')}
          />
        )

      case '/rohan/loader':
        return (
          <ConfirmBookingScreen
            seats={selectedSeats}
            showLoaderInitially={true}
            onBack={() => navigate('/rohan/seats')}
            onContinue={() => navigate('/rohan/payment')}
          />
        )

      case '/rohan/payment':
        return (
          <PaymentScreen
            amountPaise={totalPaise}
            onBack={() => navigate('/rohan/confirm')}
            onSelectPayment={(method) => {
              console.log('Selected payment method:', method)
            }}
          />
        )

      case '/rohan':
      case '/rohan/movie':
      default:
        return (
          <MovieDetailScreen
            onBack={() => navigate('/')}
            onBookTickets={() => navigate('/rohan/showtimes')}
          />
        )
    }
  }

  return (
    <DeviceFrame time="11:04">
      {renderActiveScreen()}
      {friendNotif && (
        <IosNotification
          inFrameOverlay
          app="bms"
          title={friendNotif.title}
          body={friendNotif.body}
          visible={bannerId === friendNotif.id}
          onDismiss={() => setBannerId(null)}
          onClick={() => {
            setBannerId(null)
            navigate('/rohan/board')
          }}
        />
      )}
    </DeviceFrame>
  )
}
