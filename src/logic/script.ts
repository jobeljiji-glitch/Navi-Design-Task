/**
 * Spec §1 scripted outcome as named steps. Each step sets the clock (running the timers) and
 * dispatches the same actions the UI does. Used by deep links (06) and the tutorial/controller (07).
 * Pure: give it a reducer-compatible state, get the next state back.
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
  't30',
  'priyaPending',
  'deadline',
  'priyaPaid',
  'grace',
  'kabirLate',
] as const;
export type ScriptStep = (typeof SCRIPT_STEPS)[number];

type Reduce = (s: BoardState, a: BoardFlowAction) => BoardState;

function friendPays(s: BoardState, r: Reduce, name: FriendName, outcome: 'success' | 'pending'): BoardState {
  s = r(s, { type: 'FRIEND_OPEN_LINK', name });
  s = r(s, { type: 'FRIEND_PAY', name });
  if (s.friendFlow.sessions[name].screen === 'phone') s = r(s, { type: 'FRIEND_PHONE_SUBMIT', name, phone: '98765 43210' });
  if (s.friendFlow.sessions[name].screen === 'otp') s = r(s, { type: 'FRIEND_OTP_OK', name });
  s = r(s, { type: 'FRIEND_CHOOSE_UPI', name, app: 'Kite Pay' });
  s = r(s, { type: 'FRIEND_APPROVE', name });
  if (outcome === 'success') s = r(s, { type: 'FRIEND_RESOLVE', name, outcome: 'success' });
  return s;
}

function at(s: BoardState, r: Reduce, h: number, m: number): BoardState {
  const t = ist(h, m);
  return t > s.clock.now ? r(s, { type: 'SET_CLOCK', now: t }) : s;
}

export function applyStep(s: BoardState, step: ScriptStep, r: Reduce = boardFlowReducer): BoardState {
  switch (step) {
    case 'hold': {
      s = r(s, { type: 'BEGIN_GROUP_HOLD', seatIds: DEMO_GROUP });
      s = r(s, { type: 'OPEN_UPI' });
      s = r(s, { type: 'APPROVE_HOLD', pin: '0000' });
      const d = selectShareDraft(s);
      return d ? r(s, { type: 'SHARE_TO_GROUP', text: `${d.editable}\n${d.locked}` }) : s;
    }
    case 'amit':
      return friendPays(at(s, r, 14, 2), r, 'Amit', 'success');
    case 'sana':
      return friendPays(at(s, r, 15, 10), r, 'Sana', 'success');
    case 'neha':
      return r(at(s, r, 15, 30), { type: 'FRIEND_CANT_MAKE_IT', name: 'Neha' });
    case 'release':
      s = r(at(s, r, 15, 31), { type: 'RELEASE_SEATS', seatIds: ['D05'] });
      return r(s, { type: 'DECLINE_KEEP', name: 'Neha' });
    case 't30':
      return at(s, r, 18, 45);
    case 'priyaPending':
      return friendPays(at(s, r, 19, 13), r, 'Priya', 'pending');
    case 'deadline':
      return at(s, r, 19, 15);
    case 'priyaPaid':
      return r(at(s, r, 19, 19), { type: 'FRIEND_RESOLVE', name: 'Priya', outcome: 'success' });
    case 'grace':
      return at(s, r, 19, 25);
    case 'kabirLate': {
      s = at(s, r, 20, 10);
      s = r(s, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' });
      s = r(s, { type: 'FRIEND_LATE_PAY_START', name: 'Kabir' });
      if (s.friendFlow.sessions.Kabir.screen === 'phone') s = r(s, { type: 'FRIEND_PHONE_SUBMIT', name: 'Kabir', phone: '98765 43214' });
      if (s.friendFlow.sessions.Kabir.screen === 'otp') s = r(s, { type: 'FRIEND_OTP_OK', name: 'Kabir' });
      s = r(s, { type: 'FRIEND_CHOOSE_UPI', name: 'Kabir', app: 'Kite Pay' });
      s = r(s, { type: 'FRIEND_APPROVE', name: 'Kabir' });
      return r(s, { type: 'FRIEND_RESOLVE', name: 'Kabir', outcome: 'success' });
    }
  }
}

/** Every step up to and including `step`, starting from a state without a hold. */
export function runScriptTo(s: BoardState, step: ScriptStep, r: Reduce = boardFlowReducer): BoardState {
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
  t30: 't30',
  pending: 'priyaPending',
  deadline: 'deadline',
  grace: 'priyaPaid',
  receipt: 'grace',
  late: 'kabirLate',
  '810': 'grace',
};
