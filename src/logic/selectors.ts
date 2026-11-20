import { formatINR, stillBlocked, toCover, unblocked } from './money';
import type { DemoState, NotificationItem, Seat } from './types';

/**
 * Base selectors over the plain DemoState (the app uses the richer boardFlow selectors).
 * 09 glossary: blocked / to cover / charged / unblocked (see money.ts).
 */
export interface BoardSummary {
  toCover: string;
  stillBlocked: string;
  charged: string;
  unblocked: string;
  totalGroupAmount: string;
  paidCount: number;
  totalCount: number;
  unpaidCount: number;
}

const PAID = new Set<Seat['state']>(['paid_owner', 'paid_friend', 'covered']);

export function selectBoardSummary(state: DemoState): BoardSummary | null {
  const hold = state.hold;
  if (!hold) return null;
  const fee = state.show.fee;
  const paid = hold.seatIds.filter((id) => PAID.has(state.seats[id]?.state)).length;
  const released = hold.seatIds.filter((id) => state.seats[id]?.state === 'released').length;
  return {
    toCover: formatINR(toCover(hold, state.seats, fee)),
    stillBlocked: formatINR(stillBlocked(hold)),
    charged: formatINR(hold.debited - hold.refunded),
    unblocked: formatINR(unblocked(hold)),
    totalGroupAmount: formatINR(hold.blockAmount),
    paidCount: paid,
    totalCount: hold.seatIds.length,
    unpaidCount: hold.seatIds.length - paid - released,
  };
}

export interface ReceiptSummary {
  blocked: string;
  charged: string;
  unblocked: string;
  final: boolean;
}

/** Final only after showtime settlement (09). */
export function selectReceipt(state: DemoState): ReceiptSummary | null {
  const hold = state.hold;
  if (!hold) return null;
  return {
    blocked: formatINR(hold.blockAmount),
    charged: formatINR(hold.debited - hold.refunded),
    unblocked: formatINR(unblocked(hold)),
    final: hold.status === 'settled',
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
