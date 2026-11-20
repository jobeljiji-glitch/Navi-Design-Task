import { describe, it, expect } from 'vitest';
import { stillBlocked, unblockedSoFar } from '../money';
import { demoReducer } from '../reducer';
import { selectBoardSummary, selectReceipt } from '../selectors';
import { createInitialDemoState, DEMO_CLOCK_START_MS } from '../seed';

describe('Scripted Outcome (Spec §1 Tutorial Path)', () => {
  it('reproduces the exact tutorial scenario down to every single paise and timer', () => {
    let state = createInitialDemoState();
    const fee = state.show.fee; // 2714 paise (₹27.14)

    // 1. Initial State: 1:10 PM
    expect(state.clock.now).toBe(DEMO_CLOCK_START_MS);

    // Rohan selects 6 seats: D05, D06, D07, D08, D09, D10
    const groupSeatIds = ['D05', 'D06', 'D07', 'D08', 'D09', 'D10'];
    for (const seatId of groupSeatIds) {
      state = demoReducer(state, { type: 'SELECT_SEAT', seatId });
    }
    expect(state.selectedSeatIds).toEqual(groupSeatIds);

    // 1:15 PM: Rohan starts hold
    const holdStartTime = Date.UTC(2026, 10, 20, 7, 45, 0); // 1:15 PM IST
    state = demoReducer(state, { type: 'SET_CLOCK', now: holdStartTime });
    state = demoReducer(state, { type: 'START_HOLD_DRAFT' });
    expect(state.hold).not.toBeNull();
    expect(state.hold?.ownerSeatId).toBe('D05'); // default first tapped

    // Set Rohan's seat to D07 as per spec
    state = demoReducer(state, { type: 'SET_HOLD_OWNER_SEAT', seatId: 'D07' });
    expect(state.hold?.ownerSeatId).toBe('D07');

    // Rohan submits UPI PIN
    state = demoReducer(state, { type: 'SUBMIT_UPI_PIN', pin: '1234' });

    // Verify initial hold figures:
    // Block: 6 * 277.14 = ₹1,662.84 (166284 paise)
    // Debited now: ₹277.14 (27714 paise) for D07
    // Still blocked: 5 * 277.14 = ₹1,385.70 (138570 paise)
    // Unblocked so far: ₹0.00
    expect(state.hold?.status).toBe('active');
    expect(state.hold?.blockAmount).toBe(166284);
    expect(state.hold?.debited).toBe(27714);
    expect(stillBlocked(state.hold!, state.seats, fee)).toBe(138570);
    expect(unblockedSoFar(state.hold!, state.seats, fee)).toBe(0);

    // Check deadlines from spec:
    // Deadline: 7:15 PM IST = 19:15 IST
    // Free release until: 4:15 PM IST = 16:15 IST
    // Grace until: 7:25 PM IST = 19:25 IST
    // Block expires: 7:45 PM IST = 19:45 IST
    const expectedDeadline = Date.UTC(2026, 10, 20, 13, 45, 0);
    const expectedFreeRelease = Date.UTC(2026, 10, 20, 10, 45, 0);
    const expectedGrace = Date.UTC(2026, 10, 20, 13, 55, 0);
    const expectedBlockExpiry = Date.UTC(2026, 10, 20, 14, 15, 0);

    expect(state.hold?.deadline).toBe(expectedDeadline);
    expect(state.hold?.freeReleaseUntil).toBe(expectedFreeRelease);
    expect(state.hold?.graceUntil).toBe(expectedGrace);
    expect(state.hold?.blockExpiresAt).toBe(expectedBlockExpiry);

    // 2. Amit pays at 2:02 PM (14:02 IST) for D08
    const time202PM = Date.UTC(2026, 10, 20, 8, 32, 0);
    state = demoReducer(state, { type: 'TICK', now: time202PM });
    state = demoReducer(state, { type: 'CONTROLLER_AMIT_PAYS' });

    expect(state.seats['D08'].state).toBe('paid_friend');
    expect(state.seats['D08'].payerName).toBe('Amit');
    // Still blocked: 4 seats = ₹1,108.56 (110856 paise)
    // Unblocked: 1 seat = ₹277.14 (27714 paise)
    expect(stillBlocked(state.hold!, state.seats, fee)).toBe(110856);
    expect(unblockedSoFar(state.hold!, state.seats, fee)).toBe(27714);

    // 3. Sana pays at 3:10 PM (15:10 IST) for D09
    const time310PM = Date.UTC(2026, 10, 20, 9, 40, 0);
    state = demoReducer(state, { type: 'TICK', now: time310PM });
    state = demoReducer(state, { type: 'CONTROLLER_SANA_PAYS' });

    expect(state.seats['D09'].state).toBe('paid_friend');
    expect(state.seats['D09'].payerName).toBe('Sana');
    // Still blocked: 3 seats = ₹831.42 (83142 paise)
    // Unblocked: 2 seats = ₹554.28 (55428 paise)
    expect(stillBlocked(state.hold!, state.seats, fee)).toBe(83142);
    expect(unblockedSoFar(state.hold!, state.seats, fee)).toBe(55428);

    // 4. Neha declines at 3:30 PM (15:30 IST) -> Rohan releases D05 (edge) free before 4:15 PM
    const time330PM = Date.UTC(2026, 10, 20, 10, 0, 0);
    state = demoReducer(state, { type: 'TICK', now: time330PM });
    state = demoReducer(state, { type: 'CONTROLLER_NEHA_DECLINES' });
    expect(state.declines.some((d) => d.name === 'Neha')).toBe(true);

    // Rohan releases edge seat D05
    state = demoReducer(state, { type: 'RELEASE_SEAT', seatId: 'D05' });
    expect(state.seats['D05'].state).toBe('released');
    // Free release before 4:15 PM -> no fee kept!
    expect(state.hold?.debited).toBe(27714); // unchanged
    // Still blocked: D06 and D10 (2 seats = ₹554.28)
    // Unblocked: Amit (277.14) + Sana (277.14) + Released D05 (277.14) = ₹831.42 (83142 paise)
    expect(stillBlocked(state.hold!, state.seats, fee)).toBe(55428);
    expect(unblockedSoFar(state.hold!, state.seats, fee)).toBe(83142);

    // 5. Priya pays at 7:13 PM (19:13 IST) -> Payment pending
    const time713PM = Date.UTC(2026, 10, 20, 13, 43, 0);
    state = demoReducer(state, { type: 'TICK', now: time713PM });
    state = demoReducer(state, { type: 'CONTROLLER_PRIYA_PAYS_PENDING' });
    expect(state.seats['D10'].state).toBe('paying');

    // 6. Deadline arrives at 7:15 PM (19:15 IST)
    const time715PM = expectedDeadline;
    state = demoReducer(state, { type: 'TICK', now: time715PM });
    // Since Priya is 'paying', hold status enters 'resolving' (grace period)
    expect(state.hold?.status).toBe('resolving');

    // 7. Priya payment succeeds at 7:19 PM (19:19 IST, within grace)
    const time719PM = Date.UTC(2026, 10, 20, 13, 49, 0);
    state = demoReducer(state, { type: 'TICK', now: time719PM });
    state = demoReducer(state, { type: 'CONTROLLER_PRIYA_PAYS_SUCCESS' });
    expect(state.seats['D10'].state).toBe('paid_friend');
    expect(state.seats['D10'].payerName).toBe('Priya');
    // Still blocked: only Kabir's seat D06 = ₹277.14 (27714 paise)
    // Unblocked so far: 4 seats = ₹1,108.56 (110856 paise)
    expect(stillBlocked(state.hold!, state.seats, fee)).toBe(27714);
    expect(unblockedSoFar(state.hold!, state.seats, fee)).toBe(110856);

    // 8. Grace expires at 7:25 PM (19:25 IST)
    const time725PM = expectedGrace;
    state = demoReducer(state, { type: 'TICK', now: time725PM });

    // Kabir had no response -> D06 kept by default and charged to Rohan
    expect(state.hold?.status).toBe('settled');
    expect(state.seats['D06'].state).toBe('kept');
    // Total Rohan paid: D07 (own) + D06 (kept) = ₹554.28 (55428 paise)
    expect(state.hold?.debited).toBe(55428);
    // Still blocked: 0
    expect(stillBlocked(state.hold!, state.seats, fee)).toBe(0);
    // Final unblocked amount: ₹1,108.56 (110856 paise)
    expect(unblockedSoFar(state.hold!, state.seats, fee)).toBe(110856);

    // Check final receipt from spec §1:
    // "Receipt at 7:25 PM: Rohan paid ₹554.28 in total (own + kept), fees kept ₹0, unblocked ₹1,108.56."
    const receipt = selectReceipt(state);
    expect(receipt).not.toBeNull();
    expect(receipt?.rohanPaidTotal).toBe('₹554.28');
    expect(receipt?.feesKept).toBe('₹0.00');
    expect(receipt?.unblockedAmount).toBe('₹1,108.56');

    // 9. Kabir (late) opens link at 8:10 PM (20:10 IST) and pays for kept seat D06
    const time810PM = Date.UTC(2026, 10, 20, 14, 40, 0);
    state = demoReducer(state, { type: 'TICK', now: time810PM });
    state = demoReducer(state, { type: 'CONTROLLER_KABIR_PAYS_LATE' });

    // Ticket moves to Kabir; Rohan refunded ₹277.14
    expect(state.seats['D06'].state).toBe('paid_friend');
    expect(state.seats['D06'].payerName).toBe('Kabir');
    expect(state.hold?.refunded).toBe(27714);
    // Net amount paid by Rohan drops back to ₹277.14 (only his own seat)
    expect(state.hold!.debited - state.hold!.refunded).toBe(27714);

    const boardSummary = selectBoardSummary(state);
    expect(boardSummary?.debited).toBe('₹277.14');
  });
});
