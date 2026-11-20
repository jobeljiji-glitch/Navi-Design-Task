# BookMyShow design system (reconstructed)

Reconstructed from the 12 screenshots in `reference/screens/`. Colours were sampled from the images; sizes were measured in pixels and converted with **1 px = 0.546 pt**.

**Confidence levels**
- **Measured**: sampled or measured from screenshots. JPEG compression can shift colours by a few values.
- **Estimated**: judged by eye. Verify with the reference overlay (see "Fidelity workflow").

Every component must use the tokens in `docs/tokens.css`. **No raw hex values inside components.**

---

## 1. Colour

### Brand and actions

| Token | Value | Where seen | Confidence |
| --- | --- | --- | --- |
| `--bms-red` | `#EB4E63` | `Select seats`, `Pay ₹460`, selected date tile | Measured |
| `--bms-red-strong` | `#DB354B` | `Book tickets` (movie detail), `Continue` (confirm booking) | Measured |
| `--bms-red-text` | `#D04B5E` | "2 Tickets" edit link, "See All", "Read more" | Measured |
| `--bms-star` | `#EF7685` | Rating star | Measured |

The real app uses two slightly different reds. Use `--bms-red` for the seat and payment flow and `--bms-red-strong` for the movie detail and confirm screens, matching what's observed.

### Seats and showtimes

| Token | Value | Where seen | Confidence |
| --- | --- | --- | --- |
| `--seat-available-border` | `#1FAD3D` | Available seat outline (1 pt) | Measured (border pixels are blended; pill green used) |
| `--seat-number` | `#259A3F` | Seat number inside an available seat | Measured |
| `--seat-selected` | `#1FAD3D` | Selected seat fill (white number) | Measured, observed fill `#48B361` after compression |
| `--seat-sold` | `#EFEFEF` | Sold seat fill, light-grey number | Measured |
| `--showtime-green` | `#1FAD3D` | Showtime pill border and left bar, showtime chip on seat map | Measured |
| `--screen-tint` | `#D5F1FF` | The "screen" shape at the bottom of the seat map | Measured |

### New seat states (designed for this project, in BMS style)

| Token | Value | Meaning |
| --- | --- | --- |
| `--seat-held` | `#FFF4D6` fill, `#E8A317` 1 pt dashed border | Held for the group, unpaid |
| `--seat-paying` | `#FFE7A3` fill | A friend is paying right now (5-min lock) |
| `--seat-paid-friend` | `#1FAD3D` fill + first-name label | Paid by a group member |
| `--seat-released` | `--seat-sold` | Released back to sale |

### Text

| Token | Value | Where seen | Confidence |
| --- | --- | --- | --- |
| `--text-primary` | `#1C1C1C` | Titles (observed `#000`–`#343434`) | Measured |
| `--text-secondary` | `#5C5C5C` | Subtitles, cinema names, tier labels | Measured |
| `--text-tertiary` | `#8A8A8A` | Captions, "indicates subtitle language" | Estimated |
| `--text-success` | `#0B7221` | "36.03K tickets booked…" | Measured |
| `--text-link` | `#1E63D6` | "view cancellation policy" | Estimated (sample unreliable) |

### Surfaces

| Token | Value | Where seen | Confidence |
| --- | --- | --- | --- |
| `--bg-page` | `#F2F6F9` | Showtimes list, confirm booking and payment page background | Measured |
| `--bg-header-strip` | `#F3F7FA` | Date and showtime strip on the seat map | Measured |
| `--bg-surface` | `#FFFFFF` | Cards, sheets | Measured |
| `--bg-muted` | `#F5F5F5` | Rating chip, home header | Measured |
| `--bg-tag` | `#DCDCDC` | "2D, EPIQ" format tags | Measured |
| `--bg-success` | `#E7FCED` | "Cancellation Available" banner | Measured |
| `--bg-amount` | `#FAF7E4` | "Amount Payable" header on the payment page | Measured |
| `--bg-club` | `#FAEDC3` | Club upsell strip | Measured |
| `--trending-blue` | `#648FFF` | "Trending" pill | Measured |
| `--scrim` | `rgba(0,0,0,0.70)` | Behind bottom sheets (white becomes `#4C4C4C`) | Measured |
| `--sheet-handle` | `#C9C7CC` | Grabber on bottom sheets | Measured |
| `--divider` | `#E6E6E6` | Hairlines between rows | Estimated |

---

## 2. Typography

**Font:** the app's text renders like **Roboto** (Google Fonts). Use `Roboto` with weights 400, 500 and 700, and a fallback of `-apple-system, "SF Pro Text", system-ui`. The **iOS status bar** uses SF Pro (system font). Verify the font against the overlay early; if it doesn't match, try `Inter` and compare.

| Style | Size / line height (pt) | Weight | Example | Confidence |
| --- | --- | --- | --- | --- |
| Nav title | 17 / 22 | 500 | "Bachelor Party D'eux" | Estimated |
| Nav subtitle | 13 / 18 | 400, secondary | "INOX: R-City, Ghatkopar" | Estimated |
| Sheet title | 18 / 24 | 500 | "How many seats?" | Estimated |
| Section heading | 16 / 22 | 500 | "Top offers for you" | Estimated |
| Body | 14 / 20 | 400 | Descriptions, rows | Estimated |
| Caption | 12 / 16 | 400, secondary | Legends, helper text | Estimated |
| Tier label | 12 / 16, tracking +0.5, uppercase | 400, secondary | "₹ 250 PRIME PLUS ROWS" | Estimated |
| Seat number | 9 / 12 | 400 | "01" | Estimated |
| CTA label | 16 / 20 | 500, white | "Pay ₹460" | Estimated |
| Price total | 18 / 24 | 700 | "₹514.28" | Estimated |

---

## 3. Spacing, size and radius

| Token | Value (pt) | Measured from | Confidence |
| --- | --- | --- | --- |
| Screen side margin | 16 | CTA starts at 30 px | Measured |
| Primary CTA height | 40 | 1450–1521 px | Measured |
| Primary CTA radius | 6 | Visual | Estimated |
| CTA bottom offset | 43 from screen bottom (34 home-indicator inset + 9) | Measured |
| Seat box | 20 × 20 | 36–37 px | Measured |
| Seat pitch (box + gap) | 26 | 48 px | Measured |
| Seat radius | 3 | Visual | Estimated |
| Seat border | 1 | 2 px | Measured |
| Seat-count number circle | 36 diameter | 66 px | Measured |
| Date tile | 65 × 78 | 120 × 144 px | Measured |
| Showtime pill | 110 × 39, 4 pt green left bar, 1 pt green border, radius 2 | Measured |
| Bottom sheet top radius | 16 | Visual | Estimated |
| Sheet grabber | 36 × 4, radius 2, 8 pt from top | Estimated |
| Card radius | 8 | Visual | Estimated |
| Spacing scale | 4, 8, 12, 16, 20, 24, 32 | — | Convention |

---

## 3b. Voice

BookMyShow's own notifications are short and playful, often with one emoji (see `15-notifications.jpg`: "You've ALMOST booked it! 🙈"). Prototype notifications follow that voice: a punchy title, at most one emoji, then a plain factual body. Screen copy stays plain.

## 4. Icons and imagery

- **Icons:** line icons, about 1.75 pt stroke, 24 pt box. Use **Lucide** (`lucide-react`) at `strokeWidth={1.75}`. Never copy BMS icon files.
- **Posters:** the film is fictional. Use a generated abstract poster (CSS gradient + title type), not a real film's artwork.
- **Logos:** no cinema or bank logos. Use neutral initials in a rounded square ("CP" for the fictional cinema).
- **BookMyShow mark:** text only where needed; don't reproduce the logo artwork.

---

## 5. Components to build

### Existing (match the screenshots)

| Component | Reference | Key specs |
| --- | --- | --- |
| `NavBar` | 02, 06, 11 | Back chevron, title + optional subtitle, right actions; 17 pt title |
| `PrimaryCTA` | 05, 08, 11 | Full width minus 16 pt margins, 40 pt high, red, white 16 pt label; disabled = 40% opacity |
| `BottomCtaBar` | 08, 11 | White, top hairline, safe-area padding; optional left total ("Total ₹514.28") |
| `BottomSheet` | 03, 05, 09 | Scrim 70%, 16 pt top radius, grabber, slide up with iOS spring |
| `SeatCountPicker` | 05 | Numbers 1–10, selected in red 36 pt circle, illustration above |
| `PriceTierList` | 05 | Tier name (caps, secondary), price (bold), "AVAILABLE" in green |
| `DateStrip` | 04 | 65 × 78 tiles, selected red with white text |
| `ShowtimePill` | 04, 06 | Green left bar and border, time centred |
| `SeatGrid` | 06, 08 | Row letters left, tier headers, 20 pt seats on a 26 pt pitch, aisles as gaps |
| `Seat` | 06, 08 | States: available, selected, sold, plus new ones (held, paying, paid-friend, released) |
| `ScreenShape` | 06 | Light-blue trapezoid + "All eyes this way please!" |
| `SeatLegend` | 06 | Available, Selected, Sold, plus new states when relevant |
| `SummaryCard` | 11 | White card, 8 pt radius, title, meta lines, M-Ticket edit link |
| `PriceBreakdown` | 11 | Label/value rows, dashed divider, bold total |
| `InfoBanner` | 11 | Success-green background, title + body + link |
| `PaymentRow` | 12 | Icon, title, subtitle, chevron, optional "Last Used" tag |
| `AmountHeader` | 12 | Pale yellow strip, label left, amount right with a zigzag bottom edge |
| `LoaderSheet` | 10 | Ticket illustration, message, three red dots |
| `BookingCard` | 14 | White card: poster thumb (≈ 72 × 96 pt, radius 4) left; title 17/500, language secondary, "Fri, 20 Nov, 2026 \| 09:15 PM" 16/500, cinema secondary, "6 tickets: PP - D05…D10" 14/500, "M-Ticket" top right secondary, "SCREEN 4" bottom right; hairline; footer row with `StatusBadge` + message |
| `StatusBadge` | 14 | Filled rounded rect (radius 4, 6 pt × 10 pt padding), white caps 13/500: FAILED `--badge-failed`, FINISHED `--badge-finished`; new: GROUP HOLD `--badge-hold`, CONFIRMED `--badge-confirmed` |
| `IosShareSheet` | 13 | System sheet, `--ios-sheet-bg`, close ✕ circle top right; row 1: text preview tile + message preview; row 2: contact suggestions (60 pt circles, small chat-app badge); row 3: app icons (AirDrop, Messages, Mail, **Chat**); row 4: actions (Copy…). Fictional contacts only; generic chat icon, never the WhatsApp logo |
| `IosNotification` | 15 | iOS banner at the top of the DeviceFrame: dark translucent rounded rect (radius 22), app icon tile left, bold title (one line, truncates), body (2 lines), "now" right. Slides down, stays 4 s, tap opens the relevant screen |

### New (designed for this project in BMS style)

| Component | Step | Purpose |
| --- | --- | --- |
| `GroupHint` | 1a | Blue info card in the seat-count sheet |
| `DemandBanner` | 1b | Three variants: plenty / steady / filling fast |
| `DualCtaBar` | 1b | "Hold for group" (outline) + "Pay ₹X" (filled) |
| `MoneyLedger` | 2, 8, 9 | Three lines: now / blocked / most you could pay |
| `BlockMeter` | 7 | Stacked bar: you paid · friends paid · still blocked |
| `GroupStatusList` | 7 | Paid / paying / can't make it / waiting (count), inline actions |
| `AvatarStack` | 5, 7 | Initials circles, overlap −6 pt |
| `KeepReleaseStepper` | 8 | Two linked counters |
| `UpiMandateScreen` | 3 | Generic UPI app (neutral, no brand) |
| `ChatThread` + `LinkPreviewCard` | 4 | Simulated chat, labelled "simulated" |
| `OtpInput` | 6 | 4 boxes, auto-advance |
| `TicketCard` | 6 | QR, seat, "You're in, next to Amit" |
| `CoachMark` | Tutorial | Bubble with arrow, step count, Next / Skip |
| `DeviceFrame` | Demo | iPhone 17 frame (see `docs/device-iphone17.md`) |

---

## 6. Fidelity workflow (how to get close to the real app)

1. **Tokens first.** Fill `docs/tokens.css`; components may only use these variables.
2. **Reference overlay.** A dev-only tool (toggle with the `O` key) puts the matching screenshot over the screen at 50% opacity, with a slider and a "difference" blend mode. In difference mode, a perfect match is black; misaligned elements light up.
3. **Rebuild three existing screens first** (seat-count sheet, seat layout, confirm booking) and match them with the overlay before designing new screens. This locks the visual language.
4. **Copy text verbatim** from the screenshots for existing UI ("How many seats?", "All eyes this way please!", "Confirming your Seats!").
5. **Screenshot loop:** after each screen, capture it at 402 × 874 and compare it side by side with the reference. Fix the three biggest differences, then move on. Don't chase single pixels.
6. **Real device check:** open the GitHub Pages link on an iPhone, Add to Home Screen, and compare against the real BookMyShow app.
