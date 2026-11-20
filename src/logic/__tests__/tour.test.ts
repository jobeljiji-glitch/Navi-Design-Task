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
    expect(TOUR_STEPS[2].text).toContain('The money stays in your account — it’s only set aside.');
    expect(TOUR_STEPS[12].text).toBe('Rohan paid for his seat and one kept seat. ₹1,108.56 was never charged — it’s simply unblocked.');
    expect(INTRO.problem).toBe("Rohan wants 6 seats for Friday. He shouldn't have to pay for everyone.");
  });

  it('never uses IPO / ASBA wording', () => {
    const all = JSON.stringify({ TOUR_STEPS: TOUR_STEPS.map(({ text, why, nextLabel, interstitial }) => ({ text, why, nextLabel, interstitial })), INTRO, TOUR_DONE, MOMENTS });
    expect(all).not.toMatch(/\bIPO\b|ASBA/i);
  });

  it('time skips land on the spec times', () => {
    const labels = TOUR_STEPS.map((s) => s.nextLabel).filter(Boolean);
    expect(labels).toEqual(['⏩ Skip to 3:30 PM', 'Release D05', '⏩ Skip to 4:15 PM', '⏩ Skip to 6:45 PM', '⏩ Skip to 7:15 PM', '⏩ Skip to 8:10 PM']);
  });

  it('walking every step reproduces the spec §1 outcome, the same as the script', () => {
    const end = tourStateAt(TOUR_LENGTH);
    const script = runScriptTo(freshState(), 'kabirLate');
    const m = selectMoney(end)!;
    expect(m).toEqual(selectMoney(script));
    expect(formatINR(m.rohanCharged)).toBe('₹554.28');
    expect(formatINR(m.returned)).toBe('₹1,108.56');
    expect(end.board.lateSeats).toEqual(['D06']);
    const r = selectGroupReceipt(end)!;
    expect(r.refunds.map((x) => x.value)).toEqual(['₹277.14']);
  });

  it('the receipt step shows the 7:25 PM receipt', () => {
    const s = tourStateAt(12);
    const r = selectGroupReceipt(s)!;
    expect(r.ledger.find((l) => l.key === 'paid')!.value).toBe('₹554.28');
    expect(r.ledger.find((l) => l.key === 'unblocked')!.value).toBe('₹1,108.56');
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
      if (!step.interstitial) expect(personaOf(startPath(i)), step.id).toBe(step.persona);
    });
  });

  it('done card: Rohan paid ₹554.28 — not ₹1,662.84, nobody chased, no empty seats', () => {
    const p = selectTourPayoff(tourStateAt(TOUR_LENGTH))!;
    expect(p.rows).toEqual(['Rohan paid ₹554.28 — not ₹1,662.84', 'Friends chased: 0', 'Seats left empty: 0']);
    expect(p.line).toBe('Every held seat ended up paid.');
  });
});
