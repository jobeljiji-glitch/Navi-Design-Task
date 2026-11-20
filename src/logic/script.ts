/**
 * Spec §1 scripted outcome as named steps. Each step sets the clock (running the timers) and
 * dispatches the same actions the UI does. Used by deep links (06) and the tutorial/controller (07).
 * Pure: give it a reducer-compatible state, get the next state back.
 *
 * The small sub-steps (beginHold, openUpi, …) are the single taps the guided tour (07) performs
 * one at a time; `applyStep` composes them, so the tour and the script can't drift apart.
 */
import { boardFlowReducer, type BoardFlowAction, type BoardState } from './boardFlow';
import { selectShareDraft, type FriendName } from './friendFlow';

/** IST wall-clock time on the show day (Fri, 20 Nov 2026) as epoch ms. */
export function ist(h: number, m: number): number {
  return Date.UTC(2026, 10, 20, h - 5, m - 30, 0);
}

export const DEMO_GROUP = ['D05', 'D06', 'D07', 'D08', 'D09', 'D10'];

export const SCRIPT_STEPS = [
  'hold',
  'amit',
  'sana',
  'neha',
  'release',
  'halfway',
  't30',
  'priyaPending',
  'deadline',
  'priyaPaid',
  'grace',
  'kabirLate',
] as const;
export type ScriptStep = (typeof SCRIPT_STEPS)[number];

export type Reduce = (s: BoardState, a: BoardFlowAction) => BoardState;
const R: Reduce = boardFlowReducer;

// ---------------------------------------------------------------------------
// Sub-steps (one tap each)
// ---------------------------------------------------------------------------

/** Move the clock forward to h:m IST (timers run). Never backwards. */
export function at(s: BoardState, h: number, m: number, r: Reduce = R): BoardState {
  const t = ist(h, m);
  return t > s.clock.now ? r(s, { type: 'SET_CLOCK', now: t }) : s;
}

/** Rohan taps "Hold for group" with D05–D10 selected. */
export function beginHold(s: BoardState, r: Reduce = R): BoardState {
  return r(s, { type: 'BEGIN_GROUP_HOLD', seatIds: DEMO_GROUP });
}

/** Rohan taps the hold sheet's CTA (opens the UPI app). */
export function openUpi(s: BoardState, r: Reduce = R): BoardState {
  return r(s, { type: 'OPEN_UPI' });
}

/** Rohan enters his UPI PIN. */
export function approveHold(s: BoardState, r: Reduce = R): BoardState {
  return r(s, { type: 'APPROVE_HOLD', pin: '0000' });
}

/** Rohan sends the default share message to the group chat. */
export function shareToGroup(s: BoardState, r: Reduce = R): BoardState {
  const d = selectShareDraft(s);
  return d ? r(s, { type: 'SHARE_TO_GROUP', text: `${d.editable}\n${d.locked}` }) : s;
}

/** A friend taps Rohan's link in the chat. */
export function friendOpensLink(s: BoardState, name: FriendName, r: Reduce = R): BoardState {
  return r(s, { type: 'FRIEND_OPEN_LINK', name });
}

/** From the pay page: Pay → phone → OTP → UPI app → approve (→ bank says yes). */
export function friendCompletesPay(
  s: BoardState,
  name: FriendName,
  outcome: 'success' | 'pending' = 'success',
  r: Reduce = R,
): BoardState {
  s = r(s, { type: 'FRIEND_PAY', name });
  if (s.friendFlow.sessions[name].screen === 'phone') s = r(s, { type: 'FRIEND_PHONE_SUBMIT', name, phone: '98765 43210' });
  if (s.friendFlow.sessions[name].screen === 'otp') s = r(s, { type: 'FRIEND_OTP_OK', name });
  s = r(s, { type: 'FRIEND_CHOOSE_UPI', name, app: 'Kite Pay' });
  s = r(s, { type: 'FRIEND_APPROVE', name });
  if (outcome === 'success') s = r(s, { type: 'FRIEND_RESOLVE', name, outcome: 'success' });
  return s;
}

/** Kabir opens the link at 8:10 PM (kept-seat page). */
export function kabirOpens(s: BoardState, r: Reduce = R): BoardState {
  return r(at(s, 20, 10, r), { type: 'FRIEND_OPEN_LINK', name: 'Kabir' });
}

/** Kabir pays for the kept seat from the late page. */
export function kabirPays(s: BoardState, r: Reduce = R): BoardState {
  s = r(s, { type: 'FRIEND_LATE_PAY_START', name: 'Kabir' });
  if (s.friendFlow.sessions.Kabir.screen === 'phone') s = r(s, { type: 'FRIEND_PHONE_SUBMIT', name: 'Kabir', phone: '98765 43214' });
  if (s.friendFlow.sessions.Kabir.screen === 'otp') s = r(s, { type: 'FRIEND_OTP_OK', name: 'Kabir' });
  s = r(s, { type: 'FRIEND_CHOOSE_UPI', name: 'Kabir', app: 'Kite Pay' });
  s = r(s, { type: 'FRIEND_APPROVE', name: 'Kabir' });
  return r(s, { type: 'FRIEND_RESOLVE', name: 'Kabir', outcome: 'success' });
}

// ---------------------------------------------------------------------------
// Named steps (spec §1)
// ---------------------------------------------------------------------------

export function applyStep(s: BoardState, step: ScriptStep, r: Reduce = R): BoardState {
  switch (step) {
    case 'hold':
      return shareToGroup(approveHold(openUpi(beginHold(s, r), r), r), r);
    case 'amit':
      return friendCompletesPay(friendOpensLink(at(s, 14, 2, r), 'Amit', r), 'Amit', 'success', r);
    case 'sana':
      return friendCompletesPay(friendOpensLink(at(s, 15, 10, r), 'Sana', r), 'Sana', 'success', r);
    case 'neha':
      return r(at(s, 15, 30, r), { type: 'FRIEND_CANT_MAKE_IT', name: 'Neha' });
    case 'release':
      return r(at(s, 15, 31, r), { type: 'RELEASE_SEATS', seatIds: ['D05'] });
    case 'halfway':
      return at(s, 16, 15, r);
    case 't30':
      return at(s, 18, 45, r);
    case 'priyaPending':
      return friendCompletesPay(friendOpensLink(at(s, 19, 13, r), 'Priya', r), 'Priya', 'pending', r);
    case 'deadline':
      return at(s, 19, 15, r);
    case 'priyaPaid':
      return r(at(s, 19, 19, r), { type: 'FRIEND_RESOLVE', name: 'Priya', outcome: 'success' });
    case 'grace':
      return at(s, 19, 25, r);
    case 'kabirLate':
      return kabirPays(kabirOpens(s, r), r);
  }
}

/** Every step up to and including `step`, starting from a state without a hold. */
export function runScriptTo(s: BoardState, step: ScriptStep, r: Reduce = R): BoardState {
  for (const st of SCRIPT_STEPS) {
    s = applyStep(s, st, r);
    if (st === step) break;
  }
  return s;
}

/** Deep-link shorthands: `?at=310` etc. */
export const AT_PARAM: Record<string, ScriptStep> = {
  hold: 'hold',
  '202': 'amit',
  '310': 'sana',
  neha: 'neha',
  release: 'release',
  halfway: 'halfway',
  t30: 't30',
  pending: 'priyaPending',
  deadline: 'deadline',
  grace: 'priyaPaid',
  receipt: 'grace',
  late: 'kabirLate',
  '810': 'grace',
};
