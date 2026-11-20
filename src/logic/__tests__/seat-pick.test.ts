import { describe, it, expect } from 'vitest'
import { pickSeats } from '../seatPick'
import { createInitialSeats } from '../seed'
import type { Seat, SeatTier } from '../types'

function makeMockRow(
  row: string,
  count: number,
  tier: SeatTier = 'primePlus',
  soldNums: number[] = [],
  numGaps: Record<number, number> = {} // maps index to custom num to simulate aisle gap
): Record<string, Seat> {
  const seats: Record<string, Seat> = {}
  let currentNum = 1
  for (let i = 1; i <= count; i++) {
    if (numGaps[i]) {
      currentNum = numGaps[i]
    }
    const id = `${row}${currentNum.toString().padStart(2, '0')}`
    seats[id] = {
      id,
      row,
      num: currentNum,
      tier,
      price: 25000,
      state: soldNums.includes(currentNum) ? 'sold' : 'available',
    }
    currentNum++
  }
  return seats
}

describe('pickSeats', () => {
  it('1. picks 5 seats in an open row starting from tapped seat', () => {
    const layout = makeMockRow('D', 16)
    const result = pickSeats(layout, [], 'D02', 5)
    expect(result).toEqual(['D02', 'D03', 'D04', 'D05', 'D06'])
    expect(result.message).toBeUndefined()
  })

  it('2. handles a free block of 3 next to a sold seat, then a second tap adds the rest', () => {
    // Seats 1, 2, 3 available; Seat 4 sold; Seats 5..10 available
    const layout = makeMockRow('D', 10, 'primePlus', [4])
    // Tapping D01 with 5 tickets
    const firstTap = pickSeats(layout, [], 'D01', 5)
    expect(firstTap).toEqual(['D01', 'D02', 'D03'])
    expect(firstTap.message).toBe('Select 2 more seats')

    // Second tap on D05 picks remaining 2 seats (D05, D06)
    const secondTap = pickSeats(layout, firstTap, 'D05', 5)
    expect(secondTap).toEqual(['D01', 'D02', 'D03', 'D05', 'D06'])
    expect(secondTap.message).toBeUndefined()
  })

  it('3. extends left when tapping near the right edge of a row', () => {
    // 10 seats in row; tapping seat 09 with ticket count 4
    const layout = makeMockRow('D', 10)
    // Tapping D09: only D09, D10 to the right (2 seats) -> extends left to D08, D07
    const result = pickSeats(layout, [], 'D09', 4)
    expect(result).toEqual(['D07', 'D08', 'D09', 'D10'])
    expect(result.message).toBeUndefined()
  })

  it('4. stops at a tier boundary', () => {
    // Row D: seats 1-5 prime, seats 6-10 primePlus
    const layout: Record<string, Seat> = {}
    for (let i = 1; i <= 10; i++) {
      const id = `D${i.toString().padStart(2, '0')}`
      layout[id] = {
        id,
        row: 'D',
        num: i,
        tier: i <= 5 ? 'prime' : 'primePlus',
        price: i <= 5 ? 23000 : 25000,
        state: 'available',
      }
    }

    // Tapping D04 with 4 tickets (tier prime): right side only has D04, D05 (D06 is primePlus)
    // Extends left to D03, D02
    const result = pickSeats(layout, [], 'D04', 4)
    expect(result).toEqual(['D02', 'D03', 'D04', 'D05'])
    expect(result.message).toBeUndefined()
  })

  it('5. resets selection when tapping again after selection is already full', () => {
    const layout = makeMockRow('D', 16)
    const initialFull = ['D01', 'D02', 'D03']
    // Tapping D08 resets and selects D08, D09, D10
    const result = pickSeats(layout, initialFull, 'D08', 3)
    expect(result).toEqual(['D08', 'D09', 'D10'])
  })

  it('6. demo default: with 6 tickets, tapping D05 selects D05–D10 on real seed layout', () => {
    const seedLayout = createInitialSeats()
    const result = pickSeats(seedLayout, [], 'D05', 6)
    expect(result).toEqual(['D05', 'D06', 'D07', 'D08', 'D09', 'D10'])
    expect(result.message).toBeUndefined()
  })

  it('7. deselects just the tapped seat when selection is incomplete', () => {
    const layout = makeMockRow('D', 10)
    const incomplete = ['D01', 'D02', 'D03']
    // Tapping D02 deselects D02
    const result = pickSeats(layout, incomplete, 'D02', 5)
    expect(result).toEqual(['D01', 'D03'])
    expect(result.message).toBe('Select 3 more seats')
  })

  it('8. stops at an aisle gap', () => {
    // Seat 1, 2, 3, then aisle gap to seat 7, 8, 9
    const layout = makeMockRow('D', 6, 'primePlus', [], { 4: 7 })
    const result = pickSeats(layout, [], 'D02', 4)
    // D02, D03 to right (aisle gap before 7) -> extends left to D01 -> total 3 seats (still short 1)
    expect(result).toEqual(['D01', 'D02', 'D03'])
    expect(result.message).toBe('Select 1 more seat')
  })

  it('9. ignores tapping a sold seat', () => {
    const layout = makeMockRow('D', 10, 'primePlus', [3])
    const result = pickSeats(layout, ['D01'], 'D03', 3)
    expect(result).toEqual(['D01'])
  })
})
