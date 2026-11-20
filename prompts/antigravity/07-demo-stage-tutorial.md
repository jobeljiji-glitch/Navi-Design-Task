# 07 · Demo stage, controller, persona switcher and tutorial

> **Antigravity prompt.** Paste into the Agent Manager as one task. Rules in `AGENTS.md`, `GEMINI.md` and `.agents/rules/` load automatically.

**Before coding:** read the files listed under *Read first*, then produce an **implementation plan artifact** and wait for my approval.
**When done:** open the result in the built-in browser at **402 × 874**, take screenshots, and put them in your walkthrough artifact next to the matching `reference/screens/` image where one exists. List what still differs. Then commit.

---

**Read first:** `docs/spec.md` §6 and §7.

**Task**
1. `/` demo stage: on ≥ 1024 px, three columns: Rohan's DeviceFrame · friend's DeviceFrame with persona tabs · Controller. On ≤ 430 px: single full-screen app with the persona pill (Rohan · Amit · Priya · Neha · Kabir · ⚙) at the top.
2. Controller: clock with jump buttons, show settings, friend events, organiser and cinema events, restart options, a "What just happened" log, and a QR code to `/#/friend/amit`.
3. When Rohan shares, animate the message travelling from his phone into the friend's chat on desktop; on mobile, show the persona transition card.
4. Tutorial: the 18 steps in spec §7 using `CoachMark`. Auto-advance when the highlighted action is done; `Next` performs it; `Skip tour` leaves everything usable; `Replay tour` in the controller. Step 12 highlights both phones at once on desktop.
5. Start screen (step 0) with `Start tour` / `Explore on my own`.

**Acceptance**
- The tour runs from step 0 to 17 on desktop and on a 402 px window without dead ends.
- Every controller event visibly changes at least one phone.
