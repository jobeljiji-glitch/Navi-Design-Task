import { describe, it, expect } from 'vitest';
import {
  calculateBlockExpiresAt,
  calculateDeadline,
  calculateFreeReleaseUntil,
  calculateGraceUntil,
  isAccountHoldLimitReached,
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

    it('calculates grace window (deadline + 10 min) and block expiry (deadline + 30 min)', () => {
      const deadline = calculateDeadline(createdAt, showStartsAt, 'medium');
      expect(calculateGraceUntil(deadline)).toBe(deadline + 10 * 60 * 1000);
      expect(calculateBlockExpiresAt(deadline)).toBe(deadline + 30 * 60 * 1000);
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

    it('enforces max active holds per account', () => {
      expect(isAccountHoldLimitReached(0)).toBe(false);
      expect(isAccountHoldLimitReached(1)).toBe(false);
      expect(isAccountHoldLimitReached(2)).toBe(true);
    });
  });
});
