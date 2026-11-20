/**
 * Friend flow (prompt 05): spec §4 steps 4–6, §5 failures 9–17.
 *
 * Wraps `holdFlowReducer` (which wraps the frozen `demoReducer`) with:
 * - the share step (Rohan sends the link to the group chat),
 * - one session per friend (which screen they're on, chosen seat(s), phone),
 * - seat picking with the 5-min lock, conflict, multi-seat payment,
 *   pending / failed / success, and "Can't make it".
 *
 * The session lives in the store (not React) because DeviceFrame mounts its children
 * twice and the tutorial (prompt 07) has to drive these screens.
 *
 * Pure: no React, no Date.now(), no randomness. Time comes from state.clock.
 */
import { formatINR, seatPrice } from './money';
import { formatClockIST, GROUP_LINK, holdFlowReducer, relativeDayIST, type FlowAction } from './holdFlow';
import { DEMO_HOLD_START_MS } from './seed';
import { SEAT_LOCK_DURATION_MS } from './rules';
import type { DemoState, FriendPayment, NotificationItem, Seat } from './types';

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

export const FRIENDS = ['Amit', 'Sana', 'Priya', 'Neha', 'Kabir'] as const;
export type FriendName = (typeof FRIENDS)[number];
export type ChatViewer = 'Rohan' | FriendName;

/** Spec §1 scripted outcome: each friend's seat. Used as the suggested seat and as the assigned-mode map. */
export const SCRIPTED_SEATS: Record<FriendName, string> = { Amit: 'D08', Sana: 'D09', Priya: 'D10', Neha: 'D05', Kabir: 'D06' };

/** Fictional demo numbers, shown pre-filled on the phone step. */
export const DEMO_PHONES: Record<FriendName, string> = {
  Amit: '98765 43210',
  Sana: '98765 43211',
  Priya: '98765 43212',
  Neha: '98765 43213',
  Kabir: '98765 43214',
};

export const CINEMA_SHORT = 'Cineplex Kurla';
export const LINK_DOMAIN = 'bms.link';
export const CHAT_TITLE = 'Friday movie';

export function friendFromParam(param: string | undefined): FriendName | null {
  if (!param) return null;
  const hit = FRIENDS.find((f) => f.toLowerCase() === param.toLowerCase());
  return hit ?? null;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type FriendScreen = 'chat' | 'pay' | 'phone' | 'otp' | 'upi' | 'approve' | 'pending' | 'failed' | 'ticket' | 'declined';
export type PaymentOutcome = 'success' | 'fail' | 'pending';

export interface FriendSession {
  screen: FriendScreen;
  seatId: string | null;
  extra: number;
  phone: string;
  verified: boolean;
  upiApp: string | null;
  conflict: string | null;
}

export interface FriendFlowSlice {
  loggedIn: boolean;
  nextOutcome: PaymentOutcome;
  share: { sent: boolean; text: string; sentAt: number } | null;
  sessions: Record<FriendName, FriendSession>;
}

export type AppState = DemoState & { friendFlow: FriendFlowSlice };

export function initialSession(): FriendSession {
  return { screen: 'chat', seatId: null, extra: 0, phone: '', verified: false, upiApp: null, conflict: null };
}

export function initialFriendFlow(): FriendFlowSlice {
  return {
    loggedIn: false,
    nextOutcome: 'success',
    share: null,
    sessions: { Amit: initialSession(), Sana: initialSession(), Priya: initialSession(), Neha: initialSession(), Kabir: initialSession() },
  };
}

export function withFriendFlow(state: DemoState): AppState {
  return { ...state, friendFlow: initialFriendFlow() };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type FriendFlowAction =
  | { type: 'SHARE_TO_GROUP'; text: string }
  | { type: 'FRIEND_OPEN_LINK'; name: FriendName }
  | { type: 'FRIEND_PICK_SEAT'; name: FriendName; seatId: string }
  | { type: 'FRIEND_SET_EXTRA'; name: FriendName; count: number }
  | { type: 'FRIEND_PAY'; name: FriendName }
  | { type: 'FRIEND_PHONE_SUBMIT'; name: FriendName; phone: string }
  | { type: 'FRIEND_OTP_OK'; name: FriendName }
  | { type: 'FRIEND_CHOOSE_UPI'; name: FriendName; app: string }
  | { type: 'FRIEND_APPROVE'; name: FriendName }
  | { type: 'FRIEND_RESOLVE'; name: FriendName; outcome?: PaymentOutcome }
  | { type: 'FRIEND_RETRY'; name: FriendName }
  | { type: 'FRIEND_CANT_MAKE_IT'; name: FriendName }
  | { type: 'FRIEND_BACK'; name: FriendName }
  | { type: 'FRIEND_GOTO'; name: FriendName; screen: FriendScreen }
  | { type: 'FRIEND_CLEAR_CONFLICT'; name: FriendName }
  | { type: 'SET_FRIEND_LOGGED_IN'; loggedIn: boolean }
  | { type: 'SET_NEXT_PAYMENT_OUTCOME'; outcome: PaymentOutcome };

export type AppAction = FlowAction | FriendFlowAction;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Conflict copy (failure #10). Never names the other person: they haven't paid (D-064). */
export function conflictCopy(seatId: string): string {
  return `Someone's paying for ${seatId} right now. Pick another seat.`;
}

function isHoldLive(state: DemoState): boolean {
  const h = state.hold;
  return !!h && (h.status === 'active' || h.status === 'resolving');
}

function perSeat(state: DemoState): number {
  const hold = state.hold!;
  return seatPrice(state.seats[hold.ownerSeatId], state.show.fee);
}

function sortedHoldSeats(state: DemoState): Seat[] {
  if (!state.hold) return [];
  return state.hold.seatIds
    .map((id) => state.seats[id])
    .filter((s): s is Seat => !!s)
    .sort((a, b) => (a.row === b.row ? a.num - b.num : a.row.localeCompare(b.row)));
}

/** Someone else holds this seat right now (5-min lock still running, or their payment is with the bank). */
export function isTakenByOther(seat: Seat | undefined, name: string, now: number): boolean {
  if (!seat) return false;
  if (seat.lockedBy === name) return false;
  if (seat.state === 'paying') return true;
  return seat.state === 'locked' && !!seat.lockedUntil && seat.lockedUntil > now;
}

/** Free for this friend: held, or locked by them, or locked by someone whose lock has expired. */
export function isFreeFor(seat: Seat | undefined, name: string, now: number): boolean {
  if (!seat) return false;
  if (seat.state === 'held') return true;
  if (seat.state === 'locked') return !isTakenByOther(seat, name, now);
  return false;
}

function setSession(state: AppState, name: FriendName, patch: Partial<FriendSession>): AppState {
  return {
    ...state,
    friendFlow: {
      ...state.friendFlow,
      sessions: { ...state.friendFlow.sessions, [name]: { ...state.friendFlow.sessions[name], ...patch } },
    },
  };
}

function log(state: AppState, type: string, description: string): AppState {
  const now = state.clock.now;
  return {
    ...state,
    controllerLog: [{ id: `log-${now}-${type}-${state.controllerLog.length}`, at: now, type, description }, ...state.controllerLog],
  };
}

/** The friend's live payment (locked / pending / failed). */
function openPayment(state: DemoState, name: string): FriendPayment | undefined {
  return state.friendPayments.find((p) => p.name === name && (p.status === 'locked' || p.status === 'pending' || p.status === 'failed'));
}

export function hasPaid(state: DemoState, name: string): boolean {
  return state.friendPayments.some((p) => p.name === name && p.status === 'success');
}

export function hasDeclined(state: DemoState, name: string): boolean {
  return state.declines.some((d) => d.name === name);
}

/** Suggested seat: the scripted one if free, otherwise the free seat nearest the organiser's seat. */
export function suggestedSeat(state: DemoState, name: FriendName): string | null {
  const hold = state.hold;
  if (!hold) return null;
  const now = state.clock.now;
  const scripted = state.seats[SCRIPTED_SEATS[name]];
  if (hold.seatIds.includes(SCRIPTED_SEATS[name]) && isFreeFor(scripted, name, now)) return scripted.id;
  const owner = state.seats[hold.ownerSeatId];
  const free = sortedHoldSeats(state).filter((s) => isFreeFor(s, name, now));
  if (free.length === 0) return null;
  free.sort((a, b) => Math.abs(a.num - owner.num) - Math.abs(b.num - owner.num) || b.num - a.num);
  return free[0].id;
}

/** Seats the friend pays for: the chosen seat plus `extra` nearest free seats (right first on a tie). */
export function chosenSeats(state: AppState, name: FriendName): string[] {
  const session = state.friendFlow.sessions[name];
  if (!session.seatId) return [];
  const main = state.seats[session.seatId];
  if (!main) return [];
  const now = state.clock.now;
  const free = sortedHoldSeats(state)
    .filter((s) => s.id !== main.id && isFreeFor(s, name, now))
    .sort((a, b) => Math.abs(a.num - main.num) - Math.abs(b.num - main.num) || b.num - a.num);
  const extras = free.slice(0, session.extra).map((s) => s.id);
  return formatOrder(state, [main.id, ...extras]);
}

function formatOrder(state: DemoState, ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const sa = state.seats[a];
    const sb = state.seats[b];
    return sa.row === sb.row ? sa.num - sb.num : sa.row.localeCompare(sb.row);
  });
}

export function maxExtra(state: AppState, name: FriendName): number {
  const session = state.friendFlow.sessions[name];
  const now = state.clock.now;
  return sortedHoldSeats(state).filter((s) => s.id !== session.seatId && isFreeFor(s, name, now)).length;
}

function seatsText(ids: string[]): string {
  return ids.join(', ');
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

/** RESTART_DEMO returns a fresh DemoState without the slice: reset the friend slice with it. */
function ensureSlice(next: DemoState): AppState {
  return (next as AppState).friendFlow ? (next as AppState) : withFriendFlow(next);
}

export function friendFlowReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SHARE_TO_GROUP': {
      if (!isHoldLive(state)) return state;
      const now = state.clock.now;
      const s: AppState = { ...state, friendFlow: { ...state.friendFlow, share: { sent: true, text: action.text, sentAt: now } } };
      return log(s, 'LINK_SHARED', `Rohan shared ${GROUP_LINK} to ${CHAT_TITLE}`);
    }

    case 'FRIEND_OPEN_LINK': {
      const { name } = action;
      if (hasPaid(state, name)) return setSession(state, name, { screen: 'ticket' });
      if (hasDeclined(state, name)) return setSession(state, name, { screen: 'declined' });
      const session = state.friendFlow.sessions[name];
      const keep = session.seatId && isFreeFor(state.seats[session.seatId], name, state.clock.now);
      return setSession(state, name, { screen: 'pay', seatId: keep ? session.seatId : suggestedSeat(state, name), conflict: null });
    }

    case 'FRIEND_PICK_SEAT': {
      const { name, seatId } = action;
      if (!state.hold?.seatIds.includes(seatId)) return state;
      const seat = state.seats[seatId];
      const now = state.clock.now;
      if (isTakenByOther(seat, name, now)) {
        const session = state.friendFlow.sessions[name];
        return setSession(state, name, { conflict: conflictCopy(seatId), seatId: session.seatId === seatId ? null : session.seatId });
      }
      if (!isFreeFor(seat, name, now)) return state;
      const s = setSession(state, name, { seatId, conflict: null });
      return setSession(s, name, { extra: Math.min(s.friendFlow.sessions[name].extra, maxExtra(s, name)) });
    }

    case 'FRIEND_SET_EXTRA': {
      const count = Math.max(0, Math.min(action.count, maxExtra(state, action.name)));
      return setSession(state, action.name, { extra: count });
    }

    case 'FRIEND_CLEAR_CONFLICT':
      return setSession(state, action.name, { conflict: null });

    case 'FRIEND_PAY': {
      const { name } = action;
      if (!isHoldLive(state)) return state;
      const ids = chosenSeats(state, name);
      if (ids.length === 0) return state;
      const now = state.clock.now;
      const taken = ids.find((id) => isTakenByOther(state.seats[id], name, now));
      if (taken) {
        const session = state.friendFlow.sessions[name];
        return setSession(state, name, { conflict: conflictCopy(taken), seatId: session.seatId === taken ? null : session.seatId, extra: 0 });
      }
      const seats = { ...state.seats };
      for (const id of ids) {
        seats[id] = { ...seats[id], state: 'locked', lockedBy: name, lockedUntil: now + SEAT_LOCK_DURATION_MS };
      }
      // Seats this friend locked before but no longer wants go back to the block.
      for (const id of state.hold!.seatIds) {
        const s = seats[id];
        if (!ids.includes(id) && s.state === 'locked' && s.lockedBy === name) {
          seats[id] = { ...s, state: 'held', lockedBy: undefined, lockedUntil: undefined };
        }
      }
      const session = state.friendFlow.sessions[name];
      const payment: FriendPayment = {
        id: `pmt-${name}-${now}`,
        name,
        phone: session.phone,
        seatIds: ids,
        status: 'locked',
        at: now,
        amountPaise: ids.reduce((sum, id) => sum + seatPrice(seats[id], state.show.fee), 0),
      };
      const others = state.friendPayments.filter((p) => !(p.name === name && (p.status === 'locked' || p.status === 'failed')));
      let s: AppState = { ...state, seats, friendPayments: [payment, ...others] };
      const skipPhone = state.friendFlow.loggedIn || session.verified;
      s = setSession(s, name, { screen: skipPhone ? 'upi' : 'phone', conflict: null });
      return log(s, 'FRIEND_LOCKED', `${name} locked ${seatsText(ids)} for 5 min`);
    }

    case 'FRIEND_PHONE_SUBMIT': {
      const s = setSession(state, action.name, { phone: action.phone, screen: 'otp' });
      return { ...s, friendPayments: s.friendPayments.map((p) => (p.name === action.name && p.status === 'locked' ? { ...p, phone: action.phone } : p)) };
    }

    case 'FRIEND_OTP_OK':
      return setSession(state, action.name, { verified: true, screen: 'upi' });

    case 'FRIEND_CHOOSE_UPI':
      return setSession(state, action.name, { upiApp: action.app, screen: 'approve' });

    case 'FRIEND_APPROVE': {
      const { name } = action;
      const payment = openPayment(state, name);
      if (!payment || !isHoldLive(state)) return state;
      const now = state.clock.now;
      const lost = payment.seatIds.find((id) => !isFreeFor(state.seats[id], name, now));
      if (lost) {
        // Failure #13: lock ran out and someone else took the seat. Back to the map; no money moved.
        const s = { ...state, friendPayments: state.friendPayments.filter((p) => p.id !== payment.id) };
        return setSession(s, name, { screen: 'pay', seatId: null, extra: 0, conflict: conflictCopy(lost) });
      }
      const seats = { ...state.seats };
      for (const id of payment.seatIds) {
        seats[id] = { ...seats[id], state: 'paying', lockedBy: name, lockedUntil: now + SEAT_LOCK_DURATION_MS };
      }
      let s: AppState = {
        ...state,
        seats,
        friendPayments: state.friendPayments.map((p) => (p.id === payment.id ? { ...p, status: 'pending' as const, at: now } : p)),
      };
      s = setSession(s, name, { screen: 'pending' });
      return log(s, 'FRIEND_PAYING', `${name} is paying ${formatINR(payment.amountPaise)} for ${seatsText(payment.seatIds)}`);
    }

    case 'FRIEND_RESOLVE': {
      const { name } = action;
      const payment = state.friendPayments.find((p) => p.name === name && p.status === 'pending');
      if (!payment) return state;
      const outcome = action.outcome ?? state.friendFlow.nextOutcome;
      if (outcome === 'pending') return state;
      const now = state.clock.now;
      const seats = { ...state.seats };

      if (outcome === 'fail') {
        // Failure #12: the seats stay theirs for another 5 minutes.
        for (const id of payment.seatIds) {
          seats[id] = { ...seats[id], state: 'locked', lockedBy: name, lockedUntil: now + SEAT_LOCK_DURATION_MS };
        }
        let s: AppState = {
          ...state,
          seats,
          friendPayments: state.friendPayments.map((p) => (p.id === payment.id ? { ...p, status: 'failed' as const } : p)),
        };
        s = setSession(s, name, { screen: 'failed' });
        return log(s, 'FRIEND_PAYMENT_FAILED', `${name}'s payment for ${seatsText(payment.seatIds)} failed`);
      }

      for (const id of payment.seatIds) {
        seats[id] = { ...seats[id], state: 'paid_friend', payerName: name, lockedBy: undefined, lockedUntil: undefined };
      }
      const fallback = state.hold?.paymentRail === 'pay_and_refund';
      const amount = formatINR(payment.amountPaise);
      const notif: NotificationItem = {
        id: `notif-paid-${name}-${now}`,
        title: `${name}'s in! 🎉`,
        body: fallback
          ? `${name} paid for ${seatsText(payment.seatIds)}. ${amount} is on its way back to you.`
          : `${name} paid for ${seatsText(payment.seatIds)}. ${amount} unblocked from your account.`,
        at: now,
        read: false,
        type: 'friend_paid',
      };
      let s: AppState = {
        ...state,
        seats,
        friendPayments: state.friendPayments.map((p) => (p.id === payment.id ? { ...p, status: 'success' as const, at: now } : p)),
        notifications: [notif, ...state.notifications],
      };
      s = setSession(s, name, { screen: 'ticket', conflict: null });
      return log(s, 'FRIEND_PAID', `${name} paid ${amount} for ${seatsText(payment.seatIds)}`);
    }

    case 'FRIEND_RETRY': {
      const { name } = action;
      const payment = openPayment(state, name);
      const now = state.clock.now;
      if (payment && payment.seatIds.every((id) => isFreeFor(state.seats[id], name, now))) {
        return setSession(state, name, { screen: 'approve' });
      }
      return setSession(state, name, { screen: 'pay' });
    }

    case 'FRIEND_CANT_MAKE_IT': {
      const { name } = action;
      if (hasDeclined(state, name) || hasPaid(state, name)) return setSession(state, name, { screen: hasPaid(state, name) ? 'ticket' : 'declined' });
      let s = holdFlowReducer(state, { type: 'FRIEND_DECLINE', friendName: name }) as AppState;
      // Tag the organiser's notification so Rohan's phone shows it (only Rohan is notified).
      s = { ...s, notifications: s.notifications.map((n, i) => (i === 0 ? { ...n, type: 'friend_declined' } : n)) };
      const seats = { ...s.seats };
      for (const id of s.hold?.seatIds ?? []) {
        const seat = seats[id];
        if (seat.state === 'locked' && seat.lockedBy === name) seats[id] = { ...seat, state: 'held', lockedBy: undefined, lockedUntil: undefined };
      }
      s = { ...s, seats, friendPayments: s.friendPayments.filter((p) => !(p.name === name && (p.status === 'locked' || p.status === 'failed'))) };
      return setSession(s, name, { screen: 'declined', seatId: null, extra: 0, conflict: null });
    }

    case 'FRIEND_BACK': {
      const { name } = action;
      const screen = state.friendFlow.sessions[name].screen;
      const back: Partial<Record<FriendScreen, FriendScreen>> = {
        pay: 'chat',
        phone: 'pay',
        otp: 'phone',
        upi: 'pay',
        approve: 'upi',
        failed: 'pay',
        ticket: 'chat',
        declined: 'chat',
      };
      return setSession(state, name, { screen: back[screen] ?? screen });
    }

    case 'FRIEND_GOTO':
      return setSession(state, action.name, { screen: action.screen });

    case 'SET_FRIEND_LOGGED_IN':
      return { ...state, friendFlow: { ...state.friendFlow, loggedIn: action.loggedIn } };

    case 'SET_NEXT_PAYMENT_OUTCOME':
      return { ...state, friendFlow: { ...state.friendFlow, nextOutcome: action.outcome } };

    default:
      return ensureSlice(holdFlowReducer(state, action));
  }
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Everyone who has paid, in order: Rohan first, then friends by payment time. */
export function selectPayers(state: DemoState): Array<{ name: string; seatIds: string[] }> {
  const hold = state.hold;
  if (!hold) return [];
  const rohanSeats = sortedHoldSeats(state)
    .filter((s) => s.state === 'paid_owner' || s.state === 'covered' || s.state === 'kept')
    .map((s) => s.id);
  const out: Array<{ name: string; seatIds: string[] }> = [];
  if (rohanSeats.length) out.push({ name: hold.organiser.name, seatIds: rohanSeats });
  const paid = state.friendPayments.filter((p) => p.status === 'success').sort((a, b) => a.at - b.at);
  for (const p of paid) {
    const existing = out.find((o) => o.name === p.name);
    if (existing) existing.seatIds.push(...p.seatIds);
    else out.push({ name: p.name, seatIds: [...p.seatIds] });
  }
  return out;
}

/** "Rohan", "Rohan and Amit", "Rohan, Amit and Sana" */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function payerOf(seat: Seat | undefined, organiser: string): string | null {
  if (!seat) return null;
  if (seat.state === 'paid_owner' || seat.state === 'covered' || seat.state === 'kept') return organiser;
  if (seat.state === 'paid_friend') return seat.payerName ?? null;
  return null;
}

export type FriendTileKind = 'available' | 'selected' | 'taken' | 'paying' | 'released';

export interface FriendTile {
  id: string;
  kind: FriendTileKind;
  caption: string;
  tappable: boolean;
}

export interface FriendPageView {
  live: boolean;
  alreadyPaid: boolean;
  declined: boolean;
  kicker: string;
  film: string;
  meta: string;
  avatars: string[];
  whoNames: string;
  whoRest: string;
  pickTitle: string;
  assigned: boolean;
  tiles: FriendTile[];
  conflict: string | null;
  seatIds: string[];
  seatLabel: string;
  price: string;
  priceSub: string;
  heldUntil: string;
  cancellation: string;
  cta: string;
  ctaEnabled: boolean;
  extra: number;
  maxExtra: number;
  perSeat: string;
  endedTitle: string;
}

export function selectFriendPage(state: AppState, name: FriendName): FriendPageView | null {
  const hold = state.hold;
  if (!hold) return null;
  const now = state.clock.now;
  const session = state.friendFlow.sessions[name];
  const per = perSeat(state);
  const organiser = hold.organiser.name;
  const payers = selectPayers(state);
  const unpaidLeft = sortedHoldSeats(state).filter((s) => s.state === 'held' || s.state === 'locked' || s.state === 'paying').length;
  const assigned = hold.assignMode === 'assigned';
  const ids = chosenSeats(state, name);
  const selected = new Set(ids);
  const assignedNameFor = (seatId: string): string => (Object.entries(SCRIPTED_SEATS).find(([, id]) => id === seatId)?.[0] ?? '');

  // A seat this friend picked earlier that someone else is now paying for (e.g. two friends tap at once).
  const selectedTaken = session.seatId && isTakenByOther(state.seats[session.seatId], name, now) ? session.seatId : null;

  const tiles: FriendTile[] = sortedHoldSeats(state).map((s) => {
    const payer = payerOf(s, organiser);
    if (payer) return { id: s.id, kind: 'taken', caption: payer === name ? 'You' : payer, tappable: false };
    if (s.state === 'released') return { id: s.id, kind: 'released', caption: '', tappable: false };
    if (isTakenByOther(s, name, now)) return { id: s.id, kind: 'paying', caption: 'Paying', tappable: true };
    if (selected.has(s.id) && !selectedTaken) return { id: s.id, kind: 'selected', caption: assigned ? assignedNameFor(s.id) || 'You' : 'You', tappable: true };
    return { id: s.id, kind: 'available', caption: assigned ? assignedNameFor(s.id) : '', tappable: true };
  });

  const validIds = selectedTaken ? [] : ids;
  const n = validIds.length;
  const deadline = formatClockIST(hold.deadline);
  const day = relativeDayIST(hold.deadline, now);
  const amount = formatINR(per * Math.max(n, 1));
  const whoNames = joinNames(payers.map((p) => p.name));

  return {
    live: hold.status === 'active' || hold.status === 'resolving',
    alreadyPaid: hasPaid(state, name),
    declined: hasDeclined(state, name),
    kicker: `${organiser} is holding seats for you`,
    film: state.show.filmTitle,
    meta: `Fri, ${formatClockIST(state.show.startsAt)} · ${state.show.cinemaName}`,
    avatars: payers.map((p) => p.name),
    whoNames: payers.length ? `${whoNames} ${payers.length === 1 ? 'is' : 'are'} in` : '',
    whoRest: `${unpaidLeft} ${unpaidLeft === 1 ? 'seat' : 'seats'} left`,
    pickTitle: assigned ? 'Which one is you?' : 'Pick your seat',
    assigned,
    tiles,
    conflict: session.conflict ?? (selectedTaken ? conflictCopy(selectedTaken) : null),
    seatIds: validIds,
    seatLabel: n > 1 ? `Your seats ${seatsText(validIds)}` : n === 1 ? `Your seat ${validIds[0]}` : 'Your seat',
    price: n ? formatINR(per * n) : formatINR(per),
    priceSub: 'incl. fees',
    heldUntil: `Held for you until ${deadline}${day ? ` ${day}` : ''}`,
    cancellation: "Cancellation: Cinema's rules apply",
    cta: n ? `Pay ${amount} for ${seatsText(validIds)}` : 'Pick a seat',
    ctaEnabled: n > 0 && (hold.status === 'active' || hold.status === 'resolving'),
    extra: n ? n - 1 : 0,
    maxExtra: session.seatId && !selectedTaken ? maxExtra(state, name) : 0,
    perSeat: formatINR(per),
    endedTitle: 'This hold has ended.',
  };
}

export interface FriendCheckoutView {
  seatIds: string[];
  seats: string;
  amount: string;
  phoneTitle: string;
  phoneSub: string;
  demoPhone: string;
  otpTitle: string;
  payWith: string;
  upiDetails: string;
  pendingTitle: string;
  pendingBody: string;
  failedTitle: string;
  failedBody: string;
}

export function selectFriendCheckout(state: AppState, name: FriendName): FriendCheckoutView {
  const payment = state.friendPayments.find((p) => p.name === name && p.status !== 'refunded');
  const ids = payment?.seatIds ?? chosenSeats(state, name);
  const seats = seatsText(ids);
  const amountPaise = payment?.amountPaise ?? (state.hold ? perSeat(state) * Math.max(ids.length, 1) : 0);
  const amount = formatINR(amountPaise);
  const many = ids.length > 1;
  return {
    seatIds: ids,
    seats,
    amount,
    phoneTitle: 'Your phone number',
    phoneSub: 'Your ticket is sent here',
    demoPhone: DEMO_PHONES[name],
    otpTitle: 'Enter the 4-digit code',
    payWith: `Pay ${amount} with`,
    upiDetails: `${seats} · ${state.show.filmTitle} · Fri, ${formatClockIST(state.show.startsAt)}`,
    pendingTitle: 'Confirming with your bank',
    pendingBody: `${seats} ${many ? 'stay' : 'stays'} yours while we wait, even past the deadline.`,
    failedTitle: "Payment didn't go through",
    failedBody: `Payment didn't go through. ${seats} ${many ? 'are' : 'is'} still yours for 5 minutes.`,
  };
}

export interface FriendTicketView {
  headline: string;
  film: string;
  meta: string;
  dateLine: string;
  cinema: string;
  seatLine: string;
  groupLine: string;
  qrValue: string;
  seats: string;
  amount: string;
  screen: string;
}

export function selectFriendTicket(state: AppState, name: FriendName): FriendTicketView | null {
  const hold = state.hold;
  const payment = [...state.friendPayments].filter((p) => p.name === name && p.status === 'success').sort((a, b) => a.at - b.at)[0];
  if (!hold || !payment) return null;
  const organiser = hold.organiser.name;
  const own = new Set(payment.seatIds);
  const ownSeats = payment.seatIds.map((id) => state.seats[id]);
  // Neighbour: payer of the seat just left of the friend's seats, else just right.
  const byNum = new Map(sortedHoldSeats(state).map((s) => [`${s.row}${s.num}`, s]));
  const left = ownSeats.map((s) => byNum.get(`${s.row}${s.num - 1}`)).find((s) => s && !own.has(s.id));
  const right = ownSeats.map((s) => byNum.get(`${s.row}${s.num + 1}`)).find((s) => s && !own.has(s.id));
  const neighbour = payerOf(left, organiser) ?? payerOf(right, organiser);
  const payers = selectPayers(state);
  const paidSeats = payers.reduce((n, p) => n + p.seatIds.length, 0);
  const names = [...payers.filter((p) => p.name !== name).map((p) => p.name), 'you'];
  const count = payment.seatIds.length;
  const seats = seatsText(payment.seatIds);
  const amount = formatINR(payment.amountPaise);
  const tier = state.seats[payment.seatIds[0]]?.tier === 'primePlus' ? 'PP' : 'PR';
  return {
    headline: neighbour ? `You're in, next to ${neighbour}` : "You're in",
    film: state.show.filmTitle,
    meta: `${state.show.language}, ${state.show.format}`,
    dateLine: `Fri, 20 Nov | ${formatClockIST(state.show.startsAt).padStart(8, '0')}`,
    cinema: state.show.cinemaName,
    seatLine: `${seats} · ${count} ${count === 1 ? 'ticket' : 'tickets'} · Paid ${amount} · Sent to your SMS`,
    groupLine: `${paidSeats} of ${hold.seatIds.length} in · ${names.join(', ')}`,
    qrValue: `BMS-GROUP-${hold.id}-${payment.id}`,
    seats: `${tier}-${seats}`,
    amount,
    screen: state.show.screen.toUpperCase(),
  };
}

// ---------------------------------------------------------------------------
// Chat (simulated)
// ---------------------------------------------------------------------------

export interface LinkPreviewView {
  title: string;
  headline: string;
  subtitle: string;
  deadlineNote: string;
  domain: string;
}

export interface ChatMessageView {
  id: string;
  from: string;
  mine: boolean;
  text: string;
  time: string;
  preview?: LinkPreviewView;
}

export interface ChatThreadView {
  title: string;
  members: string;
  messages: ChatMessageView[];
  sent: boolean;
  draftEditable: string;
  draftLocked: string;
}

const MIN = 60 * 1000;
/** Earlier group messages (draft copy): the WhatsApp-poll moment the link replaces. Kabir stays quiet. */
const SEED_MESSAGES: Array<{ from: ChatViewer; text: string; minutesBeforeHold: number }> = [
  { from: 'Amit', text: 'Friday movie? Monsoon Heist is out 🍿', minutesBeforeHold: 34 },
  { from: 'Sana', text: "I'm in! Late show works for me", minutesBeforeHold: 31 },
  { from: 'Priya', text: 'Same. Anything after 9', minutesBeforeHold: 28 },
  { from: 'Neha', text: 'Might have a work thing, will confirm', minutesBeforeHold: 23 },
  { from: 'Rohan', text: 'Checking seats at Phoenix now', minutesBeforeHold: 13 },
];

export function selectLinkPreview(state: DemoState): LinkPreviewView | null {
  const hold = state.hold;
  if (!hold) return null;
  const deadline = formatClockIST(hold.deadline);
  const day = relativeDayIST(hold.deadline, state.clock.now);
  return {
    title: state.show.filmTitle,
    headline: `${hold.organiser.name} is holding ${hold.seatIds.length} seats for ${state.show.filmTitle}`,
    subtitle: `Fri, ${formatClockIST(state.show.startsAt)} · ${CINEMA_SHORT} · ${formatINR(perSeat(state))} each`,
    deadlineNote: `Pick your seat by ${deadline}${day ? ` ${day}` : ''}`,
    domain: LINK_DOMAIN,
  };
}

/** The share message: an editable first part and the locked deadline line (spec §3: deadline line is locked). */
export function selectShareDraft(state: DemoState): { editable: string; locked: string } | null {
  const hold = state.hold;
  if (!hold) return null;
  const deadline = formatClockIST(hold.deadline);
  const day = relativeDayIST(hold.deadline, state.clock.now);
  return {
    editable: `Held ${hold.seatIds.length} seats for ${state.show.filmTitle}, Fri, ${formatClockIST(state.show.startsAt)}. Pick your seat and pay your share:`,
    locked: `Pay by ${deadline}${day ? ` ${day}` : ''} · ${GROUP_LINK}`,
  };
}

export function selectChatThread(state: AppState, viewer: ChatViewer): ChatThreadView {
  const messages: ChatMessageView[] = SEED_MESSAGES.map((m, i) => ({
    id: `seed-${i}`,
    from: m.from,
    mine: m.from === viewer,
    text: m.text,
    time: formatClockIST(DEMO_HOLD_START_MS - m.minutesBeforeHold * MIN),
  }));
  const share = state.friendFlow.share;
  const draft = selectShareDraft(state);
  const preview = selectLinkPreview(state);
  if (share?.sent && preview) {
    messages.push({ id: 'share', from: 'Rohan', mine: viewer === 'Rohan', text: share.text, time: formatClockIST(share.sentAt), preview });
  }
  const others = [...FRIENDS].sort().filter((f) => f !== viewer);
  const members = viewer === 'Rohan' ? [...others, 'You'] : ['Rohan', ...others, 'You'];
  return {
    title: CHAT_TITLE,
    members: members.join(', '),
    messages,
    sent: !!share?.sent,
    draftEditable: draft?.editable ?? '',
    draftLocked: draft?.locked ?? '',
  };
}

/** Rohan's in-app banners: only friend events (paid, can't make it). */
export function selectLatestFriendNotification(state: DemoState): NotificationItem | null {
  const n = state.notifications.find((x) => x.type === 'friend_paid' || x.type === 'friend_declined');
  return n ?? null;
}
