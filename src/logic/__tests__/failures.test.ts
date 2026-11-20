import { describe, it, expect } from 'vitest';
import { demoReducer } from '../reducer';
import { createInitialDemoState } from '../seed';

describe('Failure States (Spec §5)', () => {
  // Helper to get state with 6 seats selected
  function setupSelection() {
    let state = createInitialDemoState();
    const groupSeatIds = ['D05', 'D06', 'D07', 'D08', 'D09', 'D10'];
    for (const seatId of groupSeatIds) {
      state = demoReducer(state, { type: 'SELECT_SEAT', seatId });
    }
    return state;
  }

  // Helper to get active hold
  function setupActiveHold() {
    let state = setupSelection();
    state = demoReducer(state, { type: 'START_HOLD_DRAFT' });
    state = demoReducer(state, { type: 'SET_HOLD_OWNER_SEAT', seatId: 'D07' });
    state = demoReducer(state, { type: 'SUBMIT_UPI_PIN', pin: '1234' });
    return state;
  }

  it('Failure 1: Show < 3h away blocks group hold', () => {
    let state = setupSelection();
    // Simulate setting show time < 3h away
    state = demoReducer(state, { type: 'CONTROLLER_TOGGLE_3H_RULE', isLessThan3h: true });
    state = demoReducer(state, { type: 'START_HOLD_DRAFT' });

    expect(state.hold).toBeNull();
    expect(state.errorMessage).toBe('Group holds close 3 hours before the show');
  });

  it('Failure 2: Group hold cap reached on high tier blocks hold', () => {
    let state = setupSelection();
    state = demoReducer(state, { type: 'CONTROLLER_SET_DEMAND_TIER', tier: 'high' });
    // Simulate high cap reached
    state = {
      ...state,
      settings: { ...state.settings, showHoldsPct: 15 },
    };
    state = demoReducer(state, { type: 'START_HOLD_DRAFT' });

    expect(state.hold).toBeNull();
    expect(state.errorMessage).toBe('Group holds are full for this show. Book now to keep these seats.');
  });

  it('Failure 3: Existing hold for this show blocks second hold', () => {
    let state = setupSelection();
    state = {
      ...state,
      settings: { ...state.settings, userHasExistingHoldForShow: true },
    };
    state = demoReducer(state, { type: 'START_HOLD_DRAFT' });

    expect(state.hold).toBeNull();
    expect(state.errorMessage).toBe("You're already holding seats for this show.");
  });

  it('Failure 4 ★: Bank does not support blocking -> fallback rail pay_and_refund', () => {
    let state = setupSelection();
    // Bank blocking unsupported
    state = demoReducer(state, { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING', supported: false });
    state = demoReducer(state, { type: 'START_HOLD_DRAFT' });

    expect(state.hold).not.toBeNull();
    expect(state.hold?.paymentRail).toBe('pay_and_refund');
  });

  it('Failure 8 ★: Rohan cancels block in his UPI app -> unpaid seats released', () => {
    let state = setupActiveHold();
    // Amit has already paid for D08
    state = demoReducer(state, { type: 'CONTROLLER_AMIT_PAYS' });
    expect(state.seats['D08'].state).toBe('paid_friend');

    // Rohan cancels block in UPI app
    state = demoReducer(state, { type: 'CONTROLLER_ROHAN_CANCELS_BLOCK' });

    expect(state.hold?.status).toBe('cancelled');
    // Paid seat D08 and owner seat D07 are NOT affected
    expect(state.seats['D07'].state).toBe('paid_owner');
    expect(state.seats['D08'].state).toBe('paid_friend');
    // Unpaid seats D05, D06, D09, D10 were released
    expect(state.seats['D05'].state).toBe('released');
    expect(state.seats['D06'].state).toBe('released');
    expect(state.seats['D09'].state).toBe('released');
    expect(state.seats['D10'].state).toBe('released');
    expect(state.errorMessage).toContain('You cancelled your block, so 4 unpaid seats were released');
  });

  it('Failure 10 ★: Two friends pick the same seat -> conflict message shown', () => {
    let state = setupActiveHold();
    // Kabir and Sana tap D09 at the same time
    state = demoReducer(state, {
      type: 'CONTROLLER_SEAT_CONFLICT',
      friend1: 'Kabir',
      friend2: 'Sana',
      seatId: 'D09',
    });

    // Kabir holds the lock, Sana gets error message
    expect(state.seats['D09'].lockedBy).toBe('Kabir');
    expect(state.errorMessage).toBe('Kabir is paying for D09 right now. Pick another seat.');
  });

  it('Failure 11: Seat lock expires after 5 min -> returns to held', () => {
    let state = setupActiveHold();
    const lockTime = state.clock.now;

    state = demoReducer(state, {
      type: 'FRIEND_LOCK_SEAT',
      friendName: 'Kabir',
      seatId: 'D06',
    });
    expect(state.seats['D06'].state).toBe('locked');
    expect(state.seats['D06'].lockedBy).toBe('Kabir');

    // Advance clock past 5 minutes (5 min + 1 sec)
    state = demoReducer(state, { type: 'TICK', now: lockTime + 5 * 60 * 1000 + 1000 });

    expect(state.seats['D06'].state).toBe('held');
    expect(state.seats['D06'].lockedBy).toBeUndefined();
  });

  it('Failure 12: Payment fails -> seat still locked for 5 min', () => {
    let state = setupActiveHold();
    state = demoReducer(state, {
      type: 'FRIEND_START_PAYMENT',
      friendName: 'Priya',
      phone: '9876543210',
      seatId: 'D10',
    });
    state = demoReducer(state, {
      type: 'FRIEND_PAYMENT_FAILED',
      friendName: 'Priya',
      seatId: 'D10',
    });

    expect(state.seats['D10'].state).toBe('locked');
    expect(state.errorMessage).toBe("Payment didn't go through. D10 is still yours for 5 minutes.");
  });

  it('Failure 17 ★: Can\'t make it -> records decline and notifies Rohan', () => {
    let state = setupActiveHold();
    state = demoReducer(state, { type: 'CONTROLLER_NEHA_DECLINES' });

    expect(state.declines.some((d) => d.name === 'Neha')).toBe(true);
    const declineNotif = state.notifications.find((n) => n.title.includes("Neha can't make it"));
    expect(declineNotif).toBeDefined();
    expect(declineNotif?.body).toBe('Release a seat, or keep it for someone else?');
  });

  it('Failure 19 ★: Payment pending at deadline -> 10 min grace period granted', () => {
    let state = setupActiveHold();
    const deadline = state.hold!.deadline;

    // Priya starts payment 2 minutes before deadline
    state = demoReducer(state, { type: 'TICK', now: deadline - 2 * 60 * 1000 });
    state = demoReducer(state, { type: 'CONTROLLER_PRIYA_PAYS_PENDING' });
    expect(state.seats['D10'].state).toBe('paying');

    // Deadline hits
    state = demoReducer(state, { type: 'TICK', now: deadline });
    // 09: the deadline closes the hold (unpaid seats kept); the paying seat keeps its 10-min grace
    expect(state.hold?.status).toBe('closed');
    expect(state.seats['D10'].state).toBe('paying');
  });

  it('Failure 20 ★: Nobody responds -> seats kept at the deadline, charged from the block at showtime', () => {
    let state = setupActiveHold();
    const deadline = state.hold!.deadline;

    state = demoReducer(state, { type: 'TICK', now: deadline + 11 * 60 * 1000 });
    expect(state.hold?.status).toBe('closed');
    for (const seatId of ['D05', 'D06', 'D08', 'D09', 'D10']) {
      expect(state.seats[seatId].state).toBe('kept');
    }
    // Kept, not charged yet
    expect(state.hold?.debited).toBe(27714);

    // Showtime: all 6 seats = ₹1,662.84 charged, nothing unblocked
    state = demoReducer(state, { type: 'TICK', now: state.show.startsAt });
    expect(state.hold?.status).toBe('settled');
    expect(state.hold?.debited).toBe(166284);
  });

  it('Failure 23 ★: Late friend pays kept seat -> ticket moves, never charged to Rohan', () => {
    let state = setupActiveHold();
    const deadline = state.hold!.deadline;
    // Fast-forward past deadline so D06 is kept
    state = demoReducer(state, { type: 'TICK', now: deadline + 11 * 60 * 1000 });
    expect(state.seats['D06'].state).toBe('kept');
    const initialDebit = state.hold!.debited;

    // Kabir pays late
    state = demoReducer(state, { type: 'CONTROLLER_KABIR_PAYS_LATE' });

    expect(state.seats['D06'].state).toBe('paid_friend');
    expect(state.seats['D06'].payerName).toBe('Kabir');
    expect(state.hold?.refunded).toBe(0);
    expect(state.hold!.debited).toBe(initialDebit);
    // At showtime the 3 seats still kept are charged; D06 is not
    state = demoReducer(state, { type: 'TICK', now: state.show.startsAt });
    expect(state.hold!.debited).toBe(initialDebit + 4 * 27714);
  });

  it('Failure 27 ★: Cinema cancels show -> full refund including fees, block released', () => {
    let state = setupActiveHold();
    state = demoReducer(state, { type: 'CONTROLLER_AMIT_PAYS' });

    state = demoReducer(state, { type: 'CONTROLLER_CINEMA_CANCELS_SHOW' });

    expect(state.hold?.status).toBe('cancelled');
    expect(state.hold?.refunded).toBe(state.hold?.debited);
    expect(state.errorMessage).toBe('The cinema cancelled this show. Everyone gets a full refund, including fees.');
  });
});
