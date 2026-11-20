# 03b · Fix the baseline flow: function, fidelity, speed

These issues come from testing on a real iPhone. Fix all of them.

Before starting, read `AGENTS.md`, `docs/spec.md`, `docs/design-system.md`, `.agents/rules/*` and `docs/decisions.md`, and keep every decision already logged there.

**Files you may touch:**
- `src/screens/rohan/`, `src/ds/`, `src/App.tsx`, `public/`, `docs/decisions.md`;
- **new** files in `src/logic/`, with tests.

**Do not edit** existing files in `src/logic/`, or anything in `reference/` or `prompts/`.

**New references:**

| File | What it is |
|---|---|
| `reference/screens/20-showtimes-real.jpg` | Real cinema/showtime list |
| `reference/screens/21-seat-layout-scroll.jpg` | Real seat map at true size, scrolling sideways, screen and legend at the bottom |
| `reference/screens/22-confirm-booking-real.jpg` | Real confirm-booking screen |
| `reference/current/*-ours.jpg` | Our current build on the iPhone, so you can see what's wrong |

Open each pair (ours vs real) before you change the screen.

## A. Flow bugs (function first)

1. **Showtime → seat count.** Tapping the 9:15 PM pill must open the seat layout **with the "How many seats?" sheet already up**, as in the real app. The count chosen there sets the ticket count. Choosing "Select seats" closes the sheet and shows the map. The "✎ N Tickets" control reopens the same sheet. Right now the sheet only opens from the edit button.

2. **Group seat picking.** Write this as a pure function in a **new** file, `src/logic/seatPick.ts`, with tests in `src/logic/__tests__/seat-pick.test.ts`.
   - `pickSeats(layout, selected, tappedSeat, ticketCount) → newSelected`
   - **Tapping when nothing is selected, or when the selection is already full:** clear it, then select the tapped seat plus the seats to its **right** in the same row and tier, up to `ticketCount`. Stop at a sold seat, an aisle gap or a tier boundary.
   - **Not enough room to the right:** extend **left** from the tapped seat, under the same rules.
   - **Still short** (the block of free seats is smaller than `ticketCount`): keep what fits selected, show a toast "Select {remaining} more seat(s)", and let the **next tap** add the remaining seats using the same rule from the new seat.
   - **Tapping a seat that's already selected while the selection is incomplete:** deselect just that seat.
   - **Test cases:** 5 seats in an open row; a free block of 3 next to a sold seat, then a second tap; tapping near the right edge (extends left); a tier boundary; tapping again after the selection is full (resets).
   - **Demo default:** with 6 tickets, tapping D05 selects D05–D10.

3. **Pay → "Confirming your seats" loader.** After tapping Pay on the seat layout, show the `LoaderSheet` (ticket graphic, "Confirming your Seats!", 3 pulsing dots) for **1,200 ms**, then go to Confirm booking. Currently it's skipped or too fast to see.

4. **Context cinemas** (INOX, Cinepolis) on the showtimes list should look **normal, not greyed out**. Tapping them shows a toast: "Demo: only Cineplex Kurla 9:15 PM is live".

## B. Showtimes screen: match 20

- **Date strip:** tiles **without borders or gaps**. The selected day is a solid red tile flush to the left edge, full strip height. Other days are white with black day and date text; days that aren't available (23–25) are light grey.
- **Language row:** "Hindi • 2D", 15 pt, weight 500, then a hairline.
- **Filter chips:**
  - "Sort by": grey outline, red sort icon, chevron.
  - "Special Formats ⌄", "Cancellable", "₹0 – ₹…": **red outline and red text**, fully rounded, 15 pt.
  - A vertical divider after Sort by.
- **Cinema cards:** white, about 22 pt side margins, sitting on the light-grey page.
  - 56 pt logo tile (rounded 8, light border, brand initials in the cinema's colour).
  - Name at 17 pt, weight 500, with an ⓘ icon.
  - Heart outline at the right. Under it, a pale-blue "Visited" tag, flush to the card's right edge.
  - A row with a directions icon and "3.1 km | Cancellation available", 15 pt grey.
- **Showtime pill:** about **200 × 72 pt**, white, 1 pt green border, **4 pt green bar on the left**, with the time **centred** at 17 pt.
  - The text must not overlap the bar (it does now).
  - **Remove the "SCREEN 4" badge.** The real pill has none. Put "ENG" or "LASER" small and grey under or next to the time only where the reference does.
- **Bottom toast:** "LAN indicates subtitle language, if available", "1/2", and a grey circular ✕.

## C. Seat layout: match 21 (biggest problem)

The grid is squashed to fit the width. **Use the real size and scroll sideways.**

- **Header:** back chevron; title "Monsoon Heist - Hindi" at 17 pt, weight 500; cinema below at 15 pt grey. No ticket control in the header.
- **Strip under the header:** light-grey background. "Fri, 20 Nov" on the left, "✎ 6 Tickets" in red on the right. On the next line, the selected **green showtime pill** left-aligned, about 110 × 40 pt, white text.
- **Remove the empty ~96 pt gap** above the first tier header.
- **Seats at true size:** 20 × 20 pt tiles, **26 pt pitch**, 3 pt radius, 9 pt numbers.
  - The grid area scrolls **horizontally** (and the page scrolls vertically).
  - Row letters sit in a **sticky left column** that doesn't scroll sideways.
  - On open, scroll horizontally so the selected or target block (D05–D10) is centred.
  - Keep aisle gaps where the layout has them.
  - Use `touch-action: pan-x pan-y`. iOS momentum scrolling should feel native.
- **Tier headers:** "₹ 250 PRIME PLUS ROWS", 13 pt, weight 400, grey, letter-spaced, followed by a hairline running to the right.
- **Under the last row:** the **screen shape** (light-blue trapezoid) and "All eyes this way please!" centred under it. Then the **legend** row (Available / Selected / Sold). Then the **Club banner**, kept as a static visual (Add Club does nothing).
- **Pay bar:** appears only once at least 1 seat is selected. "Pay ₹1,500" for D05–D10, calculated, 48 pt high, with a safe-area inset.

## D. Confirm booking: match 22

- **Page:** light-grey background (`#F2F3F5`-ish). The header sits on the same grey, with **no white bar**: back chevron, "Confirm booking" at 20 pt, weight 400.
- **Summary card** (white, radius 8, 15 pt side margins):
  - Line 1: "Monsoon Heist" at 20 pt, weight 500, with the ticket count "6" right-aligned at the same size.
  - Line 2: "Fri, 20 Nov, 2026 | 09:15 PM" at 17 pt, weight 500, with "✎ M-Ticket" in red on the right.
  - Then, at 15 pt grey: "Hindi (2D)", "PRIME PLUS - D05, D06, D07, D08, D09, D10", "Cineplex: Phoenix Marketcity, Kurla (SCREEN 4)".
  - Age row: a red-outlined "16+" circle, then "This movie is only for audience above the age of 16" at 15 pt **black**. No divider line above it.
  - The **cancellation band is inside the card**, flush to its bottom edge, sharing its bottom radius. Pale green: "Cancellation Available" (15 pt, weight 500), then "This venue supports booking cancellation." Not a separate card, and no blue link.
- **Price card:**
  - "Ticket(s) price" and "Convenience fees ⌄" in **grey 15 pt**, values in black 15 pt. No "1 ticket" or "Base fee & taxes" sub-labels. The ⌄ expands the fee breakdown.
  - "Give to Underprivileged Musicians" (15 pt black), "(₹1 per ticket) VIEW T&C" (13 pt grey, underlined), with "₹0.00" and "Add ₹6.00" in red on the right.
  - A dashed divider, then "Order total" (17 pt, weight 500) and the amount right-aligned at **the same size**. Not 20 pt bold.
  - **Leave out** the Club purchase row, the Club upsell card and Apply Offers. Offers and loyalty are out of scope.
- **"For Sending Booking Details" card:** title 17 pt, weight 500, with "✎ Edit" in red. Then "+91-98XXXXXX10 | rohan.m@gmail.com" and "Maharashtra (for GST purposes)", both 15 pt grey.
- **Bottom bar:** white with a hairline on top. "Total" (13 pt grey) above "₹1,662.84" (20 pt, weight 500) on the left. On the right, a "Continue" button about 46% wide, 48 pt high, radius 6, **strong red**.

## E. Movie detail and payment touch-ups

- **Movie detail:** remove the "FICTIONAL DEMO FILM" label from the poster. Keep the title and tagline.
- **Payment:** check it against 12 for font sizes. The section labels look a size too big. The amount header should read "₹1,662.84" for the 6-seat path.

## F. Speed

- **Vehicle illustrations:** switch to `public/illustrations/seat-count/{n}.webp` (about 5 KB each instead of about 50 KB PNG). Use `<img decoding="async">` with explicit width and height. Start **preloading all 10 when the showtimes screen mounts**, so they're cached before the sheet opens.
- **Code splitting:** lazy-load the `/kit` route and the dev `ReferenceOverlay` with `React.lazy`, so they aren't in the main bundle. Lazy-load each later flow (friend, board, demo stage) by route.
- **Fonts:** add `<link rel="preconnect">` for fonts.googleapis.com and fonts.gstatic.com, use `display=swap`, and load only Roboto 400 and 500. Drop 700 if it isn't used.
- **Production bundle:** make sure `reference/` and `shots/` images aren't in it. The overlay can still fetch `public/reference/*` on demand.
- **Report** the main JS bundle size (gzip) before and after, in the summary.

## Acceptance
- Every A-item works on a phone-sized viewport:
  - showtime → sheet → 6 → tap D05 → D05–D10 selected → Pay ₹1,500 → loader → Confirm booking ₹1,662.84 → Payment ₹1,662.84.
- `seat-pick.test.ts` passes, along with all 29 existing tests.
- Capture `shots/03b-showtimes.png`, `03b-seat-sheet.png`, `03b-seat-layout.png` (with D05–D10 selected), `03b-loader.png`, `03b-confirm.png` and `03b-payment.png`, and show each next to its reference.
- Log every change in `docs/decisions.md`.
- `npm run build` is clean. Then `git add -A`, commit "03b fix flow: seat sheet on showtime, group seat pick, true-size seat map, confirm booking fidelity, perf", and push to main.
