# Group Hold · a BookMyShow prototype

**Group Hold** lets one person lock seats for a group without paying for everyone. Rohan pays for his own seat and *blocks* (doesn't pay) his five friends' shares with one UPI PIN, so the seats are locked at once. He shares a link; each friend picks a seat and pays BookMyShow directly. Every time a friend pays, that share is unblocked in Rohan's account. At a deadline set by the show's demand, Rohan keeps or releases any unpaid seats, and the rest of the block is unblocked. **Every held seat ends up paid**, and nobody has to chase friends for money.

This is a high-fidelity, interactive prototype for a 48-hour product design assignment, built to look like the BookMyShow iOS app on an iPhone 17 (402 × 874 pt). The film, cinema, people and banks are fictional. Nothing is charged.

## Live prototype

**https://jobeljiji-glitch.github.io/Navi-Design-Task/**

> **Best view:** open the link on your phone, then **Share → Add to Home Screen** and launch it from there. It opens full screen like the real app, with correct safe areas. On a laptop you get the phone in the middle with the story on the left and the controls on the right.

## The guided demo (2 minutes)

1. Open the link. The intro card offers **Start tour** or **Explore on my own**.
2. The tour has 14 steps on one phone that changes hands: Rohan books and holds the seats, Amit pays from the shared link, Neha can't make it, the deadline arrives, and Kabir pays late.
3. In each coach bubble, **Next** performs the highlighted tap for you; you can also tap the real element yourself. **Back** replays the previous step. **Skip tour** (or Esc) leaves everything usable. On a keyboard, ← and → move between steps.
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
| Deadline: settlement animation | [`#/?explore=1&moment=settlement`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=settlement) |
| Receipt ("Your group is set") | [`#/?explore=1&moment=receipt`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=receipt) |
| Late payer (Kabir pays for the kept seat) | [`#/?explore=1&moment=late`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&moment=late) |
| A friend's pay page on its own (no frame) | [`#/friend/amit`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/friend/amit) |
| Component gallery | [`#/kit`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/kit) |

### Failure states

Each one is also under **Try a failure** in the demo controls. Link pattern: `#/?explore=1&failure=<id>`.

| Failure | id | What you see |
| --- | --- | --- |
| Less than 3 h to the show (#1) | [`under-3h`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=under-3h) | Tap **Hold for group**: "Group holds close 3 hours before the show". Pay is still there. |
| Group holds full on a high-demand show (#2) | [`cap`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=cap) | "Group holds are full for this show. Book now to keep these seats." |
| Second hold on the same show (#3) | [`second-hold`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=second-hold) | "You're already holding seats for this show." + **View hold** |
| 2 holds already running on the account | [`two-holds`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=two-holds) | "You already have 2 group holds running. Book these seats now, or finish a hold first." |
| Fewer than 3 seats | [`two-seats`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=two-seats) | Hold for group is hidden; "Group holds need 3 or more seats." |
| Bank can't block (#4, #5): card instead | [`no-blocking`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=no-blocking) | Payment ladder rung 2: hold ₹1,662.84 on a card, ₹277.14 charged now |
| No card hold either (#4): pay all now | [`no-card`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=no-card) | Rung 3: Pay ₹1,662.84; "Refunded ₹1,385.70 · as each friend pays" |
| UPI block declined (#6) | [`upi-declined`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=upi-declined) | "Block not approved. Try again or pay for all 6." / "We're holding these seats for you until 1:25 PM." |
| Bank doesn't respond | [`bank-timeout`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=bank-timeout) | Approve with any PIN; "Your bank didn't respond, so nothing was set aside or charged." |
| Own payment fails, block works (#7) | [`own-fails`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=own-fails) | Approve with any PIN; the whole hold is undone, seats stay selected |
| Rohan cancels the block in his UPI app (#8) | [`cancel-block`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=cancel-block) | Alert: unpaid seats released, paid seats unaffected |
| Two friends pick the same seat (#10) | [`conflict`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=conflict) | "Someone's paying for D09 right now. Pick another seat." |
| A friend's bank declines (#12) | [`friend-fails`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=friend-fails) | "Payment didn't go through. D10 is still yours for 5 minutes." |
| "Can't make it" (#17) | [`cant-make-it`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=cant-make-it) | Rohan is told at once: release a seat or keep it |
| Payment pending at the deadline (#19) | [`pending`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=pending) | 10-minute grace; the seat stays theirs |
| Nobody responds (#20) | [`nobody`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=nobody) | Default keep: unpaid seats charged from the block |
| Late friend pays for a kept seat (#23) | [`late`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=late) | Ticket moves to Kabir; Rohan refunded ₹277.14 |
| Late payment still pending at showtime | [`showtime-pending`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=showtime-pending) | The seat stays Kabir's while the bank confirms (until 9:25 PM); it clears a moment later |
| …and the bank never confirms | [`showtime-expired`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=showtime-expired) | Kabir isn't charged; Rohan still has the ticket |
| Link opened after the show (#25) | [`after-show`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=after-show) | "This show has started." + a way on (See other shows) |
| Cinema cancels the show (#27) | [`cinema`](https://jobeljiji-glitch.github.io/Navi-Design-Task/#/?explore=1&failure=cinema) | Full refund for everyone, including fees; block released |

## What's simulated

- **No backend, no real money.** All state lives in the browser and resets on reload or with **Restart demo**.
- **Clock:** a simulated clock (Fri 20 Nov 2026, from 1:10 PM). The controls jump it to halfway, T−30, the deadline, after grace, 8:10 PM or showtime, and the timers fire as they would.
- **Banks and UPI:** a generic UPI app (any 4-digit PIN works), a generic card check (any code), and a fictional bank ("OKBANK") that sends SMS banners. UPI Reserve Pay, card pre-authorisation and refunds are modelled, not connected.
- **Friends:** five fictional friends. Phone OTP accepts any 4 digits. The chat is labelled "Chat (simulated)".
- **Out of scope:** home feed, search, food, offers, reviews, login, settings and a real backend.

## Tech note

- Vite + React 18 + TypeScript (strict), Tailwind mapped to CSS variables in `docs/tokens.css` (no raw colours in components), Zustand, Motion, lucide-react, qrcode.react. Hash routing for GitHub Pages; deployed by `.github/workflows/deploy.yml` on every push to `main`.
- **Logic is pure and tested.** `src/logic/` holds no React and never reads the real time. Five reducer layers each wrap the previous one: base rules → `holdFlow` → `friendFlow` → `boardFlow` → `failureFlow`. Screens only read selectors and dispatch actions. Money is integer paise.
- **Tests:** `npm test` (Vitest, 115 tests: spec §1 scripted outcome, every §3 rule, every §5 failure, the tour, a copy lint for banned wording and weights, and "friend-facing screens never name unpaid friends"). `npm run test:e2e` (Playwright, WebKit + Chromium on an iPhone viewport: cards never clip at 110 % text, accessibility audit on every route and failure covering names, 44 pt targets, 4.5:1 contrast, weights and focus, plus mobile bar and top-chrome checks).
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
docs/        spec, design system, tokens, device notes, decisions
reference/   real-app screenshots used for fidelity checks (not shipped)
prompts/     the build prompts this prototype was made from
```
