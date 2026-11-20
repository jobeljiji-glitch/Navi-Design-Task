# Logic rules

- `src/logic/` is pure TypeScript: no React, no `Date.now()`, no randomness. Time is passed in.
- Money in integer paise. One formatter: `formatINR(paise)` → `₹1,662.84`.
- Implement the rules table in `docs/spec.md` §3 exactly: windows, deadline formula, free-release window, 5-min seat lock, 10-min grace, block expiry, limits, edge-first release, default keep.
- Every controller event in spec §6 is a reducer action. Every failure in spec §5 has a test.
- The scripted outcome in spec §1 must reproduce exactly in a test: final receipt shows paid ₹554.28 and unblocked ₹1,108.56.
