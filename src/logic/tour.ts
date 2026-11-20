/**
 * 07 guided tour: 14 steps that drive the real reducer through the spec §1 script (script.ts).
 * Pure data + functions: the stage (src/demo) renders the bubbles and performs `phases` on Next.
 *
 * Each step:
 * - starts with the phone at `startPath(i)` (the previous step's `after`, or the movie page),
 * - points at the first visible `[data-tour~=anchor]` in `anchors` (priority order),
 * - `phases` are what Next does (the same taps the user could make); live, the stage waits
 *   `phaseDelayMs` between them so the UI can react (e.g. the settlement animation),
 * - `done` auto-advances when the user made the highlighted tap themselves.
 */
import { selectMoney, withBoard, type BoardState } from './boardFlow';
import { createInitialDemoState } from './seed';
import { formatINR } from './money';
import type { FriendName } from './friendFlow';
import {
  applyStep,
  approveHold,
  at,
  beginHold,
  friendCompletesPay,
  friendOpensLink,
  kabirOpens,
  kabirPays,
  openUpi,
  shareToGroup,
} from './script';

export type Persona = 'Rohan' | FriendName;
export const PERSONAS: Persona[] = ['Rohan', 'Amit', 'Sana', 'Neha', 'Priya', 'Kabir'];

export function personaPath(p: Persona): string {
  return p === 'Rohan' ? '/rohan' : `/friend/${p.toLowerCase()}`;
}
export function personaOf(path: string): Persona {
  const m = /^\/friend\/([a-z]+)/i.exec(path);
  if (!m) return 'Rohan';
  const n = m[1].toLowerCase();
  return (PERSONAS.find((p) => p.toLowerCase() === n) ?? 'Rohan') as Persona;
}

type Phase = (s: BoardState) => BoardState;

export interface TourStep {
  id: string;
  /** Short name for the story list. */
  label: string;
  persona: Persona;
  /** `data-tour` ids, highest priority first: the first one visible on the phone is highlighted. */
  anchors: string[];
  text: string;
  /** One line on why it matters. */
  why: string;
  /** Next button label (defaults to "Next"). Time skips say "⏩ Skip to 4:15 PM". */
  nextLabel?: string;
  phases: Phase[];
  phaseDelayMs?: number;
  /** Where the phone is after Next (and where a jump to the following step lands). */
  after: string;
  /** Live Next goes here first instead, and the UI moves on by itself (e.g. the settlement animation). */
  liveAfter?: string;
  /** Where the phone goes when this step starts on a different persona's phone. */
  path?: string;
  /** The user did the highlighted tap themselves. */
  done?: (s: BoardState, path: string) => boolean;
  /** Persona transition card shown when this step starts. */
  interstitial?: string;
  /** Rohan's banners that arrived while he was away should show when this step starts. */
  replayBanners?: boolean;
}

const paid = (s: BoardState, seat: string) => s.seats[seat]?.state === 'paid_friend';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'book',
    label: "Pick the 9:15 PM show",
    persona: 'Rohan',
    anchors: ['pill-915', 'book-tickets'],
    text: "Rohan's planning Friday's movie with five friends. Not everyone has confirmed. He picks the 9:15 PM show.",
    why: "Today he'd pay ₹1,662.84 up front, then chase five friends.",
    phases: [],
    after: '/rohan/seats',
    done: (_s, path) => path.startsWith('/rohan/seats'),
  },
  {
    id: 'hold-for-group',
    label: "Hold for group",
    persona: 'Rohan',
    anchors: ['hold-for-group', 'seat-count-select', 'seat-row-D', 'seat-map'],
    text: 'Tap one seat and the whole group sits together. Then tap Hold for group — friends pay their own share.',
    why: "Seats lock now. Nobody has to say yes before they're ready.",
    phases: [beginHold],
    after: '/rohan/hold',
    done: (s) => !!s.hold,
  },
  {
    id: 'money',
    label: "Only his seat is charged",
    persona: 'Rohan',
    anchors: ['money-ledger'],
    text: 'Only his seat is charged now. The rest is blocked in his account, not charged.',
    why: 'Nothing is charged for a seat a friend ends up paying for.',
    phases: [openUpi],
    after: '/rohan/upi-opening',
    done: (s) => !!s.hold && s.hold.status !== 'draft',
  },
  {
    id: 'pin',
    label: "One UPI PIN",
    persona: 'Rohan',
    anchors: ['approve-with-pin'],
    text: 'This is his bank app. One PIN: ₹1,662.84 blocked, ₹277.14 charged now.',
    why: 'One approval covers the whole group. The block ends at showtime.',
    phases: [approveHold],
    after: '/rohan/held',
    done: (s) => s.hold?.status === 'active',
  },
  {
    id: 'share',
    label: "Share to the group",
    persona: 'Rohan',
    anchors: ['chat-send', 'send-to-group'],
    text: 'One link in the group chat replaces the poll.',
    why: 'From here on BookMyShow asks for the money, not Rohan.',
    phases: [shareToGroup],
    after: '/rohan/chat',
    done: (s) => !!s.friendFlow.share?.sent,
  },
  {
    id: 'amit-link',
    label: "Amit opens the link",
    persona: 'Amit',
    anchors: ['link-preview'],
    text: "Now you're Amit. Tap Rohan's link.",
    why: 'It opens in the browser or the app. No signup needed.',
    phases: [(s) => friendOpensLink(at(s, 14, 2), 'Amit')],
    path: '/friend/amit',
    after: '/friend/amit',
    done: (s) => s.friendFlow.sessions.Amit.screen !== 'chat',
    interstitial: "Meanwhile, on Amit's phone… 📱",
  },
  {
    id: 'amit-pay',
    label: "Amit picks a seat and pays",
    persona: 'Amit',
    anchors: ['friend-pay-cta'],
    text: 'Picking a seat and paying is one step. No signup.',
    why: "Seeing who's in already makes 'yes' easier.",
    phases: [(s) => friendCompletesPay(s, 'Amit')],
    after: '/friend/amit',
    done: (s) => Object.values(s.seats).some((x) => x.payerName === 'Amit' && paid(s, x.id)),
  },
  {
    id: 'less-to-cover',
    label: "₹277.14 less to cover",
    persona: 'Rohan',
    anchors: ['block-meter'],
    text: "Amit has his own ticket. On Rohan's phone, ₹277.14 less to cover.",
    why: 'Rohan sees each friend pay without asking anyone.',
    nextLabel: '⏩ Skip to 3:30 PM',
    phases: [(s) => applyStep(applyStep(s, 'sana'), 'neha')],
    path: '/rohan/board',
    after: '/rohan/board',
    interstitial: "Back on Rohan's phone… 📱",
    replayBanners: true,
  },
  {
    id: 'neha',
    label: "Neha can't make it",
    persona: 'Rohan',
    anchors: ['release-sheet', 'cant-make-it-row'],
    text: "Neha can't make it. Rohan releases an end seat, free before 4:15 PM.",
    why: 'Sana paid at 3:10 PM too. The block shrinks as plans change.',
    nextLabel: 'Release D05',
    phases: [(s) => applyStep(s, 'release')],
    after: '/rohan/board',
    done: (s) => s.seats.D05?.state === 'released',
  },
  {
    id: 'released',
    label: "A seat goes back on sale",
    persona: 'Rohan',
    anchors: ['set-aside', 'pay-by'],
    text: 'D05 is back on sale. ₹277.14 less to cover. Free release ends at 4:15 PM.',
    why: 'Rohan only ever carries seats that are still open.',
    nextLabel: '⏩ Skip to 4:15 PM',
    phases: [(s) => applyStep(s, 'halfway')],
    after: '/rohan/board',
  },
  {
    id: 'halfway',
    label: "4:15 PM: the nudge",
    persona: 'Rohan',
    anchors: ['pay-by', 'set-aside'],
    text: "Halfway. BookMyShow nudges whoever hasn't paid, so Rohan doesn't chase anyone.",
    why: 'Reminders come from BookMyShow, not from a friend.',
    nextLabel: '⏩ Skip to 6:45 PM',
    phases: [(s) => applyStep(s, 't30')],
    after: '/rohan/board?sheet=t30',
  },
  {
    id: 't30',
    label: "6:45 PM: 30 minutes left",
    persona: 'Rohan',
    anchors: ['t30-sheet'],
    text: '30 minutes left. Do nothing and unpaid seats are kept, charged at 9:15 PM.',
    why: 'The default keeps the group together. Every held seat ends up paid.',
    nextLabel: '⏩ Skip to 7:15 PM',
    phases: [
      (s) => applyStep(applyStep(s, 'priyaPending'), 'deadline'),
      (s) => applyStep(applyStep(s, 'priyaPaid'), 'grace'),
    ],
    phaseDelayMs: 1400,
    after: '/rohan/board',
  },
  {
    id: 'kept',
    label: "7:15 PM: seats kept",
    persona: 'Rohan',
    anchors: ['kept-row', 'board-headline'],
    text: "7:15 PM. Kabir didn't answer, so D06 is kept. Nothing is charged yet.",
    why: "Priya's payment was still with the bank. It got 10 more minutes.",
    nextLabel: '⏩ Skip to 8:10 PM',
    phases: [kabirOpens],
    after: '/friend/kabir',
  },
  {
    id: 'kabir',
    label: "8:10 PM: Kabir pays late",
    persona: 'Kabir',
    anchors: ['late-pay-cta', 'late-title'],
    text: 'Kabir pays before 9:00 PM. The ticket moves to him. D06 is never charged to Rohan.',
    why: 'At 9:15 PM kept seats are charged. The rest is unblocked once.',
    nextLabel: 'Pay and skip to 9:15 PM',
    phases: [kabirPays, (s) => applyStep(s, 'showtime')],
    after: '/rohan/receipt',
    path: '/friend/kabir',
    done: (s) => s.board.lateSeats.includes('D06'),
    interstitial: "Meanwhile, on Kabir's phone… 📱",
  },
];

export const TOUR_LENGTH = TOUR_STEPS.length;

/** Copy after the last step (the done card; numbers come from `selectTourPayoff`). */
export const TOUR_DONE = {
  line: 'Every held seat ended up paid.',
  explore: 'Explore freely',
  restart: 'Restart demo',
};

export const INTRO = {
  problem: "Rohan wants 6 seats for Friday. He shouldn't have to pay for everyone.",
  start: 'Start guided demo',
  explore: 'Explore freely',
};

export function freshState(): BoardState {
  return withBoard(createInitialDemoState());
}

/** Where the phone is when step `i` (0-based) starts. */
export function startPath(i: number): string {
  if (i <= 0) return '/rohan/movie';
  return TOUR_STEPS[i]?.path ?? TOUR_STEPS[i - 1].after;
}

export function applyPhases(s: BoardState, step: TourStep): BoardState {
  return step.phases.reduce((acc, p) => p(acc), s);
}

/** State at the start of step `i` (0-based); `i = TOUR_LENGTH` is the end of the tour. */
export function tourStateAt(i: number): BoardState {
  let s = freshState();
  for (let k = 0; k < Math.min(i, TOUR_LENGTH); k++) s = applyPhases(s, TOUR_STEPS[k]);
  return s;
}

/** The done card's three stat rows, derived from state. */
export interface TourPayoffRow {
  text: string;
  /** 12 pt grey explanation under the row */
  sub?: string;
}
export interface TourPayoff {
  rows: TourPayoffRow[];
  line: string;
}
export function selectTourPayoff(s: BoardState): TourPayoff | null {
  const m = selectMoney(s);
  if (!m || !s.hold) return null;
  const chased = s.hold.events.filter((e) => e.type === 'REMINDER_SENT').length;
  const empty = s.hold.seatIds.filter((id) => {
    const st = s.seats[id]?.state;
    return st !== 'paid_owner' && st !== 'paid_friend' && st !== 'covered' && st !== 'kept' && st !== 'released';
  }).length;
  // What Rohan paid in the end (09: kept seats a friend took are never charged).
  const ownOnly = m.netPaid === m.perSeat;
  const paidRow: TourPayoffRow = {
    text: ownOnly
      ? `Rohan paid ${formatINR(m.netPaid)} — just his own seat`
      : `Rohan paid ${formatINR(m.netPaid)} — not ${formatINR(m.blockAmount)}`,
  };
  const late = s.board.lateSeats[0];
  const lateName = late ? s.seats[late]?.payerName : undefined;
  if (lateName) {
    paidRow.sub = `${lateName} paid late, so his seat was never charged to Rohan.`;
  }
  return {
    rows: [paidRow, { text: `Friends chased: ${chased}` }, { text: `Seats left empty: ${empty}` }],
    line: TOUR_DONE.line,
  };
}

/** Explore mode: "Jump to moment". Each is a script step + where the phone goes. */
export const MOMENTS = [
  { id: 'board', label: 'Group board', step: 'amit', path: '/rohan/board' },
  { id: 'release', label: 'Release a seat', step: 'neha', path: '/rohan/board?sheet=release' },
  { id: 't30', label: 'T−30 decision', step: 't30', path: '/rohan/board?sheet=t30' },
  { id: 'kept', label: '7:15 PM: seats kept', step: 'grace', path: '/rohan/board' },
  { id: 'late', label: 'Late payer', step: 'grace', path: '/friend/kabir', late: true },
  { id: 'settlement', label: 'Showtime settlement', step: 'kabirLate', path: '/rohan/board', settle: true },
  { id: 'receipt', label: 'Final receipt', step: 'showtime', path: '/rohan/receipt' },
] as const;
export type MomentId = (typeof MOMENTS)[number]['id'];

/** Explore mode clock skips (forward only). */
export const CLOCK_SKIPS: Array<{ label: string; h: number; m: number }> = [
  { label: '4:15 PM', h: 16, m: 15 },
  { label: '6:45 PM', h: 18, m: 45 },
  { label: '7:15 PM', h: 19, m: 15 },
  { label: '7:25 PM', h: 19, m: 25 },
  { label: '8:10 PM', h: 20, m: 10 },
  { label: '9:00 PM', h: 21, m: 0 },
  { label: '9:15 PM', h: 21, m: 15 },
];
