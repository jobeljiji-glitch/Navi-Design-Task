export type DemandTier = 'low' | 'medium' | 'high';
export type SeatTier = 'recliner' | 'primePlus' | 'prime' | 'classic';

export type SeatState =
  | 'available'
  | 'sold'
  | 'selected'
  | 'held'
  | 'locked'
  | 'paying'
  | 'paid_owner'
  | 'paid_friend'
  | 'covered'
  | 'kept'
  | 'released';

export interface Seat {
  id: string; // e.g. "D07"
  row: string; // e.g. "D"
  num: number; // e.g. 7
  tier: SeatTier;
  price: number; // in integer paise, e.g. 25000 (₹250.00)
  state: SeatState;
  payerName?: string;
  lockedUntil?: number; // timestamp in ms
  lockedBy?: string; // name of friend locking this seat
}

export interface Show {
  id: string;
  filmTitle: string;
  cinemaName: string;
  screen: string;
  startsAt: number; // timestamp in ms
  tier: DemandTier;
  pctLeft: number; // percentage left, e.g. 41
  fee: number; // convenience fee per ticket in paise, e.g. 2714 (₹27.14)
  language: string;
  format: string;
  rating: string;
  votes: string;
  duration: string;
  cancellationAvailable: boolean;
  distanceKm: string;
}

export type PaymentRail = 'reserve_pay' | 'card_preauth' | 'pay_and_refund';
/**
 * 09: `active` (friends pay) → deadline → `closed` (unpaid seats kept, not charged; late payers until 9:00 PM)
 * → showtime → `settled` (kept seats charged, the rest unblocked once).
 */
export type HoldStatus = 'draft' | 'awaiting_upi' | 'active' | 'closed' | 'settled' | 'cancelled' | 'failed';

export interface FriendPayment {
  id: string;
  name: string;
  phone: string;
  seatIds: string[];
  status: 'locked' | 'pending' | 'success' | 'failed' | 'refunded';
  at: number;
  amountPaise: number;
}

export interface Decline {
  name: string;
  at: number;
}

export interface HoldEvent {
  id: string;
  at: number;
  description: string;
  type: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
  type?: string;
}

export interface SmsToast {
  id: string;
  text: string;
  at: number;
}

export interface Hold {
  id: string;
  showId: string;
  organiser: {
    name: string;
    upi: string;
  };
  seatIds: string[];
  ownerSeatId: string;
  createdAt: number;
  deadline: number;
  freeReleaseUntil: number | null;
  graceUntil: number;
  blockExpiresAt: number;
  paymentRail: PaymentRail;
  blockAmount: number; // in paise
  debited: number;     // in paise, actually charged: owner seat + covered; kept seats + fees kept only at showtime
  refunded: number;    // in paise: pay-all-now rail and cinema cancellation only (09)
  feesKept?: number;   // in paise: fees kept on seats released after the free window, charged at showtime
  status: HoldStatus;
  assignMode: 'friends_pick' | 'assigned';
  joinCode?: string;
  events: HoldEvent[];
  reminder50Fired?: boolean;
  reminderT30Fired?: boolean;
  lastRohanReminderAt?: number;
}

export interface DemoSettings {
  bankSupportsBlocking: boolean;
  userAccountsActiveHoldCount: number;
  showHoldsPct: number;
  is3HoursBeforeShow: boolean;
  userHasExistingHoldForShow: boolean;
  /** ₹10,000 Reserve Pay cap, in paise (09). */
  blockCapPaise?: number;
  /** Demo only: a premium-priced show (row A ₹1,250) so a 10-seat group crosses the cap (09). */
  premiumPricing?: boolean;
}

export interface SimulatedClock {
  now: number; // timestamp ms
  isLive: boolean;
  speed: number;
}

export interface DemoState {
  clock: SimulatedClock;
  show: Show;
  seats: Record<string, Seat>;
  hold: Hold | null;
  friendPayments: FriendPayment[];
  declines: Decline[];
  notifications: NotificationItem[];
  smsToasts: SmsToast[];
  controllerLog: HoldEvent[];
  settings: DemoSettings;
  selectedSeatIds: string[];
  errorMessage?: string | null;
}

export type Action =
  // Clock actions
  | { type: 'TICK'; now: number }
  | { type: 'SET_CLOCK'; now: number }
  | { type: 'ADVANCE_CLOCK'; ms: number }
  | { type: 'SET_LIVE_CLOCK'; isLive: boolean }
  // Organiser seat selection
  | { type: 'SELECT_SEAT'; seatId: string }
  | { type: 'DESELECT_SEAT'; seatId: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_HOLD_OWNER_SEAT'; seatId: string }
  | { type: 'START_HOLD_DRAFT' }
  | { type: 'SET_PAYMENT_RAIL'; rail: PaymentRail }
  | { type: 'SET_ASSIGN_MODE'; mode: 'friends_pick' | 'assigned' }
  | { type: 'SET_COVER_SEATS'; count: number }
  | { type: 'SUBMIT_UPI_PIN'; pin: string }
  | { type: 'SHORTEN_DEADLINE'; newDeadline: number }
  | { type: 'SEND_ORGANISER_REMINDER' }
  | { type: 'RELEASE_SEAT'; seatId: string }
  | { type: 'KEEP_REMAINING_SEATS' }
  | { type: 'SETTLE_HOLD' }
  // Friend actions
  | { type: 'FRIEND_LOCK_SEAT'; friendName: string; seatId: string }
  | { type: 'FRIEND_START_PAYMENT'; friendName: string; phone: string; seatId: string }
  | { type: 'FRIEND_SUBMIT_PAYMENT'; friendName: string; seatId: string }
  | { type: 'FRIEND_PAYMENT_SUCCESS'; friendName: string; seatId: string }
  | { type: 'FRIEND_PAYMENT_FAILED'; friendName: string; seatId: string }
  | { type: 'FRIEND_DECLINE'; friendName: string }
  | { type: 'FRIEND_LATE_PAY'; friendName: string; seatId: string }
  // Scenario controller events
  | { type: 'CONTROLLER_AMIT_PAYS' }
  | { type: 'CONTROLLER_SANA_PAYS' }
  | { type: 'CONTROLLER_PRIYA_PAYS_PENDING' }
  | { type: 'CONTROLLER_PRIYA_PAYS_SUCCESS' }
  | { type: 'CONTROLLER_PRIYA_PAYS_FAIL' }
  | { type: 'CONTROLLER_NEHA_DECLINES' }
  | { type: 'CONTROLLER_KABIR_PAYS_LATE' }
  | { type: 'CONTROLLER_SEAT_CONFLICT'; friend1: string; friend2: string; seatId: string }
  | { type: 'CONTROLLER_ROHAN_CANCELS_BLOCK' }
  | { type: 'CONTROLLER_ROHAN_OFFLINE' }
  | { type: 'CONTROLLER_CINEMA_CANCELS_SHOW' }
  | { type: 'CONTROLLER_SET_DEMAND_TIER'; tier: DemandTier }
  | { type: 'CONTROLLER_TOGGLE_BANK_BLOCKING'; supported: boolean }
  | { type: 'CONTROLLER_TOGGLE_3H_RULE'; isLessThan3h: boolean }
  | { type: 'RESTART_DEMO' }
  | { type: 'RESTART_FROM_STEP'; step: number };
