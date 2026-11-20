# Consistency checklist (09)

Every screen and sheet is checked against these rules. Values are pt (= CSS px at 402 wide). Tokens live in
`docs/tokens.css`; the copy rules are enforced by `src/logic/__tests__/copy-lint.test.ts`, the layout rules by
`e2e/cta-visible.spec.ts`, `e2e/card-clipping.spec.ts` and `e2e/qa.spec.ts`.

## Rules

| Area | Rule |
| --- | --- |
| **Type scale** | Screen / sheet titles 20/400 (line 26; two-line headers 20/24 + 13/17 subtitle). Card titles 16/500 (18/500 for the status card's main line). Rows 14–15/400. Secondary 13–14/400 `--text-secondary`. Captions 12/400. Money headline 24/500. Weights: 400 and 500 only (600/700 only in the logged exceptions D-057, D-058, D-066). |
| **Cards** | `Card` from `src/ds/Surface.tsx`: white, radius 8, `--card-shadow`, 16 pt padding, never clips (D-077). Containment inside sheets uses `SoftGroup` (`--bg-muted`, radius 8). Bands (`Band`) flush on a card's bottom edge or standalone. |
| **Pinned CTA** | Every screen and sheet with a primary action uses `PinnedFooter` (or `BottomSheet`'s footer, which renders one): white, top hairline, 16 pt margins, 10 pt above, `cta-safe` below. The CTA never scrolls away. Two actions: a row (Decline / Approve, More / Share link again) or a primary + text link underneath. |
| **Glossary** | Held (seats) · Blocked (money reserved, not charged) · To cover · Charged · Kept (an unpaid seat Rohan pays for, never next to a timer) · Released (seats) · Unblocked (only at settlement) · Refunded (pay-all-now rail only). Never "set aside", "went back", "Most you could pay", IPO/ASBA. |
| **Short copy** | One idea per line; no on-screen sentence over ~12 words (lint: 12); no widows on wrapped lines (`text-balance` on headings, toasts and captions; `text-pretty` on body). |
| **Icons** | `lucide-react`, `strokeWidth={1.75}`. 24 nav/back/more · 20 rule rows and sheet rows (22 in the More sheet) · 16–18 inline and chevrons. Exceptions: 10–12 pt glyphs inside seat tiles and the story list keep 2.5 for legibility. |
| **Spacing** | 16 pt side margins; 12 pt between cards; rows ≥ 44 pt hit area, list rows 48–56 pt; payment-method rows 56 pt. |
| **Sheet anatomy** | Grabber (unless locked) · 20/400 title + 14 pt grey subtitle · body (only part that scrolls) · pinned footer. 88% max height, 70% scrim, spring 30/300. |
| **Payment rows** | `PaymentMethodRow` / `PaymentMethodList`: 32 pt icon tile, 15 pt title + 13 pt grey sub-line, radio (choice) or chevron (next step), 12 pt uppercase section label. Used by hold settings "Pay with", the friend's "Pay ₹277.14 with" and the ref-12 Payment screen (`PaymentRow` wraps it). |
| **Status colours** | Success `--text-success` / `--bg-success`; warning `--text-warning` / `--bg-warning`; muted `--text-secondary` / `--bg-muted`; brand red only for actions and the "Step n" label. Seat tiles: paid green, held dashed amber, paying amber, kept amber outline, released grey. |
| **Numbers and dates** | Money via `formatINR` only (`₹1,662.84`: Indian grouping, two decimals; `formatINRShort` only in fee sub-lines). Times "9:15 PM"; day + time "Fri, 9:15 PM"; relative "Today, 9:15 PM". The ref-14 booking card keeps its own "Fri, 20 Nov, 2026 \| 09:15 PM". |
| **Back buttons** | Bare 24 pt `ChevronLeft`, 44 pt hit area, `aria-label="Back"`, no circle (D-027). The simulated chat keeps its own 28 pt chat-app chevron (D-066). |
| **Toasts** | One surface: `.toast-surface` (`--toast-bg`, `--text-on-brand`), 13/500, pill (or radius 12 when it wraps), centred under the header. |
| **Colours** | Tokens only. No raw hex or Tailwind palette colours in components (art exceptions: none left). |

## Screens checked

Movie detail · Showtimes · Seat count sheet · Seat layout (+ hold / pay bar, limit toasts) · Hold sheet · Hold
settings · Shorten · UPI approval (block, card, payment, friend pay) · PIN pad · Group hold (success) · Share
sheet (link, reminder card) · Chat · Board (active, closed) · Release · T−30 · Cover · More · Shorten · Add a seat ·
Cancel · Settlement · Receipt (provisional, final) · Transfer · Orders · Confirm booking · Payment · Friend pay
page · Cancellation · Can't make it · Phone · OTP · Pay with · Pending / failed · Ticket · Declined · Late / ended
/ started · Coach bubble and pill · Done card.

## Findings and fixes (09)

| # | Where | Mismatch | Fix |
| --- | --- | --- | --- |
| 1 | Board, Receipt, Group hold, Friend late page, Showtimes, Seat layout | Toasts used Tailwind `bg-black/85 text-white` (raw palette colours) | `.toast-surface` with the new `--toast-bg` token |
| 2 | Movie detail poster | Raw hex gradient and rain colour | `--poster-1…4`, `--poster-rain` (already in tokens for `PosterArt`) |
| 3 | Seat layout Club strip | Raw `#FFFBEB` fallback and `#FDE68A` border | `--bg-club`, new `--club-border` |
| 4 | Payment (ref 12) wallet glyph | Tailwind `bg-cyan-500 text-white` | New `--pay-glyph-teal`, `--text-on-brand` |
| 5 | Confirm booking, Seat layout, SummaryCard edit pencils; Movie detail trend icon; settlement check | `strokeWidth` 2 / 2.25 | 1.75 |
| 6 | UPI approval default details, kit samples | "Fri 9:15 PM" (no comma) | "Fri, 9:15 PM" (D-044) |
| 7 | Hold sheet | Scrolled at 874 pt on smaller text sizes; price columns + band + two-line settings | One money line (expands), two icon rule rows, one settings row: fits with no scrolling |
| 8 | Group hold (success), Board, Receipt, Friend pages, UPI approval | CTA followed the content and could scroll away (D-047) or used ad-hoc bars | `PinnedFooter` everywhere |
| 9 | Hold settings, Friend "Pay with", Payment | Three different payment-row designs (radio rows, 3-up tiles, ref-12 rows) | One `PaymentMethodRow` / `PaymentMethodList` |
| 10 | Receipt seat rows | "—" as the person on unnamed seats; long status wrapping to a widow | Status leads ("Kept"), the note goes on the second line |
| 11 | Seat layout limit toasts | Long toast left a one-word last line ("pay now.") | `text-balance` |
| 12 | Friend "Can't make it" sheet | "Yes, let him know" guessed a pronoun | "Yes, let Rohan know" |
| 13 | Copy across board, sheets, notifications, SMS, tour, README, spec | "set aside", seat-by-seat "unblocked", refunds on Reserve Pay | Glossary words; lint extended |
| 14 | Tour bubble | Could cover the pinned CTA or sheet content; `scrollIntoView` shifted open sheets | Avoids footer and sheet content (or collapses to the pill); scrolls only real scroll containers |
| 15 | Board "Who's in" status list | Grouped by person; unpaid friends named whether or not BMS knew them | One row per seat; names only when known ("Sana · D09 · Opened, not paid", "D10 · Not opened yet") |
| 16 | Board "Who's in" tiles | A kept seat was green like a paid one | Amber solid outline (`--seat-held-fill` / `--seat-held-border`), amber caption |
