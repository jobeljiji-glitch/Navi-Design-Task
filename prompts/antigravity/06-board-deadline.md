# 06 · Status board, T−30 decision, settlement and late payer (steps 7–9)

> **Antigravity prompt.** Paste into the Agent Manager as one task. Rules in `AGENTS.md`, `GEMINI.md` and `.agents/rules/` load automatically.

**Before coding:** read the files listed under *Read first*, then produce an **implementation plan artifact** and wait for my approval.
**When done:** open the result in the built-in browser at **402 × 874**, take screenshots, and put them in your walkthrough artifact next to the matching `reference/screens/` image where one exists. List what still differs. Then commit.

---

**Read first:** `docs/spec.md` §4 steps 7, 8, 9; §3 timers; §5 failures 18–27.

**Task**
1. Step 7: group status board with live headline ("Most you could still pay"), `BlockMeter`, seat map, `GroupStatusList` with inline actions, free-release line, `Share link again`, `More` menu (Shorten deadline, Add a seat, Cancel hold). In-app notification banners with the spec copy.
2. Step 8: T−30 notification and the Keep/Release sheet with live summary and the release-fee rule.
3. Step 9: settlement animation (grace → charge kept → unblock), receipt with ledger, `Send a pay link for D06`, `Transfer ticket instead`, bank SMS toast; friend "Your group is set" message; late-payer page for a kept seat (and the released and after-showtime variants).
4. Rohan's "Your orders" card ("Group hold · 3 of 6 paid · ends 7:15 PM") that opens the board.

**Acceptance**
- Running the scripted outcome (spec §1) by hand reaches a receipt showing **₹554.28 paid** and **₹1,108.56 unblocked**.
- Kabir's late payment moves D06 to him and shows Rohan "₹277.14 refunded".
