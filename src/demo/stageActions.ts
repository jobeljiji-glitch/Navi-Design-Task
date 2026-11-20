/**
 * 07 stage controller: everything the tour, the panels and the explore chips do.
 * Domain changes go through the real reducer (script.ts sub-steps / store dispatch);
 * this file only sequences them and moves the phone.
 */
import { useDemoStore } from '@/store'
import { useStageStore, type BannerCursor } from '@/store/stage'
import { navPhone } from './PhoneRouter'
import { rohanBannerIds } from '@/screens/rohan/RohanFlow'
import { boardFlowReducer, type BoardState } from '@/logic/boardFlow'
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
import { at, beginHold, friendCompletesPay, friendOpensLink, ist, kabirOpens, runScriptTo } from '@/logic/script'

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
function replaceState(next: BoardState, cursor?: BannerCursor) {
  useDemoStore.setState(next)
  useStageStore.setState((s) => ({ cursor: cursor ?? rohanBannerIds(next), phoneKey: s.phoneKey + 1 }))
}

/** Apply a pure step to the live state (Rohan sees new banners). */
function applyLive(fn: (s: BoardState) => BoardState) {
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

export interface Failure {
  id: string
  label: string
  run: () => void
}

/** Spec §5 ★ failures, triggered with the real actions. */
export const FAILURES: Failure[] = [
  {
    id: 'no-blocking',
    label: "Bank can't block (#4)",
    run: () => {
      useStageStore.setState({ path: '/rohan/hold', rohanPath: '/rohan/hold' })
      let s = freshState()
      s = boardFlowReducer(s, { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false })
      s = beginHold(s)
      replaceState(s)
      log("Bank doesn't support blocking: pay all now, refunds as friends pay")
    },
  },
  {
    id: 'cancel-block',
    label: 'Rohan cancels the block in UPI (#8)',
    run: () => {
      ensureHold()
      demo().dispatch({ type: 'CONTROLLER_ROHAN_CANCELS_BLOCK' })
      toRohan('/rohan/board')
      log('Rohan cancelled his block in the UPI app')
    },
  },
  {
    id: 'conflict',
    label: 'Two friends pick the same seat (#10)',
    run: () => {
      ensureHold()
      applyLive((s) => friendOpensLink(s, 'Sana'))
      const seat = demo().friendFlow.sessions.Sana.seatId ?? 'D09'
      demo().dispatch({ type: 'FRIEND_LOCK_SEAT', friendName: 'Kabir', seatId: seat })
      toFriend('Sana')
      log(`Kabir and Sana tapped ${seat} at the same time`)
    },
  },
  {
    id: 'cant-make-it',
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
    label: 'Payment pending at the deadline (#19)',
    run: () => {
      ensureHold()
      applyLive((s) => at(friendCompletesPay(friendOpensLink(at(s, 19, 13), 'Priya'), 'Priya', 'pending'), 19, 15))
      toRohan('/rohan/board')
      log("Priya's payment is still with her bank at 7:15 PM")
    },
  },
  {
    id: 'nobody',
    label: 'Nobody responds (#20)',
    run: () => {
      ensureHold()
      applyLive((s) => at(s, 19, 15))
      toRohan('/rohan/receipt')
      log('Deadline passed with nobody paying: unpaid seats kept')
    },
  },
  {
    id: 'late',
    label: 'Kabir pays late (#23)',
    run: () => jumpToMoment('late'),
  },
  {
    id: 'cinema',
    label: 'Cinema cancels the show (#27)',
    run: () => {
      ensureHold()
      demo().dispatch({ type: 'CONTROLLER_CINEMA_CANCELS_SHOW' })
      toRohan('/rohan/board')
      log('The cinema cancelled the show')
    },
  },
]

function toRohan(path: string) {
  useStageStore.setState({ rohanPath: path })
  goPhone(path)
}
function toFriend(name: Persona) {
  goPhone(personaPath(name))
}
