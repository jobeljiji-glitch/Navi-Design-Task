# Logic rules

- `src/logic/` is pure TypeScript: no React, no `Date.now()`, no randomness. Time is passed in.
- Money in integer paise. One formatter: `formatINR(paise)` → `₹1,662.84`.
- Implement the rules table in `docs/spec.md` §3 exactly: windows, deadline formula, free-release window, 5-min seat lock, 10-min grace, block ends at showtime, the 9:00 PM late-pay cut-off, the ₹10,000 cap, limits, edge-first release, default keep.
- Every controller event in spec §6 is a reducer action. Every failure in spec §5 has a test.
- The scripted outcome in spec §1 must reproduce exactly in a test (09): kept seats are charged at showtime; the final receipt at 9:15 PM shows charged ₹277.14 and unblocked ₹1,385.70, and `blockAmount = charged + unblocked + stillBlocked` holds at every step.
