import type { DemandTier, Hold, Seat } from './types';

/**
 * Demand-based hold windows (10): starting values, tuned per cinema from fill rate,
 * release rate and resale of released seats.
 */
export const DEMAND_WINDOWS: Record<DemandTier, number> = {
  low: 8 * 60 * 60 * 1000,    // 8 hours
  medium: 3 * 60 * 60 * 1000, // 3 hours
  high: 90 * 60 * 1000,       // 90 minutes
};

/** "8h", "3h", "90 min": the window as shown in the demand banner. */
export function formatWindow(ms: number): string {
  const min = Math.round(ms / 60000);
  return min % 60 === 0 ? `${min / 60}h` : `${min} min`;
}

export const MIN_GROUP_SIZE = 3;
export const MAX_GROUP_SIZE = 10;
export const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
export const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
export const SEAT_LOCK_DURATION_MS = 5 * 60 * 1000; // 5 min
export const GRACE_DURATION_MS = 10 * 60 * 1000;    // 10 min
export const HIGH_TIER_MAX_HOLD_PERCENT = 15;
export const MAX_ACTIVE_HOLDS_PER_ACCOUNT = 1; // UPI Reserve Pay: one active mandate per user (09)
/** UPI Reserve Pay (SBMD) block cap: ₹10,000 in paise (09). */
export const MAX_BLOCK_PAISE = 1_000_000;
/** Late payments for kept seats close 15 min before the show (09), so nothing is pending at settlement. */
export const LATE_PAY_CUTOFF_BEFORE_SHOW_MS = 15 * 60 * 1000;

/**
 * Calculates deadline: min(createdAt + window, showStartsAt - 2h).
 */
export function calculateDeadline(createdAt: number, showStartsAt: number, tier: DemandTier): number {
  const windowMs = DEMAND_WINDOWS[tier];
  const maxAllowedDeadline = showStartsAt - TWO_HOURS_MS;
  return Math.min(createdAt + windowMs, maxAllowedDeadline);
}

/**
 * Calculates free release window cutoff:
 * Medium/High tier: until the halfway point of the demand window (min with deadline).
 * Low tier: null (free release not restricted by halfway window).
 */
export function calculateFreeReleaseUntil(createdAt: number, deadline: number, tier: DemandTier): number | null {
  if (tier === 'low') {
    return null;
  }
  const windowMs = DEMAND_WINDOWS[tier];
  const halfway = createdAt + Math.floor(windowMs / 2);
  return Math.min(halfway, deadline);
}

/**
 * Calculates grace deadline (deadline + 10 min) for pending payments.
 */
export function calculateGraceUntil(deadline: number): number {
  return deadline + GRACE_DURATION_MS;
}

/**
 * The block lasts until showtime (09): kept seats are charged and the rest is unblocked then, once.
 */
export function calculateBlockExpiresAt(showStartsAt: number): number {
  return showStartsAt;
}

/** Last moment a friend can start paying for a kept seat: showtime − 15 min (9:00 PM). */
export function latePayCutoff(showStartsAt: number): number {
  return showStartsAt - LATE_PAY_CUTOFF_BEFORE_SHOW_MS;
}

/** Most seats a group hold can block under the ₹10,000 cap (never more than the group maximum). */
export function maxSeatsForCap(perSeatPaise: number, capPaise: number = MAX_BLOCK_PAISE): number {
  return Math.min(MAX_GROUP_SIZE, Math.floor(capPaise / perSeatPaise));
}

/** True when blocking `totalPaise` would exceed the cap. */
export function isOverBlockCap(totalPaise: number, capPaise: number = MAX_BLOCK_PAISE): boolean {
  return totalPaise > capPaise;
}

/**
 * Group size must be between 3 and 10 seats inclusive.
 */
export function isGroupSizeEligible(count: number): boolean {
  return count >= MIN_GROUP_SIZE && count <= MAX_GROUP_SIZE;
}

/**
 * Group hold unavailable if show.startsAt - now < 3 hours.
 */
export function isThreeHoursBeforeShow(now: number, showStartsAt: number): boolean {
  return showStartsAt - now >= THREE_HOURS_MS;
}

/**
 * Checks if high-demand tier hold cap (15%) has been reached.
 */
export function isHighTierCapReached(tier: DemandTier, currentHoldPct: number): boolean {
  return tier === 'high' && currentHoldPct >= HIGH_TIER_MAX_HOLD_PERCENT;
}

/**
 * Checks if user account active hold limit (1 hold, 09) has been reached.
 */
export function isAccountHoldLimitReached(activeHoldsCount: number): boolean {
  return activeHoldsCount >= MAX_ACTIVE_HOLDS_PER_ACCOUNT;
}

/**
 * Determines edge-first release candidates for a group hold.
 * Invariant: Never frees a middle seat; only outer ends of the contiguous block.
 */
export function getEdgeReleasableSeats(hold: Hold, seats: Record<string, Seat>): Seat[] {
  // Collect all seats in the hold that have NOT been released yet
  const activeSeats = hold.seatIds
    .map((id) => seats[id])
    .filter((s): s is Seat => !!s && s.state !== 'released');

  if (activeSeats.length === 0) return [];

  // Group by row
  const rows: Record<string, Seat[]> = {};
  for (const seat of activeSeats) {
    if (!rows[seat.row]) rows[seat.row] = [];
    rows[seat.row].push(seat);
  }

  const releasable: Seat[] = [];

  for (const row of Object.keys(rows)) {
    const rowSeats = rows[row].sort((a, b) => a.num - b.num);
    if (rowSeats.length === 0) continue;

    const leftEdge = rowSeats[0];
    const rightEdge = rowSeats[rowSeats.length - 1];

    // Only unpaid seats ('held' or 'locked') can be released
    if (leftEdge.state === 'held' || leftEdge.state === 'locked') {
      releasable.push(leftEdge);
    }
    if (rightEdge.id !== leftEdge.id && (rightEdge.state === 'held' || rightEdge.state === 'locked')) {
      releasable.push(rightEdge);
    }
  }

  return releasable;
}
