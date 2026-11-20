import type { DemoState, Seat, SeatTier, Show } from './types';

// Show: Fri, 20 Nov 2026 · 9:15 PM IST (Screen 4)
// IST is UTC+05:30. 2026-11-20 21:15 IST = 2026-11-20 15:45 UTC.
export const DEMO_SHOW_STARTS_AT = Date.UTC(2026, 10, 20, 15, 45, 0); // 1795189500000

// Simulated clock start: 1:10 PM IST (13:10 IST = 07:40 UTC)
export const DEMO_CLOCK_START_MS = Date.UTC(2026, 10, 20, 7, 40, 0); // 1795160400000

// Hold start: 1:15 PM IST (13:15 IST = 07:45 UTC)
export const DEMO_HOLD_START_MS = Date.UTC(2026, 10, 20, 7, 45, 0); // 1795160700000

export const DEMO_SHOW: Show = {
  id: 'show-monsoon-heist-01',
  filmTitle: 'Monsoon Heist',
  cinemaName: 'Cineplex: Phoenix Marketcity, Kurla',
  screen: 'Screen 4',
  startsAt: DEMO_SHOW_STARTS_AT,
  tier: 'medium',
  pctLeft: 41,
  fee: 2714, // ₹27.14 convenience fee in paise
  language: 'Hindi',
  format: '2D',
  rating: '8.4/10',
  votes: '12.6K votes',
  duration: '2h 18m',
  cancellationAvailable: true,
  distanceKm: '3.1 km',
};

// Seat layout definitions
// A (Recliner, 1-14): ₹500 (50000 paise)
// B-D (Prime Plus, 1-16): ₹250 (25000 paise)
// E-J (Prime, 1-18): ₹230 (23000 paise)
// K-L (Classic, 1-18): ₹210 (21000 paise)
const ROW_CONFIG: Array<{ row: string; tier: SeatTier; price: number; seatCount: number }> = [
  { row: 'A', tier: 'recliner', price: 50000, seatCount: 14 },
  { row: 'B', tier: 'primePlus', price: 25000, seatCount: 16 },
  { row: 'C', tier: 'primePlus', price: 25000, seatCount: 16 },
  { row: 'D', tier: 'primePlus', price: 25000, seatCount: 16 },
  { row: 'E', tier: 'prime', price: 23000, seatCount: 18 },
  { row: 'F', tier: 'prime', price: 23000, seatCount: 18 },
  { row: 'G', tier: 'prime', price: 23000, seatCount: 18 },
  { row: 'H', tier: 'prime', price: 23000, seatCount: 18 },
  { row: 'I', tier: 'prime', price: 23000, seatCount: 18 },
  { row: 'J', tier: 'prime', price: 23000, seatCount: 18 },
  { row: 'K', tier: 'classic', price: 21000, seatCount: 18 },
  { row: 'L', tier: 'classic', price: 21000, seatCount: 18 },
];

// Pre-sold seats to match real BookMyShow layout (similar to reference 06)
const SOLD_SEATS = new Set([
  'A01', 'A02', 'A13', 'A14',
  'B01', 'B02', 'B03', 'B15', 'B16',
  'C03', 'C04', 'C11', 'C12',
  'E01', 'E02', 'E08', 'E09', 'E17', 'E18',
  'F05', 'F06', 'F07',
  'G01', 'G02', 'G15', 'G16',
  'H09', 'H10',
  'K01', 'K02', 'K17', 'K18',
  'L03', 'L04', 'L15', 'L16',
]);

export function createInitialSeats(): Record<string, Seat> {
  const seats: Record<string, Seat> = {};

  for (const { row, tier, price, seatCount } of ROW_CONFIG) {
    for (let num = 1; num <= seatCount; num++) {
      const id = `${row}${num.toString().padStart(2, '0')}`;
      seats[id] = {
        id,
        row,
        num,
        tier,
        price,
        state: SOLD_SEATS.has(id) ? 'sold' : 'available',
      };
    }
  }

  return seats;
}

export function createInitialDemoState(): DemoState {
  return {
    clock: {
      now: DEMO_CLOCK_START_MS,
      isLive: false,
      speed: 1,
    },
    show: { ...DEMO_SHOW },
    seats: createInitialSeats(),
    hold: null,
    friendPayments: [],
    declines: [],
    notifications: [],
    smsToasts: [],
    controllerLog: [
      {
        id: 'evt-init',
        at: DEMO_CLOCK_START_MS,
        type: 'INIT',
        description: 'Demo started at 1:10 PM',
      },
    ],
    settings: {
      bankSupportsBlocking: true,
      userAccountsActiveHoldCount: 0,
      showHoldsPct: 0,
      is3HoursBeforeShow: false,
      userHasExistingHoldForShow: false,
    },
    selectedSeatIds: [],
    errorMessage: null,
  };
}
