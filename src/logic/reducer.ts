import { formatINR, seatPrice, unblocked, releaseFee } from './money';
import {
  calculateBlockExpiresAt,
  calculateDeadline,
  calculateFreeReleaseUntil,
  calculateGraceUntil,
  isAccountHoldLimitReached,
  isGroupSizeEligible,
  isHighTierCapReached,
  isOverBlockCap,
  isThreeHoursBeforeShow,
  MAX_BLOCK_PAISE,
  SEAT_LOCK_DURATION_MS,
} from './rules';

/** 09 limit copy (UPI Reserve Pay: one mandate per user, ₹10,000 cap). */
export const ACCOUNT_LIMIT_COPY = 'You already have a group hold running. Finish it or book these seats now.';
export const BLOCK_CAP_COPY = 'Group holds can block up to ₹10,000. Pick fewer seats or pay now.';
import { createInitialDemoState } from './seed';
import type { Action, DemoState, FriendPayment, Hold, HoldEvent, NotificationItem, Seat } from './types';

function createEvent(at: number, type: string, description: string): HoldEvent {
  return {
    id: `evt-${at}-${Math.random().toString(36).substring(2, 7)}`,
    at,
    type,
    description,
  };
}

export function demoReducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'SET_CLOCK': {
      return {
        ...state,
        clock: { ...state.clock, now: action.now },
      };
    }

    case 'ADVANCE_CLOCK': {
      const newNow = state.clock.now + action.ms;
      return demoReducer(state, { type: 'TICK', now: newNow });
    }

    case 'SET_LIVE_CLOCK': {
      return {
        ...state,
        clock: { ...state.clock, isLive: action.isLive },
      };
    }

    case 'SELECT_SEAT': {
      if (state.selectedSeatIds.includes(action.seatId)) return state;
      const seat = state.seats[action.seatId];
      if (!seat || seat.state !== 'available') return state;

      const newSelection = [...state.selectedSeatIds, action.seatId];
      return {
        ...state,
        selectedSeatIds: newSelection,
        seats: {
          ...state.seats,
          [action.seatId]: { ...seat, state: 'selected' },
        },
      };
    }

    case 'DESELECT_SEAT': {
      if (!state.selectedSeatIds.includes(action.seatId)) return state;
      const seat = state.seats[action.seatId];
      if (!seat) return state;

      return {
        ...state,
        selectedSeatIds: state.selectedSeatIds.filter((id) => id !== action.seatId),
        seats: {
          ...state.seats,
          [action.seatId]: { ...seat, state: 'available' },
        },
      };
    }

    case 'CLEAR_SELECTION': {
      const updatedSeats = { ...state.seats };
      for (const id of state.selectedSeatIds) {
        if (updatedSeats[id] && updatedSeats[id].state === 'selected') {
          updatedSeats[id] = { ...updatedSeats[id], state: 'available' };
        }
      }
      return {
        ...state,
        selectedSeatIds: [],
        seats: updatedSeats,
      };
    }

    case 'SET_HOLD_OWNER_SEAT': {
      if (!state.hold) return state;
      return {
        ...state,
        hold: { ...state.hold, ownerSeatId: action.seatId },
      };
    }

    case 'START_HOLD_DRAFT': {
      const count = state.selectedSeatIds.length;
      if (!isGroupSizeEligible(count)) {
        return { ...state, errorMessage: 'Group holds require between 3 and 10 seats.' };
      }

      const now = state.clock.now;
      if (state.settings.is3HoursBeforeShow || !isThreeHoursBeforeShow(now, state.show.startsAt)) {
        return {
          ...state,
          errorMessage: 'Group holds close 3 hours before the show',
        };
      }

      if (isHighTierCapReached(state.show.tier, state.settings.showHoldsPct)) {
        return {
          ...state,
          errorMessage: 'Group holds are full for this show. Book now to keep these seats.',
        };
      }

      if (state.settings.userHasExistingHoldForShow || (state.hold && (state.hold.status === 'active' || state.hold.status === 'closed'))) {
        return {
          ...state,
          errorMessage: "You're already holding seats for this show.",
        };
      }

      if (isAccountHoldLimitReached(state.settings.userAccountsActiveHoldCount)) {
        return {
          ...state,
          errorMessage: ACCOUNT_LIMIT_COPY,
        };
      }

      const ownerSeatId = state.selectedSeatIds[0] || 'D07';
      const singleSeatPrice = seatPrice(state.seats[ownerSeatId], state.show.fee);
      const blockAmount = state.selectedSeatIds.reduce((sum, id) => sum + seatPrice(state.seats[id], state.show.fee), 0);

      if (isOverBlockCap(blockAmount, state.settings.blockCapPaise ?? MAX_BLOCK_PAISE)) {
        return { ...state, errorMessage: BLOCK_CAP_COPY };
      }

      const deadline = calculateDeadline(now, state.show.startsAt, state.show.tier);
      const freeReleaseUntil = calculateFreeReleaseUntil(now, deadline, state.show.tier);
      const graceUntil = calculateGraceUntil(deadline);
      const blockExpiresAt = calculateBlockExpiresAt(state.show.startsAt);

      const newHold: Hold = {
        id: `hold-${now}`,
        showId: state.show.id,
        organiser: { name: 'Rohan', upi: 'rohan@okbank' },
        seatIds: [...state.selectedSeatIds],
        ownerSeatId,
        createdAt: now,
        deadline,
        freeReleaseUntil,
        graceUntil,
        blockExpiresAt,
        paymentRail: state.settings.bankSupportsBlocking ? 'reserve_pay' : 'pay_and_refund',
        blockAmount,
        debited: singleSeatPrice,
        refunded: 0,
        status: 'draft',
        assignMode: 'friends_pick',
        events: [createEvent(now, 'HOLD_DRAFT_CREATED', `Group hold draft created for ${count} seats`)],
      };

      return {
        ...state,
        hold: newHold,
        errorMessage: null,
      };
    }

    case 'SET_PAYMENT_RAIL': {
      if (!state.hold) return state;
      return {
        ...state,
        hold: { ...state.hold, paymentRail: action.rail },
      };
    }

    case 'SET_ASSIGN_MODE': {
      if (!state.hold) return state;
      return {
        ...state,
        hold: { ...state.hold, assignMode: action.mode },
      };
    }

    case 'SET_COVER_SEATS': {
      if (!state.hold) return state;
      const count = action.count;
      const perSeat = seatPrice(state.seats[state.hold.ownerSeatId], state.show.fee);
      return {
        ...state,
        hold: {
          ...state.hold,
          debited: perSeat * (1 + count),
        },
      };
    }

    case 'SUBMIT_UPI_PIN': {
      if (!state.hold) return state;
      const now = state.clock.now;
      const updatedSeats = { ...state.seats };

      for (const seatId of state.hold.seatIds) {
        if (seatId === state.hold.ownerSeatId) {
          updatedSeats[seatId] = { ...updatedSeats[seatId], state: 'paid_owner', payerName: 'Rohan' };
        } else {
          updatedSeats[seatId] = { ...updatedSeats[seatId], state: 'held' };
        }
      }

      const activeHold: Hold = {
        ...state.hold,
        status: 'active',
        events: [
          ...state.hold.events,
          createEvent(now, 'UPI_BLOCK_APPROVED', `₹${(state.hold.blockAmount / 100).toFixed(2)} blocked, ₹${(state.hold.debited / 100).toFixed(2)} debited for owner seat`),
        ],
      };

      const smsText = `₹${(state.hold.blockAmount / 100).toFixed(2)} blocked for BookMyShow. ₹${(state.hold.debited / 100).toFixed(2)} debited.`;

      return {
        ...state,
        hold: activeHold,
        seats: updatedSeats,
        smsToasts: [{ id: `sms-${now}`, text: smsText, at: now }, ...state.smsToasts],
        notifications: [
          {
            id: `notif-${now}`,
            title: `6 seats held for your group`,
            body: `Your ticket ${state.hold.ownerSeatId} is confirmed. Friends have until 7:15 PM today to pay.`,
            at: now,
            read: false,
          },
          ...state.notifications,
        ],
        controllerLog: [
          createEvent(now, 'HOLD_ACTIVE', `Hold active with UPI Reserve Pay`),
          ...state.controllerLog,
        ],
      };
    }

    case 'SHORTEN_DEADLINE': {
      if (!state.hold) return state;
      const now = state.clock.now;
      if (action.newDeadline <= now || action.newDeadline >= state.hold.deadline) {
        return state;
      }
      return {
        ...state,
        hold: {
          ...state.hold,
          deadline: action.newDeadline,
          graceUntil: calculateGraceUntil(action.newDeadline),
          events: [
            ...state.hold.events,
            createEvent(now, 'DEADLINE_SHORTENED', `Deadline shortened to ${new Date(action.newDeadline).toLocaleTimeString()}`),
          ],
        },
      };
    }

    case 'SEND_ORGANISER_REMINDER': {
      if (!state.hold) return state;
      // 09 (user): Rohan shares the reminder through his own apps, so there's no 2-hour limit here.
      // The 2-hour spacing applies only to BookMyShow's automatic nudges.
      const now = state.clock.now;
      return {
        ...state,
        hold: {
          ...state.hold,
          lastRohanReminderAt: now,
          events: [...state.hold.events, createEvent(now, 'REMINDER_SENT', 'Rohan shared a reminder')],
        },
      };
    }

    case 'RELEASE_SEAT': {
      if (!state.hold) return state;
      const seat = state.seats[action.seatId];
      if (!seat || (seat.state !== 'held' && seat.state !== 'locked')) return state;

      const now = state.clock.now;
      const fee = releaseFee(state.hold, state.show, now);

      const updatedSeat: Seat = { ...seat, state: 'released', lockedBy: undefined, lockedUntil: undefined };
      const updatedHold: Hold = {
        ...state.hold,
        // fee kept on released seats after the free window: charged at showtime with the kept seats (09)
        feesKept: (state.hold.feesKept ?? 0) + fee,
        events: [
          ...state.hold.events,
          createEvent(now, 'SEAT_RELEASED', `Seat ${seat.id} released. Fee kept: ₹${(fee / 100).toFixed(2)}`),
        ],
      };

      return {
        ...state,
        seats: { ...state.seats, [seat.id]: updatedSeat },
        hold: updatedHold,
        controllerLog: [
          createEvent(now, 'SEAT_RELEASED', `Rohan released seat ${seat.id}`),
          ...state.controllerLog,
        ],
      };
    }

    case 'KEEP_REMAINING_SEATS': {
      if (!state.hold) return state;
      const now = state.clock.now;
      const updatedSeats = { ...state.seats };
      let keptCount = 0;

      for (const seatId of state.hold.seatIds) {
        const s = updatedSeats[seatId];
        if (s && s.state === 'held') {
          updatedSeats[seatId] = { ...s, state: 'kept' };
          keptCount++;
        }
      }

      // 09: kept seats aren't charged now; they're charged at showtime unless a friend pays first.
      const updatedHold: Hold = {
        ...state.hold,
        events: [
          ...state.hold.events,
          createEvent(now, 'SEATS_KEPT', `${keptCount} unpaid seats kept by Rohan`),
        ],
      };

      return {
        ...state,
        seats: updatedSeats,
        hold: updatedHold,
      };
    }

    case 'FRIEND_LOCK_SEAT': {
      const seat = state.seats[action.seatId];
      if (!seat) return state;
      const now = state.clock.now;

      if (seat.state === 'locked' && seat.lockedBy !== action.friendName && seat.lockedUntil && seat.lockedUntil > now) {
        return {
          ...state,
          errorMessage: `${seat.lockedBy} is paying for ${seat.id} right now. Pick another seat.`,
        };
      }

      const updatedSeat: Seat = {
        ...seat,
        state: 'locked',
        lockedBy: action.friendName,
        lockedUntil: now + SEAT_LOCK_DURATION_MS,
      };

      return {
        ...state,
        errorMessage: null,
        seats: { ...state.seats, [seat.id]: updatedSeat },
      };
    }

    case 'FRIEND_START_PAYMENT': {
      const seat = state.seats[action.seatId];
      if (!seat) return state;
      const now = state.clock.now;

      const payment: FriendPayment = {
        id: `pmt-${action.friendName}-${now}`,
        name: action.friendName,
        phone: action.phone,
        seatIds: [action.seatId],
        status: 'locked',
        at: now,
        amountPaise: seatPrice(seat, state.show.fee),
      };

      const updatedSeat: Seat = {
        ...seat,
        state: 'locked',
        lockedBy: action.friendName,
        lockedUntil: now + SEAT_LOCK_DURATION_MS,
      };

      return {
        ...state,
        seats: { ...state.seats, [seat.id]: updatedSeat },
        friendPayments: [payment, ...state.friendPayments],
      };
    }

    case 'FRIEND_SUBMIT_PAYMENT': {
      const seat = state.seats[action.seatId];
      if (!seat) return state;
      const now = state.clock.now;

      const updatedSeat: Seat = {
        ...seat,
        state: 'paying',
        lockedBy: action.friendName,
        lockedUntil: now + SEAT_LOCK_DURATION_MS,
      };

      const updatedPayments = state.friendPayments.map((p) =>
        p.name === action.friendName && p.seatIds.includes(action.seatId)
          ? { ...p, status: 'pending' as const }
          : p
      );

      return {
        ...state,
        seats: { ...state.seats, [seat.id]: updatedSeat },
        friendPayments: updatedPayments,
      };
    }

    case 'FRIEND_PAYMENT_SUCCESS': {
      const seat = state.seats[action.seatId];
      if (!seat || !state.hold) return state;
      const now = state.clock.now;

      const updatedSeat: Seat = {
        ...seat,
        state: 'paid_friend',
        payerName: action.friendName,
        lockedBy: undefined,
        lockedUntil: undefined,
      };

      const updatedPayments = state.friendPayments.map((p) =>
        p.name === action.friendName && p.seatIds.includes(action.seatId)
          ? { ...p, status: 'success' as const }
          : p
      );

      const notifTitle = `${action.friendName}'s in! 🎉`;
      const notifBody = `${formatINR(seatPrice(seat, state.show.fee))} less for you to cover`;

      return {
        ...state,
        seats: { ...state.seats, [seat.id]: updatedSeat },
        friendPayments: updatedPayments,
        notifications: [
          {
            id: `notif-${now}`,
            title: notifTitle,
            body: notifBody,
            at: now,
            read: false,
          },
          ...state.notifications,
        ],
        controllerLog: [
          createEvent(now, 'FRIEND_PAID', `${action.friendName} paid ₹277.14 for ${action.seatId}`),
          ...state.controllerLog,
        ],
      };
    }

    case 'FRIEND_PAYMENT_FAILED': {
      const seat = state.seats[action.seatId];
      if (!seat) return state;
      const now = state.clock.now;

      const updatedSeat: Seat = {
        ...seat,
        state: 'locked',
        lockedUntil: now + SEAT_LOCK_DURATION_MS,
      };

      const updatedPayments = state.friendPayments.map((p) =>
        p.name === action.friendName && p.seatIds.includes(action.seatId)
          ? { ...p, status: 'failed' as const }
          : p
      );

      return {
        ...state,
        seats: { ...state.seats, [seat.id]: updatedSeat },
        friendPayments: updatedPayments,
        errorMessage: `Payment didn't go through. ${seat.id} is still yours for 5 minutes.`,
      };
    }

    case 'FRIEND_DECLINE': {
      const now = state.clock.now;
      return {
        ...state,
        declines: [{ name: action.friendName, at: now }, ...state.declines],
        notifications: [
          {
            id: `notif-decline-${now}`,
            title: `${action.friendName} can't make it 😕`,
            body: `Release a seat, or keep it for someone else?`,
            at: now,
            read: false,
          },
          ...state.notifications,
        ],
        controllerLog: [
          createEvent(now, 'FRIEND_DECLINE', `${action.friendName} declined invitation`),
          ...state.controllerLog,
        ],
      };
    }

    case 'FRIEND_LATE_PAY': {
      const seat = state.seats[action.seatId];
      if (!seat || !state.hold || seat.state !== 'kept') return state;
      const now = state.clock.now;
      const price = seatPrice(seat, state.show.fee);

      const updatedSeat: Seat = {
        ...seat,
        state: 'paid_friend',
        payerName: action.friendName,
      };

      // 09: the kept seat is simply never charged to Rohan (no refund). Only the pay-all-now rail refunds.
      const fallback = state.hold.paymentRail === 'pay_and_refund';
      const updatedHold: Hold = {
        ...state.hold,
        refunded: state.hold.refunded + (fallback ? price : 0),
        events: [
          ...state.hold.events,
          createEvent(now, 'LATE_PAYMENT', `${action.friendName} paid ${formatINR(price)} for kept seat ${seat.id}; never charged to Rohan.`),
        ],
      };

      return {
        ...state,
        seats: { ...state.seats, [seat.id]: updatedSeat },
        hold: updatedHold,
        notifications: [
          {
            id: `notif-late-${now}`,
            title: `${action.friendName} took ${seat.id} 🙌`,
            body: fallback ? `${formatINR(price)} is on its way back to you.` : `${seat.id} won't be charged to you`,
            at: now,
            read: false,
          },
          ...state.notifications,
        ],
        controllerLog: [
          createEvent(now, 'LATE_PAYMENT', `${action.friendName} paid late for ${seat.id}; it won't be charged to Rohan`),
          ...state.controllerLog,
        ],
      };
    }

    // Controller events
    case 'CONTROLLER_AMIT_PAYS': {
      const s1 = demoReducer(state, {
        type: 'FRIEND_START_PAYMENT',
        friendName: 'Amit',
        phone: '9876543210',
        seatId: 'D08',
      });
      return demoReducer(s1, {
        type: 'FRIEND_PAYMENT_SUCCESS',
        friendName: 'Amit',
        seatId: 'D08',
      });
    }

    case 'CONTROLLER_SANA_PAYS': {
      const s1 = demoReducer(state, {
        type: 'FRIEND_START_PAYMENT',
        friendName: 'Sana',
        phone: '9876543211',
        seatId: 'D09',
      });
      return demoReducer(s1, {
        type: 'FRIEND_PAYMENT_SUCCESS',
        friendName: 'Sana',
        seatId: 'D09',
      });
    }

    case 'CONTROLLER_NEHA_DECLINES': {
      return demoReducer(state, {
        type: 'FRIEND_DECLINE',
        friendName: 'Neha',
      });
    }

    case 'CONTROLLER_PRIYA_PAYS_PENDING': {
      const s1 = demoReducer(state, {
        type: 'FRIEND_START_PAYMENT',
        friendName: 'Priya',
        phone: '9876543212',
        seatId: 'D10',
      });
      return demoReducer(s1, {
        type: 'FRIEND_SUBMIT_PAYMENT',
        friendName: 'Priya',
        seatId: 'D10',
      });
    }

    case 'CONTROLLER_PRIYA_PAYS_SUCCESS': {
      return demoReducer(state, {
        type: 'FRIEND_PAYMENT_SUCCESS',
        friendName: 'Priya',
        seatId: 'D10',
      });
    }

    case 'CONTROLLER_PRIYA_PAYS_FAIL': {
      return demoReducer(state, {
        type: 'FRIEND_PAYMENT_FAILED',
        friendName: 'Priya',
        seatId: 'D10',
      });
    }

    case 'CONTROLLER_KABIR_PAYS_LATE': {
      return demoReducer(state, {
        type: 'FRIEND_LATE_PAY',
        friendName: 'Kabir',
        seatId: 'D06',
      });
    }

    case 'CONTROLLER_SEAT_CONFLICT': {
      const s1 = demoReducer(state, {
        type: 'FRIEND_LOCK_SEAT',
        friendName: action.friend1,
        seatId: action.seatId,
      });
      return demoReducer(s1, {
        type: 'FRIEND_LOCK_SEAT',
        friendName: action.friend2,
        seatId: action.seatId,
      });
    }

    case 'CONTROLLER_ROHAN_CANCELS_BLOCK': {
      if (!state.hold) return state;
      const now = state.clock.now;
      const updatedSeats = { ...state.seats };
      let releasedCount = 0;

      for (const seatId of state.hold.seatIds) {
        const s = updatedSeats[seatId];
        if (s && (s.state === 'held' || s.state === 'locked' || s.state === 'paying' || s.state === 'kept')) {
          updatedSeats[seatId] = { ...s, state: 'released', lockedBy: undefined, lockedUntil: undefined };
          releasedCount++;
        }
      }

      const cancelledHold: Hold = {
        ...state.hold,
        status: 'cancelled',
        events: [
          ...state.hold.events,
          createEvent(now, 'ROHAN_CANCELLED_BLOCK', `Rohan cancelled block in UPI app. ${releasedCount} unpaid seats released.`),
        ],
      };

      return {
        ...state,
        seats: updatedSeats,
        hold: cancelledHold,
        errorMessage: `You cancelled your block, so ${releasedCount} unpaid seats were released. Paid seats aren't affected.`,
        controllerLog: [
          createEvent(now, 'UPI_BLOCK_CANCELLED', `Rohan cancelled block in UPI app`),
          ...state.controllerLog,
        ],
      };
    }

    case 'CONTROLLER_CINEMA_CANCELS_SHOW': {
      if (!state.hold) return state;
      const now = state.clock.now;
      const updatedSeats = { ...state.seats };

      for (const seatId of state.hold.seatIds) {
        const s = updatedSeats[seatId];
        if (s) {
          updatedSeats[seatId] = { ...s, state: 'available', payerName: undefined, lockedBy: undefined };
        }
      }

      const cancelledHold: Hold = {
        ...state.hold,
        status: 'cancelled',
        refunded: state.hold.debited,
        events: [
          ...state.hold.events,
          createEvent(now, 'CINEMA_CANCELLED_SHOW', `The cinema cancelled this show. Full refund issued.`),
        ],
      };

      return {
        ...state,
        seats: updatedSeats,
        hold: cancelledHold,
        errorMessage: 'The cinema cancelled this show. Everyone gets a full refund, including fees.',
        notifications: [
          {
            id: `notif-cinema-cancel-${now}`,
            title: 'Show Cancelled',
            body: 'The cinema cancelled this show. Everyone gets a full refund, including fees.',
            at: now,
            read: false,
          },
          ...state.notifications,
        ],
        controllerLog: [
          createEvent(now, 'CINEMA_CANCELLED', `Cinema cancelled show. Full refund issued.`),
          ...state.controllerLog,
        ],
      };
    }

    case 'CONTROLLER_SET_DEMAND_TIER': {
      const newShow = { ...state.show, tier: action.tier };
      if (!state.hold) {
        return { ...state, show: newShow };
      }
      const deadline = calculateDeadline(state.hold.createdAt, newShow.startsAt, action.tier);
      const freeReleaseUntil = calculateFreeReleaseUntil(state.hold.createdAt, deadline, action.tier);
      return {
        ...state,
        show: newShow,
        hold: {
          ...state.hold,
          deadline,
          freeReleaseUntil,
          graceUntil: calculateGraceUntil(deadline),
        },
      };
    }

    case 'CONTROLLER_TOGGLE_BANK_BLOCKING': {
      return {
        ...state,
        settings: { ...state.settings, bankSupportsBlocking: action.supported },
        hold: state.hold && state.hold.status === 'draft'
          ? { ...state.hold, paymentRail: action.supported ? 'reserve_pay' : 'pay_and_refund' }
          : state.hold,
      };
    }

    case 'CONTROLLER_TOGGLE_3H_RULE': {
      return {
        ...state,
        settings: { ...state.settings, is3HoursBeforeShow: action.isLessThan3h },
      };
    }

    case 'RESTART_DEMO': {
      return createInitialDemoState();
    }

    case 'TICK': {
      const now = action.now;
      let nextState: DemoState = {
        ...state,
        clock: { ...state.clock, now },
      };

      const hold = nextState.hold;
      if (!hold) return nextState;

      // 1. Check seat lock timeouts (5 min)
      let seatLocksChanged = false;
      const updatedSeats = { ...nextState.seats };
      for (const seatId of hold.seatIds) {
        const s = updatedSeats[seatId];
        if (s && s.state === 'locked' && s.lockedUntil && now >= s.lockedUntil) {
          updatedSeats[seatId] = { ...s, state: 'held', lockedBy: undefined, lockedUntil: undefined };
          seatLocksChanged = true;
        }
      }
      if (seatLocksChanged) {
        nextState = { ...nextState, seats: updatedSeats };
      }

      // Timers run while friends can pay (active) or kept seats wait for showtime (closed).
      if (hold.status !== 'active' && hold.status !== 'closed') {
        return nextState;
      }

      if (hold.status === 'active') {
        // 2. Halfway reminder
        const halfTime = hold.createdAt + Math.floor((hold.deadline - hold.createdAt) / 2);
        if (now >= halfTime && !hold.reminder50Fired) {
          const paid = hold.seatIds.filter((id) => ['paid_owner', 'paid_friend', 'covered'].includes(nextState.seats[id]?.state)).length;
          const notif: NotificationItem = {
            id: `notif-half-${now}`,
            title: 'Halfway there ⏳',
            body: `${paid} of ${hold.seatIds.length} in · friends pay by the deadline.`,
            at: now,
            read: false,
          };
          nextState = { ...nextState, hold: { ...nextState.hold!, reminder50Fired: true }, notifications: [notif, ...nextState.notifications] };
        }

        // 3. T−30 reminder
        const t30Time = hold.deadline - 30 * 60 * 1000;
        if (now >= t30Time && !nextState.hold!.reminderT30Fired) {
          const unpaid = hold.seatIds.filter((id) => ['held', 'locked', 'paying'].includes(nextState.seats[id]?.state)).length;
          const notif: NotificationItem = {
            id: `notif-t30-${now}`,
            title: '30 min left ⏰',
            body: `${unpaid} ${unpaid === 1 ? 'seat' : 'seats'} unpaid. They're kept at the deadline unless you release them.`,
            at: now,
            read: false,
          };
          nextState = { ...nextState, hold: { ...nextState.hold!, reminderT30Fired: true }, notifications: [notif, ...nextState.notifications] };
        }

        // 4. Deadline: unpaid seats are kept (not charged). Payments with the bank keep their 10-min grace.
        if (now >= hold.deadline) nextState = closeHoldInternal(nextState, now);
      }

      if (nextState.hold!.status === 'closed') {
        const cur = nextState.hold!;
        // 5. Grace ends: a payment still with the bank fails and its seat is kept.
        if (now >= cur.graceUntil) {
          const seats = { ...nextState.seats };
          let changed = false;
          for (const id of cur.seatIds) {
            if (seats[id]?.state === 'paying') {
              seats[id] = { ...seats[id], state: 'kept', lockedBy: undefined, lockedUntil: undefined };
              changed = true;
            }
          }
          if (changed) nextState = { ...nextState, seats };
        }
        // 6. Showtime: kept seats are charged and the rest is unblocked, once.
        if (now >= nextState.show.startsAt) nextState = settleHoldInternal(nextState, now);
      }

      return nextState;
    }

    default:
      return state;
  }
}

/** Deadline: held / locked seats become kept (Rohan's, still blocked, not charged). */
function closeHoldInternal(state: DemoState, now: number): DemoState {
  const hold = state.hold!;
  const seats = { ...state.seats };
  let kept = 0;
  for (const id of hold.seatIds) {
    const s = seats[id];
    if (s && (s.state === 'held' || s.state === 'locked')) {
      seats[id] = { ...s, state: 'kept', lockedBy: undefined, lockedUntil: undefined };
      kept++;
    }
  }
  return {
    ...state,
    seats,
    hold: { ...hold, status: 'closed', events: [...hold.events, createEvent(now, 'SEATS_KEPT', `${kept} unpaid seats kept`)] },
  };
}

/**
 * Showtime settlement (09): charge the kept seats and any fees kept on late releases from the block,
 * unblock everything else in one go, finalise the hold.
 */
function settleHoldInternal(state: DemoState, now: number): DemoState {
  const hold = state.hold!;
  const fallback = hold.paymentRail === 'pay_and_refund';
  const kept = hold.seatIds.filter((id) => state.seats[id]?.state === 'kept');
  const charge = fallback ? 0 : kept.reduce((sum, id) => sum + seatPrice(state.seats[id], state.show.fee), 0) + (hold.feesKept ?? 0);
  const settledHold: Hold = {
    ...hold,
    status: 'settled',
    debited: hold.debited + charge,
    events: [...hold.events, createEvent(now, 'HOLD_SETTLED', `Settled: ${kept.length} kept seats charged (${formatINR(charge)})`)],
  };
  const freed = unblocked(settledHold);
  const inCount = hold.seatIds.filter((id) => state.seats[id]?.state !== 'released').length;
  return {
    ...state,
    hold: settledHold,
    smsToasts: fallback ? state.smsToasts : [{ id: `sms-settled-${now}`, text: `${formatINR(freed)} unblocked by BookMyShow.`, at: now }, ...state.smsToasts],
    notifications: [
      {
        id: `notif-settled-${now}`,
        title: 'Your group is set! 🎬',
        body: `${inCount} of ${hold.seatIds.length} in. ${formatINR(freed)} unblocked.`,
        at: now,
        read: false,
      },
      ...state.notifications,
    ],
    controllerLog: [createEvent(now, 'HOLD_SETTLED', `Settled: Rohan charged ${formatINR(settledHold.debited)}, ${formatINR(freed)} unblocked`), ...state.controllerLog],
  };
}
