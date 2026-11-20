import { describe, it, expect } from 'vitest';
import { createInitialDemoState } from '../seed';
import {
  boardFlowReducer,
  withBoard,
  selectMoney,
  selectBoard,
  selectReleaseSheet,
  selectT30Sheet,
  selectGroupReceipt,
  selectOrderCard,
  selectLatePage,
  selectFriendSetLine,
  selectSettlementSteps,
  selectKeptSeatActions,
  releasableSeats,
  type BoardFlowAction,
  type BoardState,
} from '../boardFlow';
import { applyStep, ist, runScriptTo, SCRIPT_STEPS } from '../script';
import { selectFriendPage, selectFriendTicket, FRIENDS } from '../friendFlow';

function fresh(): BoardState {
  return withBoard(createInitialDemoState());
}
function run(s: BoardState, ...actions: BoardFlowAction[]): BoardState {
  return actions.reduce(boardFlowReducer, s);
}
function invariant(s: BoardState) {
  const m = selectMoney(s);
  if (!m) return;
  expect(m.rohanCharged + m.returned + m.stillBlocked).toBe(m.blockAmount);
  if (!m.fallback) expect(m.rohanCharged).toBe(s.hold!.debited);
  expect(m.refunded).toBe(s.hold!.refunded);
}

describe('06 scripted outcome through the board wrapper', () => {
  it('reaches the spec receipt and Kabir’s late payment, money adding up at every step', () => {
    let s = fresh();
    for (const step of SCRIPT_STEPS) {
      s = applyStep(s, step);
      invariant(s);

      if (step === 'sana') {
        const b = selectBoard(s)!;
        expect(b.setAside).toBe('₹831.42');
        expect(b.setAsideLabel).toBe('still set aside');
        expect(b.setAsideSub).toBe('Waiting on 3 friends · unblocks as each pays');
        expect(b.pill).toBe('Pay by 7:15 PM · 4h 05m');
        expect(b.paidLine).toBe('3 of 6 paid');
        expect(selectOrderCard(s)!.statusMessage).toBe('3 of 6 paid · ends 7:15 PM');
      }
      if (step === 'neha') {
        const b = selectBoard(s)!;
        expect(b.declined.map((d) => d.name)).toEqual(['Neha']);
        const sheet = selectReleaseSheet(s)!;
        expect(sheet.seatId).toBe('D05');
        expect(sheet.candidates).toEqual(['D05', 'D10']);
        expect(sheet.feeLine).toBe('Free until 4:15 PM');
        expect(sheet.cta).toBe('Release D05 · ₹277.14 back');
      }
      if (step === 'release') {
        expect(s.seats.D05.state).toBe('released');
        expect(s.board.feesKeptPaise).toBe(0);
        expect(selectBoard(s)!.declined).toEqual([]);
      }
      if (step === 't30') {
        const t30 = s.notifications.find((n) => n.type === 't30')!;
        expect(t30.title).toBe('30 min left ⏰');
        expect(t30.body).toBe('2 seats unpaid. Unpaid seats stay yours at 7:15 PM unless you release them.');
        const sheet = selectT30Sheet(s)!;
        expect(sheet.title).toBe('2 seats are still unpaid');
        expect(sheet.chargeRow).toEqual({ label: 'Charged at 7:15 PM if still unpaid', value: '₹554.28' });
        expect(sheet.feeRow.value).toBe('₹0.00');
        const one = selectT30Sheet(s, 1)!;
        expect(one.chargeRow.value).toBe('₹277.14');
        expect(one.feeRow.value).toBe('₹27.14');
        expect(selectBoard(s)!.t30?.body).toBe('Unpaid seats stay yours at 7:15 PM unless you release them.');
      }
      if (step === 'deadline') {
        expect(s.hold!.status).toBe('resolving');
        expect(selectBoard(s)!.resolvingLine).toBe('Waiting for 1 payment in progress…');
      }
      if (step === 'priyaPaid') {
        // Payment cleared at 7:19, but the kept seat is charged when grace ends (7:25), not on the next tick.
        s = run(s, { type: 'SET_CLOCK', now: ist(19, 20) });
        expect(s.hold!.status).toBe('resolving');
        expect(s.seats.D10.state).toBe('paid_friend');
      }
      if (step === 'grace') {
        expect(s.hold!.status).toBe('settled');
        expect(s.seats.D06.state).toBe('kept');
        const r = selectGroupReceipt(s)!;
        expect(r.title).toBe('Your group is set · 5 of 6 in');
        expect(r.ledger.map((l) => [l.label, l.value])).toEqual([
          ['Blocked at start', '₹1,662.84'],
          ['You paid in total', '₹554.28'],
          ['Unblocked', '₹1,108.56'],
        ]);
        expect(s.smsToasts[0].text).toBe('₹1,108.56 unblocked by BookMyShow.');
        const n = s.notifications.find((x) => x.type === 'settled')!;
        expect(n.body).toBe('5 of 6 in. ₹1,108.56 unblocked.');
        expect(selectSettlementSteps(s)).toEqual(['Waiting for 1 payment in progress…', 'Charging 1 kept seat…', 'Unblocking ₹1,108.56…']);
        expect(selectOrderCard(s)!).toMatchObject({ status: 'CONFIRMED', statusMessage: '5 of 6 in · you paid for 2' });
        expect(selectFriendSetLine(s, 'Sana')).toBe("Your group is set. You're in D09.");
        expect(selectKeptSeatActions(s)!.payLinkCta).toBe('Send a pay link for D06');
      }
      if (step === 'kabirLate') {
        expect(s.seats.D06.state).toBe('paid_friend');
        expect(s.seats.D06.payerName).toBe('Kabir');
        const r = selectGroupReceipt(s)!;
        expect(r.refunds).toEqual([{ key: 'refund-D06', label: 'Refunded · Kabir paid for D06', value: '₹277.14' }]);
        expect(r.netPaid).toEqual({ label: 'You paid in the end', value: '₹277.14' });
        expect(r.rows.find((x) => x.seatId === 'D06')!.status).toBe('Paid late · ₹277.14 refunded to you');
        const late = s.notifications.find((x) => x.type === 'late_paid')!;
        expect(late.title).toBe('Kabir took D06 🙌');
        expect(late.body).toBe('₹277.14 is on its way back to you.');
        expect(s.smsToasts[0].text).toBe('₹277.14 refunded by BookMyShow.');
        expect(selectOrderCard(s)!.statusMessage).toBe('5 of 6 in · you paid for 1');
        expect(selectFriendTicket(s, 'Kabir')).not.toBeNull();
      }
    }
  });
});

describe('release', () => {
  it('keeps the ₹27.14 fee per seat after 4:15 PM and says so before confirming', () => {
    let s = runScriptTo(fresh(), 'sana');
    s = run(s, { type: 'SET_CLOCK', now: ist(16, 30) });
    const sheet = selectReleaseSheet(s)!;
    expect(sheet.feeLine).toBe('₹27.14 fee per seat is kept');
    expect(sheet.backRow.value).toBe('₹250.00');
    expect(sheet.cta).toBe('Release D05 · ₹250.00 back');
    s = run(s, { type: 'RELEASE_SEATS', seatIds: ['D05'] });
    expect(s.board.feesKeptPaise).toBe(2714);
    expect(selectMoney(s)!.feesKept).toBe(2714);
    invariant(s);
    expect(selectBoard(s)!.freeReleaseLine).toBe('Releasing now keeps the ₹27.14 fee per seat');
  });

  it('never releases a middle seat', () => {
    let s = runScriptTo(fresh(), 'hold');
    expect(releasableSeats(s)).toEqual(['D05', 'D10']);
    s = run(s, { type: 'RELEASE_SEATS', seatIds: ['D08'] });
    expect(s.seats.D08.state).toBe('held');
    s = run(s, { type: 'RELEASE_SEATS', seatIds: ['D05', 'D06'] });
    expect(s.seats.D05.state).toBe('released');
    expect(s.seats.D06.state).toBe('released');
    invariant(s);
  });
});

describe('deadline and grace', () => {
  it('settles at the deadline when nobody is paying (default keep)', () => {
    let s = runScriptTo(fresh(), 'amit');
    s = run(s, { type: 'SET_CLOCK', now: ist(19, 15) });
    expect(s.hold!.status).toBe('settled');
    expect(['D05', 'D06', 'D09', 'D10'].every((id) => s.seats[id].state === 'kept')).toBe(true);
    invariant(s);
  });

  it('blocks new payments after the deadline but lets a pending one finish in grace', () => {
    let s = runScriptTo(fresh(), 'deadline');
    const before = s;
    s = run(s, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' }, { type: 'FRIEND_PAY', name: 'Kabir' });
    expect(s.seats.D06.state).toBe('held');
    expect(before.seats.D10.state).toBe('paying');
  });

  it('keeps a seat whose payment is still with the bank when grace ends', () => {
    let s = runScriptTo(fresh(), 'deadline');
    s = run(s, { type: 'SET_CLOCK', now: ist(19, 25) });
    expect(s.seats.D10.state).toBe('kept');
    expect(s.hold!.status).toBe('settled');
    invariant(s);
  });

  it('halfway copy is derived from state', () => {
    let s = runScriptTo(fresh(), 'sana');
    s = run(s, { type: 'SET_CLOCK', now: ist(16, 15) });
    const n = s.notifications.find((x) => x.type === 'halfway')!;
    expect(n.body).toBe('3 of 6 in · 3h left for friends to pay.');
  });
});

describe('late payer variants (friend-facing)', () => {
  it('kept seat page, then ended once nothing is kept, then show started', () => {
    let s = runScriptTo(fresh(), 'grace');
    s = run(s, { type: 'SET_CLOCK', now: ist(20, 10) }, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' });
    const page = selectLatePage(s, 'Kabir')!;
    expect(page).toMatchObject({
      view: 'late',
      kicker: 'The group hold has ended',
      title: 'Rohan kept a seat for you',
      seatId: 'D06',
      cta: 'Pay ₹277.14 for D06',
      availability: 'Available until 9:15 PM',
    });
    expect(page.body).toBe('Pay before the show starts and the ticket is yours. Rohan gets ₹277.14 back.');

    let t = runScriptTo(fresh(), 'kabirLate');
    t = run(t, { type: 'FRIEND_OPEN_LINK', name: 'Priya' });
    expect(t.friendFlow.sessions.Priya.screen).toBe('ticket');
    t = run(t, { type: 'FRIEND_OPEN_LINK', name: 'Amit' });
    expect(t.friendFlow.sessions.Amit.screen).toBe('ticket');

    let u = runScriptTo(fresh(), 'grace');
    u = run(u, { type: 'TRANSFER_TICKET', seatId: 'D06', name: 'Kabir' }, { type: 'FRIEND_OPEN_LINK', name: 'Neha' });
    expect(u.board.friendView.Neha).toBeUndefined(); // declined friend keeps the declined page
    expect(u.friendFlow.sessions.Neha.screen).toBe('declined');

    let v = runScriptTo(fresh(), 'grace');
    v = run(v, { type: 'SET_CLOCK', now: ist(21, 20) }, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' });
    expect(selectLatePage(v, 'Kabir')!.title).toBe('This show has started.');
  });

  it('released seat: "This hold has ended."', () => {
    let s = runScriptTo(fresh(), 'hold');
    s = run(s, { type: 'CANCEL_HOLD' }, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' });
    expect(selectLatePage(s, 'Kabir')).toMatchObject({ view: 'ended', title: 'This hold has ended.', cta: 'Book seats for this show' });
  });

  it('friend-facing copy never names a friend who has not paid', () => {
    const s = runScriptTo(fresh(), 'grace');
    const unpaid = ['Kabir', 'Neha'];
    for (const f of FRIENDS) {
      const texts = [JSON.stringify(selectLatePage(s, f)), JSON.stringify(selectFriendPage(s, f)), selectFriendSetLine(s, f) ?? ''];
      for (const name of unpaid) {
        if (name === f) continue;
        for (const t of texts) expect(t).not.toContain(name);
      }
    }
  });
});

describe('pay link vs transfer (failure #24)', () => {
  it('first action wins, the other turns off', () => {
    let s = runScriptTo(fresh(), 'grace');
    s = run(s, { type: 'SEND_PAY_LINK', seatId: 'D06' });
    expect(selectKeptSeatActions(s)!.transferEnabled).toBe(false);
    s = run(s, { type: 'TRANSFER_TICKET', seatId: 'D06', name: 'Kabir' });
    expect(s.board.transfers).toEqual({});

    let t = runScriptTo(fresh(), 'grace');
    t = run(t, { type: 'TRANSFER_TICKET', seatId: 'D06', name: 'Kabir' });
    expect(selectKeptSeatActions(t)!.payLinkEnabled).toBe(false);
    expect(selectGroupReceipt(t)!.rows.find((r) => r.seatId === 'D06')!.status).toBe('Transferred by you');
    invariant(t);
    expect(selectMoney(t)!.rohanCharged).toBe(55428);
    t = run(t, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' });
    expect(t.friendFlow.sessions.Kabir.screen).toBe('ticket');
  });
});

describe('board actions', () => {
  it('cover, add a seat, shorten, cancel', () => {
    let s = runScriptTo(fresh(), 'amit');
    s = run(s, { type: 'COVER_SEATS', count: 1 });
    expect(s.seats.D10.state).toBe('covered');
    invariant(s);

    s = run(s, { type: 'ADD_SEAT' });
    expect(s.hold!.seatIds).toContain('D11');
    expect(s.hold!.blockAmount).toBe(166284 + 27714);
    expect(s.smsToasts[0].text).toBe('₹277.14 blocked for BookMyShow.');
    invariant(s);

    const d0 = s.hold!.deadline;
    s = run(s, { type: 'SHORTEN_DEADLINE', newDeadline: d0 - 60 * 60 * 1000 });
    expect(s.hold!.deadline).toBe(d0 - 60 * 60 * 1000);

    s = run(s, { type: 'CANCEL_HOLD' });
    expect(s.hold!.status).toBe('cancelled');
    invariant(s);
    expect(selectOrderCard(s)!.status).toBe('FINISHED');
  });

  it('reminder is limited to once per 2 h', () => {
    let s = runScriptTo(fresh(), 'amit');
    s = run(s, { type: 'SEND_ORGANISER_REMINDER' });
    expect(selectBoard(s)!.reminder.available).toBe(false);
    expect(selectBoard(s)!.reminder.note).toBe('You can send another reminder at 4:02 PM.');
  });

  it('pay-and-refund rail keeps the identity', () => {
    let s = fresh();
    s = run(s, { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false });
    s = runScriptTo(s, 'grace');
    invariant(s);
    expect(selectGroupReceipt(s)!.ledger.at(-1)).toMatchObject({ label: 'Refunded to you', value: '₹1,108.56' });
  });
});
