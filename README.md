# Group Hold · a BookMyShow prototype

**Group Hold** lets one person lock seats for a group without paying for everyone. Rohan pays for his own seat and *blocks* (doesn't pay) his five friends' shares with one UPI PIN, so the seats are held at once. He shares a link; each friend picks a seat and pays BookMyShow directly, and each payment leaves less for Rohan to cover. At a deadline set by the show's demand, unpaid seats are **kept**: still Rohan's, still blocked, not charged. Until the show, a friend can still pay for a kept seat and take the ticket. At showtime BookMyShow charges whatever is still kept and unblocks the rest of the block **once**. **Every held seat ends up paid**, nobody chases friends for money, and nobody is refunded for anything (except on the pay-all-now fallback).

Why it works this way (UPI Reserve Pay limits, open questions for NPCI and BookMyShow): see **[docs/feasibility.md](docs/feasibility.md)**.

### Glossary (used everywhere: screens, notifications, SMS, tour, docs)

| Word | Means |
| --- | --- |
| **Held** | Seats reserved for the group (seats only) |
| **Blocked** | Money reserved in your account, not charged |
| **To cover** | Blocked money friends haven't paid yet |
| **Charged** | Actually debited |
| **Kept** | An unpaid seat Rohan pays for, at showtime |
| **Released** | A seat given back to the cinema |
| **Unblocked** | Money freed, once, at the showtime settlement |
| **Refunded** | Charged money returned (pay-all-now rail only) |

This is a high-fidelity, interactive prototype for a 48-hour product design assignment, built to look like the BookMyShow iOS app on an iPhone 17 (402 × 874 pt). The film, cinema, people and banks are fictional. Nothing is charged.

## Live prototype

**https://jobeljiji-glitch.github.io/Navi-Design-Task/**

> **Best view:** open the link on your phone, then **Share → Add to Home Screen** and launch it from there. It opens full screen like the real app, with correct safe areas. On a laptop you get the phone in the middle with the story on the left and the controls on the right.

## The guided demo (2 minutes)

1. Open the link. The intro card offers **Start tour** or **Explore on my own**.
2. The tour has 14 steps on one phone that changes hands: Rohan books and holds the seats, Amit pays from the shared link, Neha can't make it, at 7:15 PM Kabir's unpaid seat is kept, Kabir pays for it at 8:10 PM, and at 9:15 PM the hold settles: Rohan paid ₹277.14 for his own seat and ₹1,385.70 is unblocked.
3. In each coach bubble, **Next** performs the highlighted tap for you; you can also tap the real element yourself. **Back** replays the previous step. **–** minimises the bubble to a small "Step 4/14 ›" pill (tap it to bring it back). **Skip tour** (or Esc) leaves everything usable. On a keyboard, ← and → move between steps.
4. At the end, the done card shows the payoff: what Rohan paid in the end, how many friends he chased, and how many seats were left empty.
5. **Explore freely** opens the controls. On a laptop they're in the right column; on a phone, tap the **Demo** bar at the top. From there you can switch phones (Rohan, Amit, Sana, Priya, Neha, Kabir), move the clock, jump to a moment, try a failure, or restart. **Replay** starts the tour again.

## Deep links to key moments

Base: `https://jobeljiji-glitch.github.io/Navi-Design-Task/`

| Moment | Link |
| --- | --- |
| Guided tour, from the start | [`#/`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/) |
| Tour at step N (1–14) | [`#/?step=3`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?step=3) |
| Group status board | [`#/?explore=1&moment=board`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=board) |
| Release a seat (Neha can't make it) | [`#/?explore=1&moment=release`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=release) |
| 30 minutes left: keep or release | [`#/?explore=1&moment=t30`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=t30) |
| 7:15 PM: seats kept, not charged | [`#/?explore=1&moment=kept`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=kept) |
| Late payer (Kabir pays for the kept seat before 9:00 PM) | [`#/?explore=1&moment=late`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=late) |
| 9:15 PM: showtime settlement animation | [`#/?explore=1&moment=settlement`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=settlement) |
| Final receipt ("Your group is set") | [`#/?explore=1&moment=receipt`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=receipt) |
| A friend asks for a reminder ("Not sure yet? Remind me before 7:15 PM") | [`#/?explore=1&moment=remind`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=remind) |
| Board with all three row states (paid / opened, not paid / not opened yet) | [`#/rohan/board?at=430&opened=sana`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/rohan/board?at=430&opened=sana) |
| Receipt before showtime (provisional) | [`#/rohan/receipt?at=kept`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/rohan/receipt?at=kept) |
| Receipt after showtime (final) | [`#/rohan/receipt?at=settled`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/rohan/receipt?at=settled) |
| A friend's pay page on its own (no frame) | [`#/friend/amit`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/friend/amit) |
| Component gallery | [`#/kit`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/kit) |

### Failure states

Each one is also under **Try a failure** in the demo controls. Link pattern: `#/?explore=1&failure=<id>`.

| Failure | id | What you see |
| --- | --- | --- |
| Less than 3 h to the show (#1) | [`under-3h`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=under-3h) | Tap **Hold for group**: "Group holds close 3 hours before the show". Pay is still there. |
| Group holds full on a high-demand show (#2) | [`cap`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=cap) | "Group holds are full for this show. Book now to keep these seats." |
| Second hold on the same show (#3) | [`second-hold`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=second-hold) | "You're already holding seats for this show." + **View hold** |
| A group hold already running (one Reserve Pay block per account) | [`hold-running`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=hold-running) | "You already have a group hold running. Finish it or book these seats now." |
| Over the ₹10,000 block limit (#5) | [`over-cap`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=over-cap) | A premium show, 10 recliners (₹12,771.40). Tap **Hold for group**: "Group holds can block up to ₹10,000. Pick fewer seats or pay now." |
| Fewer than 3 seats | [`two-seats`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=two-seats) | Hold for group is hidden; "Group holds need 3 or more seats." |
| Bank can't block (#4): card instead | [`no-blocking`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=no-blocking) | Payment ladder rung 2: hold ₹1,662.84 on a card, ₹277.14 charged now |
| No card hold either (#4): pay all now | [`no-card`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=no-card) | Rung 3: Pay ₹1,662.84; "Refunded ₹1,385.70 · as each friend pays" |
| UPI block declined (#6) | [`upi-declined`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=upi-declined) | "Block not approved. Try again or pay for all 6." / "We're holding these seats for you until 1:25 PM." |
| Bank doesn't respond | [`bank-timeout`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=bank-timeout) | Approve with any PIN; "Your bank didn't respond, so nothing was blocked or charged." |
| Own payment fails, block works (#7) | [`own-fails`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=own-fails) | Approve with any PIN; the whole hold is undone, seats stay selected |
| Rohan cancels the block in his UPI app (#8) | [`cancel-block`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=cancel-block) | Alert: unpaid seats released, paid seats unaffected |
| Two friends pick the same seat (#10) | [`conflict`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=conflict) | "Someone's paying for D09 right now. Pick another seat." |
| A friend's bank declines (#12) | [`friend-fails`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=friend-fails) | "Payment didn't go through. D10 is still yours for 5 minutes." |
| "Can't make it" (#17) | [`cant-make-it`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=cant-make-it) | Rohan is told at once: release a seat or keep it |
| Payment pending at the deadline (#19) | [`pending`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=pending) | 10-minute grace; the seat stays theirs |
| Nobody responds (#20) | [`nobody`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=nobody) | Default keep: unpaid seats kept at 7:15 PM, charged from the block at 9:15 PM |
| Late friend pays for a kept seat (#23) | [`late`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=late) | "Kabir took D06 🙌 · D06 won't be charged to you". No refund: that seat is simply never charged |
| Payment pending at the 9:00 PM cut-off | [`cutoff-pending`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=cutoff-pending) | Late payments close 15 min before the show; a pending one gets 10 min. Here it never confirms: Kabir isn't charged, D06 stays kept (had it cleared, the ticket would move) |
| Link opened after the show (#25) | [`after-show`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=after-show) | "This show has started." + a way on (See other shows) |
| Cinema cancels the show (#27) | [`cinema`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=cinema) | Full refund for everyone, including fees; block released |

## What's simulated

- **No backend, no real money.** All state lives in the browser and resets on reload or with **Restart demo**.
- **Clock:** a simulated clock (Fri, 20 Nov 2026, from 4:10 PM; the hold starts at 4:15 PM). The controls jump it to halfway, T−30, the deadline, after grace, 8:10 PM, the 9:00 PM cut-off or showtime, and the timers fire as they would.
- **Banks and UPI:** a generic UPI app (any 4-digit PIN works), a generic card check (any code), and a fictional bank ("OKBANK") that sends SMS banners. UPI Reserve Pay (a block that lasts until showtime, ₹10,000 cap, one per account), card pre-authorisation and pay-all-now refunds are modelled, not connected. See [docs/feasibility.md](docs/feasibility.md).
- **Friends:** five fictional friends. Phone OTP accepts any 4 digits. The chat is labelled "Chat (simulated)".
- **Out of scope:** home feed, search, food, offers, reviews, login, settings and a real backend.

## Tech note

- Vite + React 18 + TypeScript (strict), Tailwind mapped to CSS variables in `docs/tokens.css` (no raw colours in components), Zustand, Motion, lucide-react, qrcode.react. Hash routing for GitHub Pages; deployed by `.github/workflows/deploy.yml` on every push to `main`.
- **Logic is pure and tested.** `src/logic/` holds no React and never reads the real time. Five reducer layers each wrap the previous one: base rules → `holdFlow` → `friendFlow` → `boardFlow` → `failureFlow`. Screens only read selectors and dispatch actions. Money is integer paise.
- **Tests:** `npm test` (Vitest, 125 tests: spec §1 scripted outcome and the money invariant `block = charged + unblocked + still blocked` at every step, every §3 rule, every §5 failure, the tour, a copy lint for the glossary (no "set aside", no seat-by-seat "unblocked", no "kept" next to a timer, no worst-case framing, no IPO/ASBA, no on-screen sentence over 12 words) and weights, and "friend-facing screens never name unpaid friends"). `npm run test:e2e` (Playwright, WebKit + Chromium on an iPhone viewport: the CTA is in view without scrolling on every screen and sheet at 874 pt, the hold sheet doesn't scroll, coach bubbles never cover the anchor, the CTA footer or sheet content, cards never clip at 110 % text, accessibility audit on every route and failure, plus mobile bar and top-chrome checks).
- **Bundle (production, gzip):** entry 55.9 kB; each route loads on demand (demo stage 14.2 kB, Rohan's flow 19.7 kB, friend flow 6.2 kB, plus shared chunks). The reference overlay and reference screenshots are dev-only and aren't shipped.
- Decisions not covered by the spec are logged one line each in `docs/decisions.md`.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:5173/Navi-Design-Task/
npm test             # logic tests
npm run test:e2e     # layout + accessibility (starts its own dev server)
npm run build        # production build in dist/
```

Dev only: add `?overlay=1` (or press `O`) to compare a screen with its reference screenshot.

## Repo layout

```
src/logic/   pure domain: rules, reducers, selectors, money, script, tour (unit-tested)
src/store/   Zustand store over the reducer stack
src/ds/      design-system components (tokens only)
src/screens/ rohan/, friend/, chat/
src/demo/    demo stage, coach marks, controls
docs/        spec, feasibility, design system, consistency checklist, tokens, device notes, decisions
reference/   real-app screenshots used for fidelity checks (not shipped)
prompts/     the build prompts this prototype was made from
```
