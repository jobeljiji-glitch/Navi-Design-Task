# 02 · Design-system components and kit page

> **Antigravity prompt.** Paste into the Agent Manager as one task. Rules in `AGENTS.md`, `GEMINI.md` and `.agents/rules/` load automatically.

**Before coding:** read the files listed under *Read first*, then produce an **implementation plan artifact** and wait for my approval.
**When done:** open the result in the built-in browser at **402 × 874**, take screenshots, and put them in your walkthrough artifact next to the matching `reference/screens/` image where one exists. List what still differs. Then commit.

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
