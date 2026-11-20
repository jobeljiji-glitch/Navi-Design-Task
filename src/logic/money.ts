import type { Hold, Seat, Show } from './types';

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

/**
 * Unpaid seats in a hold: seats in 'held', 'locked', or 'paying' states.
 */
export function unpaidSeats(hold: Hold, seats: Record<string, Seat>): Seat[] {
  return hold.seatIds
    .map((id) => seats[id])
    .filter((s): s is Seat => !!s && (s.state === 'held' || s.state === 'locked' || s.state === 'paying'));
}

/**
 * Amount of money still covered by the initial bank block (in paise).
 */
export function stillBlocked(hold: Hold, seats: Record<string, Seat>, feePaise: number): number {
  const unpaid = unpaidSeats(hold, seats);
  return unpaid.reduce((sum, s) => sum + seatPrice(s, feePaise), 0);
}

/**
 * Headline on status board: future charges only (in paise).
 */
export function mostYouCouldStillPay(hold: Hold, seats: Record<string, Seat>, feePaise: number): number {
  return stillBlocked(hold, seats, feePaise);
}

/**
 * Amount unblocked so far from the initial block (in paise).
 * Derived formula: blockAmount - debited - stillBlocked
 */
export function unblockedSoFar(hold: Hold, seats: Record<string, Seat>, feePaise: number): number {
  const blocked = stillBlocked(hold, seats, feePaise);
  return Math.max(0, hold.blockAmount - hold.debited - blocked);
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
