# Reference screenshots

Real BookMyShow iOS screens (plus two iOS system screens), captured on an iPhone at 402 × 874 pt and compressed to **736 × 1600 px**.

**Scale: 1 px in these files = 0.546 pt** (402 ÷ 736). Multiply any pixel measurement by 0.546 to get points / CSS px.

These are the **source of truth** for look and feel. Any unofficial "BookMyShow UI kit" found online is lower priority than these files.

| File | Screen | Used for | Rebuild it? |
| --- | --- | --- | --- |
| `01-home.jpg` | Home feed | Tab bar, header, type scale, card radius | No (out of scope). Reference only |
| `02-movie-detail.jpg` | Movie detail | Nav bar, primary CTA (`Book tickets`), chips, "Trending" pill | Partial: only as the entry point of the demo |
| `03-rating-sheet.jpg` | "Rated A" bottom sheet | Bottom sheet anatomy, scrim | No. Pattern reference |
| `04-showtimes.jpg` | Cinema + showtime list | Date strip, showtime pill (green left bar), list background | Partial: one cinema row as entry |
| `05-seat-count-sheet.jpg` | "How many seats?" sheet | Number picker, price tiers, CTA | **Yes**: gets the new group hint (step 1a) |
| `06-seat-layout-empty.jpg` | Seat layout, nothing selected | Seat grid, row labels, tier headers, screen, legend | **Yes** |
| `07-seat-layout-minimap.jpg` | Seat layout with minimap overlay | Minimap behaviour while scrolling | Optional |
| `08-seat-layout-selected.jpg` | Seat layout, 2 selected, `Pay ₹460` | Selected seat style, bottom CTA bar, Club strip | **Yes**: gets the two-button bar (step 1b) |
| `09-terms-sheet.jpg` | Terms & conditions sheet | Long-text sheet | No |
| `10-confirming-seats.jpg` | "Confirming your Seats!" loader | Loader sheet | **Yes**: reused for "Placing your hold" |
| `11-confirm-booking.jpg` | Confirm booking summary | Summary card, price breakdown, cancellation banner, sticky total bar | **Yes**: pattern for hold summary and receipt |
| `12-payment.jpg` | Payment options | Amount header, payment list rows | **Yes**: pattern for the UPI step and fallbacks |
| `13-ios-share-sheet.jpg` | iOS 26 share sheet (system UI) | Layout of the share step: text preview row, contact suggestions, app row, actions | **Yes**: simplified, with fictional contacts and a generic chat app |
| `14-your-bookings.jpg` | "Your Bookings & Purchases" | Booking card anatomy, status badges (FAILED, FINISHED) | **Yes**: the group-hold card and badge |
| `15-notifications.jpg` | BookMyShow push notifications (iOS lock screen) | Notification tone: short punchy title, often one emoji, body line | **Yes**: style of all prototype notifications |

## Real flow captured

Home → Movie detail → Rated-A sheet → Showtimes → Seat count sheet → Seat layout → (select seats) → T&C sheet → Confirming seats → Confirm booking → Payment → Your Bookings & Purchases

Note on `15-notifications.jpg`: the real reminder after an abandoned payment reads "You've ALMOST booked it! 🙈 Just finish your payment and enjoy…". BookMyShow notifications are playful, so the prototype's notifications follow that voice (see spec §4).

## Notes for agents

- Read the image files directly; you can see them.
- Do not copy film posters, cinema logos, the BookMyShow logo artwork, contact photos or third-party app icons (WhatsApp, Pinterest, etc.) into the prototype. Use the fictional demo data in `docs/spec.md` and a text wordmark.
- The film in these screenshots is real and copyrighted. The prototype uses an invented film.
