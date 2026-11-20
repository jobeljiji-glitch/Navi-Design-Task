import { describe, it, expect } from 'vitest';
import { withBoard } from '../boardFlow';
import { createInitialDemoState } from '../seed';
import { selectHoldSheet } from '../holdFlow';
import {
  ACCOUNT_LIMIT,
  failureFlowReducer as R,
  failureOf,
  initialFailure,
  selectHoldingLine,
  selectLadderNotice,
  selectSettledOutside,
  selectCutoffCheckout,
  PREMIUM_ROW_A_PAISE,
  type FailureState,
} from '../failureFlow';
import { at, beginHold, ist, kabirOpens, runScriptTo, type Reduce } from '../script';
import { selectFriendCheckout } from '../friendFlow';
import { BLOCK_CAP_COPY } from '../reducer';

const r = R as unknown as Reduce;
const fresh = (): FailureState => ({ ...withBoard(createInitialDemoState()), failure: initialFailure() });
const draft = (s: FailureState = fresh()) => beginHold(s, r) as FailureState;

describe('08 payment fallback ladder (#4/#5)', () => {
  it('Reserve Pay when the bank supports blocking', () => {
    expect(draft().hold!.paymentRail).toBe('reserve_pay');
    expect(selectLadderNotice(draft())).toBeNull();
  });

  it('bank cannot block → card pre-auth, with the notice and matching CTA / approval amounts', () => {
    const s = draft(R(fresh(), { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false }));
    expect(s.hold!.paymentRail).toBe('card_preauth');
    const v = selectHoldSheet(s)!;
    expect(v.ctaTitle).toBe('Hold ₹1,662.84 on your card');
    expect(v.ctaSub).toBe('₹277.14 charged now for your seat');
    expect(v.upiAmount).toBe('₹1,662.84');
    expect(v.leavesNow).toBe('₹277.14');
    expect(selectLadderNotice(s)!.title).toBe("Your bank can't block money on UPI");
    expect(v.blockEnds).toBe('Today, 9:15 PM');
    // Reserve Pay can't be picked by hand
    expect(R(s, { type: 'SET_PAYMENT_RAIL', rail: 'reserve_pay' }).hold!.paymentRail).toBe('card_preauth');
  });

  it('card approval: active hold, card SMS with the same amounts', () => {
    let s = draft(R(fresh(), { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false }));
    s = R(R(s, { type: 'OPEN_UPI' }), { type: 'APPROVE_HOLD', pin: '0000' });
    expect(s.hold!.status).toBe('active');
    expect(s.smsToasts[0].text).toBe('₹1,662.84 held on your card ending 4021 by BookMyShow. ₹277.14 charged.');
  });

  it('no card either → pay all now, refunded as each friend pays', () => {
    let s = R(fresh(), { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false });
    s = draft(R(s, { type: 'CONTROLLER_TOGGLE_CARD_HOLD', supported: false }));
    expect(s.hold!.paymentRail).toBe('pay_and_refund');
    const v = selectHoldSheet(s)!;
    expect(v.ctaTitle).toBe('Pay ₹1,662.84');
    expect(v.upiAmount).toBe('₹1,662.84');
    expect(v.moneyLine).toBe('₹1,662.84 charged now · refunded as friends pay');
    expect(selectLadderNotice(s)!.body).toBe('Pay for all 6 now and get ₹277.14 back each time a friend pays.');
    s = R(R(s, { type: 'OPEN_UPI' }), { type: 'APPROVE_HOLD', pin: '0000' });
    expect(s.hold!.debited).toBe(s.hold!.blockAmount);
  });

  it('toggling the card off on an open draft moves it down the ladder', () => {
    let s = draft(R(fresh(), { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false }));
    s = R(s, { type: 'CONTROLLER_TOGGLE_CARD_HOLD', supported: false });
    expect(s.hold!.paymentRail).toBe('pay_and_refund');
  });
});

describe('08 Rohan approval failures', () => {
  it('#6 declined: back to the draft, holding the seats 10 more minutes', () => {
    let s = R(draft(), { type: 'OPEN_UPI' });
    s = R(s, { type: 'UPI_DECLINED' });
    expect(s.hold!.status).toBe('draft');
    expect(s.errorMessage).toBe('Block not approved. Try again or pay for all 6.');
    expect(selectHoldingLine(s)).toBe("We're holding these seats for you until 1:25 PM.");
    expect(selectHoldingLine(at(s, 13, 26, r) as FailureState)).toBeNull();
  });

  it('bank timeout: plain copy, nothing charged, then a retry succeeds', () => {
    let s = R(R(draft(), { type: 'SET_NEXT_APPROVAL', outcome: 'timeout' }), { type: 'OPEN_UPI' });
    s = R(s, { type: 'APPROVE_HOLD', pin: '0000' });
    expect(s.hold!.status).toBe('draft');
    expect(s.errorMessage).toBe("Your bank didn't respond, so nothing was blocked or charged. Try again or pay for all 6.");
    expect(s.smsToasts).toHaveLength(0);
    s = R(R(s, { type: 'OPEN_UPI' }), { type: 'APPROVE_HOLD', pin: '0000' });
    expect(s.hold!.status).toBe('active');
  });

  it('#7 own payment fails: never half a hold', () => {
    let s = R(R(draft(), { type: 'SET_NEXT_APPROVAL', outcome: 'own_fails' }), { type: 'OPEN_UPI' });
    s = R(s, { type: 'APPROVE_HOLD', pin: '0000' });
    expect(s.hold).toBeNull();
    expect(s.smsToasts).toHaveLength(0);
    expect(Object.values(s.seats).some((x) => x.state === 'held' || x.state === 'paid_owner')).toBe(false);
    expect(failureOf(s).alert).toBe("Your payment for D07 didn't go through. Nothing was blocked or charged — your seats are still selected.");
    expect(failureOf(R(s, { type: 'DISMISS_ALERT' })).alert).toBeNull();
  });
});

describe('08 hold limits', () => {
  const tryHold = (patch: object, tier?: 'high') => {
    let s = fresh();
    if (tier) s = R(s, { type: 'CONTROLLER_SET_DEMAND_TIER', tier });
    s = R(s, { type: 'SET_DEMO_SETTINGS', patch });
    return draft(s);
  };
  it('under 3 h', () => expect(tryHold({ is3HoursBeforeShow: true }).errorMessage).toBe('Group holds close 3 hours before the show'));
  it('15% cap on high tier', () =>
    expect(tryHold({ showHoldsPct: 15 }, 'high').errorMessage).toBe('Group holds are full for this show. Book now to keep these seats.'));
  it('second hold on the same show', () => expect(tryHold({ userHasExistingHoldForShow: true }).errorMessage).toBe("You're already holding seats for this show."));
  it('1 group hold per account (one Reserve Pay mandate)', () => {
    expect(ACCOUNT_LIMIT).toBe('You already have a group hold running. Finish it or book these seats now.');
    expect(tryHold({ userAccountsActiveHoldCount: 1 }).errorMessage).toBe(ACCOUNT_LIMIT);
  });
  it('₹10,000 cap: a premium 10-seat group is refused with the cap copy; 7 seats fit', () => {
    let s = R(fresh(), { type: 'SET_DEMO_SETTINGS', patch: { premiumPricing: true } });
    expect(s.seats.A05.price).toBe(PREMIUM_ROW_A_PAISE);
    const ten = ['A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10', 'A11', 'A12'];
    const over = R(s, { type: 'BEGIN_GROUP_HOLD', seatIds: ten });
    expect(over.errorMessage).toBe(BLOCK_CAP_COPY);
    expect(over.errorMessage).toBe('Group holds can block up to ₹10,000. Pick fewer seats or pay now.');
    expect(over.hold).toBeNull();
    const seven = R(s, { type: 'BEGIN_GROUP_HOLD', seatIds: ten.slice(0, 7) });
    expect(seven.hold!.status).toBe('draft');
    s = R(seven, { type: 'SET_DEMO_SETTINGS', patch: { premiumPricing: false } });
    expect(s.seats.A05.price).toBe(50000);
  });
  it('no hold is created in any of them', () => expect(tryHold({ is3HoursBeforeShow: true }).hold).toBeNull());
});

describe('09 payment pending at the 9:00 PM cut-off', () => {
  const pendingAtCutoff = () => {
    let s = kabirOpens(runScriptTo(fresh(), 'grace', r), r) as FailureState;
    s = at(s, 20, 59, r) as FailureState;
    s = R(s, { type: 'FRIEND_LATE_PAY_START', name: 'Kabir' });
    if (s.friendFlow.sessions.Kabir.screen === 'phone') s = R(s, { type: 'FRIEND_PHONE_SUBMIT', name: 'Kabir', phone: '98765 43214' });
    if (s.friendFlow.sessions.Kabir.screen === 'otp') s = R(s, { type: 'FRIEND_OTP_OK', name: 'Kabir' });
    s = R(s, { type: 'FRIEND_CHOOSE_UPI', name: 'Kabir', app: 'Kite Pay' });
    s = R(s, { type: 'FRIEND_APPROVE', name: 'Kabir' });
    return at(s, 21, 0, r) as FailureState;
  };

  it('the seat stays his while the bank confirms, until 9:10 PM', () => {
    const s = pendingAtCutoff();
    expect(s.friendFlow.sessions.Kabir.screen).toBe('pending');
    expect(selectCutoffCheckout(s, 'Kabir').pendingBody).toBe('D06 stays yours while your bank confirms, until 9:10 PM.');
  });

  it('clears in grace: the ticket moves; D06 is never charged to Rohan', () => {
    let s = R(pendingAtCutoff(), { type: 'FRIEND_RESOLVE', name: 'Kabir', outcome: 'success' });
    expect(s.seats.D06.state).toBe('paid_friend');
    expect(s.board.lateSeats).toContain('D06');
    s = at(s, 21, 15, r) as FailureState;
    expect(s.hold!.debited).toBe(27714);
  });

  it('still pending at 9:10 PM: fails, Kabir not charged, the seat stays kept, no retry', () => {
    let s = R(pendingAtCutoff(), { type: 'SET_CLOCK', now: ist(21, 10) });
    expect(s.friendFlow.sessions.Kabir.screen).toBe('failed');
    expect(s.seats.D06.state).toBe('kept');
    const v = selectCutoffCheckout(s, 'Kabir');
    expect(v.canRetry).toBe(false);
    expect(v.failedBody).toBe("Your bank didn't confirm by 9:10 PM, so you weren't charged. Rohan still has D06.");
    s = R(s, { type: 'FRIEND_RETRY', name: 'Kabir' });
    expect(s.friendFlow.sessions.Kabir.screen).toBe('failed');
  });

  it('before the cut-off the normal copy is used', () => {
    const s = runScriptTo(fresh(), 'priyaPending', r) as FailureState;
    expect(selectCutoffCheckout(s, 'Priya').pendingBody).toBeUndefined();
    expect(selectFriendCheckout(s, 'Priya').pendingBody).toContain('even past the deadline');
  });
});

describe('08 after the show (#25, spec §3)', () => {
  it('kept seat can be labelled "Settled outside BMS" after showtime only', () => {
    let s = runScriptTo(fresh(), 'grace', r) as FailureState;
    expect(selectSettledOutside(s)).toEqual([]);
    s = at(s, 21, 20, r) as FailureState;
    expect(selectSettledOutside(s)).toEqual([{ seatId: 'D06', marked: false }]);
    s = R(s, { type: 'MARK_SETTLED_OUTSIDE', seatId: 'D06' });
    expect(selectSettledOutside(s)).toEqual([{ seatId: 'D06', marked: true }]);
  });

  it('RESTART_DEMO resets the failure slice', () => {
    const s = R(R(fresh(), { type: 'CONTROLLER_TOGGLE_CARD_HOLD', supported: false }), { type: 'RESTART_DEMO' });
    expect(failureOf(s).cardCanHold).toBe(true);
  });
});
