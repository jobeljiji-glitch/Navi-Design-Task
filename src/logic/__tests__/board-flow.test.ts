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
  selectSeatRows,
  seatRowText,
  releasableSeats,
  type BoardFlowAction,
  type BoardState,
} from '../boardFlow';
import { applyStep, friendOpensOnly, ist, runScriptTo, SCRIPT_STEPS } from '../script';
import { selectFriendPage, selectFriendTicket, FRIENDS } from '../friendFlow';

function fresh(): BoardState {
  return withBoard(createInitialDemoState());
}
function run(s: BoardState, ...actions: BoardFlowAction[]): BoardState {
  return actions.reduce(boardFlowReducer, s);
}
/** 09: blockAmount = charged + unblocked + stillBlocked; charged = what was actually debited; no refunds. */
function invariant(s: BoardState) {
  const m = selectMoney(s);
  if (!m) return;
  if (m.fallback) {
    expect(m.charged).toBe(m.blockAmount);
    return;
  }
  expect(m.charged + m.unblocked + m.stillBlocked).toBe(m.blockAmount);
  expect(m.charged).toBe(s.hold!.debited);
  expect(m.refunded).toBe(0);
  if (!m.finished) expect(m.unblocked).toBe(0);
}

describe('09 scripted outcome through the board wrapper', () => {
  it('kept at 7:15, Kabir pays at 8:10, one settlement at 9:15', () => {
    let s = fresh();
    for (const step of SCRIPT_STEPS) {
      s = applyStep(s, step);
      invariant(s);

      if (step === 'amit') {
        const n = s.notifications.find((x) => x.type === 'friend_paid')!;
        expect([n.title, n.body]).toEqual(["Amit's in! 🎉", '₹277.14 less for you to cover']);
      }
      if (step === 'sana') {
        const b = selectBoard(s)!;
        expect(b.headline).toBe('₹831.42 left to cover');
        expect(b.headlineSub).toBe('₹1,385.70 blocked · unblocked at showtime');
        expect(b.pill).toBe('Pay by 7:15 PM · 4h 05m');
        expect(b.paidLine).toBe('3 of 6 paid');
        expect(b.rows.map(seatRowText)).toEqual([
          'D05 · Not opened yet',
          'D06 · Not opened yet',
          'You · D07 · Paid',
          'Amit · D08 · Paid',
          'Sana · D09 · Paid',
          'D10 · Not opened yet',
        ]);
        expect(b.canShareReminder).toBe(true);
        expect(b.reminderShare.cardTitle).toBe('3 seats still waiting for Friday 🍿');
        expect(b.reminderShare.cardBody).toBe('Pick yours by 7:15 PM');
        expect(selectOrderCard(s)!.statusMessage).toBe('3 of 6 paid · ends 7:15 PM');
      }
      if (step === 'neha') {
        const b = selectBoard(s)!;
        expect(b.declined.map((d) => d.name)).toEqual(['Neha']);
        const sheet = selectReleaseSheet(s)!;
        expect(sheet.seatId).toBe('D05');
        expect(sheet.candidates).toEqual(['D05', 'D10']);
        expect(sheet.feeLine).toBe('Free until 4:15 PM');
        expect(sheet.cta).toBe('Release D05 · ₹277.14 less to cover');
      }
      if (step === 'release') {
        expect(s.seats.D05.state).toBe('released');
        expect(s.board.feesKeptPaise).toBe(0);
        expect(selectBoard(s)!.declined).toEqual([]);
      }
      if (step === 't30') {
        const t30 = s.notifications.find((n) => n.type === 't30')!;
        expect(t30.title).toBe('30 min left ⏰');
        expect(t30.body).toBe("2 seats unpaid. They're kept at 7:15 PM unless you release them.");
        const sheet = selectT30Sheet(s)!;
        expect(sheet.title).toBe('2 seats are still unpaid');
        expect(sheet.keepCaption).toBe('Kept at 7:15 PM');
        expect(sheet.seatLines).toEqual(['D06 · Not opened yet', 'D10 · Not opened yet']);
        expect(sheet.chargeRow).toEqual({ label: 'Charged at 9:15 PM if still unpaid', value: '₹554.28' });
        expect(sheet.feeRow.value).toBe('₹0.00');
        const one = selectT30Sheet(s, 1)!;
        expect(one.chargeRow.value).toBe('₹277.14');
        expect(one.feeRow.value).toBe('₹27.14');
      }
      if (step === 'deadline') {
        expect(s.hold!.status).toBe('closed');
        expect(s.seats.D06.state).toBe('kept');
        const kept = s.notifications.find((x) => x.type === 'kept')!;
        expect([kept.title, kept.body]).toEqual(['Seats kept 🎟', '1 seat kept. Charged at 9:15 PM unless a friend pays.']);
        const b = selectBoard(s)!;
        expect(b.closedBand!.title).toBe('Deadline passed · 1 payment in progress');
        expect(b.pill).toBe('Seats kept · settles 9:15 PM');
        expect(b.rows.find((r) => r.seatId === 'D10')!.status).toBe('Paying now');
      }
      if (step === 'grace') {
        expect(s.hold!.status).toBe('closed');
        const b = selectBoard(s)!;
        expect(b.headline).toBe('₹277.14 left to cover');
        expect(b.headlineSub).toBe('Charged at 9:15 PM unless a friend pays');
        expect(b.rows.find((r) => r.seatId === 'D06')).toMatchObject({ status: 'Kept', note: 'Charged at 9:15 PM unless a friend pays' });
        // Provisional receipt
        const r = selectGroupReceipt(s)!;
        expect(r.final).toBe(false);
        expect(r.title).toBe('Seats kept · settles at 9:15 PM');
        expect(r.ledger.map((l) => [l.label, l.value])).toEqual([
          ['Blocked', '₹1,662.84'],
          ['Charged so far', '₹277.14'],
          ['Left to cover', '₹277.14'],
        ]);
        expect(r.rows.find((x) => x.seatId === 'D06')).toMatchObject({ who: 'Kept', status: 'Charged at 9:15 PM unless a friend pays' });
        expect(selectOrderCard(s)!).toMatchObject({ status: 'GROUP HOLD', statusMessage: '1 seat kept · settles 9:15 PM' });
        expect(selectFriendSetLine(s, 'Sana')).toBe("Your group is set. You're in D09.");
        const k = selectKeptSeatActions(s)!;
        expect(k.payLinkCta).toBe('Send a pay link for D06');
        expect(k.payLinkEnabled).toBe(true);
        expect(k.payLinkMessage).toBe('Rohan kept D06 for you. Pay ₹277.14 before 9:00 PM: bms.link/g/k7Qx2');
      }
      if (step === 'kabirLate') {
        expect(s.seats.D06).toMatchObject({ state: 'paid_friend', payerName: 'Kabir' });
        const late = s.notifications.find((x) => x.type === 'late_paid')!;
        expect([late.title, late.body]).toEqual(['Kabir took D06 🙌', "D06 won't be charged to you"]);
        expect(s.smsToasts.some((t) => /refund/i.test(t.text))).toBe(false);
        expect(selectGroupReceipt(s)!.rows.find((x) => x.seatId === 'D06')).toMatchObject({ who: 'Kabir', status: 'Paid late' });
        expect(selectFriendTicket(s, 'Kabir')).not.toBeNull();
      }
      if (step === 'showtime') {
        expect(s.hold!.status).toBe('settled');
        const r = selectGroupReceipt(s)!;
        expect(r.final).toBe(true);
        expect(r.title).toBe('Your group is set · 5 of 6 in');
        expect(r.ledger.map((l) => [l.label, l.value])).toEqual([
          ['Blocked', '₹1,662.84'],
          ['Charged', '₹277.14'],
          ['Unblocked', '₹1,385.70'],
        ]);
        expect(s.smsToasts[0].text).toBe('₹1,385.70 unblocked by BookMyShow.');
        const n = s.notifications.find((x) => x.type === 'settled')!;
        expect(n.body).toBe('5 of 6 in. ₹1,385.70 unblocked.');
        expect(selectSettlementSteps(s)).toEqual(['Unblocking ₹1,385.70…', 'Finalising your receipt…']);
        expect(selectOrderCard(s)!).toMatchObject({ status: 'CONFIRMED', statusMessage: '5 of 6 in · you paid for 1' });
      }
    }
  });
});

describe('09 board rows: names only when BookMyShow knows them', () => {
  it('opened (phone entered) but unpaid shows the name; never opened shows the seat only', () => {
    let s = runScriptTo(fresh(), 'amit');
    s = friendOpensOnly(s, 'Sana');
    const rows = selectSeatRows(s).map(seatRowText);
    expect(rows).toContain('Sana · D09 · Opened, not paid');
    expect(rows).toContain('D10 · Not opened yet');
    expect(rows).toContain('Amit · D08 · Paid');
    // only never-opened seats count for the reminder card
    expect(selectBoard(s)!.notOpenedCount).toBe(3);
  });

  it('friend-facing copy never names a friend who has not paid', () => {
    let s = runScriptTo(fresh(), 'grace');
    s = friendOpensOnly(s, 'Neha');
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

describe('release', () => {
  it('keeps the ₹27.14 fee per seat after 4:15 PM, charged at showtime', () => {
    let s = runScriptTo(fresh(), 'sana');
    s = run(s, { type: 'SET_CLOCK', now: ist(16, 30) });
    const sheet = selectReleaseSheet(s)!;
    expect(sheet.feeLine).toBe('₹27.14 fee per seat is kept');
    expect(sheet.backRow).toEqual({ label: 'Unblocked at 9:15 PM', value: '₹250.00' });
    expect(sheet.cta).toBe('Release D05 · ₹27.14 fee kept');
    s = run(s, { type: 'RELEASE_SEATS', seatIds: ['D05'] });
    expect(s.board.feesKeptPaise).toBe(2714);
    expect(s.hold!.debited).toBe(27714); // not charged yet
    expect(selectMoney(s)!.pendingCharge).toBe(2714);
    invariant(s);
    expect(selectBoard(s)!.freeReleaseLine).toBe('Releasing now keeps the ₹27.14 fee per seat');
    s = run(s, { type: 'SET_CLOCK', now: ist(21, 15) });
    expect(s.hold!.status).toBe('settled');
    invariant(s);
    // own + D06 + D10 kept + fee
    expect(s.hold!.debited).toBe(27714 + 2 * 27714 + 2714);
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

describe('deadline, grace, cut-off and showtime', () => {
  it('nobody paying at the deadline: seats kept, nothing charged until showtime', () => {
    let s = runScriptTo(fresh(), 'amit');
    s = run(s, { type: 'SET_CLOCK', now: ist(19, 15) });
    expect(s.hold!.status).toBe('closed');
    expect(['D05', 'D06', 'D09', 'D10'].every((id) => s.seats[id].state === 'kept')).toBe(true);
    expect(s.hold!.debited).toBe(27714);
    invariant(s);
    s = run(s, { type: 'SET_CLOCK', now: ist(21, 15) });
    expect(s.hold!.debited).toBe(5 * 27714);
    expect(selectMoney(s)!.unblocked).toBe(27714);
    invariant(s);
  });

  it('blocks new payments after the deadline but lets a pending one finish in grace', () => {
    let s = runScriptTo(fresh(), 'deadline');
    s = run(s, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' }, { type: 'FRIEND_PAY', name: 'Kabir' });
    expect(s.seats.D06.state).toBe('kept');
    expect(s.seats.D10.state).toBe('paying');
  });

  it('keeps a seat whose payment is still with the bank when grace ends (not charged until showtime)', () => {
    let s = runScriptTo(fresh(), 'deadline');
    s = run(s, { type: 'SET_CLOCK', now: ist(19, 25) });
    expect(s.seats.D10.state).toBe('kept');
    expect(s.hold!.status).toBe('closed');
    expect(s.hold!.debited).toBe(27714);
    invariant(s);
  });

  it('late payments close at 9:00 PM; a pending one gets until 9:10 PM, then the seat stays kept', () => {
    // Pending at the cut-off: clears → ticket moves
    let s = runScriptTo(fresh(), 'grace');
    s = run(s, { type: 'SET_CLOCK', now: ist(20, 58) }, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' }, { type: 'FRIEND_LATE_PAY_START', name: 'Kabir' });
    s = run(s, { type: 'FRIEND_PHONE_SUBMIT', name: 'Kabir', phone: '98765 43214' }, { type: 'FRIEND_OTP_OK', name: 'Kabir' }, { type: 'FRIEND_CHOOSE_UPI', name: 'Kabir', app: 'Kite Pay' });
    s = run(s, { type: 'FRIEND_APPROVE', name: 'Kabir' }, { type: 'SET_CLOCK', now: ist(21, 3) });
    expect(s.friendFlow.sessions.Kabir.screen).toBe('pending');
    const cleared = run(s, { type: 'FRIEND_RESOLVE', name: 'Kabir', outcome: 'success' }, { type: 'SET_CLOCK', now: ist(21, 15) });
    expect(cleared.seats.D06.state).toBe('paid_friend');
    expect(cleared.hold!.debited).toBe(27714);
    invariant(cleared);

    // Still pending at 9:10: fails, not charged, seat stays kept and is charged to Rohan at 9:15
    let failed = run(s, { type: 'SET_CLOCK', now: ist(21, 10) });
    expect(failed.friendFlow.sessions.Kabir.screen).toBe('failed');
    expect(failed.seats.D06.state).toBe('kept');
    failed = run(failed, { type: 'SET_CLOCK', now: ist(21, 15) });
    expect(failed.hold!.debited).toBe(2 * 27714);
    invariant(failed);

    // After 9:00 PM nobody can start a late payment
    let after = runScriptTo(fresh(), 'grace');
    after = run(after, { type: 'SET_CLOCK', now: ist(21, 1) }, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' });
    expect(selectLatePage(after, 'Kabir')).toMatchObject({ view: 'ended', body: 'Payments for kept seats closed at 9:00 PM.' });
  });

  it('halfway copy is derived from state', () => {
    let s = runScriptTo(fresh(), 'sana');
    s = run(s, { type: 'SET_CLOCK', now: ist(16, 15) });
    const n = s.notifications.find((x) => x.type === 'halfway')!;
    expect(n.body).toBe('3 of 6 in · 3h left for friends to pay.');
  });
});

describe('late payer variants (friend-facing)', () => {
  it('kept seat page, then show started', () => {
    let s = runScriptTo(fresh(), 'grace');
    s = run(s, { type: 'SET_CLOCK', now: ist(20, 10) }, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' });
    expect(selectLatePage(s, 'Kabir')).toMatchObject({
      view: 'late',
      kicker: 'The group hold has ended',
      title: 'Rohan kept a seat for you',
      seatId: 'D06',
      body: 'The ticket is yours once you pay.',
      cta: 'Pay ₹277.14 for D06',
      availability: 'Pay before 9:00 PM',
    });

    let t = runScriptTo(fresh(), 'kabirLate');
    t = run(t, { type: 'FRIEND_OPEN_LINK', name: 'Priya' });
    expect(t.friendFlow.sessions.Priya.screen).toBe('ticket');

    let u = runScriptTo(fresh(), 'grace');
    u = run(u, { type: 'TRANSFER_TICKET', seatId: 'D06', name: 'Kabir' }, { type: 'FRIEND_OPEN_LINK', name: 'Neha' });
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
});

describe('pay link vs transfer (failure #24)', () => {
  it('first action wins, the other turns off; a transferred seat is charged to Rohan at showtime', () => {
    let s = runScriptTo(fresh(), 'grace');
    s = run(s, { type: 'SEND_PAY_LINK', seatId: 'D06' });
    expect(selectKeptSeatActions(s)!.transferEnabled).toBe(false);
    expect(selectKeptSeatActions(s)!.note!.body).toBe("If they pay before 9:00 PM, D06 won't be charged to you.");
    s = run(s, { type: 'TRANSFER_TICKET', seatId: 'D06', name: 'Kabir' });
    expect(s.board.transfers).toEqual({});

    let t = runScriptTo(fresh(), 'grace');
    t = run(t, { type: 'TRANSFER_TICKET', seatId: 'D06', name: 'Kabir' });
    expect(selectKeptSeatActions(t)!.payLinkEnabled).toBe(false);
    expect(selectGroupReceipt(t)!.rows.find((r) => r.seatId === 'D06')!.status).toBe('Transferred · charged to you at 9:15 PM');
    invariant(t);
    expect(selectMoney(t)!.pendingCharge).toBe(27714);
    t = run(t, { type: 'FRIEND_OPEN_LINK', name: 'Kabir' });
    expect(t.friendFlow.sessions.Kabir.screen).toBe('ticket');
    t = run(t, { type: 'SET_CLOCK', now: ist(21, 15) });
    expect(t.hold!.debited).toBe(55428);
    invariant(t);
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

  it('09: "Share a reminder" has no 2-hour limit', () => {
    let s = runScriptTo(fresh(), 'amit');
    s = run(s, { type: 'SEND_ORGANISER_REMINDER' });
    expect(selectBoard(s)!.canShareReminder).toBe(true);
    s = run(s, { type: 'SEND_ORGANISER_REMINDER' });
    expect(s.hold!.events.filter((e) => e.type === 'REMINDER_SENT')).toHaveLength(2);
  });

  it('pay-all-now rail: refunds as friends pay, nothing blocked', () => {
    let s = fresh();
    s = run(s, { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false });
    s = runScriptTo(s, 'showtime');
    invariant(s);
    const m = selectMoney(s)!;
    expect(m.fallback).toBe(true);
    expect(m.stillBlocked).toBe(0);
    expect(m.unblocked).toBe(0);
    expect(selectGroupReceipt(s)!.ledger.map((l) => [l.label, l.value])).toEqual([
      ['Paid at start', '₹1,662.84'],
      ['Refunded to you', '₹1,385.70'],
      ['You paid', '₹277.14'],
    ]);
  });
});
