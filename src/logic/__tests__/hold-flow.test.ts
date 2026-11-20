import { describe, it, expect } from 'vitest';
import { createInitialDemoState, DEMO_HOLD_START_MS } from '../seed';
import {
  holdFlowReducer,
  selectDemandBanner,
  selectHoldSheet,
  selectHoldSuccess,
  selectHoldSeatStates,
  selectSelectionTotals,
  isContiguousBlock,
  formatClockIST,
  selectShortenOptions,
  type FlowAction,
} from '../holdFlow';
import type { DemoState } from '../types';

const GROUP = ['D05', 'D06', 'D07', 'D08', 'D09', 'D10'];

function run(state: DemoState, ...actions: FlowAction[]): DemoState {
  return actions.reduce(holdFlowReducer, state);
}

function draft(): DemoState {
  return run(createInitialDemoState(), { type: 'BEGIN_GROUP_HOLD', seatIds: GROUP });
}

describe('holdFlow: begin', () => {
  it('snaps the clock to 1:15 PM, creates a draft with owner D07 and a 7:15 PM deadline', () => {
    const s = draft();
    expect(s.clock.now).toBe(DEMO_HOLD_START_MS);
    expect(s.hold?.status).toBe('draft');
    expect(s.hold?.ownerSeatId).toBe('D07');
    expect(formatClockIST(s.hold!.deadline)).toBe('7:15 PM');
    expect(s.hold?.blockAmount).toBe(166284);
  });

  it('hold sheet values match the spec', () => {
    const v = selectHoldSheet(draft())!;
    expect(v.title).toBe('Hold 6 seats for your group');
    expect(v.subtitle).toBe('Monsoon Heist · Fri, 9:15 PM · D05–D10');
    expect(v.ownNow).toBe('₹277.14 now');
    expect(v.friendsLabel).toBe("5 friends' seats");
    expect(v.friendsValue).toBe('₹1,385.70 blocked');
    expect(v.leavesNow).toBe('₹277.14');
    expect(v.blockedNotTaken).toBe('₹1,385.70');
    expect(v.mostYouCouldPay).toBe('₹1,662.84');
    expect(v.helper).not.toMatch(/IPO|ASBA/);
    expect(v.deadlineTime).toBe('7:15 PM');
    expect(v.deadlineDay).toBe('today');
    expect(v.windowLabel).toBe('6h');
    expect(v.freeReleaseUntil).toBe('4:15 PM');
    expect(v.blockEnds).toBe('Today, 7:45 PM');
    expect(v.ctaTitle).toBe('Block ₹1,662.84 on UPI');
    expect(v.ctaSub).toBe('₹277.14 charged now for your seat');
    expect(v.upiAmount).toBe('₹1,662.84'); // CTA amount = UPI screen amount
    expect(v.moneyRows).toEqual([
      { key: 'own', label: 'Your seat (D07)', value: '₹277.14', sub: '₹250 ticket + ₹27.14 convenience fee' },
      { key: 'friends', label: "5 friends' seats", value: '₹1,385.70', sub: 'Blocked, not charged' },
    ]);
    expect(v.moneyTotalLabel).toBe('Blocked on UPI');
    expect(v.moneyTotal).toBe('₹1,662.84');
    expect(v.moneyCaption).toBe('Unblocked seat by seat as friends pay.');
    expect(v.howDeadline).toBe('Friends pay by 7:15 PM today');
    expect(v.howKeep).toBe('Unpaid seats stay yours and are charged from the block. Release any before 7:15 PM.');
    expect(v.howRelease).toBe('Release free until 4:15 PM. After that, the ₹27.14 fee per seat is kept.');
    expect(v.caption).toBe('One UPI PIN · Unused money is unblocked automatically');
    expect(v.tiles.map((t) => t.kind)).toEqual(['held', 'held', 'owner', 'held', 'held', 'held']);
  });

  it('cover seats change the ledger and CTA', () => {
    const s = run(draft(), { type: 'SET_COVER_SEATS', count: 2 });
    const v = selectHoldSheet(s)!;
    expect(v.coverCount).toBe(2);
    expect(v.leavesNow).toBe('₹831.42');
    expect(v.blockedNotTaken).toBe('₹831.42');
    expect(v.ctaTitle).toBe('Block ₹1,662.84 on UPI');
    expect(v.ctaSub).toBe('₹831.42 charged now for 3 seats');
    expect(v.moneyRows.map((r) => [r.label, r.value])).toEqual([
      ['Your seat (D07)', '₹277.14'],
      ['2 seats you cover', '₹554.28'],
      ["3 friends' seats", '₹831.42'],
    ]);
    expect(v.moneyTotal).toBe('₹1,662.84');
    expect(v.coverLabel).toBe('2 seats');
    expect(v.tiles.filter((t) => t.kind === 'covered').map((t) => t.id)).toEqual(['D05', 'D10']);
  });

  it('fallback when the bank cannot block', () => {
    const s = run(
      createInitialDemoState(),
      { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false },
      { type: 'BEGIN_GROUP_HOLD', seatIds: GROUP },
    );
    const v = selectHoldSheet(s)!;
    expect(v.fallback).toBe(true);
    expect(v.fallbackLine).toBe('Pay ₹1,662.84 now · get ₹277.14 back each time a friend pays');
    expect(v.cta).toBe('Pay ₹1,662.84');
    expect(v.ctaSub).toBeNull();
    const a = run(s, { type: 'OPEN_UPI' }, { type: 'APPROVE_HOLD', pin: '1234' });
    expect(a.hold?.debited).toBe(166284);
    expect(a.smsToasts[0].text).toBe('₹1,662.84 debited by BookMyShow.');
  });

  it('blocks when < 3h to show, or a hold is already active', () => {
    const late = run(
      createInitialDemoState(),
      { type: 'CONTROLLER_TOGGLE_3H_RULE', isLessThan3h: true },
      { type: 'BEGIN_GROUP_HOLD', seatIds: GROUP },
    );
    expect(late.hold).toBeNull();
    expect(late.errorMessage).toBe('Group holds close 3 hours before the show');

    const active = run(draft(), { type: 'OPEN_UPI' }, { type: 'APPROVE_HOLD', pin: '1234' });
    const again = run(active, { type: 'BEGIN_GROUP_HOLD', seatIds: GROUP });
    expect(again.errorMessage).toBe("You're already holding seats for this show.");
    expect(again.hold?.status).toBe('active');
  });
});

describe('holdFlow: approve / decline', () => {
  it('happy path: active hold, D07 paid_owner, five seats held, SMS toast', () => {
    const s = run(draft(), { type: 'OPEN_UPI' }, { type: 'APPROVE_HOLD', pin: '4321' });
    expect(s.hold?.status).toBe('active');
    expect(s.seats.D07.state).toBe('paid_owner');
    expect(GROUP.filter((id) => s.seats[id].state === 'held')).toHaveLength(5);
    expect(s.smsToasts[0].text).toBe('₹1,662.84 blocked for BookMyShow. ₹277.14 debited.');
    const ok = selectHoldSuccess(s)!;
    expect(ok.title).toBe('6 seats held for your group');
    expect(ok.ticketLine).toBe('Your ticket D07 is confirmed');
    expect(ok.paid).toBe('₹277.14');
    expect(ok.setAsideLabel).toBe('Set aside for 5 friends');
    expect(ok.statusLine).toBe('Friends pay by 7:15 PM · 6h left');
    expect(ok.paidLine).toBe('1 of 6 paid');
    expect(ok.tiles.find((t) => t.id === 'D07')?.caption).toBe('You ✓');
    expect(ok.ticketSeat).toBe('PP-D07');
    expect(ok.blocked).toBe('₹1,385.70');
    expect(ok.paidLabel).toBe('Your ticket (D07)');
    expect(ok.paidSub).toBe('₹250 + ₹27.14 fee');
    expect(ok.setAsideSub).toBe('Blocked, not charged');
    expect(ok.most).toBe('₹1,662.84');
    expect(ok.moneyNote).toBe('Unpaid seats stay yours at 7:15 PM. Release free until 4:15 PM.');
    expect(ok.payBy).toBe('7:15 PM today');
    expect(ok.shareMessage).toContain('Pay by 7:15 PM today · bms.link/g/k7Qx2');
  });

  it('seat map states survive after approval', () => {
    const s = run(draft(), { type: 'OPEN_UPI' }, { type: 'APPROVE_HOLD', pin: '1111' });
    const states = selectHoldSeatStates(s);
    expect(states.D07).toBe('paid_owner');
    expect(states.D05).toBe('held');
    expect(selectHoldSeatStates(draft())).toEqual({});
  });

  it('covered seats are taken from the far edge, never the owner', () => {
    const s = run(draft(), { type: 'SET_COVER_SEATS', count: 2 }, { type: 'OPEN_UPI' }, { type: 'APPROVE_HOLD', pin: '1111' });
    expect(s.seats.D10.state).toBe('covered');
    expect(s.seats.D05.state).toBe('covered');
    expect(s.seats.D07.state).toBe('paid_owner');
    expect(selectHoldSuccess(s)!.blocked).toBe('₹831.42');
  });

  it('covering 3 seats works past both edges (D10, D05, D09)', () => {
    const s = run(draft(), { type: 'SET_COVER_SEATS', count: 3 }, { type: 'OPEN_UPI' }, { type: 'APPROVE_HOLD', pin: '1111' });
    expect(['D10', 'D05', 'D09'].map((id) => s.seats[id].state)).toEqual(['covered', 'covered', 'covered']);
    expect(GROUP.filter((id) => s.seats[id].state === 'held')).toEqual(['D06', 'D08']);
  });

  it('decline returns to the draft with the specified message', () => {
    const s = run(draft(), { type: 'OPEN_UPI' }, { type: 'UPI_DECLINED' });
    expect(s.hold?.status).toBe('draft');
    expect(s.errorMessage).toBe('Block not approved. Try again or pay for all 6.');
    expect(s.seats.D07.state).toBe('selected');
  });
});

describe('holdFlow: demand tier', () => {
  it('switching tier changes the banner and the deadline', () => {
    let s = draft();
    expect(selectDemandBanner(s)).toEqual({ tier: 'medium', pctLeft: 41, holdHours: 6 });
    s = run(s, { type: 'CONTROLLER_SET_DEMAND_TIER', tier: 'high' });
    expect(selectDemandBanner(s)).toEqual({ tier: 'high', pctLeft: 18, holdHours: 2 });
    expect(selectHoldSheet(s)!.deadlineTime).toBe('3:15 PM');
    expect(selectHoldSheet(s)!.windowLabel).toBe('2h');
    s = run(s, { type: 'CONTROLLER_SET_DEMAND_TIER', tier: 'low' });
    expect(selectDemandBanner(s)).toEqual({ tier: 'low', holdHours: 24 });
    expect(selectHoldSheet(s)!.howRelease).toBe('Release free anytime before 7:15 PM.');
    expect(selectHoldSheet(s)!.freeReleaseUntil).toBeNull();
  });
});

describe('holdFlow: helpers', () => {
  it('selection totals and contiguity', () => {
    const s = createInitialDemoState();
    const t = selectSelectionTotals(s, GROUP);
    expect(t.total).toBe('₹1,662.84');
    expect(t.canHold).toBe(true);
    expect(t.contiguous).toBe(true);
    expect(isContiguousBlock(['D05', 'D06', 'D08'], s.seats)).toBe(false);
    expect(isContiguousBlock(['D05', 'E05'], s.seats)).toBe(false);
    expect(selectSelectionTotals(s, ['D05', 'D06']).canHold).toBe(false);
  });

  it('shorten options are earlier than the deadline and after now', () => {
    const opts = selectShortenOptions(draft());
    expect(opts.map((o) => o.label)).toEqual(['6:15 PM today', '5:15 PM today', '4:15 PM today']);
  });
});
