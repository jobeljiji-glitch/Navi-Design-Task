/**
 * Board, deadline, settlement and late payer (prompts 06, 09): spec §4 steps 7–9, §3 timers, §5 failures 18–27.
 *
 * Wraps `friendFlowReducer` (→ holdFlowReducer → demoReducer) and owns:
 * - the timers: lock expiry, halfway, T−30, deadline (unpaid seats kept, not charged), deadline grace,
 *   the 9:00 PM late-pay cut-off (+10 min grace) and the showtime settlement,
 * - edge-first release with the fee rule, cover, reminder, shorten, add a seat, cancel,
 * - the pay link / transfer for a kept seat (first wins), and the late payer's checkout.
 *
 * 09 money model: kept seats are charged at SHOWTIME, once. A friend who pays for a kept seat before the
 * cut-off takes the ticket and that seat is simply never charged to Rohan. No refund path except the
 * pay-all-now rail. Invariant: blockAmount = charged + unblocked + stillBlocked.
 *
 * Pure: no React, no Date.now(), no randomness. Time comes from state.clock.
 */
import { formatINR, releaseFee, seatPrice } from './money';
import { coverOrder, formatClockIST, formatSeatRange, GROUP_LINK, relativeDayIST, selectHoldSuccess, selectShortenOptions, type SeatTileView } from './holdFlow';
import {
  CHAT_TITLE,
  FRIENDS,
  SCRIPTED_SEATS,
  friendFlowReducer,
  hasDeclined,
  hasPaid,
  isKnownToBms,
  openedSeat,
  withFriendFlow,
  type AppAction,
  type AppState,
  type FriendName,
} from './friendFlow';
import { getEdgeReleasableSeats, latePayCutoff, GRACE_DURATION_MS, SEAT_LOCK_DURATION_MS } from './rules';
import type { DemoState, FriendPayment, Hold, NotificationItem, Seat } from './types';

const MIN = 60 * 1000;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type FriendLateView = 'late' | 'ended' | 'started';

export interface BoardSlice {
  /** Convenience fees kept on seats released after the free window (paise). Charged at showtime. */
  feesKeptPaise: number;
  /** "Can't make it" rows Rohan answered with Keep. */
  declineAcks: string[];
  /** Rohan answered the T−30 prompt. */
  t30Decided: boolean;
  /** Kept seats Rohan sent a pay link for (failure #24: then transfer is off). */
  payLinkSentFor: string[];
  /** Kept seats Rohan transferred: seatId → friend (then the pay link is off). Charged to Rohan at showtime. */
  transfers: Record<string, string>;
  /** Kept seats a late friend paid for (never charged to Rohan). */
  lateSeats: string[];
  /** Friend's page after the deadline. */
  friendView: Partial<Record<FriendName, FriendLateView>>;
  /** Seats kept at the deadline (incl. payments that failed in grace). */
  keptAtDeadline: number;
  /** Seats charged as kept at showtime (settlement step 1). */
  settledKeptCount: number;
  /** Amount charged at showtime (kept seats + fees kept). */
  settledChargePaise: number;
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
    keptAtDeadline: 0,
    settledKeptCount: 0,
    settledChargePaise: 0,
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

/** "9:15 PM": settlement time (the block ends at showtime). */
function showLabel(state: DemoState): string {
  return formatClockIST(state.show.startsAt);
}

/** "9:00 PM": last moment to pay for a kept seat. */
export function cutoffOf(state: DemoState): number {
  return latePayCutoff(state.show.startsAt);
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

/** Seats released when Rohan releases `count`, one at a time from the left end of the row inwards (D-082). */
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

/**
 * 10: friends BMS can nudge: everyone who opened the link and is known (phone number, logged in, or asked
 * for a reminder) and hasn't paid or said they can't make it. Someone who only asked for a reminder gets
 * the T−30 nudge they agreed to, not the halfway one.
 */
export function remindable(state: AppState, at: 'halfway' | 't30'): FriendName[] {
  return FRIENDS.filter((f) => {
    if (!isKnownToBms(state, f) || hasPaid(state, f) || hasDeclined(state, f)) return false;
    // They agreed to one reminder at T−30 (the consent sheet says so): no halfway nudge.
    return at === 't30' || !state.friendFlow.sessions[f].remindRequested;
  });
}

function friendReminders(state: BoardState, at: 'halfway' | 't30'): BoardState {
  let s = state;
  const deadline = deadlineLabel(state);
  for (const f of remindable(state, at)) {
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
  /** Rohan's own + covered seats (charged at approval / on Cover). */
  ownSeats: number;
  /** Kept seats Rohan will be charged for at showtime (kept + transferred), before settlement. */
  keptSeats: number;
  friendsPaid: number;
  friendSeats: number;
  unpaidSeats: number;
  releasedSeats: number;
  feesKept: number;
  /** Actually debited so far. */
  charged: number;
  /** Charged at showtime if nobody pays first: kept seats + fees kept (0 after settlement). */
  pendingCharge: number;
  /** Blocked money for seats friends haven't paid yet (open + kept). 0 after settlement. */
  toCover: number;
  /** Money still blocked, not charged (Reserve Pay / card). 0 after settlement. */
  stillBlocked: number;
  /** Money unblocked: 0 until settlement, then everything not charged. */
  unblocked: number;
  /** Pay-all-now rail only: refunded as friends pay / seats are released. */
  refunded: number;
  /** What Rohan pays in the end (projected before settlement). */
  netPaid: number;
  blockAmount: number;
  fallback: boolean;
  finished: boolean;
}

export function selectMoney(state: BoardState): Money | null {
  const hold = state.hold;
  if (!hold) return null;
  const p = per(state);
  let own = 0;
  let kept = 0;
  let friendSeats = 0;
  let unpaid = 0;
  let released = 0;
  for (const s of holdSeats(state)) {
    if (s.state === 'paid_owner' || s.state === 'covered') own++;
    else if (s.state === 'kept') kept++;
    else if (s.state === 'paid_friend') {
      if (state.board.transfers[s.id]) kept++;
      else friendSeats++;
    } else if (isUnpaid(s)) unpaid++;
    else if (s.state === 'released') released++;
  }
  const feesKept = state.board.feesKeptPaise;
  const fallback = hold.paymentRail === 'pay_and_refund';
  const finished = hold.status === 'settled' || hold.status === 'cancelled';
  const charged = hold.debited;
  if (fallback) {
    // Everything was paid up front; friends' seats and released seats (minus fees kept) come back as refunds.
    const refunded = (friendSeats + released) * p - feesKept;
    return {
      perSeat: p,
      ownSeats: own,
      keptSeats: kept,
      friendsPaid: friendSeats * p,
      friendSeats,
      unpaidSeats: unpaid,
      releasedSeats: released,
      feesKept,
      charged,
      pendingCharge: 0,
      toCover: finished ? 0 : (unpaid + kept) * p,
      stillBlocked: 0,
      unblocked: 0,
      refunded,
      netPaid: charged - refunded,
      blockAmount: hold.blockAmount,
      fallback,
      finished,
    };
  }
  const pendingCharge = finished ? 0 : kept * p + feesKept;
  return {
    perSeat: p,
    ownSeats: own,
    keptSeats: kept,
    friendsPaid: friendSeats * p,
    friendSeats,
    unpaidSeats: unpaid,
    releasedSeats: released,
    feesKept,
    charged,
    pendingCharge,
    toCover: finished ? 0 : (unpaid + kept) * p,
    stillBlocked: finished ? 0 : hold.blockAmount - charged,
    unblocked: finished ? hold.blockAmount - charged : 0,
    refunded: 0,
    netPaid: charged + pendingCharge,
    blockAmount: hold.blockAmount,
    fallback,
    finished,
  };
}

// ---------------------------------------------------------------------------
// Timers
// ---------------------------------------------------------------------------

/** Deadline: unpaid seats become kept (still blocked, not charged). Payments with the bank keep the 10-min grace. */
function closeAtDeadline(state: BoardState): BoardState {
  const hold = state.hold!;
  const now = state.clock.now;
  const seats = { ...state.seats };
  let kept = 0;
  for (const id of hold.seatIds) {
    const s = seats[id];
    if (s && (s.state === 'held' || s.state === 'locked')) {
      seats[id] = { ...s, state: 'kept', lockedBy: undefined, lockedUntil: undefined };
      kept++;
    }
  }
  const paying = hold.seatIds.filter((id) => seats[id]?.state === 'paying').length;
  // A friend who locked a seat but never sent the payment can't finish it now.
  const friendPayments = state.friendPayments.map((fp) => (fp.status === 'locked' ? { ...fp, status: 'failed' as const } : fp));
  let s: BoardState = {
    ...state,
    seats,
    friendPayments,
    hold: { ...hold, status: 'closed', events: [...hold.events, { id: `evt-${now}-closed`, at: now, type: 'SEATS_KEPT', description: `${plural(kept, 'seat', 'seats')} kept` }] },
  };
  s = setBoard(s, { keptAtDeadline: kept });
  if (kept > 0) {
    s = pushNotif(s, {
      id: `notif-kept-${now}`,
      title: 'Seats kept 🎟',
      body: `${plural(kept, 'seat', 'seats')} kept. Charged at ${showLabel(s)} unless a friend pays.`,
      type: 'kept',
    });
  }
  return log(
    s,
    'DEADLINE',
    `Deadline: ${plural(kept, 'seat', 'seats')} kept, not charged${paying ? `; ${plural(paying, 'payment', 'payments')} with the bank until ${formatClockIST(hold.graceUntil)}` : ''}`,
  );
}

/** Deadline grace ends: a payment still with the bank fails and its seat is kept. */
function endDeadlineGrace(state: BoardState): BoardState {
  const hold = state.hold!;
  const paying = hold.seatIds.filter((id) => state.seats[id]?.state === 'paying');
  if (paying.length === 0) return state;
  const seats = { ...state.seats };
  for (const id of paying) seats[id] = { ...seats[id], state: 'kept', lockedBy: undefined, lockedUntil: undefined };
  const friendPayments = state.friendPayments.map((fp) =>
    fp.status === 'pending' && fp.seatIds.some((id) => paying.includes(id)) ? { ...fp, status: 'failed' as const } : fp,
  );
  const s = setBoard({ ...state, seats, friendPayments }, { keptAtDeadline: state.board.keptAtDeadline + paying.length });
  return log(s, 'GRACE_ENDED', `Bank didn't confirm ${paying.join(', ')} in time: kept`);
}

/** 9:00 PM cut-off + 10 min: a late payment still with the bank fails (not charged); the seat stays kept. */
function endCutoffGrace(state: BoardState): BoardState {
  let s = state;
  for (const name of FRIENDS) {
    const p = openLatePayment(s, name);
    if (!p || p.status !== 'pending') continue;
    s = { ...s, friendPayments: s.friendPayments.map((x) => (x.id === p.id ? { ...x, status: 'failed' as const } : x)) };
    s = ensureBoard(friendFlowReducer(s, { type: 'FRIEND_GOTO', name, screen: 'failed' }));
    s = log(s, 'LATE_PAY_EXPIRED', `${name}'s payment for ${p.seatIds.join(', ')} wasn't confirmed by ${formatClockIST(cutoffOf(s) + GRACE_DURATION_MS)}: not charged`);
  }
  return s;
}

/** Showtime (9:15 PM): charge kept seats + fees kept from the block, unblock the rest in one go. */
function settle(state: BoardState): BoardState {
  const hold = state.hold!;
  const now = state.clock.now;
  const p = per(state);
  // Nothing can still be pending (cut-off grace ended at 9:10), but be safe: anything open is not charged.
  const friendPayments = state.friendPayments.map((fp) => (fp.status === 'pending' || fp.status === 'locked' ? { ...fp, status: 'failed' as const } : fp));
  const kept = holdSeats(state).filter((x) => x.state === 'kept' || !!state.board.transfers[x.id]).length;
  const fallback = hold.paymentRail === 'pay_and_refund';
  const charge = fallback ? 0 : kept * p + state.board.feesKeptPaise;
  let s: BoardState = {
    ...state,
    friendPayments,
    hold: {
      ...hold,
      status: 'settled',
      debited: hold.debited + charge,
      events: [...hold.events, { id: `evt-${now}-settled`, at: now, type: 'HOLD_SETTLED', description: `${plural(kept, 'kept seat', 'kept seats')} charged` }],
    },
  };
  s = setBoard(s, { settledKeptCount: kept, settledChargePaise: charge, settledAt: now });
  const m = selectMoney(s)!;
  const inCount = holdSeats(s).filter((x) => x.state !== 'released').length;
  const n = hold.seatIds.length;
  if (!fallback) {
    s = pushSms(
      s,
      charge > 0 ? `${formatINR(charge)} charged and ${formatINR(m.unblocked)} unblocked by BookMyShow.` : `${formatINR(m.unblocked)} unblocked by BookMyShow.`,
      'settled',
    );
  }
  s = pushNotif(s, {
    id: `notif-settled-${now}`,
    title: 'Your group is set! 🎬',
    body: fallback ? `${inCount} of ${n} in.` : `${inCount} of ${n} in. ${formatINR(m.unblocked)} unblocked.`,
    type: 'settled',
  });
  return log(s, 'HOLD_SETTLED', `Showtime: ${plural(kept, 'kept seat', 'kept seats')} charged (${formatINR(charge)}), ${formatINR(m.unblocked)} unblocked`);
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

  if (hold.status !== 'active' && hold.status !== 'closed') return s;

  if (s.hold!.status === 'active') {
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
      s = friendReminders(s, 'halfway');
    }

    // 3. T−30
    if (now >= h.deadline - 30 * MIN && now < h.deadline && !s.hold!.reminderT30Fired) {
      s = { ...s, hold: { ...s.hold!, reminderT30Fired: true } };
      const unpaid = holdSeats(s).filter(isUnpaid).length;
      if (unpaid > 0) {
        s = pushNotif(s, {
          id: `notif-t30-${now}`,
          title: '30 min left ⏰',
          body: `${plural(unpaid, 'seat', 'seats')} unpaid. They're kept at ${deadlineLabel(s)} unless you release them.`,
          type: 't30',
        });
        s = friendReminders(s, 't30');
      }
    }

    // 4. Deadline: unpaid seats kept (not charged)
    if (now >= h.deadline) s = closeAtDeadline(s);
  }

  if (s.hold!.status === 'closed') {
    // 5. Deadline grace ends (7:25 PM)
    if (now >= s.hold!.graceUntil) s = endDeadlineGrace(s);
    // 6. Late-pay cut-off grace ends (9:10 PM)
    if (now >= cutoffOf(s) + GRACE_DURATION_MS) s = endCutoffGrace(s);
    // 7. Showtime: settle once
    if (now >= s.show.startsAt) s = settle(s);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Late payer
// ---------------------------------------------------------------------------

function isAfterDeadline(state: DemoState): boolean {
  const h = state.hold;
  return !!h && (h.status === 'settled' || h.status === 'cancelled' || h.status === 'closed' || state.clock.now >= h.deadline);
}

/** Kept seats a late friend can still start paying for: before 9:00 PM, kept, not transferred, not mid-payment by someone else. */
export function lateSeatsAvailable(state: BoardState, name?: string): string[] {
  const h = state.hold;
  if (!h || h.status !== 'closed' || state.clock.now >= cutoffOf(state)) return [];
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
        s = log(s, 'SEAT_RELEASED', `Rohan released ${id}${fee ? ` (${formatINR(fee)} fee kept, charged at showtime)` : ' (free)'}`);
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
      return log(s, 'SEATS_COVERED', `Rohan covered ${ids.join(', ')} (${formatINR(ids.length * per(state))} charged)`);
    }

    case 'SEND_ORGANISER_REMINDER': {
      // 09: Rohan shares a BMS-written progress card through his own apps. No 2-hour limit.
      if (!isActive(state)) return state;
      const s = ensureBoard(friendFlowReducer(state, action));
      return log(s, 'REMINDER_SENT', 'Rohan shared a reminder');
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
      // Failure #18: an adjacent seat, added to the block, same deadline.
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
      // Cancelling settles at once: fees kept are charged, everything else is unblocked.
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
      const fallback = state.hold!.paymentRail === 'pay_and_refund';
      const feesKept = state.board.feesKeptPaise + n * fee;
      let s: BoardState = {
        ...state,
        seats,
        hold: { ...state.hold!, status: 'cancelled', debited: state.hold!.debited + (fallback ? 0 : feesKept) },
        friendPayments: state.friendPayments.map((p) => (p.status === 'locked' ? { ...p, status: 'failed' as const } : p)),
      };
      s = setBoard(s, { feesKeptPaise: feesKept, settledChargePaise: fallback ? 0 : feesKept, settledAt: state.clock.now });
      const m = selectMoney(s)!;
      s = pushSms(s, fallback ? `${formatINR(m.refunded)} refunded by BookMyShow.` : `${formatINR(m.unblocked)} unblocked by BookMyShow.`, 'cancel');
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
      // The ticket moves without a payment: Rohan is still charged for it at showtime (D-083).
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
      // Late checkouts close at the 9:00 PM cut-off; only payments already with the bank get the 10-min grace.
      if (state.clock.now >= cutoffOf(state)) return state;
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
      // Failure #23: the ticket moves to the friend; the kept seat is simply never charged to Rohan.
      let s = state;
      for (const id of late.seatIds) {
        s = ensureBoard(friendFlowReducer(s, { type: 'FRIEND_LATE_PAY', friendName: name, seatId: id }));
        s = { ...s, notifications: s.notifications.slice(1) }; // replaced below (typed for Rohan's banners)
      }
      const now = s.clock.now;
      const amount = formatINR(late.amountPaise);
      const seatsText = late.seatIds.join(', ');
      const fallback = s.hold?.paymentRail === 'pay_and_refund';
      s = {
        ...s,
        seats: Object.fromEntries(Object.entries(s.seats).map(([k, v]) => [k, late.seatIds.includes(k) ? { ...v, lockedBy: undefined, lockedUntil: undefined } : v])),
        friendPayments: s.friendPayments.map((p) => (p.id === late.id ? { ...p, status: 'success' as const, at: now } : p)),
      };
      s = setBoard(s, { lateSeats: [...s.board.lateSeats, ...late.seatIds] });
      s = setFriendView(s, name, undefined);
      s = pushNotif(s, {
        id: `notif-late-${name}-${now}`,
        title: `${name} took ${seatsText} 🙌`,
        body: fallback ? `${amount} is on its way back to you.` : `${seatsText} won't be charged to you`,
        type: 'late_paid',
      });
      if (fallback) s = pushSms(s, `${amount} refunded by BookMyShow.`, 'late-refund');
      s = ensureBoard(friendFlowReducer(s, { type: 'FRIEND_GOTO', name, screen: 'ticket' }));
      return log(s, 'LATE_PAID', `${name} paid ${amount} for kept ${seatsText}; never charged to Rohan`);
    }

    case 'FRIEND_RETRY': {
      const late = openLatePayment(state, action.name);
      if (!late) return ensureBoard(friendFlowReducer(state, action));
      if (state.clock.now >= cutoffOf(state)) return state;
      return ensureBoard(friendFlowReducer(state, { type: 'FRIEND_GOTO', name: action.name, screen: 'approve' }));
    }

    case 'RESTART_DEMO':
      return withBoard(friendFlowReducer(state, action));

    default:
      return ensureBoard(friendFlowReducer(state, action as AppAction));
  }
}

// ---------------------------------------------------------------------------
// Selectors: board (organiser view; names only when BookMyShow knows them)
// ---------------------------------------------------------------------------

export type SeatRowKind = 'you' | 'paid' | 'paying' | 'opened' | 'not_opened' | 'kept' | 'released';

/** One line per seat: "Amit · D08 · Paid", "Sana · D09 · Opened, not paid", "D10 · Not opened yet". */
export interface SeatRow {
  key: string;
  seatId: string;
  /** Shown only when BookMyShow knows who it is (paid, paying, or entered a phone number). */
  name: string | null;
  /** One or two words: "Paid", "Opened, not paid", "Kept" */
  status: string;
  /** Optional second line: "Charged at 9:15 PM unless a friend pays" */
  note?: string;
  kind: SeatRowKind;
}

export function seatRowText(r: SeatRow): string {
  return [r.name, r.seatId, r.status].filter(Boolean).join(' · ');
}

/** "Kept · charged at 9:15 PM unless a friend pays" (receipt and T−30 sheet, one line). */
export function seatStatusLine(r: SeatRow): string {
  return r.note ? `${r.status} · ${r.note[0].toLowerCase()}${r.note.slice(1)}` : r.status;
}

export interface StatusRow {
  key: string;
  name: string;
  detail: string;
}

export interface ReminderShareView {
  /** BMS-written progress card, no names */
  cardTitle: string;
  cardBody: string;
  link: string;
  /** First line of the message in the share sheet */
  message: string;
}

export interface BoardView {
  title: string;
  subtitle: string;
  status: Hold['status'];
  pill: string;
  pillTone: 'warning' | 'muted';
  /** "₹831.42 left to cover" */
  headline: string;
  /** "₹1,385.70 blocked · unblocked at showtime" */
  headlineSub: string;
  meter: { charged: number; friendsPaid: number; toCover: number; chargedLabel: string; friendsLabel: string; toCoverLabel: string };
  rulesTitle: string;
  rulesBody: string;
  tiles: SeatTileView[];
  paidLine: string;
  paidCount: number;
  totalCount: number;
  rows: SeatRow[];
  declined: StatusRow[];
  waitingCount: number;
  notOpenedCount: number;
  canShareReminder: boolean;
  reminderShare: ReminderShareView;
  canRelease: boolean;
  canCover: boolean;
  freeReleaseLine: string;
  t30: { title: string; body: string } | null;
  closedBand: { title: string; body: string } | null;
  /** "Final receipt at 9:15 PM" under the closed board's footer */
  closedFooterCaption: string;
  ownerSeatId: string;
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

/** Per-seat rows for the organiser (board, receipt, T−30). Names only when BMS knows them. */
export function selectSeatRows(state: BoardState): SeatRow[] {
  const hold = state.hold;
  if (!hold) return [];
  const now = state.clock.now;
  const settled = hold.status === 'settled';
  const start = showLabel(state);
  // Friends BMS knows who haven't paid or declined: the seat they last picked.
  const opened = new Map<string, string>();
  for (const f of FRIENDS) {
    if (hasPaid(state, f) || hasDeclined(state, f)) continue;
    const seat = openedSeat(state, f);
    if (seat && !opened.has(seat)) opened.set(seat, f);
  }
  return holdSeats(state).map((s): SeatRow => {
    const base = { key: `row-${s.id}`, seatId: s.id };
    if (s.state === 'paid_owner') return { ...base, name: 'You', status: 'Paid', kind: 'you' };
    if (s.state === 'covered') return { ...base, name: 'You', status: 'Covered by you', kind: 'you' };
    if (s.state === 'released') return { ...base, name: null, status: 'Released', kind: 'released' };
    if (s.state === 'kept') {
      return { ...base, name: null, status: 'Kept', note: settled ? `Charged ${formatINR(per(state))}` : `Charged at ${start} unless a friend pays`, kind: 'kept' };
    }
    if (s.state === 'paid_friend') {
      const name = s.payerName ?? null;
      if (state.board.transfers[s.id]) return { ...base, name, status: 'Transferred', note: settled ? 'Charged to you' : `Charged to you at ${start}`, kind: 'kept' };
      if (state.board.lateSeats.includes(s.id)) return { ...base, name, status: 'Paid late', kind: 'paid' };
      return { ...base, name, status: 'Paid', kind: 'paid' };
    }
    const live = s.state === 'paying' || (s.state === 'locked' && !!s.lockedUntil && s.lockedUntil > now);
    if (live && s.lockedBy) return { ...base, name: s.lockedBy, status: 'Paying now', kind: 'paying' };
    const who = opened.get(s.id);
    if (who) {
      const asked = state.friendFlow.sessions[who as FriendName]?.remindRequested;
      return { ...base, name: who, status: 'Opened, not paid', ...(asked ? { note: 'Asked for a reminder' } : {}), kind: 'opened' };
    }
    return { ...base, name: null, status: 'Not opened yet', kind: 'not_opened' };
  });
}

const FRIDAY = 'Friday';

export function selectBoard(state: BoardState): BoardView | null {
  const hold = state.hold;
  const m = selectMoney(state);
  const success = selectHoldSuccess(state);
  if (!hold || !m || !success) return null;
  const now = state.clock.now;
  const deadline = deadlineLabel(state);
  const start = showLabel(state);
  const n = hold.seatIds.length;
  const seats = holdSeats(state);
  const paidCount = seats.filter((s) => s.state === 'paid_owner' || s.state === 'paid_friend' || s.state === 'covered').length;
  const active = hold.status === 'active';
  const closed = hold.status === 'closed';
  const rows = selectSeatRows(state);

  const declined = active
    ? state.declines
        .filter((d) => !state.board.declineAcks.includes(d.name) && !hasPaid(state, d.name))
        .map((d) => ({ key: `declined-${d.name}`, name: d.name, detail: "Can't make it" }))
    : [];
  const waitingCount = seats.filter((s) => s.state === 'held' || (s.state === 'locked' && (!s.lockedUntil || s.lockedUntil <= now))).length;
  const notOpenedCount = active ? rows.filter((r) => r.kind === 'not_opened').length : 0;

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
      ? { title: `30 min left · ${plural(unpaid, 'seat', 'seats')} unpaid`, body: `They're kept at ${deadline} unless you release them.` }
      : null;
  const paying = seats.filter((s) => s.state === 'paying').length;
  const cutoff = formatClockIST(cutoffOf(state));
  const closedBand = closed
    ? {
        title: paying > 0 ? `Deadline passed · ${plural(paying, 'payment', 'payments')} in progress` : 'Deadline passed · seats kept',
        body:
          paying > 0
            ? `${paying === 1 ? 'It stays' : 'They stay'} theirs until ${formatClockIST(hold.graceUntil)}.`
            : m.keptSeats > 0
              ? `Friends can pay for a kept seat before ${cutoff}.`
              : `Everything settles at ${start}.`,
      }
    : null;

  const anyPaying = seats.some((s) => s.state === 'paying');
  const addSeatId = active ? selectAddSeat(state) : null;
  const reminderTitle = `${plural(notOpenedCount, 'seat', 'seats')} still waiting for ${FRIDAY} 🍿`;
  const reminderBody = `Pick yours by ${deadline}`;

  let headline: string;
  let headlineSub: string;
  if (hold.status === 'settled') {
    headline = `${formatINR(m.charged)} charged`;
    headlineSub = m.fallback ? `${formatINR(m.refunded)} refunded` : `${formatINR(m.unblocked)} unblocked at ${start}`;
  } else if (hold.status === 'cancelled') {
    headline = 'Hold cancelled';
    headlineSub = m.fallback ? `${formatINR(m.refunded)} refunded` : `${formatINR(m.unblocked)} unblocked`;
  } else if (closed) {
    headline = `${formatINR(m.toCover)} left to cover`;
    headlineSub = m.toCover === 0 ? `Everyone's in · settles at ${start}` : m.fallback ? 'Already paid · refunded if a friend pays' : `Charged at ${start} unless a friend pays`;
  } else {
    headline = `${formatINR(m.toCover)} left to cover`;
    headlineSub = m.fallback ? 'Paid up front · refunded as friends pay' : `${formatINR(m.stillBlocked)} blocked · unblocked at showtime`;
  }

  return {
    title: CHAT_TITLE,
    subtitle: `${state.show.filmTitle} · Fri, ${start}`,
    status: hold.status,
    pill: active
      ? `Pay by ${deadline} · ${formatLeft(hold.deadline - now)}`
      : closed
        ? `Seats kept · settles ${start}`
        : hold.status === 'settled'
          ? `Settled at ${start}`
          : 'Hold cancelled',
    pillTone: active || closed ? 'warning' : 'muted',
    headline,
    headlineSub,
    meter: {
      charged: m.fallback ? m.netPaid : m.charged,
      friendsPaid: m.friendsPaid,
      toCover: m.toCover,
      chargedLabel: 'Charged to you',
      friendsLabel: 'Friends paid',
      toCoverLabel: 'Left to cover',
    },
    rulesTitle: `Unpaid seats are kept at ${deadline}`,
    rulesBody: freeReleaseLine,
    tiles: success.tiles,
    paidLine: `${paidCount} of ${n} paid`,
    paidCount,
    totalCount: n,
    rows,
    declined,
    waitingCount,
    notOpenedCount,
    canShareReminder: active && notOpenedCount > 0,
    reminderShare: { cardTitle: reminderTitle, cardBody: reminderBody, link: GROUP_LINK, message: `${reminderTitle} ${reminderBody}` },
    canRelease: releasableSeats(state).length > 0,
    canCover: active && !m.fallback && waitingCount > 0,
    freeReleaseLine,
    t30,
    closedBand,
    closedFooterCaption: `Final receipt at ${start}`,
    ownerSeatId: hold.ownerSeatId,
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
  blockedRow: { label: string; value: string };
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
    blockedRow: { label: m.fallback ? `${seatId} · paid` : `${seatId} · blocked`, value: formatINR(m.perSeat) },
    feeRow: { label: 'Convenience fee kept', value: formatINR(fee) },
    backRow: { label: m.fallback ? 'Refunded to you' : `Unblocked at ${showLabel(state)}`, value: formatINR(back) },
    feeKept: fee > 0,
    feeLine:
      fee > 0
        ? `${formatINR(state.show.fee)} fee per seat is kept`
        : state.show.tier === 'low' || free === null
          ? 'Free to release before the deadline'
          : `Free until ${formatClockIST(free)}`,
    cta: fee > 0 ? `Release ${seatId} · ${formatINR(fee)} fee kept` : `Release ${seatId} · ${formatINR(m.perSeat)} less to cover`,
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
  /** The unpaid seats, as on the board ("D06 · Not opened yet") */
  seatLines: string[];
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
  const unpaidIds = holdSeats(state).filter((s) => s.state === 'held' || s.state === 'locked').map((s) => s.id);
  const unpaid = unpaidIds.length;
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
    keepCaption: `Kept at ${deadline}`,
    releaseCaption: 'Back on sale, from the end of the row',
    seatLines: selectSeatRows(state).filter((r) => unpaidIds.includes(r.seatId)).map(seatRowText),
    chargeRow: { label: `Charged at ${showLabel(state)} if still unpaid`, value: formatINR(k * m.perSeat) },
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
    subtitle: 'Charged now. Nobody else can pick them.',
    row: { label: `I'll pay for ${plural(c, 'seat', 'seats')} now`, value: formatINR(c * m.perSeat), sub: ids.join(', ') },
    cta: `Pay ${formatINR(c * m.perSeat)} now`,
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
    subtitle: `Next to your group. Friends pay by ${deadlineLabel(state)}.`,
    row: { label: `${id} · blocked`, value: formatINR(m.perSeat), sub: 'Added to your block · not charged' },
    cta: `Block ${formatINR(m.perSeat)} on UPI`,
  };
}

export function selectCancelSheet(state: BoardState) {
  const hold = state.hold;
  const m = selectMoney(state);
  if (!hold || !m) return null;
  const n = holdSeats(state).filter((s) => s.state === 'held' || s.state === 'locked').length;
  const fee = releaseFee(hold, state.show, state.clock.now) * n + state.board.feesKeptPaise;
  return {
    title: 'Cancel the group hold?',
    subtitle: `${plural(n, 'unpaid seat goes', 'unpaid seats go')} back on sale. Paid seats aren't affected.`,
    rows: m.fallback
      ? [
          { label: 'Refunded now', value: formatINR(n * m.perSeat - (fee - state.board.feesKeptPaise)) },
          { label: 'Fee kept on released seats', value: formatINR(fee) },
        ]
      : [
          { label: 'Unblocked now', value: formatINR(m.stillBlocked - fee) },
          { label: 'Fee kept on released seats', value: formatINR(fee) },
        ],
    cta: 'Cancel hold',
    caption: "This can't be undone",
  };
}

// --- Settlement animation (showtime) -------------------------------------------

export function selectSettlementSteps(state: BoardState): string[] {
  const m = selectMoney(state);
  if (!m) return [];
  const steps: string[] = [];
  const kept = state.board.settledKeptCount;
  if (kept > 0) steps.push(`Charging ${plural(kept, 'kept seat', 'kept seats')}…`);
  if (!m.fallback) steps.push(`Unblocking ${formatINR(m.unblocked)}…`);
  steps.push('Finalising your receipt…');
  return steps;
}

// ---------------------------------------------------------------------------
// Receipt (organiser): provisional while seats are kept, final after showtime
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
  transferSubtitle: string;
  note: { title: string; body: string } | null;
}

export function selectKeptSeatActions(state: BoardState): KeptSeatActions | null {
  const hold = state.hold;
  if (!hold || (hold.status !== 'closed' && hold.status !== 'settled')) return null;
  const seats = holdSeats(state);
  const kept = seats.find((s) => s.state === 'kept' || state.board.transfers[s.id]);
  if (!kept) return null;
  const transferredTo = state.board.transfers[kept.id];
  const linkSent = state.board.payLinkSentFor.includes(kept.id);
  const open = hold.status === 'closed';
  const beforeCutoff = state.clock.now < cutoffOf(state);
  const p = formatINR(per(state));
  const cutoff = formatClockIST(cutoffOf(state));
  const start = showLabel(state);
  const transferCandidates = FRIENDS.filter((f) => !hasPaid(state, f));
  let note: KeptSeatActions['note'] = null;
  if (transferredTo) note = { title: `${kept.id} transferred to ${transferredTo}`, body: open ? `Charged to you at ${start}. Settle up outside BookMyShow.` : 'Charged to you. Settle up outside BookMyShow.' };
  else if (linkSent) note = { title: `Pay link sent for ${kept.id}`, body: `If they pay before ${cutoff}, ${kept.id} won't be charged to you.` };
  return {
    seatId: kept.id,
    payLinkEnabled: open && beforeCutoff && !transferredTo && !linkSent && kept.state === 'kept',
    transferEnabled: open && !transferredTo && !linkSent && kept.state === 'kept',
    payLinkCta: `Send a pay link for ${kept.id}`,
    payLinkMessage: `${hold.organiser.name} kept ${kept.id} for you. Pay ${p} before ${cutoff}: ${GROUP_LINK}`,
    transferCandidates,
    transferSubtitle: `The ticket moves to them. It's charged to you at ${start}. The pay link turns off.`,
    note,
  };
}

export interface GroupReceiptView {
  final: boolean;
  badge: 'CONFIRMED' | 'FINISHED' | 'GROUP HOLD';
  title: string;
  statusLine: string;
  filmLine: string;
  dateLine: string;
  cinemaLine: string;
  rows: ReceiptRow[];
  ledger: Array<{ key: string; label: string; value: string; sub?: string; strong?: boolean }>;
  lateNote: { title: string; body: string } | null;
  kept: KeptSeatActions | null;
}

/**
 * 11: a cancelled hold (Rohan cancels, Rohan cancels the block in UPI, or the cinema cancels the show) is final at
 * once. `at` is when it was cancelled; `cinema` = everyone refunded in full, including fees (spec §5 #27).
 */
export function selectCancellation(state: DemoState): { at: number; cinema: boolean } | null {
  const h = state.hold;
  if (!h || h.status !== 'cancelled') return null;
  const ev = [...h.events].reverse().find((e) => e.type === 'CINEMA_CANCELLED_SHOW' || e.type === 'ROHAN_CANCELLED_BLOCK');
  const settledAt = (state as Partial<BoardState>).board?.settledAt;
  return { at: ev?.at ?? settledAt ?? state.clock.now, cinema: h.events.some((e) => e.type === 'CINEMA_CANCELLED_SHOW') };
}

export function selectGroupReceipt(state: BoardState): GroupReceiptView | null {
  const hold = state.hold;
  const m = selectMoney(state);
  if (!hold || !m) return null;
  const n = hold.seatIds.length;
  const seats = holdSeats(state);
  const cancel = selectCancellation(state);
  const cinema = !!cancel?.cinema;
  // The cinema cancelled: nobody is in, whatever the seats showed before
  const inCount = cinema ? 0 : seats.filter((s) => s.state !== 'released').length;
  const p = formatINR(m.perSeat);
  const cancelled = hold.status === 'cancelled';
  const final = hold.status === 'settled' || cancelled;
  const start = showLabel(state);
  const rows: ReceiptRow[] = cinema
    ? seats.map((s) => ({ seatId: s.id, who: 'Cancelled', status: 'By the cinema · full refund', amount: '', tone: 'released' }))
    : selectSeatRows(state).map((r) => ({
        seatId: r.seatId,
        // Names only when BMS knows them; otherwise the status leads ("Kept" / "Charged at 9:15 PM unless a friend pays")
        who: r.name ?? r.status,
        status: r.name ? seatStatusLine(r) : (r.note ?? (r.kind === 'released' ? 'Back on sale' : '')),
        amount: r.kind === 'released' ? '' : p,
        tone: r.kind === 'you' ? 'you' : r.kind === 'kept' ? 'kept' : r.kind === 'released' ? 'released' : 'paid',
      }));
  const chargedSub = (() => {
    const parts: string[] = [];
    if (m.ownSeats > 0) parts.push(m.ownSeats === 1 ? 'your seat' : `${m.ownSeats} seats`);
    if (final && state.board.settledKeptCount > 0) parts.push(`${plural(state.board.settledKeptCount, 'kept seat', 'kept seats')}`);
    if (final && m.feesKept > 0) parts.push('fees kept');
    return parts.join(' + ');
  })();
  let ledger: GroupReceiptView['ledger'];
  if (cinema) {
    // Everything charged comes back; the rest of the block is unblocked
    const refunded = hold.refunded ?? m.charged;
    ledger = m.fallback
      ? [
          { key: 'start', label: 'Paid at start', value: formatINR(m.charged) },
          { key: 'refunded', label: 'Refunded to you', value: formatINR(refunded), strong: true },
        ]
      : [
          { key: 'start', label: 'Blocked', value: formatINR(m.blockAmount) },
          { key: 'charged', label: 'Charged', value: formatINR(m.charged), sub: chargedSub || undefined },
          { key: 'refunded', label: 'Refunded', value: formatINR(refunded) },
          { key: 'unblocked', label: 'Unblocked', value: formatINR(m.unblocked), strong: true },
        ];
  } else if (m.fallback) {
    ledger = [
      { key: 'start', label: 'Paid at start', value: formatINR(m.blockAmount) },
      { key: 'refunded', label: 'Refunded to you', value: formatINR(m.refunded) },
      { key: 'net', label: final ? 'You paid' : 'You paid so far', value: formatINR(m.netPaid), strong: true },
    ];
  } else if (final) {
    ledger = [
      { key: 'start', label: 'Blocked', value: formatINR(m.blockAmount) },
      { key: 'charged', label: 'Charged', value: formatINR(m.charged), sub: chargedSub || undefined },
      { key: 'unblocked', label: 'Unblocked', value: formatINR(m.unblocked), strong: true },
    ];
  } else {
    ledger = [
      { key: 'start', label: 'Blocked', value: formatINR(m.blockAmount) },
      { key: 'charged', label: 'Charged so far', value: formatINR(m.charged), sub: chargedSub || undefined },
      { key: 'cover', label: 'Left to cover', value: formatINR(m.toCover), sub: m.toCover > 0 ? `Charged at ${start} unless a friend pays` : undefined, strong: true },
    ];
  }
  const settledAt = state.board.settledAt;
  const lateLast = [...state.notifications].find((x) => x.type === 'late_paid');
  return {
    final,
    badge: cancelled ? 'FINISHED' : final ? 'CONFIRMED' : 'GROUP HOLD',
    title: cinema
      ? 'Show cancelled · full refund'
      : cancelled
        ? `Hold cancelled · ${inCount} of ${n} in`
        : final
          ? `Your group is set · ${inCount} of ${n} in`
          : `Seats kept · settles at ${start}`,
    statusLine: cancel
      ? `Cancelled at ${formatClockIST(cancel.at)}`
      : final && settledAt
        ? `Settled at ${formatClockIST(settledAt)}`
        : `${inCount} of ${n} in · receipt final at ${start}`,
    filmLine: `${state.show.filmTitle} · ${state.show.language}, ${state.show.format}`,
    dateLine: `Fri, 20 Nov · ${start}`,
    cinemaLine: `${state.show.cinemaName} · ${state.show.screen}`,
    rows,
    ledger,
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
  const live = hold.status === 'active' || hold.status === 'closed';
  const youPaidFor = m.ownSeats + state.board.settledKeptCount;
  return {
    movieTitle: state.show.filmTitle,
    language: state.show.language,
    showtime: `Fri, 20 Nov, 2026 | ${formatClockIST(state.show.startsAt).padStart(8, '0')}`,
    cinema: state.show.cinemaName,
    seats: `${n} tickets: ${tierCode} - ${range}`,
    screen: state.show.screen.toUpperCase(),
    status: (live ? 'GROUP HOLD' : hold.status === 'cancelled' ? 'FINISHED' : 'CONFIRMED') as 'GROUP HOLD' | 'FINISHED' | 'CONFIRMED',
    statusMessage:
      hold.status === 'active'
        ? `${paidCount} of ${n} paid · ends ${deadlineLabel(state)}`
        : hold.status === 'closed'
          ? m.keptSeats > 0
            ? `${plural(m.keptSeats, 'seat', 'seats')} kept · settles ${showLabel(state)}`
            : `${inCount} of ${n} in · settles ${showLabel(state)}`
          : hold.status === 'cancelled'
            ? selectCancellation(state)?.cinema
              ? 'Show cancelled · full refund'
              : `Hold cancelled · ${inCount} of ${n} in`
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
  const start = showLabel(state);
  const cutoff = formatClockIST(cutoffOf(state));
  const p = formatINR(per(state));
  const base = { film: state.show.filmTitle, meta: `Fri, ${start} · ${state.show.cinemaName}`, price: p };
  if (view === 'started') {
    // Failure #25: never a dead end. Paid friends already have their ticket by SMS.
    return {
      ...base,
      view,
      kicker: '',
      title: 'This show has started.',
      seatId: null,
      body: "Tickets for this show can't be bought any more. If you paid, your ticket is in your SMS.",
      cta: 'See other shows',
      availability: '',
    };
  }
  if (view === 'late' && seatId) {
    return {
      ...base,
      view,
      kicker: 'The group hold has ended',
      title: `${organiser} kept a seat for you`,
      seatId,
      body: 'The ticket is yours once you pay.',
      cta: `Pay ${p} for ${seatId}`,
      availability: `Pay before ${cutoff}`,
    };
  }
  const afterCutoff = hold.status === 'closed' && state.clock.now >= cutoffOf(state);
  return {
    ...base,
    view: 'ended',
    kicker: '',
    title: 'This hold has ended.',
    seatId: null,
    body: afterCutoff ? `Payments for kept seats closed at ${cutoff}.` : '',
    cta: 'Book seats for this show',
    availability: '',
  };
}

/** "Your group is set. You're in D09." on a paid friend's ticket once the deadline has passed. */
export function selectFriendSetLine(state: BoardState, name: FriendName): string | null {
  const hold = state.hold;
  if (!hold || (hold.status !== 'settled' && hold.status !== 'closed')) return null;
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
const ROHAN_BANNERS = new Set(['friend_paid', 'friend_declined', 'halfway', 't30', 'kept', 'settled', 'late_paid']);
export function selectRohanBanner(state: BoardState): NotificationItem | null {
  return state.notifications.find((n) => !!n.type && ROHAN_BANNERS.has(n.type)) ?? null;
}

export { selectShortenOptions, relativeDayIST, SEAT_LOCK_DURATION_MS };
