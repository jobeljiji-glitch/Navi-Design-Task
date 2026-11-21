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

/** Script times (10), IST [h, m]. The hold starts at 4:15 PM; halfway (free release ends) is 5:45 PM. */
export const AMIT_AT: [number, number] = [16, 30];
export const SANA_AT: [number, number] = [17, 5];
export const NEHA_AT: [number, number] = [17, 20];
export const RELEASE_AT: [number, number] = [17, 21];
export const HALFWAY_AT: [number, number] = [17, 45];

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
  'showtime',
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

/**
 * A friend opens the link, picks a seat and enters a phone number, then leaves without paying
 * (09: the board shows "Sana · D09 · Opened, not paid"). The 5-min lock runs out.
 */
export function friendOpensOnly(s: BoardState, name: FriendName, r: Reduce = R): BoardState {
  s = r(s, { type: 'FRIEND_OPEN_LINK', name });
  s = r(s, { type: 'FRIEND_PAY', name });
  if (s.friendFlow.sessions[name].screen === 'phone') s = r(s, { type: 'FRIEND_PHONE_SUBMIT', name, phone: '98765 43211' });
  s = r(s, { type: 'FRIEND_BACK', name });
  return r(s, { type: 'ADVANCE_CLOCK', ms: 6 * 60 * 1000 });
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
    // 10: the hold starts at 4:15 PM (3h window); friends act before halfway (5:45 PM)
    case 'amit':
      return friendCompletesPay(friendOpensLink(at(s, ...AMIT_AT, r), 'Amit', r), 'Amit', 'success', r);
    case 'sana':
      return friendCompletesPay(friendOpensLink(at(s, ...SANA_AT, r), 'Sana', r), 'Sana', 'success', r);
    case 'neha':
      return r(at(s, ...NEHA_AT, r), { type: 'FRIEND_CANT_MAKE_IT', name: 'Neha' });
    case 'release':
      return r(at(s, ...RELEASE_AT, r), { type: 'RELEASE_SEATS', seatIds: ['D05'] });
    case 'halfway':
      return at(s, ...HALFWAY_AT, r);
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
    case 'showtime':
      // 9:15 PM: kept seats charged, the rest unblocked once (09)
      return at(s, 21, 15, r);
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

/** Deep-link shorthands: `?at=505` etc. (`202` / `310` are the pre-10 names, kept so old links work.) */
export const AT_PARAM: Record<string, ScriptStep> = {
  hold: 'hold',
  amit: 'amit',
  '430': 'amit',
  '202': 'amit',
  sana: 'sana',
  '505': 'sana',
  '310': 'sana',
  neha: 'neha',
  release: 'release',
  halfway: 'halfway',
  t30: 't30',
  pending: 'priyaPending',
  deadline: 'deadline',
  grace: 'priyaPaid',
  kept: 'grace',
  receipt: 'grace',
  late: 'kabirLate',
  '810': 'grace',
  settled: 'showtime',
  showtime: 'showtime',
};
