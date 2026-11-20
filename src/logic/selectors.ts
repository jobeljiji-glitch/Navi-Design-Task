import { formatINR, mostYouCouldStillPay, seatPrice, stillBlocked, unblockedSoFar } from './money';
import type { DemoState, NotificationItem, Seat } from './types';

export interface BoardSummary {
  mostYouCouldStillPay: string;
  stillBlocked: string;
  debited: string;
  unblockedSoFar: string;
  totalGroupAmount: string;
  paidCount: number;
  totalCount: number;
  unpaidCount: number;
}

export function selectBoardSummary(state: DemoState): BoardSummary | null {
  const hold = state.hold;
  if (!hold) return null;

  const fee = state.show.fee;
  const blockedPaise = stillBlocked(hold, state.seats, fee);
  const unblockedPaise = unblockedSoFar(hold, state.seats, fee);
  const mostPaise = mostYouCouldStillPay(hold, state.seats, fee);

  const confirmedSeats = hold.seatIds
    .map((id) => state.seats[id])
    .filter((s): s is Seat => !!s && (s.state === 'paid_owner' || s.state === 'paid_friend' || s.state === 'kept' || s.state === 'covered'));

  return {
    mostYouCouldStillPay: formatINR(mostPaise),
    stillBlocked: formatINR(blockedPaise),
    debited: formatINR(hold.debited - hold.refunded),
    unblockedSoFar: formatINR(unblockedPaise),
    totalGroupAmount: formatINR(hold.blockAmount),
    paidCount: confirmedSeats.length,
    totalCount: hold.seatIds.length,
    unpaidCount: hold.seatIds.length - confirmedSeats.length,
  };
}

export interface WhoIsInItem {
  seatId: string;
  name: string;
  state: Seat['state'];
  amountFormatted: string;
}

export function selectWhoIsIn(state: DemoState): WhoIsInItem[] {
  if (!state.hold) return [];

  const items: WhoIsInItem[] = [];
  for (const seatId of state.hold.seatIds) {
    const seat = state.seats[seatId];
    if (!seat) continue;

    if (seat.state === 'paid_owner') {
      items.push({
        seatId: seat.id,
        name: 'Rohan',
        state: seat.state,
        amountFormatted: formatINR(seatPrice(seat, state.show.fee)),
      });
    } else if (seat.state === 'paid_friend') {
      items.push({
        seatId: seat.id,
        name: seat.payerName || 'Friend',
        state: seat.state,
        amountFormatted: formatINR(seatPrice(seat, state.show.fee)),
      });
    } else if (seat.state === 'kept') {
      items.push({
        seatId: seat.id,
        name: 'Rohan (kept)',
        state: seat.state,
        amountFormatted: formatINR(seatPrice(seat, state.show.fee)),
      });
    }
  }

  return items;
}

export function selectUnpaidCount(state: DemoState): number {
  if (!state.hold) return 0;
  return state.hold.seatIds
    .map((id) => state.seats[id])
    .filter((s): s is Seat => !!s && (s.state === 'held' || s.state === 'locked' || s.state === 'paying')).length;
}

export interface LedgerLines {
  leavesAccountNow: string;
  blockedNotTaken: string;
  mostYouCouldPay: string;
  ctaText: string;
}

export function selectHoldSummaryLedger(state: DemoState): LedgerLines | null {
  if (!state.hold) return null;
  const fee = state.show.fee;
  const ownerSeat = state.seats[state.hold.ownerSeatId];
  if (!ownerSeat) return null;

  const perSeatPrice = seatPrice(ownerSeat, fee);
  const totalCount = state.hold.seatIds.length;
  const friendSeatsCount = totalCount - 1;
  const blockedAmount = friendSeatsCount * perSeatPrice;

  return {
    leavesAccountNow: formatINR(perSeatPrice),
    blockedNotTaken: formatINR(blockedAmount),
    mostYouCouldPay: formatINR(state.hold.blockAmount),
    ctaText: `Pay ${formatINR(perSeatPrice)} and block ${formatINR(blockedAmount)}`,
  };
}

export interface ReceiptSummary {
  title: string;
  totalBlockedAtStart: string;
  rohanPaidTotal: string;
  unblockedAmount: string;
  feesKept: string;
  seatBreakdown: Array<{
    seatId: string;
    payer: string;
    status: string;
    amount: string;
  }>;
}

export function selectReceipt(state: DemoState): ReceiptSummary | null {
  const hold = state.hold;
  if (!hold) return null;

  const fee = state.show.fee;
  const unblocked = unblockedSoFar(hold, state.seats, fee);
  const netPaid = hold.debited - hold.refunded;

  const breakdown = hold.seatIds.map((id) => {
    const seat = state.seats[id];
    let payer = 'Unpaid';
    let status: string = seat?.state || 'unknown';

    if (seat?.state === 'paid_owner') {
      payer = 'Rohan';
      status = 'Confirmed';
    } else if (seat?.state === 'paid_friend') {
      payer = seat.payerName || 'Friend';
      status = 'Confirmed';
    } else if (seat?.state === 'kept') {
      payer = 'Rohan (Kept)';
      status = 'Charged to Rohan';
    } else if (seat?.state === 'released') {
      payer = '—';
      status = 'Released';
    }

    return {
      seatId: id,
      payer,
      status,
      amount: formatINR(seat ? seatPrice(seat, fee) : 0),
    };
  });

  return {
    title: 'Your group is set · 5 of 6 in',
    totalBlockedAtStart: formatINR(hold.blockAmount),
    rohanPaidTotal: formatINR(netPaid),
    unblockedAmount: formatINR(unblocked),
    feesKept: '₹0.00',
    seatBreakdown: breakdown,
  };
}

export function selectNotifications(state: DemoState): NotificationItem[] {
  return state.notifications;
}

export function selectSmsToasts(state: DemoState) {
  return state.smsToasts;
}

export function selectEventLog(state: DemoState) {
  return state.controllerLog;
}
