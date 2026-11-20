import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { FRIENDS, hasPaid, selectFriendCheckout, selectFriendPage, selectFriendTicket, type FriendName } from '../friendFlow';
import { selectFriendReminder, selectFriendSetLine, selectLatePage, selectTransferNote, withBoard } from '../boardFlow';
import { selectShowtimeCheckout, failureFlowReducer, type FailureState } from '../failureFlow';
import { SCRIPT_STEPS, applyStep, at, friendOpensLink, type Reduce } from '../script';
import { createInitialDemoState } from '../seed';

/**
 * 08 copy lint: the words the user ruled out (memory + D-033, D-080, D-095) never appear in UI strings,
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
    states.push(['showtime', at(s, 21, 20, r) as FailureState]);
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
          selectShowtimeCheckout(st, viewer),
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
