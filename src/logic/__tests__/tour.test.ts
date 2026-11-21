import { describe, it, expect } from 'vitest';
import {
  TOUR_STEPS,
  TOUR_LENGTH,
  INTRO,
  TOUR_DONE,
  MOMENTS,
  applyPhases,
  freshState,
  personaOf,
  selectTourPayoff,
  startPath,
  tourStateAt,
} from '../tour';
import { selectGroupReceipt, selectMoney } from '../boardFlow';
import { runScriptTo } from '../script';
import { formatINR } from '../money';

describe('07 guided tour', () => {
  it('has 14 steps, each with an anchor, text and a why line', () => {
    expect(TOUR_LENGTH).toBe(14);
    for (const s of TOUR_STEPS) {
      expect(s.anchors.length, s.id).toBeGreaterThan(0);
      expect(s.text.length, s.id).toBeGreaterThan(10);
      expect(s.why.length, s.id).toBeGreaterThan(10);
    }
  });

  it('uses the approved copy', () => {
    expect(TOUR_STEPS[1].text).toBe('Tap one seat and the whole group sits together. Then tap Hold for group — friends pay their own share.');
    expect(TOUR_STEPS[1].anchors.at(-1)).toBe('seat-map');
    expect(TOUR_STEPS[2].text).toBe('Only his seat is charged now. The rest is blocked in his account, not charged.');
    expect(TOUR_STEPS[11].text).toBe('30 minutes left. Do nothing and unpaid seats are kept, charged at 9:15 PM.');
    expect(TOUR_STEPS[12].text).toBe("7:15 PM. Kabir didn't answer, so D06 is kept. Nothing is charged yet.");
    expect(TOUR_STEPS[13].text).toBe('Kabir pays before 9:00 PM. The ticket moves to him. D06 is never charged to Rohan.');
    expect(INTRO.problem).toBe("Rohan wants 6 seats for Friday. He shouldn't have to pay for everyone.");
  });

  it('never uses IPO / ASBA wording', () => {
    const all = JSON.stringify({ TOUR_STEPS: TOUR_STEPS.map(({ text, why, nextLabel, interstitial }) => ({ text, why, nextLabel, interstitial })), INTRO, TOUR_DONE, MOMENTS });
    expect(all).not.toMatch(/\bIPO\b|ASBA/i);
  });

  it('time skips land on the spec times', () => {
    const labels = TOUR_STEPS.map((s) => s.nextLabel).filter(Boolean);
    expect(labels).toEqual(['⏩ Skip to 5:20 PM', 'Release D05', '⏩ Skip to 5:45 PM', '⏩ Skip to 6:45 PM', '⏩ Skip to 7:15 PM', '⏩ Skip to 8:10 PM', 'Pay and skip to 9:15 PM']);
  });

  it('walking every step reproduces the spec §1 outcome, the same as the script', () => {
    const end = tourStateAt(TOUR_LENGTH);
    const script = runScriptTo(freshState(), 'showtime');
    const m = selectMoney(end)!;
    expect(m).toEqual(selectMoney(script));
    expect(formatINR(m.charged)).toBe('₹277.14');
    expect(formatINR(m.unblocked)).toBe('₹1,385.70');
    expect(end.board.lateSeats).toEqual(['D06']);
    expect(selectGroupReceipt(end)!.final).toBe(true);
  });

  it('step 13 (7:15 PM): D06 kept, nothing charged beyond his seat, receipt still provisional', () => {
    const s = tourStateAt(12);
    expect(s.hold!.status).toBe('closed');
    expect(s.seats.D06.state).toBe('kept');
    expect(selectMoney(s)!.charged).toBe(27714);
    expect(selectGroupReceipt(s)!.final).toBe(false);
  });

  it("each step's done() is false at its start and true after Next", () => {
    let s = freshState();
    TOUR_STEPS.forEach((step, i) => {
      if (step.done) {
        expect(step.done(s, startPath(i)), `${step.id} done at start`).toBe(false);
        const next = applyPhases(s, step);
        // step 1 has no state change: it's done by navigating
        expect(step.done(next, step.after), `${step.id} done after Next`).toBe(true);
      }
      s = applyPhases(s, step);
    });
  });

  it('personas follow the story', () => {
    expect(TOUR_STEPS.map((s) => s.persona)).toEqual([
      'Rohan', 'Rohan', 'Rohan', 'Rohan', 'Rohan', 'Amit', 'Amit', 'Rohan', 'Rohan', 'Rohan', 'Rohan', 'Rohan', 'Rohan', 'Kabir',
    ]);
    // the phone shows the step's persona when the step starts (after its interstitial)
    TOUR_STEPS.forEach((step, i) => {
      expect(personaOf(startPath(i)), step.id).toBe(step.persona);
    });
  });

  it('done card: Rohan paid just his own seat in the end, nobody chased, no empty seats', () => {
    const p = selectTourPayoff(tourStateAt(TOUR_LENGTH))!;
    expect(p.rows).toEqual([
      { text: 'Rohan paid ₹277.14 — just his own seat', sub: 'Kabir paid late, so his seat was never charged to Rohan.' },
      { text: 'Friends chased: 0' },
      { text: 'Seats left empty: 0' },
    ]);
    // before Kabir pays (step 14 start): the kept seat would still be charged at 9:15 PM
    expect(selectTourPayoff(tourStateAt(13))!.rows[0]).toEqual({ text: 'Rohan paid ₹554.28 — not ₹1,662.84' });
    expect(p.line).toBe('Every held seat ended up paid.');
  });
});
