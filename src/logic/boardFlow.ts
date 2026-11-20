/**
 * Board, deadline, settlement and late payer (prompt 06): spec §4 steps 7–9, §3 timers, §5 failures 18–27.
 *
 * Wraps `friendFlowReducer` (→ holdFlowReducer → frozen demoReducer) and owns:
 * - the timers (lock expiry, halfway, T−30, deadline, grace, settlement), with copy derived from state,
 * - edge-first release with the fee rule, cover, reminder, shorten, add a seat, cancel,
 * - settlement at the end of grace (spec §1: kept seat charged at 7:25 PM),
 * - the pay link / transfer for a kept seat (first wins), and the late payer's checkout.
 *
 * Pure: no React, no Date.now(), no randomness. Time comes from state.clock.
 */
import { formatINR, releaseFee, seatPrice } from './money';
import { coverOrder, formatClockIST, formatSeatRange, relativeDayIST, selectHoldSuccess, selectShortenOptions, type SeatTileView } from './holdFlow';
import {
  CHAT_TITLE,
  FRIENDS,
  SCRIPTED_SEATS,
  friendFlowReducer,
  hasDeclined,
  hasPaid,
  selectPayers,
  withFriendFlow,
  type AppAction,
  type AppState,
  type FriendName,
} from './friendFlow';
import { getEdgeReleasableSeats, SEAT_LOCK_DURATION_MS } from './rules';
import type { DemoState, FriendPayment, Hold, NotificationItem, Seat } from './types';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type FriendLateView = 'late' | 'ended' | 'started';

export interface BoardSlice {
  /** Convenience fees kept on seats released after the free window (paise). */
  feesKeptPaise: number;
  /** "Can't make it" rows Rohan answered with Keep. */
  declineAcks: string[];
  /** Rohan answered the T−30 prompt. */
  t30Decided: boolean;
  /** Kept seats Rohan sent a pay link for (failure #24: then transfer is off). */
  payLinkSentFor: string[];
  /** Kept seats Rohan transferred: seatId → friend (then the pay link is off). */
  transfers: Record<string, string>;
  /** Kept seats a late friend paid for (Rohan refunded). */
  lateSeats: string[];
  /** Friend's page after the deadline. */
  friendView: Partial<Record<FriendName, FriendLateView>>;
  /** Payments still with the bank when the deadline passed (settlement step 1). */
  graceWaitCount: number;
  /** Seats charged as kept at settlement (settlement step 2). */
  settledKeptCount: number;
  settledAt: number | null;
}

export type BoardState = AppState & { board: BoardSlice };

export function initialBoard(): BoardSlice {
  return {
    feesKeptPaise: 0,
    declineAcks: [],
    t30Decided: false,
    payLinkSentFor: [],
    transfers: {},
    lateSeats: [],
    friendView: {},
    graceWaitCount: 0,
    settledKeptCount: 0,
    settledAt: null,
  };
}

export function withBoard(state: DemoState | AppState): BoardState {
  const app = (state as AppState).friendFlow ? (state as AppState) : withFriendFlow(state);
  return { ...app, board: initialBoard() };
}

function ensureBoard(next: AppState): BoardState {
  return (next as BoardState).board ? (next as BoardState) : withBoard(next);
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type BoardAction =
  | { type: 'RELEASE_SEATS'; seatIds: string[] }
  | { type: 'DECLINE_KEEP'; name: string }
  | { type: 'T30_DECIDED' }
  | { type: 'COVER_SEATS'; count: number }
  | { type: 'ADD_SEAT' }
  | { type: 'CANCEL_HOLD' }
  | { type: 'SEND_PAY_LINK'; seatId: string }
  | { type: 'TRANSFER_TICKET'; seatId: string; name: string }
  | { type: 'FRIEND_LATE_PAY_START'; name: FriendName };

export type BoardFlowAction = AppAction | BoardAction;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function per(state: DemoState): number {
  const hold = state.hold!;
  return seatPrice(state.seats[hold.ownerSeatId], state.show.fee);
}

function sortIds(state: DemoState, ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const sa = state.seats[a];
    const sb = state.seats[b];
    return sa.row === sb.row ? sa.num - sb.num : sa.row.localeCompare(sb.row);
  });
}

function holdSeats(state: DemoState): Seat[] {
  if (!state.hold) return [];
  return sortIds(state, state.hold.seatIds).map((id) => state.seats[id]);
}

const isUnpaid = (s: Seat) => s.state === 'held' || s.state === 'locked' || s.state === 'paying';

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "4h 05m", "3h", "25m" */
export function formatLeft(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / MIN));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function deadlineLabel(state: DemoState): string {
  return formatClockIST(state.hold!.deadline);
}

function pushNotif(state: BoardState, n: Omit<NotificationItem, 'read' | 'at'>): BoardState {
  const now = state.clock.now;
  return { ...state, notifications: [{ ...n, at: now, read: false }, ...state.notifications] };
}

function pushSms(state: BoardState, text: string, key: string): BoardState {
  const now = state.clock.now;
  return { ...state, smsToasts: [{ id: `sms-${key}-${now}`, text, at: now }, ...state.smsToasts] };
}

function log(state: BoardState, type: string, description: string): BoardState {
  const now = state.clock.now;
  return {
    ...state,
    controllerLog: [{ id: `log-${now}-${type}-${state.controllerLog.length}`, at: now, type, description }, ...state.controllerLog],
  };
}

function setBoard(state: BoardState, patch: Partial<BoardSlice>): BoardState {
  return { ...state, board: { ...state.board, ...patch } };
}

function isActive(state: DemoState): boolean {
  return state.hold?.status === 'active';
}

/** Seats Rohan may release now: unpaid edges only (held, or a friend's lock that ran out). Never the middle. */
export function releasableSeats(state: DemoState): string[] {
  const hold = state.hold;
  if (!hold || hold.status !== 'active') return [];
  const now = state.clock.now;
  return sortIds(
    state,
    getEdgeReleasableSeats(hold, state.seats)
      .filter((s) => s.state === 'held' || (s.state === 'locked' && (!s.lockedUntil || s.lockedUntil <= now)))
      .map((s) => s.id),
  );
}

/** Seats released when Rohan releases `count`, one at a time from the left end of the row inwards (D-079). */
export function releaseOrder(state: DemoState, count: number, first?: string): string[] {
  const out: string[] = [];
  let seats = state.seats;
  for (let i = 0; i < count; i++) {
    const s = { ...state, seats } as DemoState;
    const cands = releasableSeats(s);
    if (cands.length === 0) break;
    const pick = i === 0 && first && cands.includes(first) ? first : cands[0];
    out.push(pick);
    seats = { ...seats, [pick]: { ...seats[pick], state: 'released' } };
  }
  return out;
}

/** Friends who were given the link and could still be reminded (entered a phone, haven't paid or declined). */
function remindable(state: AppState): FriendName[] {
  return FRIENDS.filter((f) => {
    const phone = state.friendFlow.sessions[f].phone || state.friendPayments.find((p) => p.name === f)?.phone;
    return !!phone && !hasPaid(state, f) && !hasDeclined(state, f);
  });
}

function friendReminders(state: BoardState): BoardState {
  let s = state;
  const deadline = deadlineLabel(state);
  for (const f of remindable(state)) {
    s = pushNotif(s, {
      id: `notif-remind-${f}-${state.clock.now}`,
      title: "Your seat's waiting 🍿",
      body: `${state.hold!.organiser.name}'s holding a seat for ${state.show.filmTitle}. Pay by ${deadline}.`,
      type: `friend_reminder:${f}`,
    });
  }
  return s;
}

// ---------------------------------------------------------------------------
// Money (every amount on the board, sheets and receipt comes from here)
// ---------------------------------------------------------------------------

export interface Money {
  perSeat: number;
  /** Seats Rohan was charged for (own, covered, kept, transferred, late-paid before the refund). */
  rohanSeats: number;
  /** Everything charged to Rohan, incl. fees kept on released seats. */
  rohanCharged: number;
  friendsPaid: number;
  friendSeats: number;
  stillBlocked: number;
  unpaidSeats: number;
  releasedSeats: number;
  feesKept: number;
  /** Unblocked (Reserve Pay) or refunded during the hold (pay-and-refund). */
  returned: number;
  /** Refunds after settlement (late payers). */
  refunded: number;
  /** What Rohan paid in the end. */
  netPaid: number;
  blockAmount: number;
  fallback: boolean;
}

export function selectMoney(state: BoardState): Money | null {
  const hold = state.hold;
  if (!hold) return null;
  const p = per(state);
  let rohanSeats = 0;
  let friendSeats = 0;
  let unpaid = 0;
  let released = 0;
  for (const s of holdSeats(state)) {
    if (s.state === 'paid_owner' || s.state === 'covered' || s.state === 'kept') rohanSeats++;
    else if (s.state === 'paid_friend') {
      if (state.board.transfers[s.id] || state.board.lateSeats.includes(s.id)) rohanSeats++;
      else friendSeats++;
    } else if (isUnpaid(s)) unpaid++;
    else if (s.state === 'released') released++;
  }
  const feesKept = state.board.feesKeptPaise;
  const rohanCharged = rohanSeats * p + feesKept;
  const stillBlocked = unpaid * p;
  const refunded = state.board.lateSeats.length * p;
  return {
    perSeat: p,
    rohanSeats,
    rohanCharged,
    friendsPaid: friendSeats * p,
    friendSeats,
    stillBlocked,
    unpaidSeats: unpaid,
    releasedSeats: released,
    feesKept,
    returned: hold.blockAmount - rohanCharged - stillBlocked,
    refunded,
    netPaid: rohanCharged - refunded,
    blockAmount: hold.blockAmount,
    fallback: hold.paymentRail === 'pay_and_refund',
  };
}

// ---------------------------------------------------------------------------
// Timers
// ---------------------------------------------------------------------------

function settle(state: BoardState): BoardState {
  const hold = state.hold!;
  const now = state.clock.now;
  const p = per(state);
  const seats = { ...state.seats };
  let kept = 0;
  for (const id of hold.seatIds) {
    const s = seats[id];
    if (s && isUnpaid(s)) {
      seats[id] = { ...s, state: 'kept', lockedBy: undefined, lockedUntil: undefined };
      kept++;
    }
  }
  // A payment still with the bank at the end of grace doesn't go through (the seat is kept).
  const friendPayments = state.friendPayments.map((fp) =>
    fp.status === 'pending' || fp.status === 'locked' ? { ...fp, status: 'failed' as const } : fp,
  );
  let s: BoardState = {
    ...state,
    seats,
    friendPayments,
    hold: {
      ...hold,
      status: 'settled',
      debited: hold.debited + kept * p,
      events: [...hold.events, { id: `evt-${now}-settled`, at: now, type: 'HOLD_SETTLED', description: `${plural(kept, 'seat', 'seats')} kept` }],
    },
  };
  s = setBoard(s, { settledKeptCount: kept, settledAt: now });
  const m = selectMoney(s)!;
  const inCount = holdSeats(s).filter((x) => x.state !== 'released').length;
  const n = hold.seatIds.length;
  s = pushSms(s, m.fallback ? `${formatINR(m.returned)} refunded by BookMyShow.` : `${formatINR(m.returned)} unblocked by BookMyShow.`, 'settled');
  s = pushNotif(s, {
    id: `notif-settled-${now}`,
    title: 'Your group is set! 🎬',
    body: `${inCount} of ${n} in. ${formatINR(m.returned)} ${m.fallback ? 'refunded' : 'unblocked'}.`,
    type: 'settled',
  });
  return log(s, 'HOLD_SETTLED', `Settled: ${plural(kept, 'seat', 'seats')} kept, Rohan paid ${formatINR(m.rohanCharged)}, ${formatINR(m.returned)} unblocked`);
}

/** Runs every timer for the current clock. Called on TICK / ADVANCE_CLOCK / SET_CLOCK. */
export function runTimers(state: BoardState): BoardState {
  const now = state.clock.now;
  let s = state;
  const hold = s.hold;
  if (!hold) return s;

  // 1. 5-minute seat locks run out → the seat goes back to the block
  let changed = false;
  const seats = { ...s.seats };
  for (const id of hold.seatIds) {
    const seat = seats[id];
    if (seat?.state === 'locked' && seat.lockedUntil && now >= seat.lockedUntil) {
      seats[id] = { ...seat, state: 'held', lockedBy: undefined, lockedUntil: undefined };
      changed = true;
    }
  }
  if (changed) s = { ...s, seats };

  if (hold.status !== 'active' && hold.status !== 'resolving') return s;
  const h = s.hold!;

  // 2. Halfway reminder (50% of the window)
  const half = h.createdAt + Math.floor((h.deadline - h.createdAt) / 2);
  if (now >= half && now >= h.deadline - 30 * MIN && !h.reminder50Fired) {
    // Jumped straight past halfway to T−30 (controller): the T−30 reminder supersedes it.
    s = { ...s, hold: { ...s.hold!, reminder50Fired: true } };
  } else if (now >= half && now < h.deadline && !h.reminder50Fired) {
    const n = h.seatIds.length;
    const paid = holdSeats(s).filter((x) => x.state === 'paid_owner' || x.state === 'paid_friend' || x.state === 'covered').length;
    s = { ...s, hold: { ...s.hold!, reminder50Fired: true } };
    s = pushNotif(s, {
      id: `notif-half-${now}`,
      title: 'Halfway there ⏳',
      body: `${paid} of ${n} in · ${formatLeft(h.deadline - now)} left for friends to pay.`,
      type: 'halfway',
    });
    s = friendReminders(s);
  }

  // 3. T−30
  if (now >= h.deadline - 30 * MIN && now < h.deadline && !s.hold!.reminderT30Fired) {
    s = { ...s, hold: { ...s.hold!, reminderT30Fired: true } };
    const unpaid = holdSeats(s).filter(isUnpaid).length;
    if (unpaid > 0) {
      s = pushNotif(s, {
        id: `notif-t30-${now}`,
        title: '30 min left ⏰',
        body: `${plural(unpaid, 'seat', 'seats')} unpaid. Unpaid seats stay yours at ${deadlineLabel(s)} unless you release them.`,
        type: 't30',
      });
      s = friendReminders(s);
    }
  }

  // 4. Deadline: payments with the bank get the 10-min grace; otherwise settle now.
  const cur = s.hold!;
  if (cur.status === 'active' && now >= cur.deadline) {
    const paying = holdSeats(s).filter((x) => x.state === 'paying').length;
    if (paying > 0) {
      s = { ...s, hold: { ...cur, status: 'resolving' } };
      s = setBoard(s, { graceWaitCount: s.friendPayments.filter((p) => p.status === 'pending').length || paying });
      s = log(s, 'DEADLINE', `Deadline: waiting for ${plural(paying, 'payment', 'payments')} in progress`);
    } else {
      s = setBoard(s, { graceWaitCount: 0 });
      s = settle(s);
    }
  }
  // 5. Grace ends: settle (spec §1: kept seat charged at 7:25 PM, even if the pending payment cleared earlier)
  if (s.hold!.status === 'resolving' && now >= s.hold!.graceUntil) {
    s = settle(s);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Late payer
// ---------------------------------------------------------------------------

function isAfterDeadline(state: DemoState): boolean {
  const h = state.hold;
  return !!h && (h.status === 'settled' || h.status === 'cancelled' || h.status === 'resolving' || state.clock.now >= h.deadline);
}

/** Kept seats a late friend can still pay for: kept, not transferred, not mid-payment by someone else. */
export function lateSeatsAvailable(state: BoardState, name?: string): string[] {
  const h = state.hold;
  if (!h || h.status !== 'settled') return [];
  const busy = new Set(
    state.friendPayments.filter((p) => (p.status === 'locked' || p.status === 'pending') && p.name !== name).flatMap((p) => p.seatIds),
  );
  return holdSeats(state)
    .filter((s) => s.state === 'kept' && !state.board.transfers[s.id] && !busy.has(s.id))
    .map((s) => s.id);
}

function lateSeatFor(state: BoardState, name: FriendName): string | null {
  const free = lateSeatsAvailable(state, name);
  if (free.length === 0) return null;
  return free.includes(SCRIPTED_SEATS[name]) ? SCRIPTED_SEATS[name] : free[0];
}

/** The friend's live late payment (seats still kept). */
export function openLatePayment(state: BoardState, name: string): FriendPayment | undefined {
  return state.friendPayments.find(
    (p) =>
      p.name === name &&
      (p.status === 'locked' || p.status === 'pending' || p.status === 'failed') &&
      p.seatIds.length > 0 &&
      p.seatIds.every((id) => state.seats[id]?.state === 'kept'),
  );
}

function friendView(state: BoardState, name: FriendName): FriendLateView {
  if (state.clock.now >= state.show.startsAt) return 'started';
  return lateSeatFor(state, name) ? 'late' : 'ended';
}

function setFriendView(state: BoardState, name: FriendName, view: FriendLateView | undefined): BoardState {
  return setBoard(state, { friendView: { ...state.board.friendView, [name]: view } });
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function boardFlowReducer(state: BoardState, action: BoardFlowAction): BoardState {
  switch (action.type) {
    case 'TICK':
      return runTimers({ ...state, clock: { ...state.clock, now: action.now } });
    case 'ADVANCE_CLOCK':
      return runTimers({ ...state, clock: { ...state.clock, now: state.clock.now + action.ms } });
    case 'SET_CLOCK':
      return runTimers({ ...state, clock: { ...state.clock, now: action.now } });

    case 'RELEASE_SEAT':
      return boardFlowReducer(state, { type: 'RELEASE_SEATS', seatIds: [action.seatId] });

    case 'RELEASE_SEATS': {
      let s = state;
      for (const id of action.seatIds) {
        if (!releasableSeats(s).includes(id)) break; // edges only, one at a time
        const fee = releaseFee(s.hold!, s.show, s.clock.now);
        s = ensureBoard(friendFlowReducer(s, { type: 'RELEASE_SEAT', seatId: id }));
        s = setBoard(s, { feesKeptPaise: s.board.feesKeptPaise + fee });
        s = log(s, 'SEAT_RELEASED', `Rohan released ${id}${fee ? ` (${formatINR(fee)} fee kept)` : ' (free)'}`);
        // A released seat answers one open "Can't make it" (oldest first).
        const open = [...s.declines].reverse().find((d) => !s.board.declineAcks.includes(d.name) && !hasPaid(s, d.name));
        if (open) s = setBoard(s, { declineAcks: [...s.board.declineAcks, open.name] });
      }
      return s;
    }

    case 'DECLINE_KEEP':
      return state.board.declineAcks.includes(action.name) ? state : setBoard(state, { declineAcks: [...state.board.declineAcks, action.name] });

    case 'T30_DECIDED':
      return setBoard(state, { t30Decided: true });

    case 'COVER_SEATS': {
      if (!isActive(state) || state.hold!.paymentRail === 'pay_and_refund') return state;
      const hold = state.hold!;
      const held = holdSeats(state).filter((s) => s.state === 'held').map((s) => s.id);
      const ids = coverOrder(held, hold.ownerSeatId, state.seats, Math.min(action.count, held.length));
      if (ids.length === 0) return state;
      const seats = { ...state.seats };
      for (const id of ids) seats[id] = { ...seats[id], state: 'covered', payerName: hold.organiser.name };
      const s: BoardState = { ...state, seats, hold: { ...hold, debited: hold.debited + ids.length * per(state) } };
      return log(s, 'SEATS_COVERED', `Rohan covered ${ids.join(', ')} (${formatINR(ids.length * per(state))})`);
    }

    case 'SEND_ORGANISER_REMINDER': {
      if (!isActive(state)) return state;
      const s = ensureBoard(friendFlowReducer(state, action));
      if (s.hold?.lastRohanReminderAt === state.hold?.lastRohanReminderAt) return s;
      return log(s, 'REMINDER_SENT', `Rohan forwarded a reminder to ${CHAT_TITLE}`);
    }

    case 'SHORTEN_DEADLINE': {
      if (!isActive(state)) return state;
      let s = ensureBoard(friendFlowReducer(state, action));
      const h = s.hold!;
      if (h.deadline !== state.hold!.deadline) {
        if (h.freeReleaseUntil !== null && h.freeReleaseUntil > h.deadline) s = { ...s, hold: { ...h, freeReleaseUntil: h.deadline } };
        s = log(s, 'DEADLINE_SHORTENED', `Deadline moved to ${formatClockIST(h.deadline)}`);
      }
      return runTimers(s);
    }

    case 'ADD_SEAT': {
      // Failure #18: an adjacent seat, its own new block, same deadline.
      const hold = state.hold;
      if (!hold || !isActive(state)) return state;
      const add = selectAddSeat(state);
      if (!add) return state;
      const p = per(state);
      let s: BoardState = {
        ...state,
        seats: { ...state.seats, [add]: { ...state.seats[add], state: 'held' } },
        hold: { ...hold, seatIds: [...hold.seatIds, add], blockAmount: hold.blockAmount + p },
      };
      s = pushSms(s, `${formatINR(p)} blocked for BookMyShow.`, 'add-seat');
      return log(s, 'SEAT_ADDED', `Rohan added ${add} (${formatINR(p)} blocked)`);
    }

    case 'CANCEL_HOLD': {
      if (!isActive(state)) return state;
      if (holdSeats(state).some((s) => s.state === 'paying')) return state;
      const fee = releaseFee(state.hold!, state.show, state.clock.now);
      const seats = { ...state.seats };
      let n = 0;
      for (const s of holdSeats(state)) {
        if (s.state === 'held' || s.state === 'locked') {
          seats[s.id] = { ...s, state: 'released', lockedBy: undefined, lockedUntil: undefined };
          n++;
        }
      }
      let s: BoardState = {
        ...state,
        seats,
        hold: { ...state.hold!, status: 'cancelled', debited: state.hold!.debited + n * fee },
        friendPayments: state.friendPayments.map((p) => (p.status === 'locked' ? { ...p, status: 'failed' as const } : p)),
      };
      s = setBoard(s, { feesKeptPaise: s.board.feesKeptPaise + n * fee, settledAt: state.clock.now });
      const m = selectMoney(s)!;
      s = pushSms(s, `${formatINR(m.returned)} unblocked by BookMyShow.`, 'cancel');
      return log(s, 'HOLD_CANCELLED', `Rohan cancelled the hold: ${plural(n, 'seat', 'seats')} released`);
    }

    case 'SEND_PAY_LINK': {
      const v = selectKeptSeatActions(state);
      if (!v || v.seatId !== action.seatId || !v.payLinkEnabled) return state;
      const s = setBoard(state, { payLinkSentFor: [...state.board.payLinkSentFor, action.seatId] });
      return log(s, 'PAY_LINK_SENT', `Rohan sent a pay link for ${action.seatId}`);
    }

    case 'TRANSFER_TICKET': {
      const v = selectKeptSeatActions(state);
      if (!v || v.seatId !== action.seatId || !v.transferEnabled) return state;
      const name = action.name;
      const now = state.clock.now;
      // The ticket moves without a payment: Rohan stays charged (D-083).
      const payment: FriendPayment = { id: `xfer-${name}-${now}`, name, phone: '', seatIds: [action.seatId], status: 'success', at: now, amountPaise: 0 };
      let s: BoardState = {
        ...state,
        seats: { ...state.seats, [action.seatId]: { ...state.seats[action.seatId], state: 'paid_friend', payerName: name } },
        friendPayments: [payment, ...state.friendPayments],
      };
      s = setBoard(s, { transfers: { ...s.board.transfers, [action.seatId]: name } });
      return log(s, 'TICKET_TRANSFERRED', `Rohan transferred ${action.seatId} to ${name}`);
    }

    case 'FRIEND_OPEN_LINK': {
      const { name } = action;
      if (!isAfterDeadline(state) || hasPaid(state, name)) return setFriendView(ensureBoard(friendFlowReducer(state, action)), name, undefined);
      if (hasDeclined(state, name)) return ensureBoard(friendFlowReducer(state, action));
      const s = ensureBoard(friendFlowReducer(state, { type: 'FRIEND_GOTO', name, screen: 'pay' }));
      return setFriendView(s, name, friendView(s, name));
    }

    case 'FRIEND_PAY':
      // Grace covers only payments already with the bank (spec §3); no new payments after the deadline.
      if (state.hold && state.clock.now >= state.hold.deadline) return state;
      return ensureBoard(friendFlowReducer(state, action));

    case 'FRIEND_LATE_PAY_START': {
      const { name } = action;
      if (state.clock.now >= state.show.startsAt) return setFriendView(state, name, 'started');
      const seatId = lateSeatFor(state, name);
      if (!seatId) return setFriendView(state, name, 'ended');
      const now = state.clock.now;
      const session = state.friendFlow.sessions[name];
      const payment: FriendPayment = { id: `late-${name}-${now}`, name, phone: session.phone, seatIds: [seatId], status: 'locked', at: now, amountPaise: per(state) };
      const others = state.friendPayments.filter((p) => !(p.name === name && (p.status === 'locked' || p.status === 'failed')));
      const skipPhone = state.friendFlow.loggedIn || session.verified;
      let s: BoardState = { ...state, friendPayments: [payment, ...others] };
      s = ensureBoard(friendFlowReducer(s, { type: 'FRIEND_GOTO', name, screen: skipPhone ? 'upi' : 'phone' }));
      s = { ...s, friendFlow: { ...s.friendFlow, sessions: { ...s.friendFlow.sessions, [name]: { ...s.friendFlow.sessions[name], seatId, extra: 0 } } } };
      return log(s, 'LATE_PAY_STARTED', `${name} is paying late for kept seat ${seatId}`);
    }

    case 'FRIEND_APPROVE': {
      const late = openLatePayment(state, action.name);
      if (!late) return ensureBoard(friendFlowReducer(state, action));
      if (late.status === 'pending') return state;
      const s: BoardState = {
        ...state,
        friendPayments: state.friendPayments.map((p) => (p.id === late.id ? { ...p, status: 'pending' as const, at: state.clock.now } : p)),
      };
      return ensureBoard(friendFlowReducer(s, { type: 'FRIEND_GOTO', name: action.name, screen: 'pending' }));
    }

    case 'FRIEND_RESOLVE': {
      const late = openLatePayment(state, action.name);
      if (!late || late.status !== 'pending') return ensureBoard(friendFlowReducer(state, action));
      const outcome = action.outcome ?? state.friendFlow.nextOutcome;
      if (outcome === 'pending') return state;
      const { name } = action;
      if (outcome === 'fail') {
        const s: BoardState = { ...state, friendPayments: state.friendPayments.map((p) => (p.id === late.id ? { ...p, status: 'failed' as const } : p)) };
        return ensureBoard(friendFlowReducer(s, { type: 'FRIEND_GOTO', name, screen: 'failed' }));
      }
      // Failure #23: the ticket moves to the friend, Rohan is refunded that seat.
      let s = state;
      for (const id of late.seatIds) {
        s = ensureBoard(friendFlowReducer(s, { type: 'FRIEND_LATE_PAY', friendName: name, seatId: id }));
        // Replace the base notification ("took his seat": guessed pronoun, D-069) with ours.
        s = { ...s, notifications: s.notifications.slice(1) };
      }
      const now = s.clock.now;
      const amount = formatINR(late.amountPaise);
      s = {
        ...s,
        seats: Object.fromEntries(Object.entries(s.seats).map(([k, v]) => [k, late.seatIds.includes(k) ? { ...v, lockedBy: undefined, lockedUntil: undefined } : v])),
        friendPayments: s.friendPayments.map((p) => (p.id === late.id ? { ...p, status: 'success' as const, at: now } : p)),
      };
      s = setBoard(s, { lateSeats: [...s.board.lateSeats, ...late.seatIds] });
      s = setFriendView(s, name, undefined);
      s = pushNotif(s, { id: `notif-late-${name}-${now}`, title: `${name} took ${late.seatIds.join(', ')} 🙌`, body: `${amount} is on its way back to you.`, type: 'late_paid' });
      s = pushSms(s, `${amount} refunded by BookMyShow.`, 'late-refund');
      s = ensureBoard(friendFlowReducer(s, { type: 'FRIEND_GOTO', name, screen: 'ticket' }));
      return log(s, 'LATE_PAID', `${name} paid ${amount} for kept ${late.seatIds.join(', ')}; Rohan refunded`);
    }

    case 'FRIEND_RETRY': {
      const late = openLatePayment(state, action.name);
      if (!late) return ensureBoard(friendFlowReducer(state, action));
      return ensureBoard(friendFlowReducer(state, { type: 'FRIEND_GOTO', name: action.name, screen: 'approve' }));
    }

    case 'RESTART_DEMO':
      return withBoard(friendFlowReducer(state, action));

    default:
      return ensureBoard(friendFlowReducer(state, action as AppAction));
  }
}

// ---------------------------------------------------------------------------
// Selectors: board (organiser view; names of unpaid friends are allowed here)
// ---------------------------------------------------------------------------

export interface StatusRow {
  key: string;
  name: string;
  detail: string;
}

export interface BoardView {
  title: string;
  subtitle: string;
  status: Hold['status'];
  pill: string;
  pillTone: 'warning' | 'muted';
  setAside: string;
  setAsideLabel: string;
  setAsideSub: string;
  meter: { youPaid: number; friendsPaid: number; stillBlocked: number; youLabel: string; friendsLabel: string; blockedLabel: string };
  rulesTitle: string;
  rulesBody: string;
  tiles: SeatTileView[];
  paidLine: string;
  paidCount: number;
  totalCount: number;
  paid: StatusRow[];
  paying: StatusRow[];
  declined: StatusRow[];
  waitingCount: number;
  waitingLabel: string;
  canRelease: boolean;
  canCover: boolean;
  freeReleaseLine: string;
  t30: { title: string; body: string } | null;
  resolvingLine: string | null;
  resolvingBody: string;
  ownerSeatId: string;
  reminder: { available: boolean; note: string; message: string };
  canAddSeat: boolean;
  addSeatId: string | null;
  canCancel: boolean;
  cancelNote: string;
}

export function selectAddSeat(state: DemoState): string | null {
  const hold = state.hold;
  if (!hold) return null;
  const sorted = holdSeats(state);
  const row = sorted[0].row;
  const inRow = sorted.filter((s) => s.row === row);
  const id = (n: number) => `${row}${n.toString().padStart(2, '0')}`;
  const right = state.seats[id(inRow[inRow.length - 1].num + 1)];
  if (right?.state === 'available') return right.id;
  const left = state.seats[id(inRow[0].num - 1)];
  if (left?.state === 'available') return left.id;
  return null;
}

export function selectBoard(state: BoardState): BoardView | null {
  const hold = state.hold;
  const m = selectMoney(state);
  const success = selectHoldSuccess(state);
  if (!hold || !m || !success) return null;
  const now = state.clock.now;
  const deadline = deadlineLabel(state);
  const n = hold.seatIds.length;
  const seats = holdSeats(state);
  const paidCount = seats.filter((s) => s.state === 'paid_owner' || s.state === 'paid_friend' || s.state === 'covered').length;

  const paid: StatusRow[] = selectPayers(state).map((p) => ({
    key: `paid-${p.name}`,
    name: p.name === hold.organiser.name ? 'You' : p.name,
    detail: p.seatIds.join(', '),
  }));
  const payingBy = new Map<string, string[]>();
  for (const s of seats) {
    const live = s.state === 'paying' || (s.state === 'locked' && !!s.lockedUntil && s.lockedUntil > now);
    if (live && s.lockedBy) payingBy.set(s.lockedBy, [...(payingBy.get(s.lockedBy) ?? []), s.id]);
  }
  const paying = [...payingBy.entries()].map(([name, ids]) => ({ key: `paying-${name}`, name, detail: ids.join(', ') }));
  const active = hold.status === 'active';
  const declined = active
    ? state.declines
        .filter((d) => !state.board.declineAcks.includes(d.name) && !hasPaid(state, d.name))
        .map((d) => ({ key: `declined-${d.name}`, name: d.name, detail: "Can't make it" }))
    : [];
  const waitingCount = seats.filter((s) => s.state === 'held' || (s.state === 'locked' && (!s.lockedUntil || s.lockedUntil <= now))).length;

  const freeUntil = hold.freeReleaseUntil;
  const freeOpen = state.show.tier !== 'low' && freeUntil !== null && now < freeUntil;
  const freeReleaseLine =
    state.show.tier === 'low'
      ? `Release free anytime before ${deadline}`
      : freeOpen
        ? `Release free until ${formatClockIST(freeUntil!)}`
        : `Releasing now keeps the ${formatINR(state.show.fee)} fee per seat`;

  const unpaid = m.unpaidSeats;
  const t30 =
    active && hold.reminderT30Fired && unpaid > 0 && !state.board.t30Decided && now < hold.deadline
      ? { title: `30 min left · ${plural(unpaid, 'seat', 'seats')} unpaid`, body: `Unpaid seats stay yours at ${deadline} unless you release them.` }
      : null;
  const resolvingPayments = seats.filter((s) => s.state === 'paying').length;
  const grace = formatClockIST(hold.graceUntil);
  const resolving = hold.status === 'resolving';
  const resolvingLine = !resolving
    ? null
    : resolvingPayments > 0
      ? `Waiting for ${plural(resolvingPayments, 'payment', 'payments')} in progress…`
      : `Settling at ${grace}`;
  const resolvingBody =
    resolvingPayments > 0
      ? `${resolvingPayments === 1 ? 'It stays' : 'They stay'} theirs until ${grace}. Unpaid seats stay yours.`
      : `${plural(unpaid, 'unpaid seat stays', 'unpaid seats stay')} yours, charged from your block.`;

  const lastRem = hold.lastRohanReminderAt;
  const remAvailable = !lastRem || now - lastRem >= 2 * HOUR;
  const reminderMessage = `Your seat's waiting 🍿 ${hold.organiser.name}'s holding a seat for ${state.show.filmTitle}. Pay by ${deadline}. bms.link/g/k7Qx2`;
  const addSeatId = active ? selectAddSeat(state) : null;
  const anyPaying = seats.some((s) => s.state === 'paying');

  return {
    title: CHAT_TITLE,
    subtitle: `${state.show.filmTitle} · Fri, ${formatClockIST(state.show.startsAt)}`,
    status: hold.status,
    pill: active ? `Pay by ${deadline} · ${formatLeft(hold.deadline - now)}` : hold.status === 'resolving' ? `Deadline passed · settling` : `Ended at ${deadline}`,
    pillTone: active ? 'warning' : 'muted',
    // 06 (user): no worst-case "Most you could still pay" framing. Same number, said as money set aside.
    setAside: formatINR(m.stillBlocked),
    setAsideLabel: m.fallback ? 'still to come back' : 'still set aside',
    setAsideSub:
      hold.status === 'settled' || hold.status === 'cancelled'
        ? `Settled · ${formatINR(m.returned)} ${m.fallback ? 'refunded' : 'unblocked'}`
        : unpaid === 0
        ? 'Everyone has paid'
        : resolving
          ? resolvingPayments > 0
            ? `${plural(resolvingPayments, 'payment', 'payments')} in progress · the rest is charged at ${grace}`
            : `Charged from your block at ${grace}`
          : `Waiting on ${plural(unpaid, 'friend', 'friends')} · ${m.fallback ? 'refunded' : 'unblocks'} as each pays`,
    meter: {
      youPaid: m.rohanCharged,
      friendsPaid: m.friendsPaid,
      stillBlocked: m.stillBlocked,
      youLabel: 'You paid',
      friendsLabel: 'Friends paid',
      blockedLabel: m.fallback ? 'Still to come back' : 'Still blocked',
    },
    rulesTitle: `Unpaid seats stay yours at ${deadline}`,
    rulesBody: freeReleaseLine,
    tiles: success.tiles,
    paidLine: `${paidCount} of ${n} paid`,
    paidCount,
    totalCount: n,
    paid,
    paying,
    declined,
    waitingCount,
    waitingLabel: `${plural(waitingCount, 'seat', 'seats')} waiting`,
    canRelease: releasableSeats(state).length > 0,
    canCover: active && !m.fallback && waitingCount > 0,
    freeReleaseLine,
    t30,
    resolvingLine,
    resolvingBody,
    ownerSeatId: hold.ownerSeatId,
    reminder: {
      available: remAvailable,
      note: remAvailable ? 'BookMyShow writes it. You forward it.' : `You can send another reminder at ${formatClockIST(lastRem! + 2 * HOUR)}.`,
      message: reminderMessage,
    },
    canAddSeat: !!addSeatId,
    addSeatId,
    canCancel: active && !anyPaying,
    cancelNote: anyPaying ? 'Someone is paying right now. Try again in a few minutes.' : '',
  };
}

// --- Release sheet ---------------------------------------------------------

export interface ReleaseSheetView {
  title: string;
  subtitle: string;
  candidates: string[];
  seatId: string;
  tiles: Array<SeatTileView & { tappable: boolean }>;
  setAsideRow: { label: string; value: string };
  feeRow: { label: string; value: string };
  backRow: { label: string; value: string };
  feeLine: string;
  feeKept: boolean;
  cta: string;
  caption: string;
}

export function selectReleaseSheet(state: BoardState, chosen?: string | null): ReleaseSheetView | null {
  const hold = state.hold;
  const m = selectMoney(state);
  const board = selectBoard(state);
  if (!hold || !m || !board) return null;
  const candidates = releasableSeats(state);
  if (candidates.length === 0) return null;
  const seatId = chosen && candidates.includes(chosen) ? chosen : candidates[0];
  const fee = releaseFee(hold, state.show, state.clock.now);
  const back = m.perSeat - fee;
  const free = hold.freeReleaseUntil;
  return {
    title: 'Release a seat?',
    subtitle: 'It goes back on sale, from the end of the row.',
    candidates,
    seatId,
    tiles: board.tiles.map((t) =>
      t.id === seatId
        ? { id: t.id, kind: 'released', caption: 'Release', tappable: true }
        : { ...t, tappable: candidates.includes(t.id), caption: candidates.includes(t.id) ? 'Edge' : t.caption },
    ),
    setAsideRow: { label: `Seat ${seatId} · set aside`, value: formatINR(m.perSeat) },
    feeRow: { label: 'Convenience fee kept', value: formatINR(fee) },
    backRow: { label: m.fallback ? 'Refunded to you' : 'You get back', value: formatINR(back) },
    feeKept: fee > 0,
    feeLine:
      fee > 0
        ? `${formatINR(state.show.fee)} fee per seat is kept`
        : state.show.tier === 'low' || free === null
          ? 'Free to release before the deadline'
          : `Free until ${formatClockIST(free)}`,
    cta: `Release ${seatId} · ${formatINR(back)} back`,
    caption: "Released seats can't be taken back",
  };
}

// --- T−30 sheet ------------------------------------------------------------

export interface T30SheetView {
  title: string;
  subtitle: string;
  unpaid: number;
  minKeep: number;
  keep: number;
  release: number;
  keepCaption: string;
  releaseCaption: string;
  chargeRow: { label: string; value: string };
  feeRow: { label: string; value: string; sub?: string };
  releaseIds: string[];
  cta: string;
  caption: string;
  perSeat: string;
}

export function selectT30Sheet(state: BoardState, keep?: number): T30SheetView | null {
  const hold = state.hold;
  const m = selectMoney(state);
  if (!hold || !m) return null;
  const deadline = deadlineLabel(state);
  const unpaid = holdSeats(state).filter((s) => s.state === 'held' || s.state === 'locked').length;
  const maxRelease = releaseOrder(state, unpaid).length;
  const minKeep = unpaid - maxRelease;
  const k = Math.max(minKeep, Math.min(unpaid, keep ?? unpaid));
  const release = unpaid - k;
  const releaseIds = releaseOrder(state, release);
  const fee = releaseFee(hold, state.show, state.clock.now) * release;
  return {
    title: `${plural(unpaid, 'seat is', 'seats are')} still unpaid`,
    subtitle: `Friends can still pay until ${deadline}`,
    unpaid,
    minKeep,
    keep: k,
    release,
    keepCaption: `Charged from your block at ${deadline}`,
    releaseCaption: 'Back on sale, from the end of the row',
    // 06 (user): "Charged at 7:15 PM if still unpaid" replaces "If nobody else pays" / "Most you'll pay".
    chargeRow: { label: `Charged at ${deadline} if still unpaid`, value: formatINR(k * m.perSeat) },
    feeRow: { label: 'Fee kept on released seats', value: formatINR(fee), sub: release > 0 ? `Releases ${releaseIds.join(', ')}` : undefined },
    releaseIds,
    cta: 'Confirm',
    caption: "Released seats can't be taken back",
    perSeat: formatINR(m.perSeat),
  };
}

// --- Cover sheet -------------------------------------------------------------

export function selectCoverSheet(state: BoardState, count: number) {
  const hold = state.hold;
  const m = selectMoney(state);
  if (!hold || !m) return null;
  const held = holdSeats(state).filter((s) => s.state === 'held').map((s) => s.id);
  const c = Math.max(1, Math.min(count, held.length));
  const ids = coverOrder(held, hold.ownerSeatId, state.seats, c);
  return {
    max: held.length,
    count: c,
    ids,
    title: 'Cover seats',
    subtitle: "You pay for these now. Nobody else can pick them.",
    row: { label: `I'll pay for ${plural(c, 'seat', 'seats')} now`, value: formatINR(c * m.perSeat), sub: ids.join(', ') },
    cta: `Pay ${formatINR(c * m.perSeat)} from your block`,
  };
}

// --- Add a seat / cancel -----------------------------------------------------

export function selectAddSeatSheet(state: BoardState) {
  const hold = state.hold;
  const m = selectMoney(state);
  const id = selectAddSeat(state);
  if (!hold || !m || !id) return null;
  return {
    seatId: id,
    title: `Add ${id} to the group?`,
    subtitle: `Next to your group. Friends pay by ${deadlineLabel(state)}, same as everyone.`,
    row: { label: `${id} · set aside`, value: formatINR(m.perSeat), sub: 'A new block on UPI · not charged' },
    cta: `Block ${formatINR(m.perSeat)} on UPI`,
  };
}

export function selectCancelSheet(state: BoardState) {
  const hold = state.hold;
  const m = selectMoney(state);
  if (!hold || !m) return null;
  const n = holdSeats(state).filter((s) => s.state === 'held' || s.state === 'locked').length;
  const fee = releaseFee(hold, state.show, state.clock.now) * n;
  return {
    title: 'Cancel the group hold?',
    subtitle: `${plural(n, 'unpaid seat goes', 'unpaid seats go')} back on sale. Paid seats aren't affected.`,
    rows: [
      { label: 'Unblocked now', value: formatINR(m.stillBlocked - fee) },
      { label: 'Fee kept on released seats', value: formatINR(fee) },
    ],
    cta: 'Cancel hold',
    caption: "This can't be undone",
  };
}

// --- Settlement animation ------------------------------------------------------

export function selectSettlementSteps(state: BoardState): string[] {
  const m = selectMoney(state);
  if (!m) return [];
  const steps: string[] = [];
  const wait = state.board.graceWaitCount;
  if (wait > 0) steps.push(`Waiting for ${plural(wait, 'payment', 'payments')} in progress…`);
  const kept = state.board.settledKeptCount;
  if (kept > 0) steps.push(`Charging ${plural(kept, 'kept seat', 'kept seats')}…`);
  steps.push(`${m.fallback ? 'Refunding' : 'Unblocking'} ${formatINR(m.returned)}…`);
  return steps;
}

// ---------------------------------------------------------------------------
// Receipt (organiser)
// ---------------------------------------------------------------------------

export interface ReceiptRow {
  seatId: string;
  who: string;
  status: string;
  amount: string;
  tone: 'paid' | 'you' | 'kept' | 'released';
}

export interface KeptSeatActions {
  seatId: string;
  payLinkEnabled: boolean;
  transferEnabled: boolean;
  payLinkCta: string;
  payLinkMessage: string;
  transferCandidates: string[];
  note: { title: string; body: string } | null;
}

export function selectKeptSeatActions(state: BoardState): KeptSeatActions | null {
  const hold = state.hold;
  if (!hold || hold.status !== 'settled') return null;
  const seats = holdSeats(state);
  const kept = seats.find((s) => s.state === 'kept' || state.board.transfers[s.id]);
  if (!kept) return null;
  const transferredTo = state.board.transfers[kept.id];
  const linkSent = state.board.payLinkSentFor.includes(kept.id);
  const showStarted = state.clock.now >= state.show.startsAt;
  const p = formatINR(per(state));
  const start = formatClockIST(state.show.startsAt);
  const transferCandidates = FRIENDS.filter((f) => !hasPaid(state, f));
  let note: KeptSeatActions['note'] = null;
  if (transferredTo) note = { title: `${kept.id} transferred to ${transferredTo}`, body: 'The pay link is off. Settle up outside BookMyShow.' };
  else if (linkSent) note = { title: `Pay link sent for ${kept.id}`, body: `If they pay before ${start}, ${p} comes back to you. Transfer is off.` };
  return {
    seatId: kept.id,
    payLinkEnabled: !transferredTo && !linkSent && !showStarted && kept.state === 'kept',
    transferEnabled: !transferredTo && !linkSent && kept.state === 'kept',
    payLinkCta: `Send a pay link for ${kept.id}`,
    payLinkMessage: `${hold.organiser.name} kept ${kept.id} for you at ${state.show.filmTitle}, Fri, ${start}. Pay ${p} before the show and the ticket is yours: bms.link/g/k7Qx2`,
    transferCandidates,
    note,
  };
}

export interface GroupReceiptView {
  badge: 'CONFIRMED' | 'FINISHED';
  title: string;
  statusLine: string;
  filmLine: string;
  dateLine: string;
  cinemaLine: string;
  rows: ReceiptRow[];
  ledger: Array<{ key: string; label: string; value: string; sub?: string; strong?: boolean }>;
  refunds: Array<{ key: string; label: string; value: string }>;
  netPaid: { label: string; value: string } | null;
  lateNote: { title: string; body: string } | null;
  kept: KeptSeatActions | null;
}

export function selectGroupReceipt(state: BoardState): GroupReceiptView | null {
  const hold = state.hold;
  const m = selectMoney(state);
  if (!hold || !m) return null;
  const n = hold.seatIds.length;
  const seats = holdSeats(state);
  const inCount = seats.filter((s) => s.state !== 'released').length;
  const p = formatINR(m.perSeat);
  const rows: ReceiptRow[] = seats.map((s) => {
    if (s.state === 'paid_owner') return { seatId: s.id, who: 'You', status: 'Your seat', amount: p, tone: 'you' };
    if (s.state === 'covered') return { seatId: s.id, who: 'You', status: 'Covered by you', amount: p, tone: 'you' };
    if (s.state === 'kept') return { seatId: s.id, who: 'You', status: 'Kept · charged from your block', amount: p, tone: 'kept' };
    if (s.state === 'released') return { seatId: s.id, who: '—', status: 'Released · back on sale', amount: '', tone: 'released' };
    const name = s.payerName ?? 'Friend';
    if (state.board.transfers[s.id]) return { seatId: s.id, who: name, status: 'Transferred by you', amount: p, tone: 'kept' };
    if (state.board.lateSeats.includes(s.id)) return { seatId: s.id, who: name, status: `Paid late · ${p} refunded to you`, amount: p, tone: 'paid' };
    if (s.state === 'paid_friend') return { seatId: s.id, who: name, status: 'Paid', amount: p, tone: 'paid' };
    return { seatId: s.id, who: '—', status: 'Unpaid', amount: p, tone: 'kept' };
  });
  const yourSeats = seats.filter((s) => s.state === 'paid_owner' || s.state === 'covered' || s.state === 'kept' || state.board.transfers[s.id] || state.board.lateSeats.includes(s.id));
  const yourSub = [...yourSeats]
    .sort((a, b) => Number(b.state === 'paid_owner') - Number(a.state === 'paid_owner'))
    .map((s) => (s.state === 'paid_owner' ? s.id : s.state === 'covered' ? `covered ${s.id}` : `kept ${s.id}`))
    .join(' + ');
  const ledger: GroupReceiptView['ledger'] = [
    { key: 'start', label: m.fallback ? 'Paid at start' : 'Blocked at start', value: formatINR(m.blockAmount) },
    { key: 'paid', label: 'You paid in total', value: formatINR(m.rohanCharged), sub: yourSub || undefined },
  ];
  if (m.feesKept > 0) ledger.push({ key: 'fees', label: 'Fees kept on released seats', value: formatINR(m.feesKept) });
  ledger.push({ key: 'unblocked', label: m.fallback ? 'Refunded to you' : 'Unblocked', value: formatINR(m.returned), strong: true });
  const refunds = state.board.lateSeats.map((id) => ({
    key: `refund-${id}`,
    label: `Refunded · ${state.seats[id].payerName} paid for ${id}`,
    value: p,
  }));
  const settledAt = state.board.settledAt;
  const lateLast = [...state.notifications].find((x) => x.type === 'late_paid');
  const cancelled = hold.status === 'cancelled';
  return {
    badge: cancelled ? 'FINISHED' : 'CONFIRMED',
    title: cancelled ? `Hold cancelled · ${inCount} of ${n} in` : `Your group is set · ${inCount} of ${n} in`,
    statusLine: settledAt ? `${cancelled ? 'Cancelled' : 'Settled'} at ${formatClockIST(settledAt)}` : '',
    filmLine: `${state.show.filmTitle} · ${state.show.language}, ${state.show.format}`,
    dateLine: `Fri, 20 Nov · ${formatClockIST(state.show.startsAt)}`,
    cinemaLine: `${state.show.cinemaName} · ${state.show.screen}`,
    rows,
    ledger,
    refunds,
    netPaid: refunds.length ? { label: 'You paid in the end', value: formatINR(m.netPaid) } : null,
    lateNote: lateLast ? { title: lateLast.title, body: lateLast.body } : null,
    kept: selectKeptSeatActions(state),
  };
}

// ---------------------------------------------------------------------------
// Your Bookings & Purchases (organiser)
// ---------------------------------------------------------------------------

export function selectOrderCard(state: BoardState) {
  const hold = state.hold;
  const m = selectMoney(state);
  if (!hold || !m) return null;
  const n = hold.seatIds.length;
  const seats = holdSeats(state);
  const tierCode = seats[0]?.tier === 'primePlus' ? 'PP' : seats[0]?.tier === 'recliner' ? 'RC' : seats[0]?.tier === 'classic' ? 'CL' : 'PR';
  const range = formatSeatRange(hold.seatIds, state.seats).replace('–', '…');
  const paidCount = seats.filter((s) => s.state === 'paid_owner' || s.state === 'paid_friend' || s.state === 'covered').length;
  const inCount = seats.filter((s) => s.state !== 'released').length;
  const created = new Date(hold.createdAt + 330 * MIN);
  const hh = created.getUTCHours();
  const two = (x: number) => x.toString().padStart(2, '0');
  const ordered = `20 Nov, 2026 at ${two(hh % 12 === 0 ? 12 : hh % 12)}:${two(created.getUTCMinutes())}:${two(created.getUTCSeconds())} ${hh < 12 ? 'AM' : 'PM'}`;
  const live = hold.status === 'active' || hold.status === 'resolving';
  const youPaidFor = m.rohanSeats - state.board.lateSeats.length;
  return {
    movieTitle: state.show.filmTitle,
    language: state.show.language,
    showtime: `Fri, 20 Nov, 2026 | ${formatClockIST(state.show.startsAt).padStart(8, '0')}`,
    cinema: state.show.cinemaName,
    seats: `${n} tickets: ${tierCode} - ${range}`,
    screen: state.show.screen.toUpperCase(),
    status: (live ? 'GROUP HOLD' : hold.status === 'cancelled' ? 'FINISHED' : 'CONFIRMED') as 'GROUP HOLD' | 'FINISHED' | 'CONFIRMED',
    statusMessage: live
      ? `${paidCount} of ${n} paid · ends ${deadlineLabel(state)}`
      : hold.status === 'cancelled'
        ? `Hold cancelled · ${inCount} of ${n} in`
        : `${inCount} of ${n} in · you paid for ${youPaidFor}`,
    orderedDate: ordered,
    live,
  };
}

// ---------------------------------------------------------------------------
// Friend-facing (never names a friend who hasn't paid)
// ---------------------------------------------------------------------------

export interface LatePageView {
  view: FriendLateView;
  kicker: string;
  title: string;
  seatId: string | null;
  body: string;
  cta: string;
  availability: string;
  film: string;
  meta: string;
  price: string;
}

export function selectLatePage(state: BoardState, name: FriendName): LatePageView | null {
  const hold = state.hold;
  if (!hold) return null;
  const view = state.board.friendView[name] ?? friendView(state, name);
  const seatId = view === 'late' ? lateSeatFor(state, name) : null;
  const organiser = hold.organiser.name;
  const start = formatClockIST(state.show.startsAt);
  const p = formatINR(per(state));
  const base = { film: state.show.filmTitle, meta: `Fri, ${start} · ${state.show.cinemaName}`, price: p };
  if (view === 'started') {
    return { ...base, view, kicker: '', title: 'This show has started.', seatId: null, body: '', cta: '', availability: '' };
  }
  if (view === 'late' && seatId) {
    return {
      ...base,
      view,
      kicker: 'The group hold has ended',
      title: `${organiser} kept a seat for you`,
      seatId,
      // Spec: "Rohan gets his ₹277.14 back." No pronoun is guessed (D-069), so: "Rohan gets ₹277.14 back."
      body: `Pay before the show starts and the ticket is yours. ${organiser} gets ${p} back.`,
      cta: `Pay ${p} for ${seatId}`,
      availability: `Available until ${start}`,
    };
  }
  return { ...base, view: 'ended', kicker: '', title: 'This hold has ended.', seatId: null, body: '', cta: 'Book seats for this show', availability: '' };
}

/** "Your group is set. You're in D09." on a paid friend's ticket once the hold settles. */
export function selectFriendSetLine(state: BoardState, name: FriendName): string | null {
  const hold = state.hold;
  if (!hold || hold.status !== 'settled') return null;
  const seats = state.friendPayments.filter((p) => p.name === name && p.status === 'success').flatMap((p) => p.seatIds);
  if (seats.length === 0) return null;
  return `Your group is set. You're in ${sortIds(state, seats).join(', ')}.`;
}

/** Transfer: the friend's ticket shows who sent it instead of an amount. */
export function selectTransferNote(state: BoardState, name: FriendName): { seatLine: string; amount: string } | null {
  const entry = Object.entries(state.board.transfers).find(([, n]) => n === name);
  if (!entry || !state.hold) return null;
  return { seatLine: `${entry[0]} · 1 ticket · From ${state.hold.organiser.name} · Sent to your SMS`, amount: 'Paid by ' + state.hold.organiser.name };
}

/** Latest BookMyShow reminder for this friend (they entered a phone number and haven't paid). */
export function selectFriendReminder(state: BoardState, name: FriendName): NotificationItem | null {
  return state.notifications.find((n) => n.type === `friend_reminder:${name}`) ?? null;
}

/** Rohan's in-app banners. */
const ROHAN_BANNERS = new Set(['friend_paid', 'friend_declined', 'halfway', 't30', 'settled', 'late_paid']);
export function selectRohanBanner(state: BoardState): NotificationItem | null {
  return state.notifications.find((n) => !!n.type && ROHAN_BANNERS.has(n.type)) ?? null;
}

export { selectShortenOptions, relativeDayIST, SEAT_LOCK_DURATION_MS };
