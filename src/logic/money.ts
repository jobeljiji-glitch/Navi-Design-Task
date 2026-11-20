import type { Hold, Seat, Show } from './types';

/**
 * Money (09 model). One glossary:
 * - Blocked   = money reserved in Rohan's account, not charged.
 * - To cover  = blocked money for seats friends haven't paid yet (open + kept seats, before showtime).
 * - Charged   = actually debited (own seat, covered seats; kept seats + fees kept only at showtime).
 * - Unblocked = money freed, once, at showtime settlement (or when the hold is cancelled).
 * - Refunded  = charged money returned: pay-all-now rail and cinema cancellation only.
 *
 * Invariant (Reserve Pay / card): blockAmount = charged + unblocked + stillBlocked.
 */

/**
 * Formats integer paise into Indian INR currency notation with 2 decimals.
 * Examples:
 *   166284  -> "₹1,662.84"
 *   27714   -> "₹277.14"
 *   0       -> "₹0.00"
 *   10000000 -> "₹1,00,000.00"
 */
export function formatINR(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainingPaise = absPaise % 100;
  const paiseStr = remainingPaise.toString().padStart(2, '0');

  const rupeesStr = rupees.toString();
  let formattedRupees = '';

  if (rupeesStr.length <= 3) {
    formattedRupees = rupeesStr;
  } else {
    const lastThree = rupeesStr.substring(rupeesStr.length - 3);
    const otherDigits = rupeesStr.substring(0, rupeesStr.length - 3);
    const withCommas = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedRupees = `${withCommas},${lastThree}`;
  }

  return `${isNegative ? '-' : ''}₹${formattedRupees}.${paiseStr}`;
}

/**
 * Returns total price for a seat including show convenience fee (in paise).
 */
export function seatPrice(seat: Seat, feePaise: number): number {
  return seat.price + feePaise;
}

/** Seats friends can still pick: 'held', 'locked' or 'paying'. */
export function unpaidSeats(hold: Hold, seats: Record<string, Seat>): Seat[] {
  return hold.seatIds
    .map((id) => seats[id])
    .filter((s): s is Seat => !!s && (s.state === 'held' || s.state === 'locked' || s.state === 'paying'));
}

/** Unpaid seats Rohan keeps after the deadline (charged at showtime unless a friend pays first). */
export function keptSeats(hold: Hold, seats: Record<string, Seat>): Seat[] {
  return hold.seatIds.map((id) => seats[id]).filter((s): s is Seat => !!s && s.state === 'kept');
}

function isFinished(hold: Hold): boolean {
  return hold.status === 'settled' || hold.status === 'cancelled';
}

/** Blocked money friends haven't paid yet: open + kept seats. 0 once the hold is settled. */
export function toCover(hold: Hold, seats: Record<string, Seat>, feePaise: number): number {
  if (isFinished(hold)) return 0;
  return [...unpaidSeats(hold, seats), ...keptSeats(hold, seats)].reduce((sum, s) => sum + seatPrice(s, feePaise), 0);
}

/** Money still blocked (not charged) in Rohan's account. 0 after settlement and on the pay-all-now rail. */
export function stillBlocked(hold: Hold): number {
  if (isFinished(hold) || hold.paymentRail === 'pay_and_refund') return 0;
  return Math.max(0, hold.blockAmount - hold.debited);
}

/** Money unblocked: nothing until settlement, then everything that wasn't charged, in one go. */
export function unblocked(hold: Hold): number {
  if (!isFinished(hold) || hold.paymentRail === 'pay_and_refund') return 0;
  return Math.max(0, hold.blockAmount - hold.debited);
}

/**
 * Release fee per released seat:
 * Medium/High tier only: if t > freeReleaseUntil, convenience fee of seat is kept.
 */
export function releaseFee(hold: Hold, show: Show, t: number): number {
  if (show.tier !== 'low' && hold.freeReleaseUntil !== null && t > hold.freeReleaseUntil) {
    return show.fee;
  }
  return 0;
}
