/**
 * Failure states (prompt 08): spec §5 cases the earlier wrappers didn't cover.
 *
 * Wraps `boardFlowReducer` (→ friendFlow → holdFlow → frozen demoReducer), like D-029/D-065/D-078, and adds:
 * - the payment fallback ladder (#4/#5): UPI Reserve Pay → card pre-auth → pay all now, refunded per friend,
 * - Rohan's own approval outcomes: declined (#6), bank timeout, own payment fails while the block succeeds (#7),
 * - plain copy for the 2-holds-per-account limit,
 * - the cut-off checkout copy (late payments close at 9:00 PM; pending ones get 10 min, 09),
 * - "Settled outside BMS" labels for kept seats after showtime (spec §3, label only).
 *
 * Pure: no React, no Date.now(), no randomness. Time comes from state.clock.
 */
import { formatINR, seatPrice } from './money';
import { formatClockIST } from './holdFlow';
import { boardFlowReducer, cutoffOf, openLatePayment, type BoardFlowAction, type BoardState } from './boardFlow';
import { type FriendName } from './friendFlow';
import { GRACE_DURATION_MS } from './rules';
import { ACCOUNT_LIMIT_COPY } from './reducer';
import type { DemoSettings, PaymentRail } from './types';

/** Demo only: premium-priced recliners (row A ₹1,250) so a 10-seat group crosses the ₹10,000 cap. */
export const PREMIUM_ROW_A_PAISE = 125000;
const ROW_A_PAISE = 50000;

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

export const ACCOUNT_LIMIT = ACCOUNT_LIMIT_COPY;
export const TIMEOUT_PREFIX = "Your bank didn't respond, so nothing was blocked or charged.";

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

    case 'SET_DEMO_SETTINGS': {
      let s: FailureState = { ...state, settings: { ...state.settings, ...action.patch } };
      if (action.patch.premiumPricing !== undefined) {
        const price = action.patch.premiumPricing ? PREMIUM_ROW_A_PAISE : ROW_A_PAISE;
        const seats = { ...s.seats };
        for (const id of Object.keys(seats)) if (seats[id].row === 'A') seats[id] = { ...seats[id], price };
        s = { ...s, seats };
      }
      return s;
    }

    case 'BEGIN_GROUP_HOLD': {
      let s: FailureState = { ...state, ...boardFlowReducer(state, action) };
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
        alert: `Your payment for ${owner} didn't go through. Nothing was blocked or charged — your seats are still selected.`,
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

    case 'DISMISS_ALERT':
      return setFailure(state, { alert: null });

    case 'MARK_SETTLED_OUTSIDE': {
      const v = selectSettledOutside(state);
      if (!v.some((x) => x.seatId === action.seatId && !x.marked)) return state;
      const s = setFailure(state, { settledOutside: [...failureOf(state).settledOutside, action.seatId] });
      return log(s, 'SETTLED_OUTSIDE', `Rohan labelled ${action.seatId} "Settled outside BMS"`);
    }

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
    return { title: "Your bank can't block money on UPI", body: `We'll hold ${formatINR(hold.blockAmount)} on your card instead. You're charged only for your seat and kept seats.` };
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

/**
 * Overrides for the friend's pending / failed screen after the 9:00 PM late-pay cut-off (09).
 * A pending late payment keeps the seat until 9:10 PM; after that it fails and isn't charged.
 */
export function selectCutoffCheckout(state: FailureState, name: FriendName): { pendingBody?: string; failedBody?: string; canRetry: boolean } {
  const late = openLatePayment(state, name);
  if (!late || state.clock.now < cutoffOf(state)) return { canRetry: true };
  const seats = late.seatIds.join(', ');
  const until = formatClockIST(cutoffOf(state) + GRACE_DURATION_MS);
  const organiser = state.hold?.organiser.name ?? 'Rohan';
  if (late.status === 'pending') {
    return { pendingBody: `${seats} stays yours while your bank confirms, until ${until}.`, canRetry: false };
  }
  return {
    failedBody: `Your bank didn't confirm by ${until}, so you weren't charged. ${organiser} still has ${seats}.`,
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
