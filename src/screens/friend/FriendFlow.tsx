import { useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import DeviceFrame from '@/demo/DeviceFrame'
import { useDemoStore } from '@/store'
import { formatClockIST } from '@/logic/holdFlow'
import { friendFromParam, selectShareDraft, suggestedSeat, type AppAction, type FriendName, type FriendScreen } from '@/logic/friendFlow'
import ChatScreen from '@/screens/chat/ChatScreen'
import FriendPayScreen from './FriendPayScreen'
import {
  FriendApproveScreen,
  FriendDeclinedScreen,
  FriendEndedScreen,
  FriendPendingScreen,
  FriendPhoneScreen,
  FriendTicketScreen,
  FriendUpiChoiceScreen,
  UPI_APPS,
} from './FriendCheckoutScreens'

const DEMO_GROUP = ['D05', 'D06', 'D07', 'D08', 'D09', 'D10']
/** Simulated bank round-trip before a pending payment resolves (real time). */
const BANK_MS = 1600

type Dispatch = (a: AppAction) => void

/** Runs a friend's whole payment (used by `?after=` to set up "Amit already paid"). */
function payAll(dispatch: Dispatch, name: FriendName) {
  dispatch({ type: 'FRIEND_OPEN_LINK', name })
  dispatch({ type: 'FRIEND_PAY', name })
  dispatch({ type: 'FRIEND_PHONE_SUBMIT', name, phone: '98765 43210' })
  dispatch({ type: 'FRIEND_OTP_OK', name })
  dispatch({ type: 'FRIEND_CHOOSE_UPI', name, app: UPI_APPS[0].name })
  dispatch({ type: 'FRIEND_APPROVE', name })
  dispatch({ type: 'FRIEND_RESOLVE', name, outcome: 'success' })
}

/** Deep link `?screen=`: walk the real actions up to that screen, so the store is consistent. */
function advanceTo(dispatch: Dispatch, name: FriendName, screen: FriendScreen) {
  if (screen === 'chat') return dispatch({ type: 'FRIEND_GOTO', name, screen: 'chat' })
  dispatch({ type: 'FRIEND_OPEN_LINK', name })
  if (screen === 'pay') return
  if (screen === 'declined') return dispatch({ type: 'FRIEND_CANT_MAKE_IT', name })
  dispatch({ type: 'FRIEND_PAY', name })
  const s = () => useDemoStore.getState().friendFlow.sessions[name].screen
  if (screen === 'phone') return
  if (s() === 'phone') dispatch({ type: 'FRIEND_PHONE_SUBMIT', name, phone: '98765 43210' })
  if (screen === 'otp') return
  if (s() === 'otp') dispatch({ type: 'FRIEND_OTP_OK', name })
  if (screen === 'upi') return
  dispatch({ type: 'FRIEND_CHOOSE_UPI', name, app: UPI_APPS[1].name })
  if (screen === 'approve') return
  if (screen === 'pending') dispatch({ type: 'SET_NEXT_PAYMENT_OUTCOME', outcome: 'pending' })
  dispatch({ type: 'FRIEND_APPROVE', name })
  if (screen === 'failed') dispatch({ type: 'FRIEND_RESOLVE', name, outcome: 'fail' })
  if (screen === 'ticket') dispatch({ type: 'FRIEND_RESOLVE', name, outcome: 'success' })
}

export default function FriendFlow() {
  const { name: param } = useParams()
  const location = useLocation()
  const name = friendFromParam(param)
  const state = useDemoStore()
  const session = name ? state.friendFlow.sessions[name] : null
  const hold = state.hold
  const live = !!hold && (hold.status === 'active' || hold.status === 'resolving')

  // Deep links and seeding. Lives here, not in screens: DeviceFrame mounts children twice (D-037).
  // The ref keeps it to once per URL, even when StrictMode runs effects twice in dev.
  const seededFor = useRef<string | null>(null)
  useEffect(() => {
    if (!name) return
    const key = `${name}|${location.search}`
    if (seededFor.current === key) return
    seededFor.current = key
    const q = new URLSearchParams(location.search)
    const { dispatch } = useDemoStore.getState()
    let s = useDemoStore.getState()
    const isLive = s.hold && (s.hold.status === 'active' || s.hold.status === 'resolving')
    if (!isLive) {
      dispatch({ type: 'BEGIN_GROUP_HOLD', seatIds: DEMO_GROUP })
      if (q.get('assigned') === '1') dispatch({ type: 'SET_ASSIGN_MODE', mode: 'assigned' })
      dispatch({ type: 'OPEN_UPI' })
      dispatch({ type: 'APPROVE_HOLD', pin: '0000' })
    }
    s = useDemoStore.getState()
    if (!s.friendFlow.share?.sent) {
      const d = selectShareDraft(s)
      if (d) dispatch({ type: 'SHARE_TO_GROUP', text: `${d.editable}\n${d.locked}` })
    }
    if (q.get('loggedIn') === '1') dispatch({ type: 'SET_FRIEND_LOGGED_IN', loggedIn: true })
    for (const other of (q.get('after') ?? '').split(',')) {
      const f = friendFromParam(other)
      if (f && f !== name) payAll(dispatch, f)
    }
    if (q.get('fail') === '1') dispatch({ type: 'SET_NEXT_PAYMENT_OUTCOME', outcome: 'fail' })
    if (q.get('pending') === '1') dispatch({ type: 'SET_NEXT_PAYMENT_OUTCOME', outcome: 'pending' })
    const screen = q.get('screen') as FriendScreen | null
    if (screen) advanceTo(dispatch, name, screen)
    if (q.get('conflict') === '1') {
      // Failure #10: another friend starts paying for the seat this friend was about to take.
      dispatch({ type: 'FRIEND_OPEN_LINK', name })
      const seat = useDemoStore.getState().friendFlow.sessions[name].seatId ?? suggestedSeat(useDemoStore.getState(), name)
      const other = name === 'Kabir' ? 'Sana' : 'Kabir'
      if (seat) dispatch({ type: 'FRIEND_LOCK_SEAT', friendName: other, seatId: seat })
    }
  }, [name, location.search])

  // The bank answers after BANK_MS unless the demo holds the payment pending.
  const screen = session?.screen
  const nextOutcome = state.friendFlow.nextOutcome
  useEffect(() => {
    if (!name || screen !== 'pending' || nextOutcome === 'pending') return
    const t = setTimeout(() => useDemoStore.getState().dispatch({ type: 'FRIEND_RESOLVE', name }), BANK_MS)
    return () => clearTimeout(t)
  }, [name, screen, nextOutcome])

  const time = formatClockIST(state.clock.now).replace(/ [AP]M$/, '')

  const render = () => {
    if (!name || !session) {
      return (
        <div className="h-full flex items-center justify-center text-[14px]" style={{ color: 'var(--text-secondary)' }}>
          Unknown friend
        </div>
      )
    }
    const dispatch = state.dispatch
    switch (session.screen) {
      case 'chat':
        return <ChatScreen viewer={name} onPreviewClick={() => dispatch({ type: 'FRIEND_OPEN_LINK', name })} />
      case 'ticket':
        return <FriendTicketScreen name={name} />
      case 'declined':
        return <FriendDeclinedScreen name={name} />
      case 'pending':
      case 'failed':
        return <FriendPendingScreen name={name} />
      default:
        break
    }
    if (!live) return <FriendEndedScreen name={name} />
    switch (session.screen) {
      case 'phone':
      case 'otp':
        return <FriendPhoneScreen key={session.screen} name={name} />
      case 'upi':
        return <FriendUpiChoiceScreen name={name} />
      case 'approve':
        return <FriendApproveScreen name={name} />
      case 'pay':
      default:
        return <FriendPayScreen name={name} />
    }
  }

  return <DeviceFrame time={time}>{render()}</DeviceFrame>
}
