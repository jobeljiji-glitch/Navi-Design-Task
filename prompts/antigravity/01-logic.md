# 01 · Domain logic engine and tests (no UI)

> **Antigravity prompt.** Paste into the Agent Manager as one task. Rules in `AGENTS.md`, `GEMINI.md` and `.agents/rules/` load automatically.

**Before coding:** read the files listed under *Read first*, then produce an **implementation plan artifact** and wait for my approval.
**When done:** open the result in the built-in browser at **402 × 874**, take screenshots, and put them in your walkthrough artifact next to the matching `reference/screens/` image where one exists. List what still differs. Then commit.

---

**Read first:** `docs/spec.md` (all of it, especially §1 demo data, §2 domain model, §3 rules, §5 failures, §6 controller), `.agents/rules/logic.md`

**Task**
Build `src/logic/` as pure TypeScript:
1. `types.ts`: the domain model from spec §2.
2. `money.ts`: paise integers, `formatINR` (Indian grouping, two decimals), and the derived values from spec §2 (`seatPrice`, `stillBlocked`, `mostYouCouldStillPay`, `unblockedSoFar`, `releaseFee`).
3. `rules.ts`: demand windows, deadline formula, free-release window, grace, block expiry, limits, edge-first release order, eligibility checks (group size, 3-hour rule, cap, existing hold).
4. `reducer.ts`: one reducer over a `DemoState` (show, seats, hold, friend payments, declines, notifications, SMS toasts, event log, clock). Actions = every user action in spec §4 plus every controller event in spec §6 plus `TICK(now)`. `TICK` applies timers (seat-lock expiry, reminders, deadline, grace, settlement, block expiry).
5. `seed.ts`: the demo data from spec §1 (seat map rows A–L with tiers and some sold seats similar to `reference/screens/06-seat-layout-empty.jpg`).
6. `selectors.ts`: everything screens need (board summary, ledger lines, who's in, unpaid count, notifications, receipt).
7. `src/store/`: a Zustand store wrapping the reducer, plus a simulated clock (starts 1:10 PM on Fri 20 Nov 2026, advances only when the controller says so or in real time at 1× when "live" is on).

**Tests (Vitest)**
- The full scripted outcome in spec §1 reproduces exactly: receipt shows **paid ₹554.28** and **unblocked ₹1,108.56**, Kabir's late payment refunds Rohan ₹277.14.
- One test per failure state in spec §5 (at least all ★ ones).
- Deadline formula for low / medium / high tiers and the 3-hour rule.
- Edge-first release never frees a middle seat.

**Acceptance**
- `npm test` passes; no React imports inside `src/logic/`.
