/**
 * Group hold flow (prompt 04): steps 1b → 3.
 *
 * Wraps the base `demoReducer` (which stays untouched) with the few actions the
 * organiser UI needs that the base reducer lacks: starting a hold from a seat
 * selection, opening / declining the UPI request, and approving it with cover
 * seats and the pay-and-refund fallback taken into account.
 *
 * Pure: no React, no Date.now(), no randomness. Time comes from state.clock.
 */
import { formatINR, seatPrice, stillBlocked } from './money';
import { demoReducer } from './reducer';
import { DEMAND_WINDOWS } from './rules';
import { DEMO_HOLD_START_MS } from './seed';
import type { Action, DemandTier, DemoState, Hold, Seat } from './types';

export const GROUP_LINK = 'bms.link/g/k7Qx2';
export const HIGH_TIER_PCT_LEFT = 18;
const HOUR_MS = 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000;

export type HoldFlowAction =
  | { type: 'BEGIN_GROUP_HOLD'; seatIds: string[] }
  | { type: 'OPEN_UPI' }
  | { type: 'UPI_DECLINED' }
  | { type: 'APPROVE_HOLD'; pin: string }
  | { type: 'CLEAR_ERROR' };

export type FlowAction = Action | HoldFlowAction;

const ALREADY_HOLDING = "You're already holding seats for this show.";

function isLiveHold(hold: Hold | null): boolean {
  return !!hold && (hold.status === 'awaiting_upi' || hold.status === 'active' || hold.status === 'resolving');
}

function sortSeatIds(ids: string[], seats: Record<string, Seat>): string[] {
  return [...ids].sort((a, b) => {
    const sa = seats[a];
    const sb = seats[b];
    if (!sa || !sb) return a.localeCompare(b);
    if (sa.row !== sb.row) return sa.row.localeCompare(sb.row);
    return sa.num - sb.num;
  });
}

/** Seats Rohan covers: alternate far edge / near edge inwards, skipping the owner seat. */
export function coverOrder(seatIds: string[], ownerSeatId: string, seats: Record<string, Seat>, count: number): string[] {
  const others = sortSeatIds(seatIds, seats).filter((id) => id !== ownerSeatId);
  const out: string[] = [];
  let lo = 0;
  let hi = others.length - 1;
  for (let i = 0; i < count && lo <= hi; i++) out.push(i % 2 === 0 ? others[hi--] : others[lo++]);
  return out;
}

/** Middle seat of the block (D07 for D05–D10): the organiser's default seat. */
export function defaultOwnerSeat(seatIds: string[], seats: Record<string, Seat>): string {
  const sorted = sortSeatIds(seatIds, seats);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/** Per-seat price used for the hold (prices are locked at creation; all group seats share a tier). */
function holdSeatPrice(state: DemoState): number {
  const hold = state.hold!;
  return seatPrice(state.seats[hold.ownerSeatId], state.show.fee);
}

/** Cover count chosen in the draft, derived from `debited` (set by SET_COVER_SEATS). */
export function selectCoverCount(state: DemoState): number {
  const hold = state.hold;
  if (!hold || hold.paymentRail === 'pay_and_refund') return 0;
  if (hold.status !== 'draft' && hold.status !== 'awaiting_upi') {
    return hold.seatIds.filter((id) => state.seats[id]?.state === 'covered').length;
  }
  const per = holdSeatPrice(state);
  return Math.max(0, Math.round(hold.debited / per) - 1);
}

export function holdFlowReducer(state: DemoState, action: FlowAction): DemoState {
  switch (action.type) {
    case 'BEGIN_GROUP_HOLD': {
      if (isLiveHold(state.hold)) {
        return { ...state, errorMessage: ALREADY_HOLDING };
      }
      let s: DemoState = state;
      // Spec §1: the hold starts at 1:15 PM. Rohan browses from 1:10, so snap forward.
      if (s.clock.now < DEMO_HOLD_START_MS) {
        s = demoReducer(s, { type: 'SET_CLOCK', now: DEMO_HOLD_START_MS });
      }
      if (s.hold && (s.hold.status === 'draft' || s.hold.status === 'failed')) {
        s = { ...s, hold: null };
      }
      s = demoReducer(s, { type: 'CLEAR_SELECTION' });
      for (const id of sortSeatIds(action.seatIds, s.seats)) {
        s = demoReducer(s, { type: 'SELECT_SEAT', seatId: id });
      }
      s = demoReducer(s, { type: 'START_HOLD_DRAFT' });
      if (!s.hold || s.hold.status !== 'draft') return s;
      return demoReducer(s, { type: 'SET_HOLD_OWNER_SEAT', seatId: defaultOwnerSeat(s.hold.seatIds, s.seats) });
    }

    case 'OPEN_UPI': {
      if (!state.hold || state.hold.status !== 'draft') return state;
      return { ...state, errorMessage: null, hold: { ...state.hold, status: 'awaiting_upi' } };
    }

    case 'UPI_DECLINED': {
      const hold = state.hold;
      if (!hold || (hold.status !== 'awaiting_upi' && hold.status !== 'draft')) return state;
      const now = state.clock.now;
      const n = hold.seatIds.length;
      const message = `Block not approved. Try again or pay for all ${n}.`;
      return {
        ...state,
        errorMessage: message,
        hold: {
          ...hold,
          status: 'draft',
          events: [...hold.events, { id: `evt-${now}-upi-declined`, at: now, type: 'UPI_DECLINED', description: 'UPI block declined. Seats locked 10 more min.' }],
        },
        controllerLog: [
          { id: `log-${now}-upi-declined`, at: now, type: 'UPI_DECLINED', description: 'Rohan declined the UPI block request' },
          ...state.controllerLog,
        ],
      };
    }

    case 'APPROVE_HOLD': {
      const hold = state.hold;
      if (!hold || (hold.status !== 'awaiting_upi' && hold.status !== 'draft')) return state;
      const cover = selectCoverCount(state);
      const fallback = hold.paymentRail === 'pay_and_refund';
      let s = demoReducer(state, { type: 'SUBMIT_UPI_PIN', pin: action.pin });
      s = { ...s, errorMessage: null };

      // Covered seats: Rohan pays for them now. Edges first (far end, then near end), never the owner seat.
      if (cover > 0 && s.hold) {
        const seats = { ...s.seats };
        for (const id of coverOrder(s.hold.seatIds, s.hold.ownerSeatId, seats, cover)) {
          seats[id] = { ...seats[id], state: 'covered', payerName: 'Rohan' };
        }
        s = { ...s, seats };
      }

      if (!s.hold) return s;
      const now = s.clock.now;
      if (fallback) {
        s = { ...s, hold: { ...s.hold, debited: s.hold.blockAmount } };
      }
      // Bank SMS (spec §4 step 3), with Indian digit grouping.
      const per = holdSeatPrice(s);
      const smsText = fallback
        ? `${formatINR(s.hold!.blockAmount)} debited by BookMyShow.`
        : `${formatINR(s.hold!.blockAmount)} blocked for BookMyShow. ${formatINR(per * (1 + cover))} debited.`;
      return { ...s, smsToasts: [{ id: `sms-${now}`, text: smsText, at: now }, ...s.smsToasts.slice(1)] };
    }

    case 'CLEAR_ERROR':
      return state.errorMessage ? { ...state, errorMessage: null } : state;

    default:
      return demoReducer(state, action);
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers (IST, pure)
// ---------------------------------------------------------------------------

/** "7:15 PM" in IST. */
export function formatClockIST(ms: number): string {
  const d = new Date(ms + IST_OFFSET_MS);
  const h24 = d.getUTCHours();
  const m = d.getUTCMinutes();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

function istDay(ms: number): number {
  return Math.floor((ms + IST_OFFSET_MS) / (24 * HOUR_MS));
}

/** "today" / "tomorrow" relative to now, in IST. */
export function relativeDayIST(ms: number, now: number): string {
  const diff = istDay(ms) - istDay(now);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return '';
}

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/** "D05–D10" for a contiguous block, else a comma list. */
export function formatSeatRange(seatIds: string[], seats: Record<string, Seat>): string {
  const sorted = sortSeatIds(seatIds, seats);
  if (sorted.length === 0) return '';
  if (sorted.length === 1) return sorted[0];
  return isContiguousBlock(sorted, seats) ? `${sorted[0]}–${sorted[sorted.length - 1]}` : sorted.join(', ');
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** True when all seats are in one row with consecutive numbers. */
export function isContiguousBlock(seatIds: string[], seats: Record<string, Seat>): boolean {
  if (seatIds.length <= 1) return true;
  const list = seatIds.map((id) => seats[id]).filter((s): s is Seat => !!s);
  if (list.length !== seatIds.length) return false;
  if (new Set(list.map((s) => s.row)).size !== 1) return false;
  const nums = list.map((s) => s.num).sort((a, b) => a - b);
  return nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
}

export interface DemandBannerInfo {
  tier: DemandTier;
  pctLeft?: number;
  holdHours: number;
}

export function selectDemandBanner(state: DemoState): DemandBannerInfo {
  const tier = state.show.tier;
  const holdHours = DEMAND_WINDOWS[tier] / HOUR_MS;
  if (tier === 'low') return { tier, holdHours };
  return { tier, holdHours, pctLeft: tier === 'high' ? HIGH_TIER_PCT_LEFT : state.show.pctLeft };
}

export interface SelectionTotals {
  count: number;
  total: string;
  totalPaise: number;
  canHold: boolean;
  contiguous: boolean;
}

export function selectSelectionTotals(state: DemoState, seatIds: string[]): SelectionTotals {
  const totalPaise = seatIds.reduce((sum, id) => {
    const seat = state.seats[id];
    return seat ? sum + seatPrice(seat, state.show.fee) : sum;
  }, 0);
  return {
    count: seatIds.length,
    total: formatINR(totalPaise),
    totalPaise,
    canHold: seatIds.length >= 3 && seatIds.length <= 10,
    contiguous: isContiguousBlock(seatIds, state.seats),
  };
}

export interface HoldSheetView {
  title: string;
  subtitle: string;
  seatIds: string[];
  ownerSeatId: string;
  perSeat: string;
  friendsCount: number;
  friendsLabel: string;
  coverCount: number;
  maxCover: number;
  ownNow: string;
  friendsValue: string;
  leavesNow: string;
  blockedNotTaken: string;
  mostYouCouldPay: string;
  helper: string;
  deadlineTime: string;
  deadlineDay: string;
  windowLabel: string;
  freeReleaseUntil: string | null;
  blockEnds: string;
  assignMode: 'friends_pick' | 'assigned';
  rail: Hold['paymentRail'];
  fallback: boolean;
  fallbackLine: string;
  cta: string;
  upiAmount: string;
  status: Hold['status'];
  // 04c picture → money rows → how it works → settings
  tiles: SeatTileView[];
  moneyRows: MoneyRow[];
  moneyTotalLabel: string;
  moneyTotal: string;
  moneyCaption: string;
  howDeadline: string;
  howKeep: string;
  howRelease: string;
  ctaTitle: string;
  ctaSub: string | null;
  // 04d booking-flow patterns
  columns: Array<{ key: string; label: string; price: string; status: string; tone: 'green' | 'grey' }>;
  columnsCaption: string;
  rulesTitle: string;
  rulesBody: string;
  settingsLine1: string;
  settingsLine2: string;
  seatsModeLabel: string;
  coverLabel: string;
  railLabel: string;
  caption: string;
}

export interface SeatTileView {
  id: string;
  kind: 'owner' | 'paid' | 'covered' | 'held' | 'paying' | 'kept' | 'released';
  caption: string;
}

export interface MoneyRow {
  key: string;
  label: string;
  value: string;
  sub?: string;
}

/** ₹250 for whole rupees, ₹27.14 otherwise (short form for fee breakdown sub-lines). */
export function formatINRShort(paise: number): string {
  const full = formatINR(paise);
  return full.endsWith('.00') ? full.slice(0, -3) : full;
}

export function selectHoldSheet(state: DemoState): HoldSheetView | null {
  const hold = state.hold;
  if (!hold) return null;
  const per = holdSeatPrice(state);
  const n = hold.seatIds.length;
  const friends = n - 1;
  const cover = selectCoverCount(state);
  const fallback = hold.paymentRail === 'pay_and_refund';
  const nowPaise = per * (1 + cover);
  const blockedPaise = per * (friends - cover);
  const now = state.clock.now;
  const show = state.show;
  const startsAt = formatClockIST(show.startsAt);

  const holdCount = friends - cover;
  const sorted = sortSeatIds(hold.seatIds, state.seats);
  const coveredPreview = new Set(coverOrder(hold.seatIds, hold.ownerSeatId, state.seats, cover));
  const tiles: SeatTileView[] = sorted.map((id) => {
    if (id === hold.ownerSeatId) return { id, kind: 'owner', caption: 'You' };
    if (coveredPreview.has(id)) return { id, kind: 'covered', caption: 'Covered' };
    return { id, kind: 'held', caption: '' };
  });
  const deadlineTime = formatClockIST(hold.deadline);
  const freeTime = hold.freeReleaseUntil !== null && show.tier !== 'low' ? formatClockIST(hold.freeReleaseUntil) : null;
  const deadlineDay = relativeDayIST(hold.deadline, now);
  const deadlineFull = `${deadlineTime}${deadlineDay ? ` ${deadlineDay}` : ''}`;
  const ownerSeat = state.seats[hold.ownerSeatId];
  const feeLine = ownerSeat ? `${formatINRShort(ownerSeat.price)} ticket + ${formatINRShort(show.fee)} convenience fee` : undefined;
  const moneyRows: MoneyRow[] = [{ key: 'own', label: `Your seat (${hold.ownerSeatId})`, value: formatINR(per), sub: feeLine }];
  if (cover > 0 && !fallback) {
    moneyRows.push({ key: 'cover', label: `${cover} ${cover === 1 ? 'seat' : 'seats'} you cover`, value: formatINR(per * cover), sub: 'Charged now' });
  }
  if (fallback) {
    moneyRows.push({ key: 'friends', label: `${friends} friends' seats`, value: formatINR(per * friends), sub: 'Paid now, refunded as friends pay' });
  } else if (holdCount > 0) {
    moneyRows.push({ key: 'friends', label: `${holdCount} friends' seats`, value: formatINR(blockedPaise), sub: 'Blocked, not charged' });
  }
  const isCard = hold.paymentRail === 'card_preauth';
  const ctaTitle = fallback
    ? `Pay ${formatINR(hold.blockAmount)}`
    : blockedPaise === 0
      ? `Pay ${formatINR(nowPaise)}`
      : isCard
        ? `Hold ${formatINR(hold.blockAmount)} on your card`
        : `Block ${formatINR(hold.blockAmount)} on UPI`;
  const ctaSub =
    fallback || blockedPaise === 0
      ? null
      : cover === 0
        ? `${formatINR(per)} charged now for your seat`
        : `${formatINR(nowPaise)} charged now for ${1 + cover} seats`;

  return {
    title: `Hold ${n} seats for your group`,
    subtitle: `${show.filmTitle} · Fri, ${startsAt} · ${formatSeatRange(hold.seatIds, state.seats)}`,
    seatIds: sortSeatIds(hold.seatIds, state.seats),
    ownerSeatId: hold.ownerSeatId,
    perSeat: formatINR(per),
    friendsCount: friends,
    friendsLabel: `${friends} friends' seats`,
    coverCount: cover,
    maxCover: friends,
    ownNow: `${formatINR(per)} now`,
    friendsValue:
      cover === 0
        ? `${formatINR(blockedPaise)} blocked`
        : blockedPaise === 0
          ? `${formatINR(per * cover)} now`
          : `${formatINR(per * cover)} now · ${formatINR(blockedPaise)} blocked`,
    leavesNow: formatINR(nowPaise),
    blockedNotTaken: formatINR(blockedPaise),
    mostYouCouldPay: formatINR(hold.blockAmount),
    helper: `Each time a friend pays, ${formatINR(per)} is unblocked. This money stays in your account — it's only set aside.`,
    deadlineTime: formatClockIST(hold.deadline),
    deadlineDay: relativeDayIST(hold.deadline, now),
    windowLabel: formatDuration(hold.deadline - hold.createdAt),
    freeReleaseUntil: hold.freeReleaseUntil !== null && show.tier !== 'low' ? formatClockIST(hold.freeReleaseUntil) : null,
    blockEnds: `${relativeDayIST(hold.blockExpiresAt, now) === 'today' ? 'Today' : 'Tomorrow'}, ${formatClockIST(hold.blockExpiresAt)}`,
    assignMode: hold.assignMode,
    rail: hold.paymentRail,
    fallback,
    fallbackLine: `Pay ${formatINR(hold.blockAmount)} now · get ${formatINR(per)} back each time a friend pays`,
    cta: ctaSub ? `${ctaTitle} · ${ctaSub}` : ctaTitle,
    // The UPI block is always the full amount (incl. what's debited now) so CTA, money total and UPI screen agree
    upiAmount: formatINR(hold.blockAmount),
    status: hold.status,
    tiles,
    moneyRows,
    moneyTotalLabel: fallback ? 'Paid now' : isCard ? 'Held on your card' : 'Blocked on UPI',
    moneyTotal: formatINR(hold.blockAmount),
    moneyCaption: fallback ? `${formatINR(per)} comes back each time a friend pays.` : 'Unblocked seat by seat as friends pay.',
    howDeadline: `Friends pay by ${deadlineFull}`,
    howKeep: fallback
      ? `Unpaid seats stay yours, already paid for. Release any before ${deadlineTime} to get that money back.`
      : `Unpaid seats stay yours and are charged from the block. Release any before ${deadlineTime}.`,
    howRelease: freeTime
      ? `Release free until ${freeTime}. After that, the ${formatINR(show.fee)} fee per seat is kept.`
      : `Release free anytime before ${deadlineTime}.`,
    ctaTitle,
    ctaSub,
    columns: fallback
      ? [
          { key: 'now', label: 'Paid now', price: formatINR(hold.blockAmount), status: `All ${n} seats`, tone: 'green' },
          { key: 'aside', label: 'Refunded', price: formatINR(per * friends), status: 'as each friend pays', tone: 'grey' },
        ]
      : [
          {
            key: 'now',
            label: 'Paid now',
            price: formatINR(nowPaise),
            status: cover === 0 ? `Your seat · ${hold.ownerSeatId}` : `${hold.ownerSeatId} + ${cover} covered`,
            tone: 'green',
          },
          {
            key: 'aside',
            label: 'Set aside',
            price: formatINR(blockedPaise),
            status: holdCount === 0 ? 'No friends left to pay' : `${holdCount} ${holdCount === 1 ? 'friend' : 'friends'} · not charged`,
            tone: 'grey',
          },
        ],
    columnsCaption: fallback ? 'Refunded seat by seat as friends pay' : 'Unblocked seat by seat as friends pay',
    rulesTitle: `Friends pay by ${deadlineFull}`,
    rulesBody: freeTime
      ? `Unpaid seats stay yours. Release free until ${freeTime}, then the ${formatINR(show.fee)} fee per seat is kept.`
      : `Unpaid seats stay yours. Release free anytime before ${deadlineTime}.`,
    settingsLine1: [
      hold.assignMode === 'friends_pick' ? 'Friends pick their own seat' : 'You assign the seats',
      ...(fallback ? [] : [cover === 0 ? 'No seats covered' : `${cover} ${cover === 1 ? 'seat' : 'seats'} covered`]),
    ].join(' · '),
    settingsLine2: isCard
      ? 'Paying with your card ending 4021'
      : fallback
        ? `Paying for all seats with UPI · ${hold.organiser.upi}`
        : `Paying with UPI · ${hold.organiser.upi}`,
    seatsModeLabel: hold.assignMode === 'friends_pick' ? 'Friends pick their own' : 'You assign them',
    coverLabel: cover === 0 ? 'None' : `${cover} ${cover === 1 ? 'seat' : 'seats'}`,
    railLabel: hold.paymentRail === 'card_preauth' ? 'Card' : fallback ? 'UPI · pay all now' : `UPI ${hold.organiser.upi}`,
    caption: fallback
      ? 'One UPI PIN · Refunds come back to this account'
      : isCard
        ? 'One card OTP · Unused money is unblocked automatically'
        : 'One UPI PIN · Unused money is unblocked automatically',
  };
}

export interface HoldSuccessView {
  title: string;
  ticketLine: string;
  paid: string;
  blockedLabel: string;
  blocked: string;
  payBy: string;
  fallback: boolean;
  shareMessage: string;
  link: string;
  // 04b
  statusLine: string;
  filmLine: string;
  dateLine: string;
  cinemaLine: string;
  tiles: SeatTileView[];
  paidCount: number;
  totalCount: number;
  paidLine: string;
  setAsideLabel: string;
  setAsideCaption: string;
  // 04d Confirm-booking price card + split + band
  ticketsLabel: string;
  ticketsPrice: string;
  feesPrice: string;
  orderTotal: string;
  splitPaidLabel: string;
  splitWaitingLabel: string;
  splitWaitingSub: string;
  rulesBand: string;
  // 04c money card
  paidLabel: string;
  paidSub: string;
  setAsideSub: string;
  mostLabel: string;
  most: string;
  moneyNote: string;
  ownerSeatId: string;
  ticketSeat: string;
  ticketAmount: string;
  ticketBanner: string;
}

export function selectHoldSuccess(state: DemoState): HoldSuccessView | null {
  const hold = state.hold;
  if (!hold) return null;
  const n = hold.seatIds.length;
  const per = holdSeatPrice(state);
  const blockedPaise = stillBlocked(hold, state.seats, state.show.fee);
  const unpaid = hold.seatIds.filter((id) => state.seats[id]?.state === 'held').length;
  const deadline = formatClockIST(hold.deadline);
  const day = relativeDayIST(hold.deadline, state.clock.now);
  const fallback = hold.paymentRail === 'pay_and_refund';
  const now = state.clock.now;
  const left = hold.deadline - now;
  const tiles: SeatTileView[] = sortSeatIds(hold.seatIds, state.seats).map((id) => {
    const seat = state.seats[id];
    switch (seat?.state) {
      case 'paid_owner': return { id, kind: 'owner', caption: 'You ✓' };
      case 'paid_friend': return { id, kind: 'paid', caption: seat.payerName ?? 'Paid' };
      case 'covered': return { id, kind: 'covered', caption: 'Covered' };
      case 'paying':
      case 'locked': return { id, kind: 'paying', caption: seat.lockedBy ?? 'Paying' };
      case 'kept': return { id, kind: 'kept', caption: 'Kept' };
      case 'released': return { id, kind: 'released', caption: 'Released' };
      default: return { id, kind: 'held', caption: 'Waiting' };
    }
  });
  const paidCount = tiles.filter((t) => t.kind === 'owner' || t.kind === 'paid' || t.kind === 'covered').length;
  const ownerSeat = state.seats[hold.ownerSeatId];
  const coveredCount = tiles.filter((t) => t.kind === 'covered').length;
  const freeTime =
    hold.freeReleaseUntil !== null && state.show.tier !== 'low' && now < hold.freeReleaseUntil ? formatClockIST(hold.freeReleaseUntil) : null;
  const tierCode = ownerSeat?.tier === 'primePlus' ? 'PP' : ownerSeat?.tier === 'recliner' ? 'RC' : ownerSeat?.tier === 'classic' ? 'CL' : 'PR';
  return {
    title: `${n} seats held for your group`,
    ticketLine: `Your ticket ${hold.ownerSeatId} is confirmed`,
    paid: formatINR(hold.debited),
    blockedLabel: fallback ? `Back to you as ${unpaid} friends pay` : `Blocked for ${unpaid} friends`,
    blocked: formatINR(fallback ? per * unpaid : blockedPaise),
    payBy: `${deadline}${day ? ` ${day}` : ''}`,
    fallback,
    shareMessage:
      `Held ${n} seats for ${state.show.filmTitle}, Fri, ${formatClockIST(state.show.startsAt)}. Pick your seat and pay your share:\n` +
      `Pay by ${deadline}${day ? ` ${day}` : ''} · ${GROUP_LINK}`,
    link: GROUP_LINK,
    statusLine: left > 0 ? `Friends pay by ${deadline} · ${formatDuration(left)} left` : `Friends paid by ${deadline}`,
    filmLine: `${state.show.filmTitle} · ${state.show.language}, ${state.show.format}`,
    dateLine: `Fri, 20 Nov · ${formatClockIST(state.show.startsAt)}`,
    cinemaLine: `${state.show.cinemaName} · ${state.show.screen}`,
    tiles,
    paidCount,
    totalCount: n,
    paidLine: `${paidCount} of ${n} paid`,
    setAsideLabel: fallback ? `Back to you as ${unpaid} friends pay` : `Set aside for ${unpaid} ${unpaid === 1 ? 'friend' : 'friends'}`,
    setAsideCaption: fallback ? `${formatINR(per)} comes back each time a friend pays` : 'Unblocks as friends pay',
    ticketsLabel: `Ticket(s) price · ${n} tickets`,
    ticketsPrice: formatINR(hold.seatIds.reduce((sum, id) => sum + (state.seats[id]?.price ?? 0), 0)),
    feesPrice: formatINR(state.show.fee * n),
    orderTotal: formatINR(hold.blockAmount),
    splitPaidLabel: coveredCount > 0 ? `Paid by you · ${hold.ownerSeatId} + ${coveredCount} covered` : `Paid by you · ${hold.ownerSeatId}`,
    splitWaitingLabel: `Waiting on ${unpaid} ${unpaid === 1 ? 'friend' : 'friends'}`,
    splitWaitingSub: fallback ? 'Paid by you now, refunded as each friend pays' : 'Set aside in your account, unblocks as each friend pays',
    rulesBand: freeTime
      ? `Unpaid seats stay yours at ${deadline} · Release free until ${freeTime}`
      : state.show.tier === 'low'
        ? `Unpaid seats stay yours at ${deadline} · Release free anytime before then`
        : `Unpaid seats stay yours at ${deadline} · Releasing now keeps the ${formatINR(state.show.fee)} fee per seat`,
    paidLabel: coveredCount > 0 ? `You paid for ${1 + coveredCount} seats` : `Your ticket (${hold.ownerSeatId})`,
    paidSub:
      coveredCount > 0
        ? `Your seat ${hold.ownerSeatId} + ${coveredCount} covered`
        : ownerSeat
          ? `${formatINRShort(ownerSeat.price)} + ${formatINRShort(state.show.fee)} fee`
          : '',
    setAsideSub: fallback ? 'Paid now, refunded as friends pay' : 'Blocked, not charged',
    mostLabel: 'Blocked on UPI',
    most: formatINR(hold.debited + (fallback ? 0 : blockedPaise)),
    moneyNote: freeTime
      ? `Unpaid seats stay yours at ${deadline}. Release free until ${freeTime}.`
      : state.show.tier === 'low'
        ? `Unpaid seats stay yours at ${deadline}. Release free anytime before then.`
        : `Unpaid seats stay yours at ${deadline}. Releasing now keeps the ${formatINR(state.show.fee)} fee per seat.`,
    ownerSeatId: hold.ownerSeatId,
    ticketSeat: `${tierCode}-${hold.ownerSeatId}`,
    ticketAmount: formatINR(per),
    ticketBanner: `Your seat in the group · ${paidCount} of ${n} paid`,
  };
}

/** Shorten options: 1, 2 or 3 hours earlier, never before now. */
export function selectShortenOptions(state: DemoState): Array<{ label: string; deadline: number }> {
  const hold = state.hold;
  if (!hold) return [];
  const now = state.clock.now;
  return [1, 2, 3]
    .map((h) => hold.deadline - h * HOUR_MS)
    .filter((t) => t > now + HOUR_MS / 2)
    .map((t) => ({ label: `${formatClockIST(t)} ${relativeDayIST(t, now)}`.trim(), deadline: t }));
}

/**
 * Seat states to paint on the organiser's seat map once a hold exists:
 * the hold's seats take their live store state (held, paid_owner, …).
 */
export function selectHoldSeatStates(state: DemoState): Record<string, Seat['state']> {
  const hold = state.hold;
  if (!hold || hold.status === 'draft' || hold.status === 'awaiting_upi' || hold.status === 'failed') return {};
  const out: Record<string, Seat['state']> = {};
  for (const id of hold.seatIds) {
    const seat = state.seats[id];
    if (seat) out[id] = seat.state;
  }
  return out;
}
