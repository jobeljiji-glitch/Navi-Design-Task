import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { FRIENDS, hasPaid, selectFriendCheckout, selectFriendPage, selectFriendTicket, selectRemindMe, type FriendName } from '../friendFlow';
import {
  selectBoard,
  selectFriendReminder,
  selectFriendSetLine,
  selectGroupReceipt,
  selectLatePage,
  selectOrderCard,
  selectReleaseSheet,
  selectT30Sheet,
  selectTransferNote,
  withBoard,
} from '../boardFlow';
import { selectHoldSheet, selectHoldSuccess } from '../holdFlow';
import { selectCutoffCheckout, failureFlowReducer, type FailureState } from '../failureFlow';
import { SCRIPT_STEPS, applyStep, at, beginHold, friendOpensLink, friendOpensOnly, type Reduce } from '../script';
import { TOUR_STEPS } from '../tour';
import { createInitialDemoState } from '../seed';

/**
 * 08/09 copy lint: the words the user ruled out (memory + D-033, D-080, D-095, 09 glossary) never appear in UI strings,
 * and 600/700 weights appear only in the logged exceptions (D-057, D-058, D-066).
 */

const SRC = join(__dirname, '..', '..');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === '__tests__' ? [] : files(p);
    return /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}

const stripComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

/** String literals and JSX text: what a user can read. */
function uiStrings(code: string): string[] {
  const c = stripComments(code);
  const out: string[] = [];
  for (const m of c.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) out.push(m[2].replace(/\$\{[^}]*\}/g, '…'));
  for (const m of c.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)) out.push(m[1]);
  return out;
}

const UI_FILES = files(SRC).filter((f) => !f.includes(`${join('src', 'dev')}`));

const BANNED: Array<[RegExp, string]> = [
  [/\bIPO\b|\bASBA\b/i, 'IPO/ASBA wording (D-033, D-095)'],
  [/went back/i, '"went back" for set-aside money'],
  [/\b(?:unblock\w*|set aside|blocked)\b[^.]{0,40}\breturned\b|\breturned\b[^.]{0,40}\b(?:unblock\w*|set aside|blocked)\b/i, '"returned" for set-aside money'],
  [/most you could (?:still )?pay|most you(?:'|’)ll pay/i, 'worst-case framing (D-080)'],
  // 09 glossary: "blocked" replaces "set aside" (money reserved, not charged)
  [/\bset(?:s|ting)? aside\b/i, '"set aside" (09 glossary: say "blocked")'],
  // 09: money is unblocked once, at showtime settlement (or cancellation) — never seat by seat
  [/^(?![\s\S]*(?:showtime|settl|\bat\b|by BookMyShow|Unblocking|\bnow\b|\bin\. |cancel))(?!\W*…?\W*unblocked\W*$)[\s\S]*\bunblock(?:s|ed)?\b/i, '"unblocked" outside a settlement context (09)'],
  [/unblocked seat by seat|unblocks as|as (?:each )?friends? pay[^.]{0,20}unblock/i, 'seat-by-seat unblocking (09)'],
  // "kept" means Rohan pays for an unpaid seat; never for a lock or a timer (08, user)
  [/\bkept\b[^.]{0,30}\b(?:min|mins|minutes|until|lock\w*|more)\b|\b(?:lock\w*|holding)\b[^.]{0,30}\bkept\b/i, '"kept" next to a lock/timer'],
];

describe('08 copy lint', () => {
  for (const [re, why] of BANNED) {
    it(`no ${why}`, () => {
      const hits = UI_FILES.flatMap((f) =>
        uiStrings(readFileSync(f, 'utf8'))
          .filter((s) => re.test(s))
          .map((s) => `${relative(SRC, f)}: ${s.slice(0, 80)}`),
      );
      expect(hits).toEqual([]);
    });
  }

  it('600/700 weights only in the logged exceptions', () => {
    // Status bar (system), chat app (D-066), poster art + Club wordmark + ref-21 line (D-058)
    const ALLOW = ['demo/DeviceFrame.tsx', 'ds/ChatThread.tsx', 'ds/LinkPreviewCard.tsx', 'screens/chat/ChatScreen.tsx', 'ds/PosterArt.tsx', 'ds/ScreenShape.tsx', 'screens/rohan/MovieDetailScreen.tsx', 'screens/rohan/SeatLayoutScreen.tsx'];
    const hits = UI_FILES.filter((f) => !ALLOW.some((a) => relative(SRC, f).replace(/\\/g, '/') === a)).flatMap((f) =>
      stripComments(readFileSync(f, 'utf8'))
        .split('\n')
        .filter((l) => /font-(?:semibold|bold|extrabold|black)\b|fontWeight:\s*['"]?(?:[6-9]00|bold)/.test(l))
        .map((l) => `${relative(SRC, f)}: ${l.trim().slice(0, 80)}`),
    );
    expect(hits).toEqual([]);
  });
});

describe('08 friend-facing screens never name unpaid friends', () => {
  const r = failureFlowReducer as unknown as Reduce;
  it('at every script step, for every friend', () => {
    let s: FailureState = withBoard(createInitialDemoState());
    const problems: string[] = [];
    const states: Array<[string, FailureState]> = [];
    for (const step of SCRIPT_STEPS) {
      s = applyStep(s, step, r) as FailureState;
      states.push([step, s]);
    }
    // 09: a friend who opened the link and entered a phone number, then left
    states.splice(2, 0, ['opened', friendOpensOnly(states[1][1], 'Sana', r) as FailureState]);
    // 10: a logged-in friend who only opened the link, and one who asked for a reminder
    const loggedIn = r(friendOpensLink(r(states[1][1], { type: 'SET_FRIEND_LOGGED_IN', loggedIn: true }), 'Priya', r), { type: 'FRIEND_OPEN_LINK', name: 'Priya' });
    states.splice(3, 0, ['logged-in-opened', loggedIn as FailureState]);
    const asked = r(friendOpensLink(states[1][1], 'Kabir', r), { type: 'FRIEND_REMIND_ME', name: 'Kabir', phone: '98765 43214' });
    states.splice(4, 0, ['remind-me', asked as FailureState]);
    states.splice(5, 0, ['remind-me-t30', at(asked, 18, 45, r) as FailureState]);
    states.push(['after-show', at(s, 21, 20, r) as FailureState]);
    for (const [step, base] of states) {
      for (const viewer of FRIENDS) {
        const st = friendOpensLink(base, viewer, r) as FailureState;
        const text = JSON.stringify([
          selectFriendPage(st, viewer),
          selectFriendCheckout(st, viewer),
          selectFriendTicket(st, viewer),
          selectLatePage(st, viewer),
          selectFriendSetLine(st, viewer),
          selectTransferNote(st, viewer),
          selectFriendReminder(st, viewer),
          selectCutoffCheckout(st, viewer),
          selectRemindMe(st, viewer),
        ]);
        for (const other of FRIENDS) {
          if (other === viewer || hasPaid(st, other)) continue;
          if (new RegExp(`\\b${other}\\b`).test(text)) problems.push(`${step}: ${viewer} sees unpaid ${other as FriendName}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('09 short copy: one idea per line, no on-screen sentence over 12 words', () => {
  const r = failureFlowReducer as unknown as Reduce;
  const MAX = 12;
  // Longer explanatory paragraphs a user opens on purpose (sheets' body text), not glanceable lines.
  const ALLOW = [/cancellation rules/, /can't be bought any more/];
  const words = (x: string) => x.trim().split(/\s+/).filter((w) => /[A-Za-z0-9₹]/.test(w)).length;
  const sentences = (x: string) => x.split(/(?<=[.!?])\s+|\s·\s|\n/).map((t) => t.trim()).filter(Boolean);
  function collect(v: unknown, out: string[]) {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach((x) => collect(x, out));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => k !== 'message' && k !== 'payLinkMessage' && k !== 'shareMessage' && collect(x, out));
  }
  it('board, sheets, receipt, notifications and tour bubbles', () => {
    let s: FailureState = withBoard(createInitialDemoState());
    const texts: string[] = [];
    collect(selectHoldSheet(beginHold(s, r)), texts);
    for (const step of SCRIPT_STEPS) {
      s = applyStep(s, step, r) as FailureState;
      if (step === 'amit') {
        // 10: remind-me copy (option, consent sheet, toast, board sub-line)
        const asked = r(friendOpensLink(s, 'Priya', r), { type: 'FRIEND_REMIND_ME', name: 'Priya', phone: '98765 43212' }) as FailureState;
        collect([selectRemindMe(friendOpensLink(s, 'Priya', r) as FailureState, 'Priya'), selectRemindMe(asked, 'Priya'), selectBoard(asked)], texts);
      }
      collect([selectBoard(s), selectT30Sheet(s), selectReleaseSheet(s), selectGroupReceipt(s), selectOrderCard(s), selectHoldSuccess(s)], texts);
      for (const f of FRIENDS) collect(selectLatePage(s, f), texts);
    }
    collect(s.notifications.map((n) => [n.title, n.body]), texts);
    collect(TOUR_STEPS.map((t) => [t.text, t.why]), texts);
    const long = [...new Set(texts)]
      .filter((t) => !ALLOW.some((a) => a.test(t)))
      .flatMap((t) => sentences(t).filter((x) => words(x) > MAX).map((x) => `${words(x)}w: ${x}`));
    expect(long).toEqual([]);
  });
});
