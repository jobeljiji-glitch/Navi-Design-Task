import { describe, it, expect } from 'vitest';
import {
  calculateBlockExpiresAt,
  calculateDeadline,
  calculateFreeReleaseUntil,
  calculateGraceUntil,
  DEMAND_WINDOWS,
  formatWindow,
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
  const createdAt = new Date('2026-11-20T16:15:00+05:30').getTime();    // 4:15 PM (5h before show)
  const ist = (hm: string) => new Date(`2026-11-20T${hm}:00+05:30`).getTime();

  describe('Deadline Formula (10: windows 8h / 3h / 90 min)', () => {
    it('windows are 8h low, 3h medium, 90 min high', () => {
      expect(DEMAND_WINDOWS.low).toBe(8 * 60 * 60 * 1000);
      expect(DEMAND_WINDOWS.medium).toBe(3 * 60 * 60 * 1000);
      expect(DEMAND_WINDOWS.high).toBe(90 * 60 * 1000);
      expect([formatWindow(DEMAND_WINDOWS.low), formatWindow(DEMAND_WINDOWS.medium), formatWindow(DEMAND_WINDOWS.high)]).toEqual(['8h', '3h', '90 min']);
    });

    it('medium: 4:15 PM + 3h = 7:15 PM, which is also showtime − 2h', () => {
      expect(calculateDeadline(createdAt, showStartsAt, 'medium')).toBe(ist('19:15'));
    });

    it('medium uncapped: 10:00 AM + 3h = 1:00 PM', () => {
      expect(calculateDeadline(ist('10:00'), showStartsAt, 'medium')).toBe(ist('13:00'));
    });

    it('low: 4:15 PM + 8h would pass midnight, capped at showtime − 2h (7:15 PM)', () => {
      expect(calculateDeadline(createdAt, showStartsAt, 'low')).toBe(ist('19:15'));
    });

    it('low uncapped: 9:00 AM + 8h = 5:00 PM', () => {
      expect(calculateDeadline(ist('09:00'), showStartsAt, 'low')).toBe(ist('17:00'));
    });

    it('high: 4:15 PM + 90 min = 5:45 PM', () => {
      expect(calculateDeadline(createdAt, showStartsAt, 'high')).toBe(ist('17:45'));
    });

    it('high capped: 6:00 PM + 90 min = 7:30 PM, capped at 7:15 PM', () => {
      expect(calculateDeadline(ist('18:00'), showStartsAt, 'high')).toBe(ist('19:15'));
    });

    it('free release: halfway of the window for medium/high, any time for low', () => {
      const medium = calculateDeadline(createdAt, showStartsAt, 'medium');
      expect(calculateFreeReleaseUntil(createdAt, medium, 'medium')).toBe(ist('17:45'));
      const high = calculateDeadline(createdAt, showStartsAt, 'high');
      expect(calculateFreeReleaseUntil(createdAt, high, 'high')).toBe(ist('17:00'));
      expect(calculateFreeReleaseUntil(createdAt, medium, 'low')).toBeNull();
    });

    it('free release never runs past a capped deadline', () => {
      // 5:00 PM + 3h → capped at 7:15 PM; halfway (6:30 PM) is before it
      const created = ist('17:00');
      const deadline = calculateDeadline(created, showStartsAt, 'medium');
      expect(deadline).toBe(ist('19:15'));
      expect(calculateFreeReleaseUntil(created, deadline, 'medium')).toBe(ist('18:30'));
      // A deadline earlier than halfway wins
      expect(calculateFreeReleaseUntil(created, ist('18:00'), 'medium')).toBe(ist('18:00'));
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

    it('not offered in the last 3 hours: 6:15 PM is the last moment for a 9:15 PM show', () => {
      expect(isThreeHoursBeforeShow(ist('18:15'), showStartsAt)).toBe(true);
      expect(isThreeHoursBeforeShow(ist('18:16'), showStartsAt)).toBe(false);
      expect(isThreeHoursBeforeShow(createdAt, showStartsAt)).toBe(true);
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
