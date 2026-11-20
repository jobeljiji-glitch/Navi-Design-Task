# 04 · Rohan: start a group hold (steps 1–3)

> **Antigravity prompt.** Paste into the Agent Manager as one task. Rules in `AGENTS.md`, `GEMINI.md` and `.agents/rules/` load automatically.

**Before coding:** read the files listed under *Read first*, then produce an **implementation plan artifact** and wait for my approval.
**When done:** open the result in the built-in browser at **402 × 874**, take screenshots, and put them in your walkthrough artifact next to the matching `reference/screens/` image where one exists. List what still differs. Then commit.

---

**Read first:** `docs/spec.md` §4 steps 1a, 1b, 2, 3; §3 rules; images `05`, `08`, `10`, `11`, `12`.

**Task**
1. Step 1a: `GroupHint` in the seat-count sheet when ≥ 3.
2. Step 1b: `DemandBanner` (three tiers), non-contiguous note, `DualCtaBar` with all button states from the spec.
3. Step 2: Hold summary bottom sheet: own-seat dropdown, `MoneyLedger`, deadline row with `Shorten`, assign-mode link, free-release row, `Cover seats` stepper, payment method row, CTA, footnote. Plus the fallback variant when the bank doesn't support blocking.
4. Step 3: "Opening your UPI app…" transition → generic UPI approval screen → PIN pad → bank SMS toast → BMS success screen with `Send to your group`, `Copy link`, `Show QR`.
5. All values come from selectors; all copy from the spec.

**Acceptance**
- The happy path from seat layout to success works and the store shows hold status `active`, D07 `paid_owner`, five seats `held`.
- Switching the demand tier in the store changes the banner and the deadline.
- Decline in the UPI app returns to step 2 with the specified message.
