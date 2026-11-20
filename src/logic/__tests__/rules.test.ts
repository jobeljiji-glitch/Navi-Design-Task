import { describe, it, expect } from 'vitest';
import {
  calculateBlockExpiresAt,
  calculateDeadline,
  calculateFreeReleaseUntil,
  calculateGraceUntil,
  isAccountHoldLimitReached,
  isOverBlockCap,
  latePayCutoff,
  maxSeatsForCap,
  isGroupSizeEligible,
  isHighTierCapReached,
  isThreeHoursBeforeShow,
} from '../rules';

describe('Domain Rules', () => {
  const showStartsAt = new Date('2026-11-20T21:15:00+05:30').getTime(); // 9:15 PM
  const createdAt = new Date('2026-11-20T13:15:00+05:30').getTime();    // 1:15 PM (8h before show)

  describe('Deadline Formula', () => {
    it('calculates medium demand tier deadline (6h window, capped at showStartsAt - 2h)', () => {
      // 1:15 PM + 6h = 7:15 PM (19:15)
      // showStartsAt - 2h = 9:15 PM - 2h = 7:15 PM (19:15)
      const deadline = calculateDeadline(createdAt, showStartsAt, 'medium');
      expect(deadline).toBe(new Date('2026-11-20T19:15:00+05:30').getTime());
    });

    it('calculates low demand tier deadline capped at showStartsAt - 2h', () => {
      // 1:15 PM + 24h = next day 1:15 PM
      // but showStartsAt - 2h is 7:15 PM today, so it caps at 7:15 PM
      const deadline = calculateDeadline(createdAt, showStartsAt, 'low');
      expect(deadline).toBe(new Date('2026-11-20T19:15:00+05:30').getTime());
    });

    it('calculates high demand tier deadline (2h window)', () => {
      // 1:15 PM + 2h = 3:15 PM
      const deadline = calculateDeadline(createdAt, showStartsAt, 'high');
      expect(deadline).toBe(new Date('2026-11-20T15:15:00+05:30').getTime());
    });

    it('calculates free-release cutoff as halfway point of demand window for medium/high', () => {
      // Medium: 6h window -> halfway is +3h = 4:15 PM
      const deadline = calculateDeadline(createdAt, showStartsAt, 'medium');
      const freeReleaseUntil = calculateFreeReleaseUntil(createdAt, deadline, 'medium');
      expect(freeReleaseUntil).toBe(new Date('2026-11-20T16:15:00+05:30').getTime());

      // Low: returns null (free release not restricted to halfway point)
      const lowFree = calculateFreeReleaseUntil(createdAt, deadline, 'low');
      expect(lowFree).toBeNull();
    });

    it('grace = deadline + 10 min; the block ends at showtime; late payments close 15 min before', () => {
      const deadline = calculateDeadline(createdAt, showStartsAt, 'medium');
      expect(calculateGraceUntil(deadline)).toBe(deadline + 10 * 60 * 1000);
      expect(calculateBlockExpiresAt(showStartsAt)).toBe(showStartsAt);
      expect(latePayCutoff(showStartsAt)).toBe(new Date('2026-11-20T21:00:00+05:30').getTime());
    });
  });

  describe('Eligibility Checks', () => {
    it('enforces group size between 3 and 10 seats', () => {
      expect(isGroupSizeEligible(2)).toBe(false);
      expect(isGroupSizeEligible(3)).toBe(true);
      expect(isGroupSizeEligible(6)).toBe(true);
      expect(isGroupSizeEligible(10)).toBe(true);
      expect(isGroupSizeEligible(11)).toBe(false);
    });

    it('enforces 3-hour cutoff rule', () => {
      const moreThan3h = showStartsAt - 3.5 * 60 * 60 * 1000;
      const exactly3h = showStartsAt - 3 * 60 * 60 * 1000;
      const lessThan3h = showStartsAt - 2.5 * 60 * 60 * 1000;

      expect(isThreeHoursBeforeShow(moreThan3h, showStartsAt)).toBe(true);
      expect(isThreeHoursBeforeShow(exactly3h, showStartsAt)).toBe(true);
      expect(isThreeHoursBeforeShow(lessThan3h, showStartsAt)).toBe(false);
    });

    it('enforces high-tier cap at 15%', () => {
      expect(isHighTierCapReached('high', 14)).toBe(false);
      expect(isHighTierCapReached('high', 15)).toBe(true);
      expect(isHighTierCapReached('high', 20)).toBe(true);
      expect(isHighTierCapReached('medium', 20)).toBe(false);
    });

    it('enforces 1 active group hold per account (one Reserve Pay mandate per user)', () => {
      expect(isAccountHoldLimitReached(0)).toBe(false);
      expect(isAccountHoldLimitReached(1)).toBe(true);
    });

    it('caps the block at ₹10,000 and sizes the group by amount', () => {
      expect(isOverBlockCap(166284)).toBe(false);
      expect(isOverBlockCap(1_000_000)).toBe(false);
      expect(isOverBlockCap(1_000_001)).toBe(true);
      expect(maxSeatsForCap(127714)).toBe(7); // ₹1,250 + ₹27.14 premium recliner
      expect(maxSeatsForCap(27714)).toBe(10); // never above the group maximum
    });
  });
});
