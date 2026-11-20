import type { DemandTier, Hold, Seat } from './types';

export const DEMAND_WINDOWS: Record<DemandTier, number> = {
  low: 24 * 60 * 60 * 1000,   // 24 hours
  medium: 6 * 60 * 60 * 1000,  // 6 hours
  high: 2 * 60 * 60 * 1000,   // 2 hours
};

export const MIN_GROUP_SIZE = 3;
export const MAX_GROUP_SIZE = 10;
export const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
export const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
export const SEAT_LOCK_DURATION_MS = 5 * 60 * 1000; // 5 min
export const GRACE_DURATION_MS = 10 * 60 * 1000;    // 10 min
export const BLOCK_EXPIRY_AFTER_DEADLINE_MS = 30 * 60 * 1000; // 30 min
export const HIGH_TIER_MAX_HOLD_PERCENT = 15;
export const MAX_ACTIVE_HOLDS_PER_ACCOUNT = 2;

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
 * Calculates block expiry timestamp (deadline + 30 min).
 */
export function calculateBlockExpiresAt(deadline: number): number {
  return deadline + BLOCK_EXPIRY_AFTER_DEADLINE_MS;
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
 * Checks if user account active hold limit (2 holds) has been reached.
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
