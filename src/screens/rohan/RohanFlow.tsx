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
import { setDemoState, useDemoStore } from '@/store'
import { IosNotification, LoaderSheet, UpiMandateScreen } from '@/ds'
import ChatScreen from '@/screens/chat/ChatScreen'
import BoardScreen, { type BoardSheet } from './BoardScreen'
import ReceiptScreen from './ReceiptScreen'
import OrdersScreen from './OrdersScreen'
import { selectShareDraft } from '@/logic/friendFlow'
import { formatClockIST } from '@/logic/holdFlow'
import { boardFlowReducer, selectRohanBanner, withBoard } from '@/logic/boardFlow'
import { AT_PARAM, ist, runScriptTo } from '@/logic/script'
import { createInitialDemoState } from '@/logic/seed'
import { useInStage } from '@/demo/PhoneRouter'
import { useStageStore } from '@/store/stage'
import type { BoardState } from '@/logic/boardFlow'

const DEMO_GROUP = ['D05', 'D06', 'D07', 'D08', 'D09', 'D10']
const ALREADY_HOLDING = "You're already holding seats for this show."
const UPI_OPENING_MS = 600
const CHAT_TO_BOARD_MS = 900
/** Bank SMS that reach Rohan as banners from here (the approval SMS is shown by the Group hold screen). */
const SMS_KEYS = ['sms-settled-', 'sms-late-refund-', 'sms-add-seat-', 'sms-cancel-']

/** The banner ids RohanFlow treats as already seen (the stage records them across persona switches). */
export function rohanBannerIds(s: BoardState) {
  return {
    notif: selectRohanBanner(s)?.id ?? null,
    sms: s.smsToasts.find((t) => SMS_KEYS.some((k) => t.id.startsWith(k)))?.id ?? null,
  }
}

type Banner = { id: string; app: 'bms' | 'sms'; title: string; body: string; kind?: string }

export default function RohanFlow() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = useDemoStore()
  const { dispatch, hold } = state
  const holdView = selectHoldSheet(state)
  const holdPaths = ['/rohan/hold', '/rohan/upi-opening', '/rohan/upi', '/rohan/held', '/rohan/chat', '/rohan/board', '/rohan/receipt', '/rohan/orders']
  const activePaths = ['/rohan/held', '/rohan/chat', '/rohan/board', '/rohan/receipt', '/rohan/orders']
  const latestNotif = selectRohanBanner(state)
  const latestSms = state.smsToasts.find((t) => SMS_KEYS.some((k) => t.id.startsWith(k))) ?? null
  const [queue, setQueue] = useState<Banner[]>([])
  const [bannerVisible, setBannerVisible] = useState(true)
  // In the demo stage the seen ids outlive this component, so a friend's payment made while
  // Rohan's phone was away still arrives as a banner when the story comes back to him.
  const inStage = useInStage()
  const seenNotif = useRef<string | null | undefined>(inStage ? useStageStore.getState().cursor.notif : undefined)
  const seenSms = useRef<string | null | undefined>(inStage ? useStageStore.getState().cursor.sms : undefined)
  const syncCursor = () => {
    if (inStage) useStageStore.setState({ cursor: { notif: seenNotif.current ?? null, sms: seenSms.current ?? null } })
  }
  const seededFor = useRef<string | null>(null)

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
    if (inStage) return // the stage owns state
    if (!holdPaths.includes(path)) return
    // `?at=310|neha|t30|pending|deadline|grace|receipt|late|810`: replay the spec §1 script up to that step.
    const at = new URLSearchParams(location.search).get('at')
    if (at && AT_PARAM[at]) {
      const key = `${path}|${location.search}`
      if (seededFor.current === key) return
      seededFor.current = key
      let next = runScriptTo(withBoard(createInitialDemoState()), AT_PARAM[at])
      // `&clock=1630`: then move the clock (timers run), e.g. past the free-release time
      const clock = new URLSearchParams(location.search).get('clock') ?? (at === '810' ? '2010' : null)
      if (clock && /^\d{4}$/.test(clock)) {
        next = boardFlowReducer(next, { type: 'SET_CLOCK', now: ist(Number(clock.slice(0, 2)), Number(clock.slice(2))) })
      }
      setDemoState(next)
      // What the script produced is history: no banners for it
      seenNotif.current = selectRohanBanner(next)?.id ?? null
      seenSms.current = next.smsToasts.find((t) => SMS_KEYS.some((k) => t.id.startsWith(k)))?.id ?? null
      // `&play=1`: let the clock reach the end of grace a moment later (settlement animation)
      if (new URLSearchParams(location.search).get('play') === '1') {
        setTimeout(() => {
          const h = useDemoStore.getState().hold
          if (h) useDemoStore.getState().dispatch({ type: 'SET_CLOCK', now: h.graceUntil })
        }, 900)
      }
      return
    }
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
  }, [path, location.search]) // eslint-disable-line react-hooks/exhaustive-deps

  // BMS notifications (friend paid / can't make it / halfway / T−30 / settled / late payer) and bank SMS
  // reach Rohan as iOS banners, one at a time. Only ones that arrive after mount.
  useEffect(() => {
    const id = latestNotif?.id ?? null
    if (seenNotif.current === undefined) {
      seenNotif.current = id
      return
    }
    if (latestNotif && id !== seenNotif.current) {
      seenNotif.current = id
      syncCursor()
      setQueue((q) => [...q, { id: latestNotif.id, app: 'bms', title: latestNotif.title, body: latestNotif.body, kind: latestNotif.type }])
    }
  }, [latestNotif?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = latestSms?.id ?? null
    if (seenSms.current === undefined) {
      seenSms.current = id
      return
    }
    if (latestSms && id !== seenSms.current) {
      seenSms.current = id
      syncCursor()
      setQueue((q) => [...q, { id: latestSms.id, app: 'sms', title: 'OKBANK', body: latestSms.text }])
    }
  }, [latestSms?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const banner = queue[0]
  useEffect(() => setBannerVisible(true), [banner?.id])
  const nextBanner = () => {
    setBannerVisible(false)
    setTimeout(() => setQueue((q) => q.slice(1)), 350)
  }
  const openBanner = (b: Banner) => {
    nextBanner()
    if (b.app === 'sms') return
    if (b.kind === 't30') navigate('/rohan/board?sheet=t30')
    else if (b.kind === 'settled' || b.kind === 'late_paid') navigate('/rohan/receipt')
    else navigate('/rohan/board')
  }

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
    onViewHold: () => navigate('/rohan/board'),
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
        return (
          <HoldSuccessScreen
            onBack={() => navigate('/rohan/seats')}
            onOpenChat={() => navigate('/rohan/chat')}
            onViewGroup={() => navigate('/rohan/board')}
          />
        )

      case '/rohan/chat':
        return <ChatScreen viewer="Rohan" onBack={() => navigate('/rohan/held')} />

      case '/rohan/board': {
        const sheet = new URLSearchParams(location.search).get('sheet') as BoardSheet
        return (
          <BoardScreen
            key={`${location.key}`}
            initialSheet={sheet}
            onBack={() => navigate('/rohan/orders')}
            onOpenChat={() => navigate('/rohan/chat')}
            onSettled={() => navigate('/rohan/receipt', { replace: true })}
          />
        )
      }

      case '/rohan/receipt':
        return <ReceiptScreen onBack={() => navigate('/rohan/orders')} />

      case '/rohan/orders':
        return <OrdersScreen onBack={() => navigate('/rohan/movie')} onOpen={(live) => navigate(live ? '/rohan/board' : '/rohan/receipt')} />

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
    <DeviceFrame time={formatClockIST(state.clock.now).replace(/ [AP]M$/, '')}>
      {renderActiveScreen()}
      {banner && (
        <IosNotification
          key={banner.id}
          inFrameOverlay
          app={banner.app}
          title={banner.title}
          body={banner.body}
          visible={bannerVisible}
          onDismiss={nextBanner}
          onClick={() => openBanner(banner)}
        />
      )}
      {/* Failures #8 and #27 end the hold with an alert (copy from spec §5) */}
      {state.errorMessage && hold?.status === 'cancelled' && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center px-12" style={{ backgroundColor: 'var(--scrim-light)' }}>
          <div role="alertdialog" aria-labelledby="hold-alert" className="w-full max-w-[270px] rounded-[14px] overflow-hidden text-center" style={{ backgroundColor: 'var(--ios-sheet-bg)', fontFamily: 'var(--font-system)' }} data-testid="hold-alert">
            <p id="hold-alert" className="px-4 pt-5 pb-4 text-[15px] leading-[20px]" style={{ color: 'var(--text-primary)' }}>{state.errorMessage}</p>
            <button type="button" onClick={() => dispatch({ type: 'CLEAR_ERROR' })} className="w-full h-11 text-[17px] font-medium" style={{ borderTop: '0.5px solid var(--ios-separator)', color: 'var(--text-link)' }}>OK</button>
          </div>
        </div>
      )}
    </DeviceFrame>
  )
}
