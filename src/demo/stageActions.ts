/**
 * 07 stage controller: everything the tour, the panels and the explore chips do.
 * Domain changes go through the real reducer (script.ts sub-steps / store dispatch);
 * this file only sequences them and moves the phone.
 */
import { setDemoState, useDemoStore } from '@/store'
import { useStageStore, type BannerCursor } from '@/store/stage'
import { navPhone } from './PhoneRouter'
import { rohanBannerIds } from '@/screens/rohan/RohanFlow'
import type { BoardState } from '@/logic/boardFlow'
import { formatClockIST } from '@/logic/holdFlow'
import {
  CLOCK_SKIPS,
  MOMENTS,
  TOUR_LENGTH,
  TOUR_STEPS,
  freshState,
  personaOf,
  personaPath,
  startPath,
  tourStateAt,
  type MomentId,
  type Persona,
} from '@/logic/tour'
import { at, beginHold, friendCompletesPay, friendOpensLink, ist, kabirOpens, openUpi, runScriptTo, type Reduce } from '@/logic/script'
import { failureFlowReducer, initialFailure, type FailureFlowAction, type FailureState } from '@/logic/failureFlow'

/** Failures and moments leave the tour (it can't continue from an off-script state). */
export function runFailure(f: Failure) {
  clearTimers()
  dismissInterstitial()
  if (stage().mode !== 'explore') useStageStore.setState({ mode: 'explore' })
  f.run()
}

export const INTERSTITIAL_MS = 1200

const demo = () => useDemoStore.getState()
const stage = () => useStageStore.getState()

let timers: ReturnType<typeof setTimeout>[] = []
function later(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}
function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

function log(text: string) {
  const { log } = stage()
  const id = (log[0]?.id ?? 0) + 1
  useStageStore.setState({ log: [{ id, at: demo().clock.now, text }, ...log].slice(0, 12) })
}

/** Replace domain state wholesale (jumps). No banners for what the replay produced. */
function replaceState(next: BoardState | FailureState, cursor?: BannerCursor) {
  setDemoState(next)
  useStageStore.setState((s) => ({ cursor: cursor ?? rohanBannerIds(next), phoneKey: s.phoneKey + 1 }))
}

/** Apply a pure step to the live state (Rohan sees new banners). */
function applyLive(fn: (s: FailureState) => FailureState) {
  useDemoStore.setState(fn(demo()))
}

function goPhone(path: string, initial = false) {
  if (personaOf(stage().path) === 'Rohan' && stage().path.startsWith('/rohan')) {
    useStageStore.setState({ rohanPath: stage().path })
  }
  useStageStore.setState({ path })
  if (!initial) navPhone(path)
}

function showInterstitial(text: string, then?: () => void) {
  useStageStore.setState({ interstitial: text })
  later(() => {
    if (stage().interstitial === text) dismissInterstitial()
    then?.()
  }, INTERSTITIAL_MS)
}

export function dismissInterstitial() {
  useStageStore.setState({ interstitial: null })
}

// ---------------------------------------------------------------------------
// Tour
// ---------------------------------------------------------------------------

/** Enter step `i` after its predecessor's actions already happened (live). */
function enterLive(i: number) {
  if (i >= TOUR_LENGTH) return finishTour()
  const step = TOUR_STEPS[i]
  useStageStore.setState({ step: i, mode: 'tour' })
  const switching = step.path && personaOf(stage().path) !== step.persona
  if (step.interstitial && switching) {
    showInterstitial(step.interstitial)
    goPhone(step.path!)
  } else if (switching) {
    goPhone(step.path!)
  }
}

/** Jump to the start of step `i` (Back, story list, `?step=`). */
export function jumpTo(i: number) {
  clearTimers()
  dismissInterstitial()
  const clamped = Math.max(0, Math.min(TOUR_LENGTH - 1, i))
  const next = tourStateAt(clamped)
  const step = TOUR_STEPS[clamped]
  // Coming back to Rohan: show what arrived while he was away (as when playing live).
  let cursor: BannerCursor | undefined
  if (step.replayBanners) {
    let k = clamped - 1
    while (k >= 0 && TOUR_STEPS[k].persona !== 'Rohan') k--
    cursor = rohanBannerIds(tourStateAt(k + 1))
  }
  const path = startPath(clamped)
  useStageStore.setState({ mode: 'tour', step: clamped, path, rohanPath: path.startsWith('/rohan') ? path : '/rohan/board' })
  replaceState(next, cursor)
  log(`Tour: step ${clamped + 1} of ${TOUR_LENGTH}`)
}

export function startTour() {
  jumpTo(0)
}

/** Next: perform the step's tap(s) for the user, then move on. */
export function nextStep() {
  const { step: i, mode } = stage()
  if (mode !== 'tour') return
  const step = TOUR_STEPS[i]
  clearTimers()
  dismissInterstitial()
  const [first, ...rest] = step.phases
  if (first) applyLive(first)
  goPhone(step.liveAfter ?? step.after)
  rest.forEach((p, k) => later(() => applyLive(p), (step.phaseDelayMs ?? 1000) * (k + 1)))
  if (step.nextLabel) log(step.nextLabel.replace('⏩ ', ''))
  advanceFrom(i)
}

/** Move from step `i` to `i + 1` once (Next and auto-advance can both ask). */
export function advanceFrom(i: number) {
  const s = stage()
  if (s.mode !== 'tour' || s.step !== i) return
  enterLive(i + 1)
}

export function backStep() {
  const { step } = stage()
  if (step > 0) jumpTo(step - 1)
}

function finishTour() {
  useStageStore.setState({ mode: 'done' })
  if (personaOf(stage().path) !== 'Rohan') {
    showInterstitial("Back on Rohan's phone… 📱")
    goPhone('/rohan/receipt')
  }
  log('Tour finished')
}

export function skipTour() {
  clearTimers()
  dismissInterstitial()
  useStageStore.setState({ mode: 'explore' })
}

export function exploreFreely() {
  clearTimers()
  dismissInterstitial()
  const fromIntro = stage().mode === 'intro'
  useStageStore.setState({ mode: 'explore' })
  if (fromIntro) restartDemo(false)
}

/** Fresh state, Rohan on the movie page. Keeps the current mode unless asked. */
export function restartDemo(toIntro = false) {
  clearTimers()
  dismissInterstitial()
  useStageStore.setState({ path: '/rohan/movie', rohanPath: '/rohan/movie', step: 0, log: [], ...(toIntro ? { mode: 'intro' } : {}) })
  replaceState(freshState())
}

// ---------------------------------------------------------------------------
// Explore
// ---------------------------------------------------------------------------

/** Remount the phone on a given screen (explore deep link `&phone=`). */
export function openPhoneAt(path: string) {
  useStageStore.setState((s) => ({ path, rohanPath: path.startsWith('/rohan') ? path : s.rohanPath, phoneKey: s.phoneKey + 1 }))
}

export function switchPersona(p: Persona) {
  if (personaOf(stage().path) === p) return
  const s = stage()
  const rohanPath = personaOf(s.path) === 'Rohan' ? s.path : s.rohanPath
  useStageStore.setState({ rohanPath })
  goPhone(p === 'Rohan' ? rohanPath : personaPath(p))
  log(`Switched to ${p}'s phone`)
}

export function clockTo(h: number, m: number) {
  const t = ist(h, m)
  if (t <= demo().clock.now) return
  demo().dispatch({ type: 'SET_CLOCK', now: t })
  log(`Clock → ${formatClockIST(t)}`)
}

export function plus15() {
  demo().dispatch({ type: 'ADVANCE_CLOCK', ms: 15 * 60 * 1000 })
  log(`Clock → ${formatClockIST(demo().clock.now)}`)
}

export function clockSkips() {
  const now = demo().clock.now
  return CLOCK_SKIPS.map((c) => ({ ...c, disabled: ist(c.h, c.m) <= now }))
}

export function jumpToMoment(id: MomentId) {
  clearTimers()
  const m = MOMENTS.find((x) => x.id === id)!
  let next = runScriptTo(freshState(), m.step)
  if ('late' in m && m.late) next = kabirOpens(next)
  useStageStore.setState({ mode: 'explore', path: m.path, rohanPath: m.path.startsWith('/rohan') ? m.path : '/rohan/receipt' })
  replaceState(next)
  if ('settle' in m && m.settle) {
    later(() => {
      const h = demo().hold
      if (h) demo().dispatch({ type: 'SET_CLOCK', now: h.graceUntil })
    }, 900)
  }
  log(`Jumped to: ${m.label}`)
}

/** A live group hold exists (most failures need one). */
function ensureHold() {
  const h = demo().hold
  if (h && (h.status === 'active' || h.status === 'resolving')) return
  replaceState(runScriptTo(freshState(), 'hold'))
}

export type FailureGroup = 'Before the hold' | 'Paying for the hold' | 'Friends paying' | 'After the deadline'
export const FAILURE_GROUPS: FailureGroup[] = ['Before the hold', 'Paying for the hold', 'Friends paying', 'After the deadline']

export interface Failure {
  id: string
  group: FailureGroup
  label: string
  run: () => void
}

/** Failures go through the full reducer stack (08: failure layer on top), so its timers run too. */
const FR = failureFlowReducer as unknown as Reduce
const fr = (s: FailureState, a: FailureFlowAction) => failureFlowReducer(s, a)
const fresh = (): FailureState => ({ ...freshState(), failure: initialFailure() })

/** Rohan on the seat layout, seats selected, a limit in place: tap "Hold for group". */
function limitFailure(path: string, prep: (s: FailureState) => FailureState, text: string) {
  replaceState(prep(fresh()))
  toRohan(path)
  log(text)
}

/** A draft hold (sheet or approval screen), optionally down the payment ladder or with an approval outcome. */
function draftFailure(prep: (s: FailureState) => FailureState, path: string, text: string) {
  replaceState(prep(fresh()))
  toRohan(path)
  log(text)
}

/** Spec §5 failures (★ and the rest the logic supports), triggered with the real actions. */
export const FAILURES: Failure[] = [
  // --- Before the hold ---------------------------------------------------
  {
    id: 'under-3h',
    group: 'Before the hold',
    label: 'Less than 3 h to the show (#1)',
    run: () =>
      limitFailure('/rohan/seats-selected', (s) => fr(s, { type: 'SET_DEMO_SETTINGS', patch: { is3HoursBeforeShow: true } }), 'Show is less than 3 h away. Tap Hold for group.'),
  },
  {
    id: 'cap',
    group: 'Before the hold',
    label: 'Group holds full, high demand (#2)',
    run: () =>
      limitFailure(
        '/rohan/seats-selected',
        (s) => fr(fr(s, { type: 'CONTROLLER_SET_DEMAND_TIER', tier: 'high' }), { type: 'SET_DEMO_SETTINGS', patch: { showHoldsPct: 15 } }),
        'High-demand show: group holds already cover 15% of the seats left. Tap Hold for group.',
      ),
  },
  {
    id: 'second-hold',
    group: 'Before the hold',
    label: 'Second hold on the same show (#3)',
    run: () => {
      replaceState(runScriptTo(fresh(), 'hold', FR))
      toRohan('/rohan/seats-selected?seats=C05,C06,C07,C08,C09,C10')
      log('Rohan already holds D05–D10 and picks C05–C10. Tap Hold for group.')
    },
  },
  {
    id: 'two-holds',
    group: 'Before the hold',
    label: '2 holds running on the account',
    run: () =>
      limitFailure(
        '/rohan/seats-selected',
        (s) => fr(s, { type: 'SET_DEMO_SETTINGS', patch: { userAccountsActiveHoldCount: 2 } }),
        'Rohan already has 2 group holds for other shows. Tap Hold for group.',
      ),
  },
  {
    id: 'two-seats',
    group: 'Before the hold',
    label: 'Fewer than 3 seats',
    run: () => limitFailure('/rohan/seats-selected?seats=D07,D08', (s) => s, 'Only 2 seats: Hold for group is hidden.'),
  },
  // --- Paying for the hold ------------------------------------------------
  {
    id: 'no-blocking',
    group: 'Paying for the hold',
    label: "Bank can't block (#4, #5)",
    run: () =>
      draftFailure(
        (s) => beginHold(fr(s, { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false }), FR) as FailureState,
        '/rohan/hold',
        "Rohan's bank has no UPI Reserve Pay: hold it on his card instead",
      ),
  },
  {
    id: 'no-card',
    group: 'Paying for the hold',
    label: 'No card hold either (#4)',
    run: () =>
      draftFailure(
        (s) =>
          beginHold(
            fr(fr(s, { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false }), { type: 'CONTROLLER_TOGGLE_CARD_HOLD', supported: false }),
            FR,
          ) as FailureState,
        '/rohan/hold',
        'No block, no card hold: pay for all 6 now, refunded as each friend pays',
      ),
  },
  {
    id: 'upi-declined',
    group: 'Paying for the hold',
    label: 'UPI block declined (#6)',
    run: () =>
      draftFailure((s) => fr(openUpi(beginHold(s, FR), FR) as FailureState, { type: 'UPI_DECLINED' }), '/rohan/hold', "Rohan's bank declined the block"),
  },
  {
    id: 'bank-timeout',
    group: 'Paying for the hold',
    label: "Bank doesn't respond",
    run: () =>
      draftFailure(
        (s) => fr(openUpi(beginHold(s, FR), FR) as FailureState, { type: 'SET_NEXT_APPROVAL', outcome: 'timeout' }),
        '/rohan/upi',
        "Rohan's bank will time out. Approve with any PIN.",
      ),
  },
  {
    id: 'own-fails',
    group: 'Paying for the hold',
    label: 'Own payment fails, block works (#7)',
    run: () =>
      draftFailure(
        (s) => fr(openUpi(beginHold(s, FR), FR) as FailureState, { type: 'SET_NEXT_APPROVAL', outcome: 'own_fails' }),
        '/rohan/upi',
        "Rohan's payment for D07 will fail. Approve with any PIN.",
      ),
  },
  {
    id: 'cancel-block',
    group: 'Paying for the hold',
    label: 'Rohan cancels the block in UPI (#8)',
    run: () => {
      ensureHold()
      demo().dispatch({ type: 'CONTROLLER_ROHAN_CANCELS_BLOCK' })
      toRohan('/rohan/board')
      log('Rohan cancelled his block in the UPI app')
    },
  },
  // --- Friends paying -------------------------------------------------------
  {
    id: 'conflict',
    group: 'Friends paying',
    label: 'Two friends pick the same seat (#10)',
    run: () => {
      ensureHold()
      applyLive((s) => friendOpensLink(s, 'Sana', FR) as FailureState)
      const seat = demo().friendFlow.sessions.Sana.seatId ?? 'D09'
      demo().dispatch({ type: 'FRIEND_LOCK_SEAT', friendName: 'Kabir', seatId: seat })
      toFriend('Sana')
      log(`Kabir and Sana tapped ${seat} at the same time`)
    },
  },
  {
    id: 'friend-fails',
    group: 'Friends paying',
    label: "A friend's bank declines (#12)",
    run: () => {
      ensureHold()
      applyLive((s) =>
        fr(friendCompletesPay(friendOpensLink(s, 'Priya', FR), 'Priya', 'pending', FR) as FailureState, { type: 'FRIEND_RESOLVE', name: 'Priya', outcome: 'fail' }),
      )
      toFriend('Priya')
      log("Priya's bank declined her payment")
    },
  },
  {
    id: 'cant-make-it',
    group: 'Friends paying',
    label: "Neha can't make it (#17)",
    run: () => {
      ensureHold()
      demo().dispatch({ type: 'FRIEND_CANT_MAKE_IT', name: 'Neha' })
      toRohan('/rohan/board')
      log("Neha tapped Can't make it")
    },
  },
  {
    id: 'pending',
    group: 'Friends paying',
    label: 'Payment pending at the deadline (#19)',
    run: () => {
      ensureHold()
      applyLive((s) => at(friendCompletesPay(friendOpensLink(at(s, 19, 13, FR), 'Priya', FR), 'Priya', 'pending', FR), 19, 15, FR) as FailureState)
      toRohan('/rohan/board')
      log("Priya's payment is still with her bank at 7:15 PM")
    },
  },
  // --- After the deadline ---------------------------------------------------
  {
    id: 'nobody',
    group: 'After the deadline',
    label: 'Nobody responds (#20)',
    run: () => {
      ensureHold()
      applyLive((s) => at(s, 19, 15, FR) as FailureState)
      toRohan('/rohan/receipt')
      log('Deadline passed with nobody paying: unpaid seats kept')
    },
  },
  {
    id: 'late',
    group: 'After the deadline',
    label: 'Kabir pays late (#23)',
    run: () => jumpToMoment('late'),
  },
  {
    id: 'showtime-pending',
    group: 'After the deadline',
    label: 'Late payment pending at showtime',
    run: () => showtimePending('success'),
  },
  {
    id: 'showtime-expired',
    group: 'After the deadline',
    label: 'Late payment not confirmed in time',
    run: () => showtimePending('expire'),
  },
  {
    id: 'after-show',
    group: 'After the deadline',
    label: 'Link opened after the show (#25)',
    run: () => {
      let s = runScriptTo(fresh(), 'grace', FR) as FailureState
      s = at(s, 21, 20, FR) as FailureState
      s = friendOpensLink(s, 'Kabir', FR) as FailureState
      replaceState(s)
      useStageStore.setState({ rohanPath: '/rohan/receipt' })
      toFriend('Kabir')
      log('Kabir opens the link at 9:20 PM, after the show started')
    },
  },
  {
    id: 'cinema',
    group: 'After the deadline',
    label: 'Cinema cancels the show (#27)',
    run: () => {
      ensureHold()
      demo().dispatch({ type: 'CONTROLLER_CINEMA_CANCELS_SHOW' })
      toRohan('/rohan/board')
      log('The cinema cancelled the show')
    },
  },
]

/** Kabir pays for the kept seat at 9:14 PM; at 9:15 the show starts with his bank still confirming. */
function showtimePending(outcome: 'success' | 'expire') {
  let s = kabirOpens(runScriptTo(fresh(), 'grace', FR), FR) as FailureState
  s = at(s, 21, 14, FR) as FailureState
  s = fr(s, { type: 'SET_NEXT_PAYMENT_OUTCOME', outcome: 'pending' })
  s = fr(s, { type: 'FRIEND_LATE_PAY_START', name: 'Kabir' })
  if (s.friendFlow.sessions.Kabir.screen === 'phone') s = fr(s, { type: 'FRIEND_PHONE_SUBMIT', name: 'Kabir', phone: '98765 43214' })
  if (s.friendFlow.sessions.Kabir.screen === 'otp') s = fr(s, { type: 'FRIEND_OTP_OK', name: 'Kabir' })
  s = fr(s, { type: 'FRIEND_CHOOSE_UPI', name: 'Kabir', app: 'Kite Pay' })
  s = fr(s, { type: 'FRIEND_APPROVE', name: 'Kabir' })
  s = at(s, 21, 15, FR) as FailureState
  replaceState(s)
  useStageStore.setState({ rohanPath: '/rohan/receipt' })
  toFriend('Kabir')
  log("9:15 PM: the show starts while Kabir's bank is still confirming D06")
  later(() => {
    if (outcome === 'success') {
      demo().dispatch({ type: 'SET_CLOCK', now: ist(21, 17) })
      demo().dispatch({ type: 'SET_NEXT_PAYMENT_OUTCOME', outcome: 'success' })
      demo().dispatch({ type: 'FRIEND_RESOLVE', name: 'Kabir', outcome: 'success' })
      log("9:17 PM: Kabir's bank confirmed. D06 is his; Rohan refunded")
    } else {
      demo().dispatch({ type: 'SET_CLOCK', now: ist(21, 25) })
      demo().dispatch({ type: 'SET_NEXT_PAYMENT_OUTCOME', outcome: 'success' })
      log("9:25 PM: Kabir's bank never confirmed. Not charged; Rohan still has D06")
    }
  }, 3500)
}

function toRohan(path: string) {
  useStageStore.setState({ rohanPath: path })
  goPhone(path)
}
function toFriend(name: Persona) {
  goPhone(personaPath(name))
}
