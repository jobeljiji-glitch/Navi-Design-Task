import { describe, it, expect } from 'vitest';
import { getEdgeReleasableSeats } from '../rules';
import type { Hold, Seat } from '../types';

describe('Edge-first Seat Release Order', () => {
  it('never frees a middle seat: only outer edge seats of the block can be released', () => {
    // Group seats: D05, D06, D07, D08, D09, D10
    // D07 is Rohan (paid_owner)
    // D08 is Amit (paid_friend)
    // D09 is Sana (paid_friend)
    // D05, D06, D10 are unpaid (held)
    const seats: Record<string, Seat> = {
      D05: { id: 'D05', row: 'D', num: 5, tier: 'primePlus', price: 25000, state: 'held' },
      D06: { id: 'D06', row: 'D', num: 6, tier: 'primePlus', price: 25000, state: 'held' },
      D07: { id: 'D07', row: 'D', num: 7, tier: 'primePlus', price: 25000, state: 'paid_owner' },
      D08: { id: 'D08', row: 'D', num: 8, tier: 'primePlus', price: 25000, state: 'paid_friend' },
      D09: { id: 'D09', row: 'D', num: 9, tier: 'primePlus', price: 25000, state: 'paid_friend' },
      D10: { id: 'D10', row: 'D', num: 10, tier: 'primePlus', price: 25000, state: 'held' },
    };

    const hold: Hold = {
      id: 'h1',
      showId: 's1',
      organiser: { name: 'Rohan', upi: 'rohan@okbank' },
      seatIds: ['D05', 'D06', 'D07', 'D08', 'D09', 'D10'],
      ownerSeatId: 'D07',
      createdAt: 1000,
      deadline: 5000,
      freeReleaseUntil: 3000,
      graceUntil: 6000,
      blockExpiresAt: 7000,
      paymentRail: 'reserve_pay',
      blockAmount: 6 * 27714,
      debited: 27714,
      refunded: 0,
      status: 'active',
      assignMode: 'friends_pick',
      events: [],
    };

    const releasable = getEdgeReleasableSeats(hold, seats);
    const releasableIds = releasable.map((s) => s.id);

    // Left edge is D05, right edge is D10.
    // D06 is an interior seat (between D05 and D07) and MUST NOT be releasable!
    expect(releasableIds).toContain('D05');
    expect(releasableIds).toContain('D10');
    expect(releasableIds).not.toContain('D06');
    expect(releasableIds).not.toContain('D07');
    expect(releasableIds).not.toContain('D08');
    expect(releasableIds).not.toContain('D09');
  });

  it('exposes the next edge seat after the outer edge is released', () => {
    // Once D05 is released, D06 becomes the new left edge!
    const seats: Record<string, Seat> = {
      D05: { id: 'D05', row: 'D', num: 5, tier: 'primePlus', price: 25000, state: 'released' },
      D06: { id: 'D06', row: 'D', num: 6, tier: 'primePlus', price: 25000, state: 'held' },
      D07: { id: 'D07', row: 'D', num: 7, tier: 'primePlus', price: 25000, state: 'paid_owner' },
      D08: { id: 'D08', row: 'D', num: 8, tier: 'primePlus', price: 25000, state: 'paid_friend' },
      D09: { id: 'D09', row: 'D', num: 9, tier: 'primePlus', price: 25000, state: 'paid_friend' },
      D10: { id: 'D10', row: 'D', num: 10, tier: 'primePlus', price: 25000, state: 'held' },
    };

    const hold: Hold = {
      id: 'h1',
      showId: 's1',
      organiser: { name: 'Rohan', upi: 'rohan@okbank' },
      seatIds: ['D05', 'D06', 'D07', 'D08', 'D09', 'D10'],
      ownerSeatId: 'D07',
      createdAt: 1000,
      deadline: 5000,
      freeReleaseUntil: 3000,
      graceUntil: 6000,
      blockExpiresAt: 7000,
      paymentRail: 'reserve_pay',
      blockAmount: 6 * 27714,
      debited: 27714,
      refunded: 0,
      status: 'active',
      assignMode: 'friends_pick',
      events: [],
    };

    const releasable = getEdgeReleasableSeats(hold, seats);
    const releasableIds = releasable.map((s) => s.id);

    // Now D06 and D10 are the outer edges!
    expect(releasableIds).toEqual(['D06', 'D10']);
  });
});
