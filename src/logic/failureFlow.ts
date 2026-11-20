/**
 * Failure states (prompt 08): spec §5 cases the earlier wrappers didn't cover.
 *
 * Wraps `boardFlowReducer` (→ friendFlow → holdFlow → frozen demoReducer), like D-029/D-065/D-078, and adds:
 * - the payment fallback ladder (#4/#5): UPI Reserve Pay → card pre-auth → pay all now, refunded per friend,
 * - Rohan's own approval outcomes: declined (#6), bank timeout, own payment fails while the block succeeds (#7),
 * - plain copy for the 2-holds-per-account limit,
 * - a late payment still with the bank when the show starts (10-min grace from showtime),
 * - "Settled outside BMS" labels for kept seats after showtime (spec §3, label only).
 *
 * Pure: no React, no Date.now(), no randomness. Time comes from state.clock.
 */
import { formatINR, seatPrice } from './money';
import { formatClockIST } from './holdFlow';
import { boardFlowReducer, openLatePayment, type BoardFlowAction, type BoardState } from './boardFlow';
import { FRIENDS, type FriendName } from './friendFlow';
import { GRACE_DURATION_MS } from './rules';
import type { DemoSettings, PaymentRail } from './types';

const MIN = 60 * 1000;
/** Spec §5 #6: seats stay locked 10 more minutes after a declined block. */
export const DECLINE_HOLD_MS = 10 * MIN;
/** Fictional card for the pre-auth rung. */
export const DEMO_CARD = 'ending 4021';

export type ApprovalOutcome = 'ok' | 'declined' | 'timeout' | 'own_fails';

export interface FailureSlice {
  /** What Rohan's next approval (UPI PIN / card OTP) does. */
  nextApproval: ApprovalOutcome;
  /** Rung 2 of the ladder: the card can place a hold. Off → pay all now. */
  cardCanHold: boolean;
  /** After a decline or timeout: seats stay Rohan's until then (#6). */
  holdingUntil: number | null;
  /** Rohan's iOS alert (#7). */
  alert: string | null;
  /** Kept seats Rohan labelled "Settled outside BMS" after showtime. */
  settledOutside: string[];
}

export type FailureState = BoardState & { failure?: FailureSlice };

export function initialFailure(): FailureSlice {
  return { nextApproval: 'ok', cardCanHold: true, holdingUntil: null, alert: null, settledOutside: [] };
}

export function failureOf(state: FailureState): FailureSlice {
  return state.failure ?? initialFailure();
}

export type FailureAction =
  | { type: 'SET_NEXT_APPROVAL'; outcome: ApprovalOutcome }
  | { type: 'UPI_TIMED_OUT' }
  | { type: 'OWN_PAYMENT_FAILED' }
  | { type: 'CONTROLLER_TOGGLE_CARD_HOLD'; supported: boolean }
  | { type: 'SET_DEMO_SETTINGS'; patch: Partial<DemoSettings> }
  | { type: 'DISMISS_ALERT' }
  | { type: 'MARK_SETTLED_OUTSIDE'; seatId: string };

export type FailureFlowAction = BoardFlowAction | FailureAction;

export const ACCOUNT_LIMIT_BASE = 'You have reached the maximum active holds limit.';
export const ACCOUNT_LIMIT = 'You already have 2 group holds running. Book these seats now, or finish a hold first.';
export const TIMEOUT_PREFIX = "Your bank didn't respond, so nothing was set aside or charged.";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setFailure(state: FailureState, patch: Partial<FailureSlice>): FailureState {
  return { ...state, failure: { ...failureOf(state), ...patch } };
}

function log(state: FailureState, type: string, description: string): FailureState {
  const now = state.clock.now;
  return { ...state, controllerLog: [{ id: `log-${now}-${type}-${state.controllerLog.length}`, at: now, type, description }, ...state.controllerLog] };
}

/** Rung of the ladder a new draft starts on. */
export function ladderRail(state: FailureState): PaymentRail {
  if (state.settings.bankSupportsBlocking) return 'reserve_pay';
  return failureOf(state).cardCanHold ? 'card_preauth' : 'pay_and_refund';
}

/** Rails offered in "Pay with", in ladder order. */
export function availableRails(state: FailureState): PaymentRail[] {
  const rails: PaymentRail[] = [];
  if (state.settings.bankSupportsBlocking) rails.push('reserve_pay');
  if (failureOf(state).cardCanHold) rails.push('card_preauth');
  rails.push('pay_and_refund');
  return rails;
}

function isDraft(state: FailureState) {
  return !!state.hold && (state.hold.status === 'draft' || state.hold.status === 'awaiting_upi');
}

function withLadderRail(state: FailureState): FailureState {
  if (!state.hold || state.hold.status !== 'draft') return state;
  const rail = ladderRail(state);
  if (state.hold.paymentRail === rail) return state;
  // Moving to "pay all now" drops covered seats (every seat is paid now anyway).
  const per = seatPrice(state.seats[state.hold.ownerSeatId], state.show.fee);
  const debited = rail === 'pay_and_refund' ? per : state.hold.debited;
  return { ...state, hold: { ...state.hold, paymentRail: rail, debited } };
}

function decline(state: FailureState, message: string, logText: string): FailureState {
  const hold = state.hold!;
  const now = state.clock.now;
  let s: FailureState = { ...state, errorMessage: message, hold: { ...hold, status: 'draft' } };
  s = setFailure(s, { holdingUntil: now + DECLINE_HOLD_MS, nextApproval: 'ok' });
  return log(s, 'UPI_DECLINED', logText);
}

/** A late payment still with the bank when the show starts gets 10 minutes, then fails (not charged). */
function runShowtimeGrace(state: FailureState): FailureState {
  const cutoff = state.show.startsAt + GRACE_DURATION_MS;
  if (state.clock.now < cutoff) return state;
  let s = state;
  for (const name of FRIENDS) {
    const p = openLatePayment(s, name);
    if (!p || p.status !== 'pending') continue;
    s = { ...s, friendPayments: s.friendPayments.map((x) => (x.id === p.id ? { ...x, status: 'failed' as const } : x)) };
    s = { ...s, ...boardFlowReducer(s, { type: 'FRIEND_GOTO', name, screen: 'failed' }) };
    s = log(s, 'LATE_PAY_EXPIRED', `${name}'s payment for ${p.seatIds.join(', ')} wasn't confirmed by ${formatClockIST(cutoff)}: not charged`);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function failureFlowReducer(state: FailureState, action: FailureFlowAction): FailureState {
  switch (action.type) {
    case 'SET_NEXT_APPROVAL':
      return setFailure(state, { nextApproval: action.outcome });

    case 'CONTROLLER_TOGGLE_CARD_HOLD':
      return withLadderRail(setFailure(state, { cardCanHold: action.supported }));

    case 'CONTROLLER_TOGGLE_BANK_BLOCKING': {
      const s: FailureState = { ...state, ...boardFlowReducer(state, action) };
      return withLadderRail(s);
    }

    case 'SET_DEMO_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'BEGIN_GROUP_HOLD': {
      let s: FailureState = { ...state, ...boardFlowReducer(state, action) };
      if (s.errorMessage === ACCOUNT_LIMIT_BASE) s = { ...s, errorMessage: ACCOUNT_LIMIT };
      s = setFailure(s, { holdingUntil: null, alert: null });
      return withLadderRail(s);
    }

    case 'SET_PAYMENT_RAIL': {
      if (!availableRails(state).includes(action.rail)) return state;
      return { ...state, ...boardFlowReducer(state, action) };
    }

    case 'UPI_DECLINED': {
      if (!isDraft(state)) return state;
      const s: FailureState = { ...state, ...boardFlowReducer(state, action) };
      return setFailure(s, { holdingUntil: s.clock.now + DECLINE_HOLD_MS, nextApproval: 'ok' });
    }

    case 'UPI_TIMED_OUT': {
      if (!isDraft(state)) return state;
      const n = state.hold!.seatIds.length;
      return decline(state, `${TIMEOUT_PREFIX} Try again or pay for all ${n}.`, "Rohan's bank didn't respond to the request");
    }

    case 'OWN_PAYMENT_FAILED': {
      // #7: never half a hold. Nothing is blocked or debited; the seats stay selected on the seat layout.
      if (!isDraft(state)) return state;
      const owner = state.hold!.ownerSeatId;
      let s: FailureState = { ...state, hold: null, errorMessage: null };
      s = setFailure(s, {
        alert: `Your payment for ${owner} didn't go through. Nothing was set aside or charged — your seats are still selected.`,
        nextApproval: 'ok',
        holdingUntil: null,
      });
      return log(s, 'OWN_PAYMENT_FAILED', `Rohan's payment for ${owner} failed: hold undone, nothing blocked`);
    }

    case 'APPROVE_HOLD': {
      if (!isDraft(state)) return state;
      const outcome = failureOf(state).nextApproval;
      if (outcome === 'declined') return failureFlowReducer(state, { type: 'UPI_DECLINED' });
      if (outcome === 'timeout') return failureFlowReducer(state, { type: 'UPI_TIMED_OUT' });
      if (outcome === 'own_fails') return failureFlowReducer(state, { type: 'OWN_PAYMENT_FAILED' });
      const card = state.hold!.paymentRail === 'card_preauth';
      let s: FailureState = { ...state, ...boardFlowReducer(state, action) };
      s = setFailure(s, { holdingUntil: null });
      if (card && s.hold && s.smsToasts[0]) {
        // Card issuer SMS instead of the UPI wording.
        const per = seatPrice(s.seats[s.hold.ownerSeatId], s.show.fee);
        const covered = s.hold.seatIds.filter((id) => s.seats[id]?.state === 'covered').length;
        const text = `${formatINR(s.hold.blockAmount)} held on your card ${DEMO_CARD} by BookMyShow. ${formatINR(per * (1 + covered))} charged.`;
        s = { ...s, smsToasts: [{ ...s.smsToasts[0], text }, ...s.smsToasts.slice(1)] };
      }
      return s;
    }

    case 'FRIEND_RETRY':
      // After showtime a failed late payment can't be retried.
      if (state.clock.now >= state.show.startsAt && openLatePayment(state, action.name)) return state;
      return { ...state, ...boardFlowReducer(state, action) };

    case 'DISMISS_ALERT':
      return setFailure(state, { alert: null });

    case 'MARK_SETTLED_OUTSIDE': {
      const v = selectSettledOutside(state);
      if (!v.some((x) => x.seatId === action.seatId && !x.marked)) return state;
      const s = setFailure(state, { settledOutside: [...failureOf(state).settledOutside, action.seatId] });
      return log(s, 'SETTLED_OUTSIDE', `Rohan labelled ${action.seatId} "Settled outside BMS"`);
    }

    case 'TICK':
    case 'SET_CLOCK':
    case 'ADVANCE_CLOCK':
      return runShowtimeGrace({ ...state, ...boardFlowReducer(state, action) });

    case 'RESTART_DEMO':
      return { ...boardFlowReducer(state, action), failure: initialFailure() };

    default:
      return { ...state, ...boardFlowReducer(state, action) };
  }
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export interface LadderNotice {
  title: string;
  body: string;
}

/** Band on the hold sheet when Reserve Pay isn't available. */
export function selectLadderNotice(state: FailureState): LadderNotice | null {
  const hold = state.hold;
  if (!hold || state.settings.bankSupportsBlocking) return null;
  const n = hold.seatIds.length;
  const per = formatINR(seatPrice(state.seats[hold.ownerSeatId], state.show.fee));
  if (hold.paymentRail === 'card_preauth') {
    return { title: "Your bank can't set money aside on UPI", body: `We'll hold ${formatINR(hold.blockAmount)} on your card instead. You're charged only for your seat and any seats you keep.` };
  }
  return {
    title: failureOf(state).cardCanHold ? 'Paying for everyone now' : "Your bank and card can't hold money",
    body: `Pay for all ${n} now and get ${per} back each time a friend pays.`,
  };
}

/** After a decline or timeout: "We're holding these seats for you until 1:25 PM." */
export function selectHoldingLine(state: FailureState): string | null {
  const until = failureOf(state).holdingUntil;
  if (!until || !state.hold || state.hold.status !== 'draft' || state.clock.now >= until) return null;
  return `We're holding these seats for you until ${formatClockIST(until)}.`;
}

/** Overrides for the friend's pending / failed screen around showtime. */
export function selectShowtimeCheckout(state: FailureState, name: FriendName): { pendingBody?: string; failedBody?: string; canRetry: boolean } {
  const started = state.clock.now >= state.show.startsAt;
  const late = openLatePayment(state, name);
  if (!started || !late) return { canRetry: true };
  const seats = late.seatIds.join(', ');
  const cutoff = formatClockIST(state.show.startsAt + GRACE_DURATION_MS);
  const organiser = state.hold?.organiser.name ?? 'Rohan';
  if (late.status === 'pending') {
    return { pendingBody: `The show has started, but ${seats} stays yours while your bank confirms, until ${cutoff}.`, canRetry: false };
  }
  return {
    failedBody: `Your bank didn't confirm before the show started, so you weren't charged. ${organiser} still has the ticket for ${seats}.`,
    canRetry: false,
  };
}

/** Kept seats after showtime (spec §3): Rohan can label them "Settled outside BMS". */
export function selectSettledOutside(state: FailureState): Array<{ seatId: string; marked: boolean }> {
  const hold = state.hold;
  if (!hold || hold.status !== 'settled' || state.clock.now < state.show.startsAt) return [];
  const marked = failureOf(state).settledOutside;
  return hold.seatIds
    .filter((id) => state.seats[id]?.state === 'kept' && !state.board.transfers[id])
    .map((seatId) => ({ seatId, marked: marked.includes(seatId) }));
}
