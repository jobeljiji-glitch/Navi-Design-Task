# 03 · Rebuild the existing BookMyShow screens (fidelity anchor)

> **Antigravity prompt.** Paste into the Agent Manager as one task. Rules in `AGENTS.md`, `GEMINI.md` and `.agents/rules/` load automatically.

**Before coding:** read the files listed under *Read first*, then produce an **implementation plan artifact** and wait for my approval.
**When done:** open the result in the built-in browser at **402 × 874**, take screenshots, and put them in your walkthrough artifact next to the matching `reference/screens/` image where one exists. List what still differs. Then commit.

---

**Read first:** `reference/README.md` and images `02`, `04`, `05`, `06`, `08`, `10`, `11`, `12`; `docs/spec.md` §1 (fictional data) and §4 "Entry".

**Task**
Rebuild these existing screens with the fictional demo data, as close to the screenshots as possible, using `src/ds/` components:
1. Movie detail (top part only: nav, generated poster, rating chip, meta, tags, short description, trending pill, `Book tickets` bar). Skip offers and reviews.
2. Showtimes: date strip (Fri 20 selected), filter row, one Cineplex row with a `09:15 PM` pill, plus two greyed rows for context.
3. Seat-count sheet: illustration placeholder (simple line drawing of a scooter-like vehicle that changes with count is optional; a single neutral illustration is fine), numbers 1–10, price tiers.
4. Seat layout: header strip, tier headers, rows A–L, screen shape, legend, selection behaviour, bottom `Pay ₹…` CTA (Club strip optional).
5. Loader sheet ("Confirming your Seats!") and Confirm booking summary, as patterns for later screens.
6. Payment options page pattern.

Wire them in order: movie detail → showtimes → seat-count sheet → seat layout. Use the overlay on each and fix the biggest differences.

**Acceptance**
- With `?overlay=1` in difference mode, layout blocks line up within about 4 pt on screens 05, 06 and 08.
- Copy matches the screenshots ("How many seats?", "All eyes this way please!", "Confirming your Seats!").
