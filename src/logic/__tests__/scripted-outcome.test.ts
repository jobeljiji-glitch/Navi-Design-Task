import { describe, it, expect } from 'vitest';
import { formatINR, stillBlocked, toCover, unblocked } from '../money';
import { demoReducer } from '../reducer';
import { selectBoardSummary, selectReceipt } from '../selectors';
import { createInitialDemoState, DEMO_CLOCK_START_MS } from '../seed';
import { selectMoney, withBoard, type BoardState } from '../boardFlow';
import { applyStep, ist, SCRIPT_STEPS } from '../script';
import { selectTourPayoff } from '../tour';
import type { DemoState } from '../types';

/**
 * Spec §1 scripted outcome, 09 money model: kept seats are charged at showtime, once; a late friend's
 * payment means the kept seat is never charged to Rohan (no refund). Receipt at 9:15 PM:
 * charged ₹277.14 (his own seat), unblocked ₹1,385.70.
 */

function invariant(s: BoardState) {
  const m = selectMoney(s);
  if (!m || m.fallback) return;
  expect(m.charged + m.unblocked + m.stillBlocked).toBe(m.blockAmount);
  expect(m.charged).toBe(s.hold!.debited);
  expect(m.refunded).toBe(0);
}

describe('Scripted outcome (spec §1) through the full reducer stack', () => {
  it('every step adds up; Kabir pays late so D06 is never charged; one unblock at 9:15 PM', () => {
    let s = withBoard(createInitialDemoState());
    const seen: Partial<Record<(typeof SCRIPT_STEPS)[number], BoardState>> = {};
    for (const step of SCRIPT_STEPS) {
      s = applyStep(s, step);
      invariant(s);
      seen[step] = s;
    }

    // 4:15 PM (10): block ₹1,662.84, own seat charged ₹277.14
    const hold = seen.hold!;
    expect(hold.hold!.createdAt).toBe(ist(16, 15));
    expect(hold.hold!.blockAmount).toBe(166284);
    expect(hold.hold!.debited).toBe(27714);
    expect(hold.hold!.deadline).toBe(ist(19, 15));
    expect(hold.hold!.freeReleaseUntil).toBe(ist(17, 45));
    expect(hold.hold!.graceUntil).toBe(ist(19, 25));
    expect(hold.hold!.blockExpiresAt).toBe(ist(21, 15)); // the block lasts until showtime
    expect(selectMoney(hold)!).toMatchObject({ charged: 27714, toCover: 138570, stillBlocked: 138570, unblocked: 0 });

    // Amit, Sana pay: less to cover, nothing unblocked yet
    expect(selectMoney(seen.amit!)!).toMatchObject({ toCover: 110856, stillBlocked: 138570, unblocked: 0 });
    expect(selectMoney(seen.sana!)!).toMatchObject({ toCover: 83142, stillBlocked: 138570, unblocked: 0 });

    // 10: every friend action happens between the hold (4:15) and halfway (5:45)
    for (const step of ['amit', 'sana', 'neha', 'release'] as const) {
      expect(seen[step]!.clock.now).toBeGreaterThan(ist(16, 15));
      expect(seen[step]!.clock.now).toBeLessThan(ist(17, 45));
    }
    expect(seen.halfway!.clock.now).toBe(ist(17, 45));
    expect(seen.t30!.clock.now).toBe(ist(18, 45));
    expect(seen.halfway!.notifications.some((n) => n.type === 'halfway')).toBe(true);

    // Neha can't make it → D05 released free (before 5:45 PM)
    expect(seen.release!.seats.D05.state).toBe('released');
    expect(selectMoney(seen.release!)!).toMatchObject({ toCover: 55428, feesKept: 0, unblocked: 0 });

    // 7:15 PM: Kabir's D06 kept (not charged); Priya's payment with the bank gets the grace
    const dl = seen.deadline!;
    expect(dl.hold!.status).toBe('closed');
    expect(dl.seats.D06.state).toBe('kept');
    expect(dl.seats.D10.state).toBe('paying');
    expect(dl.hold!.debited).toBe(27714);

    // 7:19 PM Priya clears; 7:25 PM grace over: one kept seat, still only ₹277.14 charged
    expect(seen.priyaPaid!.seats.D10.state).toBe('paid_friend');
    expect(selectMoney(seen.grace!)!).toMatchObject({ charged: 27714, keptSeats: 1, toCover: 27714, pendingCharge: 27714, stillBlocked: 138570 });

    // 8:10 PM Kabir pays for the kept seat: ticket moves, D06 is never charged, no refund
    const late = seen.kabirLate!;
    expect(late.seats.D06).toMatchObject({ state: 'paid_friend', payerName: 'Kabir' });
    expect(late.hold!.refunded).toBe(0);
    expect(late.smsToasts.some((t) => /refund/i.test(t.text))).toBe(false);
    expect(selectMoney(late)!).toMatchObject({ charged: 27714, keptSeats: 0, toCover: 0, pendingCharge: 0 });

    // 9:15 PM settlement: charged ₹277.14, unblocked ₹1,385.70, once
    const end = seen.showtime!;
    expect(end.hold!.status).toBe('settled');
    const m = selectMoney(end)!;
    expect(formatINR(m.charged)).toBe('₹277.14');
    expect(formatINR(m.unblocked)).toBe('₹1,385.70');
    expect(m.stillBlocked).toBe(0);
    expect(end.smsToasts.filter((t) => /unblocked/.test(t.text)).map((t) => t.text)).toEqual(['₹1,385.70 unblocked by BookMyShow.']);

    // Done card
    const p = selectTourPayoff(end)!;
    expect(p.rows[0]).toEqual({ text: 'Rohan paid ₹277.14 — just his own seat', sub: 'Kabir paid late, so his seat was never charged to Rohan.' });
  });

  it('without Kabir: D06 is charged at showtime from the block', () => {
    let s = withBoard(createInitialDemoState());
    for (const step of SCRIPT_STEPS) {
      if (step === 'kabirLate') continue;
      s = applyStep(s, step);
      invariant(s);
    }
    const m = selectMoney(s)!;
    expect(s.seats.D06.state).toBe('kept');
    expect(formatINR(m.charged)).toBe('₹554.28');
    expect(formatINR(m.unblocked)).toBe('₹1,108.56');
    expect(s.smsToasts[0].text).toBe('₹277.14 charged and ₹1,108.56 unblocked by BookMyShow.');
  });
});

describe('Base reducer follows the same model', () => {
  it('kept at the deadline, charged at showtime, no refund on a late payment', () => {
    let state: DemoState = createInitialDemoState();
    expect(state.clock.now).toBe(DEMO_CLOCK_START_MS);
    for (const seatId of ['D05', 'D06', 'D07', 'D08', 'D09', 'D10']) state = demoReducer(state, { type: 'SELECT_SEAT', seatId });
    state = demoReducer(state, { type: 'SET_CLOCK', now: ist(16, 15) });
    state = demoReducer(state, { type: 'START_HOLD_DRAFT' });
    state = demoReducer(state, { type: 'SET_HOLD_OWNER_SEAT', seatId: 'D07' });
    state = demoReducer(state, { type: 'SUBMIT_UPI_PIN', pin: '1234' });
    const fee = state.show.fee;
    expect(stillBlocked(state.hold!)).toBe(138570);

    state = demoReducer(state, { type: 'TICK', now: ist(16, 30) });
    state = demoReducer(state, { type: 'CONTROLLER_AMIT_PAYS' });
    expect(toCover(state.hold!, state.seats, fee)).toBe(110856);
    expect(unblocked(state.hold!)).toBe(0);

    state = demoReducer(state, { type: 'TICK', now: ist(19, 15) });
    expect(state.hold!.status).toBe('closed');
    expect(state.seats.D06.state).toBe('kept');
    expect(state.hold!.debited).toBe(27714);

    state = demoReducer(state, { type: 'TICK', now: ist(20, 10) });
    state = demoReducer(state, { type: 'CONTROLLER_KABIR_PAYS_LATE' });
    expect(state.seats.D06.state).toBe('paid_friend');
    expect(state.hold!.refunded).toBe(0);

    state = demoReducer(state, { type: 'TICK', now: ist(21, 15) });
    expect(state.hold!.status).toBe('settled');
    // D05, D09, D10 were still kept: 3 × ₹277.14 charged with the owner seat
    expect(state.hold!.debited).toBe(4 * 27714);
    expect(selectReceipt(state)).toEqual({ blocked: '₹1,662.84', charged: '₹1,108.56', unblocked: '₹554.28', final: true });
    expect(selectBoardSummary(state)!.toCover).toBe('₹0.00');
  });
});
