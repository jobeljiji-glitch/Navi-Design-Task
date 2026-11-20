import { describe, it, expect } from 'vitest';
import { formatINR, seatPrice, stillBlocked, unblockedSoFar } from '../money';
import type { Hold, Seat } from '../types';

describe('Money and formatINR', () => {
  it('formats amounts in Indian numbering system with 2 decimals', () => {
    expect(formatINR(0)).toBe('₹0.00');
    expect(formatINR(27714)).toBe('₹277.14');
    expect(formatINR(55428)).toBe('₹554.28');
    expect(formatINR(110856)).toBe('₹1,108.56');
    expect(formatINR(138570)).toBe('₹1,385.70');
    expect(formatINR(166284)).toBe('₹1,662.84');
    expect(formatINR(10000000)).toBe('₹1,00,000.00');
    expect(formatINR(123456789)).toBe('₹12,34,567.89');
  });

  it('handles negative values correctly', () => {
    expect(formatINR(-27714)).toBe('-₹277.14');
  });

  it('calculates seatPrice with fee in paise', () => {
    const seat: Seat = {
      id: 'D07',
      row: 'D',
      num: 7,
      tier: 'primePlus',
      price: 25000,
      state: 'available',
    };
    expect(seatPrice(seat, 2714)).toBe(27714);
  });

  it('calculates stillBlocked and unblockedSoFar correctly', () => {
    const seats: Record<string, Seat> = {
      D05: { id: 'D05', row: 'D', num: 5, tier: 'primePlus', price: 25000, state: 'held' },
      D06: { id: 'D06', row: 'D', num: 6, tier: 'primePlus', price: 25000, state: 'held' },
      D07: { id: 'D07', row: 'D', num: 7, tier: 'primePlus', price: 25000, state: 'paid_owner' },
      D08: { id: 'D08', row: 'D', num: 8, tier: 'primePlus', price: 25000, state: 'paid_friend' },
    };

    const hold: Hold = {
      id: 'h1',
      showId: 's1',
      organiser: { name: 'Rohan', upi: 'rohan@okbank' },
      seatIds: ['D05', 'D06', 'D07', 'D08'],
      ownerSeatId: 'D07',
      createdAt: 1000,
      deadline: 5000,
      freeReleaseUntil: 3000,
      graceUntil: 6000,
      blockExpiresAt: 7000,
      paymentRail: 'reserve_pay',
      blockAmount: 4 * 27714, // 110856
      debited: 27714, // D07 paid
      refunded: 0,
      status: 'active',
      assignMode: 'friends_pick',
      events: [],
    };

    // D05 and D06 are held (2 seats = 55428 paise still blocked)
    expect(stillBlocked(hold, seats, 2714)).toBe(55428);
    // Unblocked so far = 110856 - 27714 - 55428 = 27714 (for D08 which was paid by friend)
    expect(unblockedSoFar(hold, seats, 2714)).toBe(27714);
  });
});
