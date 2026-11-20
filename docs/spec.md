# Group Hold: product spec (source of truth for the prototype)

**One line:** Rohan pays for his own seat and *blocks* (doesn't pay) his friends' shares with one UPI PIN. The seats lock at once. Each friend picks a seat and pays BookMyShow directly from a shared link. At a deadline set by the show's demand, Rohan keeps or releases any unpaid seats, and the rest of his block is released. **Every held seat ends up paid.**

Design principles (use them to settle any doubt):
1. **Block, don't debit.** Show the most Rohan could pay at all times.
2. **BMS asks, friends never do.** Reminders and deadlines come from BookMyShow.
3. **Paying is choosing.** A friend's payment and seat choice are one action.
4. **Your seat, your ticket.** Every payer gets their own ticket and refund.
5. **Every held seat ends paid.** No state leaves a seat held but unfunded.

---

## 1. Demo data

| Item | Value |
| --- | --- |
| Film (fictional) | **Monsoon Heist** · Hindi · 2D · UA16+ · 2h 18m · Action, Thriller · rating 8.4/10 (12.6K votes) |
| Poster | Generated: deep teal-to-indigo gradient, rain streaks, title in bold condensed type |
| Cinema (fictional) | **Cineplex: Phoenix Marketcity, Kurla** · 3.1 km · Cancellation available |
| Show | **Fri, 20 Nov 2026 · 9:15 PM** · Screen 4 |
| Seat tiers | ₹500 Recliner (row A) · ₹250 Prime Plus (B–D) · ₹230 Prime (E–J) · ₹210 Classic (K–L) |
| Group seats | **D05–D10** (Prime Plus) |
| Price per seat | ₹250.00 ticket + ₹27.14 convenience fee = **₹277.14** |
| Group total (6) | **₹1,662.84** |
| Organiser | **Rohan** (rohan@okbank), his seat **D07** (first tapped) |
| Friends | Amit, Sana, Priya, Neha, Kabir |
| Demand tier | **Medium** ("Selling steadily · 41% left") → 6 h window |
| Hold starts | 1:15 PM → deadline **7:15 PM** · free release until **4:15 PM** · reminder at 4:15 PM and **6:45 PM** · grace until **7:25 PM** · block expires **7:45 PM** |

### Scripted outcome (the tutorial path)

| Who | Behaviour | Seat | Result |
| --- | --- | --- | --- |
| Rohan | Pays own seat at hold start | D07 | ₹277.14 debited |
| Amit | Pays immediately (2:02 PM) | D08 | ₹277.14 unblocked |
| Sana | Pays (3:10 PM) | D09 | ₹277.14 unblocked |
| Neha | Taps "Can't make it" (3:30 PM) → Rohan releases 1 seat (free, before 4:15 PM) | D05 released (edge) | ₹277.14 unblocked |
| Priya | Pays at 7:13 PM, payment pending past the deadline, succeeds at 7:19 PM in grace | D10 | ₹277.14 unblocked |
| Kabir | No response → seat kept by default | D06 | ₹277.14 charged to Rohan at 7:25 PM |
| Kabir (late) | Opens the link at 8:10 PM, pays for the kept seat | D06 | Ticket moves to Kabir; Rohan refunded ₹277.14 |

Receipt at 7:25 PM: Rohan paid ₹554.28 in total (own + kept), fees kept ₹0, **unblocked ₹1,108.56**.

---

## 2. Domain model

```ts
type DemandTier = 'low' | 'medium' | 'high';

interface Show { id; filmTitle; cinemaName; startsAt: Date; tier: DemandTier; pctLeft: number; fee: number; }
interface Seat { id: string; row: string; num: number; tier: 'recliner'|'primePlus'|'prime'|'classic'; price: number; state: SeatState; }

type SeatState =
  | 'available' | 'sold' | 'selected'          // existing
  | 'held'            // in Rohan's block, unpaid
  | 'locked'          // a friend tapped it, 5-min payment lock
  | 'paying'          // payment submitted, waiting for bank
  | 'paid_owner'      // Rohan's own
  | 'paid_friend'     // paid by a friend (has payerName)
  | 'covered'         // Rohan chose "I'll cover" (charged now)
  | 'kept'            // charged to Rohan at resolution
  | 'released';       // back on public sale

interface Hold {
  id; showId; organiser: { name: 'Rohan'; upi: string };
  seatIds: string[]; ownerSeatId: string;
  createdAt: Date; deadline: Date; freeReleaseUntil: Date | null; graceUntil: Date; blockExpiresAt: Date;
  paymentRail: 'reserve_pay' | 'card_preauth' | 'pay_and_refund';
  blockAmount: number;     // initial block (all seats incl. owner)
  debited: number;         // owner seat + covered + kept + kept fees
  status: HoldStatus;
  assignMode: 'friends_pick' | 'assigned';
  joinCode?: string;
  events: HoldEvent[];     // audit trail shown in the controller log
}

type HoldStatus = 'draft' | 'awaiting_upi' | 'active' | 'resolving' | 'settled' | 'cancelled' | 'failed';

interface FriendPayment { id; name; phone; seatIds: string[]; status: 'locked'|'pending'|'success'|'failed'|'refunded'; at: Date; }
interface Decline { name; at: Date; }   // "Can't make it"
```

### Derived values (pure functions, unit-tested)

```ts
seatPrice(seat)            = seat.price + show.fee                       // 277.14
unpaidSeats(hold)          = seats in 'held' | 'locked' | 'paying'
stillBlocked(hold)         = sum(seatPrice of unpaidSeats)              // what the block still covers
mostYouCouldStillPay(hold) = stillBlocked                                // headline on status board (future charges only)
unblockedSoFar(hold)       = blockAmount − debited − stillBlocked
releaseFee(hold, t)        = (tier !== 'low' && t > freeReleaseUntil) ? show.fee : 0   // per released seat
```

---

## 3. Rules and timers

| Rule | Value |
| --- | --- |
| Group size | 3–10 seats. Under 3: "Hold for group" hidden |
| Demand windows | low 24 h · medium 6 h · high 2 h |
| Deadline | `min(createdAt + window, show.startsAt − 2h)`. Fixed at creation |
| Hold unavailable | if `show.startsAt − now < 3h` |
| Free release window | medium/high only: until the halfway point of the window |
| Release fee | after the free window, the convenience fee of each released seat is kept (₹27.14) |
| Friend seat lock | 5 min after tapping Pay |
| Grace | 10 min after the deadline for payments already `paying` |
| Block expiry | deadline + 30 min (safety net) |
| Reminders | BMS sends at 50% of window and at T−30 min (to anyone who entered a phone number but didn't pay); Rohan notified at the same times |
| Rohan's "Send reminder" | Pre-written BMS-voiced message to forward; max once per 2 h |
| Limits | 1 active hold per show per account; 2 active holds per account; on high-tier shows group holds capped at 15% of remaining seats |
| Seat release order | Always from the **edges** of the block, never the middle |
| Default at deadline | **Keep** |
| Late payment for a kept seat | Allowed until showtime; ticket moves, Rohan refunded |
| After showtime | Link shows "This show has started"; Rohan can label a seat "settled outside BMS" (label only) |
| Prices | Locked at hold creation |
| Deadline changes | Rohan may **shorten**, never extend. Shared-message deadline line is locked |

---

## 4. Screens and copy, step by step

Copy is final unless marked *(draft)*. Currency always shows two decimals, like the real app (`₹277.14`).

### Entry (existing screens, rebuilt from references)
- **Movie detail** (ref 02) → `Book tickets`
- **Showtimes** (ref 04) → Cineplex row → `09:15 PM`
- **Seat-count sheet** (ref 05)

### Step 1a: Seat-count sheet + group hint
- When 3 or more is selected, show `GroupHint` above the CTA:
  - "Booking for a group? You can hold seats and let friends pay their own share."
- CTA unchanged: `Select seats`

### Step 1b: Seat layout with new options
- `DemandBanner` under the header strip, by tier:
  - low: "Plenty of seats · group hold: 24h"
  - medium: "Selling steadily · 41% left · group hold: 6h"
  - high: "Filling fast · 18% left · group hold: 2h"
- Non-contiguous selection: inline note "Your group isn't seated together."
- `DualCtaBar` when 3–10 seats selected:
  - Outline: **Hold for group** / sub-label "Friends pay their own"
  - Filled: **Pay ₹1,662.84** / sub-label "All 6 seats"
- Button states:
  - < 3 h to show: tapping shows toast "Group holds close 3 hours before the show"
  - Cap reached: "Group holds are full for this show. Book now to keep these seats."
  - Existing hold: "You're already holding seats for this show." + `View hold`

### Step 2: Hold summary (bottom sheet)
- Title: **Hold 6 seats for your group** · subtitle "Monsoon Heist · Fri 9:15 PM · D05–D10"
- Rows: `Your seat [D07 ▾]` → "₹277.14 now" · `5 friends' seats` → "₹1,385.70 blocked"
- `MoneyLedger`: "Leaves your account now ₹277.14" · "Blocked, not taken ₹1,385.70" · **"Most you could pay ₹1,662.84"** · helper: "Each time a friend pays, ₹277.14 is unblocked. The money stays in your account — it’s only set aside."
- Info rows:
  - "Friends have until **7:15 PM today** (6h). After that, you keep or release each unpaid seat." + `Shorten`
  - "Friends pick their own seat." + link `Assign seats instead`
  - "Release free until 4:15 PM" (medium/high only)
  - `Cover seats` stepper (default 0): "I'll pay for … seats now"
- Pay with: "UPI · rohan@okbank ▾" (alternatives: card, or fallback)
- CTA: **Pay ₹277.14 and block ₹1,385.70**
- Footnote: "One UPI PIN. Cancel the hold anytime before friends pay."
- **Fallback** (bank lacks Reserve Pay / above limit): ledger changes to "Pay ₹1,662.84 now · get ₹277.14 back each time a friend pays"; CTA **Pay ₹1,662.84**

### Step 3: UPI approval (generic UPI app) and success
- Transition: "Opening your UPI app…" (600 ms)
- UPI screen: "Approve a block request" · BookMyShow (verified tick) · "Group hold · Monsoon Heist · Fri 9:15 PM"
  - Big: **₹1,662.84** "will be blocked in your account"
  - Rows: "Debited now ₹277.14" · "Further debits: Only for seats you keep" · "Block ends: Today, 7:45 PM" · "Type: UPI Reserve Pay"
  - "Unused money is unblocked automatically. You can cancel this block from Mandates."
  - Buttons: `Decline` · **Approve with PIN** → 4-digit PIN pad (any digits)
- Bank SMS toast: "₹1,662.84 blocked for BookMyShow. ₹277.14 debited."
- BMS success: ✓ **6 seats held for your group** · "Your ticket D07 is confirmed" · mini ledger (Paid ₹277.14 · Blocked for 5 friends ₹1,385.70 · Friends pay by 7:15 PM) · **Send to your group** · `Copy link` · `Show QR`

### Step 4: Share
- iOS share sheet modelled on `13-ios-share-sheet.jpg`: text preview row (message first line), contact suggestions (**Friday movie** group, Amit, Sana, Priya; initials avatars with a small generic chat badge), app row (AirDrop, Messages, Mail, **Chat**), Copy action. Tapping **Friday movie** or **Chat** opens the simulated chat
- Pre-filled message (editable except the deadline line):
  "Held 6 seats for Monsoon Heist, Fri 9:15 PM. Pick your seat and pay your share:
  **Pay by 7:15 PM today** · bms.link/g/k7Qx2"
- `LinkPreviewCard` (static): artwork · "Rohan is holding 6 seats for Monsoon Heist" · "Fri 9:15 PM · Cineplex Kurla · ₹277.14 each" · "Pick your seat by 7:15 PM today" · domain
- Chat is labelled "Chat (simulated)". After sending, Rohan lands on the status board.

### Step 5: Friend pay page (web or app; same page)
- Header: "Rohan is holding seats for you" · **Monsoon Heist** · "Fri 9:15 PM · Cineplex: Phoenix Marketcity, Kurla"
- `AvatarStack` + "**Rohan and Amit are in** · 3 seats left" (never lists who hasn't paid)
- Mini seat map of the block only; paid seats show first names; tapping a free seat selects it
- Rows: "Your seat D09 · ₹277.14 incl. fees" · "Held for you until 7:15 PM today" · "Cancellation: Cinema's rules apply" (opens sheet)
- CTA: **Pay ₹277.14 for D09**
- Secondary: `Pay for more seats` (stepper up to unpaid count) · `Can't make it`
- Can't make it → confirm sheet: "Let Rohan know you can't make it?" `Yes, let him know` / `Cancel` → "Thanks. Rohan's been told." (Only Rohan is notified.)
- Assigned mode: map shows names on seats; header "Which one is you?"
- Conflict: "Kabir is paying for D09 right now. Pick another seat."

### Step 6: Payment and ticket
- Phone + OTP (skipped if logged in): "Your phone number · Your ticket is sent here" → 4 boxes (any digits auto-accept)
- "Pay ₹277.14 with" → three generic UPI app tiles + "Card or net banking"
- Pending: "Confirming with your bank" · "D09 stays yours while we wait, even past the deadline."
- Failed: "Payment didn't go through. D09 is still yours for 5 minutes." `Try again`
- Ticket: **You're in, next to Amit** · film/time/cinema · QR · "D09 · 1 ticket · Paid ₹277.14 · Sent to your SMS" · "4 of 6 in · Rohan, Amit, Sana, you" · `Keep it in the BookMyShow app`
- Simultaneously on Rohan: notification "Sana paid for D09 · ₹277.14 unblocked"; board updates

### Step 7: Group status board (Rohan)
- Header: "Friday movie" · "Monsoon Heist · Fri 9:15 PM" · pill "Pay by 7:15 PM · 4h 05m" (example at 3:10 PM)
- Headline: "Most you could still pay" **₹831.42** (live)
- `BlockMeter`: You paid · Friends paid · Still blocked (+ legend amounts)
- Seat map: names on paid seats, dashed held seats, amber paying seats
- `GroupStatusList`: Paid (names, seats) · Paying now · Can't make it (`Release a seat` / `Keep`) · "N seats waiting" (`Cover seats` / `Send reminder`)
- "Release free until 4:15 PM"
- Buttons: **Share link again** · `More` (Shorten deadline · Add a seat · Cancel hold)
- Notifications (iOS banner style from `15-notifications.jpg`; title, then body):
  - "Amit's in! 🎉" / "He paid for D08. ₹277.14 unblocked from your account."
  - "Neha can't make it 😕" / "Release a seat, or keep it for someone else?"
  - "Halfway there ⏳" / "3 of 6 in · 3h left for friends to pay."
  - "30 min left ⏰" / "2 seats unpaid. We'll keep them for you unless you release them."
  - Friend reminder (to people who entered a phone number): "Your seat's waiting 🍿" / "Rohan's holding a seat for Monsoon Heist. Pay by 7:15 PM."
  - Settled: "Your group is set! 🎬" / "5 of 6 in. ₹1,108.56 unblocked."
  - Late payer: "Kabir took his seat 🙌" / "₹277.14 is on its way back to you."

### Step 8: T−30 decision sheet
- Notification: "30 min left ⏰" / "2 seats unpaid. We'll keep them for you unless you release them."
- Sheet: "2 seats are still unpaid" · "Friends can still pay until 7:15 PM"
- `KeepReleaseStepper`: Keep (n) "Charged from your block at 7:15 PM" · Release now (m) "Back on sale, from the end of the row"
- Summary: "If nobody else pays ₹554.28" (2 × 277.14, updates with the stepper) · "Fee kept on released seats ₹0.00 / ₹27.14" · **"Most you'll pay ₹…"**
- CTA **Confirm** · footnote "Released seats can't be taken back"

### Your Bookings & Purchases (Rohan)
- Same anatomy as `14-your-bookings.jpg`. Group card: poster thumb · **Monsoon Heist** · Hindi · "Fri, 20 Nov, 2026 | 09:15 PM" · "Cineplex: Phoenix Marketcity, Kurla" · "6 tickets: PP - D05…D10" · "M-Ticket" · "SCREEN 4"
- Footer while active: badge **GROUP HOLD** + "3 of 6 paid · ends 7:15 PM" (tap → status board)
- After settlement: badge **CONFIRMED** + "5 of 6 in · you paid for 2"

### Step 9: Deadline, receipt and late payer
- Settlement animation on Rohan's phone (7:15 → 7:25): "Waiting for 1 payment in progress…" → "Charging 1 kept seat…" → "Unblocking ₹1,108.56…"
- Receipt: **Your group is set · 5 of 6 in** · seat list with status and payer · ledger "Blocked at start ₹1,662.84 · You paid in total ₹554.28 · **Unblocked ₹1,108.56**" · **Send a pay link for D06** · `Transfer ticket instead`
- Bank SMS: "₹1,108.56 unblocked by BookMyShow."
- Friends who paid: "Your group is set. You're in D09."
- Late friend (link after deadline, kept seat): "The group hold has ended" · **Rohan kept a seat for you** · D06 · "Pay before the show starts and the ticket is yours. Rohan gets his ₹277.14 back." · **Pay ₹277.14 for D06** · "Available until 9:15 PM"
- Late friend, seat released: "This hold has ended." `Book seats for this show`
- After showtime: "This show has started."

---

## 5. Failure states (★ = trigger from the controller)

| # | Failure | Response |
| --- | --- | --- |
| 1 | Show < 3 h away | Toast: "Group holds close 3 hours before the show" |
| 2 | Group-hold cap reached (high tier) | "Group holds are full for this show. Book now to keep these seats." |
| 3 | Existing hold for this show | "You're already holding seats for this show." + View hold |
| 4 ★ | Bank doesn't support blocking | Fallback ledger: pay all now, refunded per friend payment |
| 5 | Over bank's block limit | Same as #4 |
| 6 | UPI declined / failed | "Block not approved. Try again or pay for all 6." Seats locked 10 more min |
| 7 | Own payment fails, block succeeds | Undo everything; never half a hold |
| 8 ★ | Rohan cancels the block in his UPI app | Alert: "You cancelled your block, so 2 unpaid seats were released. Paid seats aren't affected." |
| 9 | Link forwarded outside group | Only unpaid seats at face value; optional join code |
| 10 ★ | Two friends pick the same seat | "Kabir is paying for D09 right now. Pick another seat." |
| 11 | Seat lock expires | Seat returns to the block |
| 12 | Payment fails | "Payment didn't go through. D09 is still yours for 5 minutes." |
| 13 | Paid after lock expired, seat taken | Another seat in the block, or instant refund |
| 14 | Double payment | Second payment refunded instantly: "You were charged twice. We've refunded ₹277.14." |
| 15 | Network lost mid-payment | Treated as pending |
| 16 | Link opens in WhatsApp's browser | Web page works fully |
| 17 ★ | "Can't make it" | Rohan prompted immediately |
| 18 | Late joiner after all paid | Board → More → Add a seat (adjacent, new block, same deadline) |
| 19 ★ | Payment pending at deadline | 10-min grace; seat stays theirs |
| 20 ★ | Nobody responds | Default keep, charged from block |
| 21 | Rohan offline at deadline | Server applies default; receipt via SMS |
| 22 | Block can't be charged | Retry until expiry, then release seat: "We couldn't charge your block, so D06 was released." |
| 23 ★ | Late friend pays kept seat | Ticket moves; Rohan refunded |
| 24 | Pay link and transfer both used | First action wins; the other turns off |
| 25 | Link after showtime | "This show has started." |
| 26 | Paid friend cancels | Cinema rules; seat to group link before deadline, public after |
| 27 ★ | Cinema cancels the show | "The cinema cancelled this show. Everyone gets a full refund, including fees." Block released |
| 28 | Showtime changed | Everyone notified; free cancellation; deadline kept ≥ 2 h before new time |
| 29 | Price change during hold | Price locked at hold creation |

---

## 6. Scenario controller

A panel next to the phones (on mobile: the ⚙ tab). Every event is logged with a timestamp in a "What just happened" feed.

**Clock:** current simulated time (starts 1:10 PM) · buttons: `+15 min` · `Halfway` · `T−30` · `Deadline` · `After grace` · `8:10 PM` · `Showtime`

**Show settings (before hold):** demand tier low / medium / high · "Bank supports blocking" on/off · "Less than 3h to show"

**Friends:**
- Amit pays · Sana pays · Priya pays (pending → success after 6 min) · Priya pays (fails) · Neha can't make it · Kabir pays late (after deadline)
- Kabir and Sana tap the same seat (conflict)

**Organiser:** Rohan cancels block in UPI app · Rohan offline at deadline

**Cinema:** Cinema cancels show

**Reset:** `Restart demo` · `Restart from step…` (dropdown of the tutorial steps)

---

## 7. Demo stage and tutorial

### Layout
- **≥ 1024 px wide:** three columns: Rohan's phone (`DeviceFrame`) · Friend's phone (`DeviceFrame`, persona tabs above it: Amit · Sana · Priya · Neha · Kabir) · Controller. A QR code in the controller opens `/#/friend` on a real phone.
- **≤ 430 px wide (real iPhone):** one full-screen app, no frame. Top persona pill: **Rohan · Amit · Priya · Neha · Kabir · ⚙**. The tutorial switches persona automatically with a transition card ("Now you're Amit. Rohan just shared this.").
- Routes: `/#/` demo · `/#/rohan` · `/#/friend/:name` · `/#/kit` (component gallery) · `?overlay=1` enables the reference overlay.

### Tutorial (coach marks; `Next`, `Back`, `Skip tour`; `Replay tour` in the controller)

> **Superseded by D-093–D-104:** the shipped tour is 14 steps on one phone that changes hands (`src/logic/tour.ts`). The table below is the original outline.

| # | Persona | Anchor | Bubble text |
| --- | --- | --- | --- |
| 0 | — | Centre card | "Group Hold for BookMyShow. Lock seats for your group without paying for everyone. Take the 2-minute tour, or explore on your own." `Start tour` · `Explore on my own` |
| 1 | Rohan | Book tickets | "Rohan's planning Friday's movie with five friends. Not everyone has confirmed." |
| 2 | Rohan | 9:15 PM pill | "He picks the 9:15 PM show." |
| 3 | Rohan | Number 6 | "Six seats. Notice the new hint: he can hold seats for the group." |
| 4 | Rohan | Demand banner | "An honest signal: seats are selling, and the hold would last 6 hours." |
| 5 | Rohan | Hold for group | "Instead of paying ₹1,662.84 for everyone, he holds the seats." |
| 6 | Rohan | Money ledger | "Only his seat is paid now. The money stays in your account — it’s only set aside." |
| 7 | Rohan | Approve with PIN | "This is his bank app. One PIN: ₹1,662.84 set aside, ₹277.14 leaves now." |
| 8 | Rohan | Send to your group | "The link replaces the WhatsApp poll." |
| 9 | Amit | Link preview | "Now you're Amit. Tap Rohan's link." |
| 10 | Amit | Avatar stack | "Seeing who's in makes 'yes' easier." |
| 11 | Amit | Pay button | "Picking a seat and paying is one step. No signup." |
| 12 | Both | Ticket + block meter | "Amit has his own ticket. On Rohan's phone, ₹277.14 just got unblocked." |
| 13 | Rohan | Can't make it row | "Neha can't make it. Rohan releases a seat from the end of the row, free before 4:15 PM." |
| 14 | Rohan | T−30 sheet | "30 minutes left. Do nothing and unpaid seats are kept." |
| 15 | Rohan | Receipt | "Rohan paid for his seat and one kept seat. ₹1,108.56 went straight back." |
| 16 | Kabir | Late pay page | "Kabir pays late, before the show. The ticket moves to him and Rohan is refunded." |
| 17 | — | Controller | "That's the flow. Try the failure states here, or replay the tour." |

Tutorial actions auto-advance when the user performs the highlighted tap; `Next` also performs it for them.

---

## 8. Out of scope (don't build)
Home feed, discovery, search, F&B, offers and Club, reviews, chat beyond the simulated thread, wallets, login/onboarding, settings, events other than movies, a real backend.
