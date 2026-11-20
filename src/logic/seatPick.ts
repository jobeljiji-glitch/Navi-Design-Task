import type { Seat } from './types'

export type PickSeatsResult = string[] & {
  message?: string
  selected?: string[]
}

function createResult(seatIds: string[], remaining: number): PickSeatsResult {
  const arr = [...seatIds] as PickSeatsResult
  const message =
    remaining > 0 ? `Select ${remaining} more seat${remaining > 1 ? 's' : ''}` : undefined

  Object.defineProperty(arr, 'message', {
    value: message,
    enumerable: false,
    writable: true,
    configurable: true,
  })

  Object.defineProperty(arr, 'selected', {
    get() {
      return this
    },
    enumerable: false,
    configurable: true,
  })

  return arr
}

/**
 * Pure function to pick seats in groups for BookMyShow.
 *
 * Rules:
 * - Tapping when nothing is selected, or when selection is full: clear and select tapped seat
 *   plus contiguous available seats to its right in the same row and tier, up to ticketCount.
 *   Stops at a sold seat, an aisle gap, or a tier boundary.
 * - If not enough room to the right: extends left from the tapped seat under the same rules.
 * - If still short: keep what fits selected, attach toast message "Select {remaining} more seat(s)",
 *   and allow subsequent taps to fill remaining seats.
 * - Tapping a seat that is already selected while selection is incomplete: deselects that single seat.
 */
export function pickSeats(
  layout: Record<string, Seat> | Seat[],
  selected: string[],
  tappedSeat: string | Seat,
  ticketCount: number
): PickSeatsResult {
  // Normalize layout map
  const seatsMap: Record<string, Seat> = Array.isArray(layout)
    ? Object.fromEntries(layout.map(s => [s.id, s]))
    : layout

  const tappedId = typeof tappedSeat === 'string' ? tappedSeat : tappedSeat.id
  const targetSeat = seatsMap[tappedId]

  if (!targetSeat || targetSeat.state === 'sold') {
    const remaining = ticketCount - selected.length
    return createResult(selected, remaining)
  }

  // Case 1: Tapping an already selected seat while selection is incomplete -> deselect just that seat
  if (selected.length < ticketCount && selected.includes(tappedId)) {
    const updated = selected.filter(id => id !== tappedId)
    const remaining = ticketCount - updated.length
    return createResult(updated, remaining)
  }

  // Determine base selection: reset if empty or full
  let currentSelection: string[] = []
  if (selected.length > 0 && selected.length < ticketCount) {
    currentSelection = [...selected]
  }

  const needed = ticketCount - currentSelection.length
  if (needed <= 0) {
    // Already full but tapping a new seat -> reset and pick full ticketCount from tapped seat
    currentSelection = []
  }

  const seatsToPickCount = ticketCount - currentSelection.length

  // Find all seats in the same row sorted by num
  const rowSeats = Object.values(seatsMap)
    .filter(s => s.row === targetSeat.row)
    .sort((a, b) => a.num - b.num)

  const tappedIdx = rowSeats.findIndex(s => s.id === tappedId)
  if (tappedIdx === -1) {
    return createResult(currentSelection, ticketCount - currentSelection.length)
  }

  // 1. Gather rightwards from tapped seat
  const rightCandidates: Seat[] = [targetSeat]
  for (let i = tappedIdx + 1; i < rowSeats.length; i++) {
    if (rightCandidates.length >= seatsToPickCount) break
    const prev = rowSeats[i - 1]
    const curr = rowSeats[i]
    // Aisle gap check
    if (curr.num !== prev.num + 1) break
    // Tier boundary check
    if (curr.tier !== targetSeat.tier) break
    // Availability check
    if (curr.state !== 'available' || currentSelection.includes(curr.id)) break

    rightCandidates.push(curr)
  }

  const candidateBlock: Seat[] = [...rightCandidates]

  // 2. If not enough room to the right, extend leftwards from tapped seat
  if (candidateBlock.length < seatsToPickCount) {
    for (let i = tappedIdx - 1; i >= 0; i--) {
      if (candidateBlock.length >= seatsToPickCount) break
      const nextInRow = rowSeats[i + 1]
      const curr = rowSeats[i]
      // Aisle gap check
      if (curr.num !== nextInRow.num - 1) break
      // Tier boundary check
      if (curr.tier !== targetSeat.tier) break
      // Availability check
      if (curr.state !== 'available' || currentSelection.includes(curr.id)) break

      candidateBlock.unshift(curr)
    }
  }

  // Merge newly picked seats into currentSelection
  const newSelectedSet = new Set(currentSelection)
  for (const s of candidateBlock) {
    newSelectedSet.add(s.id)
  }

  // Sort overall selected seats by row then num for consistent order
  const finalSeatIds = Array.from(newSelectedSet).sort((a, b) => {
    const seatA = seatsMap[a]
    const seatB = seatsMap[b]
    if (!seatA || !seatB) return a.localeCompare(b)
    if (seatA.row !== seatB.row) return seatA.row.localeCompare(seatB.row)
    return seatA.num - seatB.num
  })

  const remaining = ticketCount - finalSeatIds.length
  return createResult(finalSeatIds, remaining)
}
