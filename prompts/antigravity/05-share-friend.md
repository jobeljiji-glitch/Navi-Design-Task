# 05 · Share link and the friend's flow (steps 4–6)

> **Antigravity prompt.** Paste into the Agent Manager as one task. Rules in `AGENTS.md`, `GEMINI.md` and `.agents/rules/` load automatically.

**Before coding:** read the files listed under *Read first*, then produce an **implementation plan artifact** and wait for my approval.
**When done:** open the result in the built-in browser at **402 × 874**, take screenshots, and put them in your walkthrough artifact next to the matching `reference/screens/` image where one exists. List what still differs. Then commit.

---

**Read first:** `docs/spec.md` §4 steps 4, 5, 6; §5 failures 9–17.

**Task**
1. Step 4: simplified iOS share sheet → simulated chat thread ("Chat (simulated)") with the earlier group messages, Rohan's pre-filled message (deadline line not editable) and the `LinkPreviewCard`. Sending lands Rohan on the status board (placeholder until prompt 06).
2. Step 5: friend pay page at `/friend/:name`: header, `AvatarStack` + "who's in" line (never who's out), mini seat map of the block with names, seat selection with 5-min lock, rows, CTA, `Pay for more seats` stepper, `Can't make it` flow, assigned-seat variant, conflict message.
3. Step 6: phone + OTP (skip when "logged in" toggle is on), UPI app choice, pending state, failure state, ticket screen with QR and "You're in, next to …".
4. Every friend action dispatches to the shared store, so Rohan's side updates at the same moment.

**Acceptance**
- From Amit's chat, tapping the preview → pay page → OTP → UPI → ticket works, and Rohan's block shrinks by ₹277.14.
- "Can't make it" notifies only Rohan.
- Two friends selecting the same seat shows the conflict copy.
