# 08 · Failure states, QA pass and deploy

> **Antigravity prompt.** Paste into the Agent Manager as one task. Rules in `AGENTS.md`, `GEMINI.md` and `.agents/rules/` load automatically.

**Before coding:** read the files listed under *Read first*, then produce an **implementation plan artifact** and wait for my approval.
**When done:** open the result in the built-in browser at **402 × 874**, take screenshots, and put them in your walkthrough artifact next to the matching `reference/screens/` image where one exists. List what still differs. Then commit.

---

**Read first:** `docs/spec.md` §5; `AGENTS.md` "Definition of done".

**Task**
1. Make every ★ failure in spec §5 triggerable from the controller with the exact copy, and implement the non-★ ones that the logic already supports.
2. QA pass at 402 × 874: tap targets ≥ 44 pt, `aria-label` on icon buttons, no text overflow, no layout jump when sheets open, keyboard doesn't cover the OTP field on iOS.
3. Performance: friend page loads fast on a phone (lazy-load the demo stage and controller; the friend route ships only what it needs).
4. Add a short `README` section in the app repo: how to run, routes, controller guide.
5. Push to `main`, confirm the GitHub Pages deploy, open it on a real iPhone (Add to Home Screen), and list anything that differs from the desktop frame.

**Acceptance**
- All "Definition of done" items in `AGENTS.md` are true.
- A final screenshot set of every screen (Rohan steps 1–9, friend steps 4–6, 4 failure states) is in your walkthrough/`shots/`.
