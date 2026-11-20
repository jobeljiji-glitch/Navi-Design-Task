# 02 · Design-system components and kit page

> **Claude Code prompt.** Run from the repo root. `CLAUDE.md` (which imports `AGENTS.md`) loads automatically.

**Before coding:** switch to plan mode, read the files listed under *Read first* (use the Read tool on the reference images), and show me the plan.
**When done:** take screenshots with `npx playwright screenshot --viewport-size=402,874 --device-scale-factor=3 <url> shots/<name>.png`, Read them next to the matching `reference/screens/` image, fix the 3 biggest differences, run `npm test`, then commit.

---

**Read first:** `docs/design-system.md`, `docs/tokens.css`, `.agents/rules/design-fidelity.md`, and look at every image in `reference/screens/`.

**Task**
1. Build every component in design-system.md §5 (both "Existing" and "New") in `src/ds/`, using tokens only.
2. Seat component supports all states: available, selected, sold, held, locked, paying, paid_owner, paid_friend (with name), covered, kept, released.
3. Build `/kit`: a gallery page inside the DeviceFrame, scrollable, showing each component in each state with its name.
4. Bottom sheet: scrim, grabber, spring animation, drag-to-dismiss.
5. CoachMark: bubble with arrow (auto-placed above/below the anchor), step count "3 of 17", `Back`, `Next`, `Skip tour`; dims everything except the anchor.

**Acceptance**
- `/kit` renders all components with no raw hex in `src/ds/` (grep for `#` colours must find none outside tokens).
- Seat, PrimaryCTA, BottomSheet and ShowtimePill visually match the references at 402 × 874 (screenshot comparison in your walkthrough).
