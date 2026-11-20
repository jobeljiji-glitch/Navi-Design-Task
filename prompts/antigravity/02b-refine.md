# 02b · Design-system refinement pass

The `/kit` page from step 02 works. This pass makes it match the real app more closely. Change only `src/ds/`, `src/kit/` (or wherever the /kit page lives), `public/illustrations/` and `docs/decisions.md`. Do not touch `src/logic/`, `src/store/`, `docs/spec.md`, `reference/` or `prompts/`.

New references added to `reference/screens/`:
- `16-m-ticket.jpg`: the real BMS M-Ticket screen
- `17-ios-share-sheet.jpg`: a real iOS 26 share sheet (light)
- `18-bookings-list.jpg`: "Your Bookings & Purchases"
- `19-seat-count-6.jpg`: the seat-count sheet with 4 price tiers

Also read `reference/screens/05-*.jpg` and `14-*.jpg` again. Open every reference image before changing the matching component.

## 1. Seat-count vehicle: use the real illustrations

- Delete the drawn vector scooter. Use `public/illustrations/seat-count/{n}.png` for n = 1–10.
- The images are 1 bicycle, 2 scooter, 3 auto, 4 small car, 5 sedan, 6 SUV, 7 van, 8 = copy of the van, 9 bus, 10 = copy of the bus.
- Show them centred, about 130 pt tall, with `object-fit: contain`, on the white sheet. Load them with `import.meta.env.BASE_URL` so they work on GitHub Pages.
- When the count changes, crossfade (150 ms) and slide the new vehicle in 12 pt from the left.
- Preload all 10 images when the sheet opens.

## 2. Seat-count sheet: match 05 and 19

- **Sheet:** a real bottom sheet, full width, flush to the screen edges. White background, 16 pt top radius, grabber, scrim over the seat map behind it. It shouldn't be a card with margins.
- **Title:** "How many seats?" at 22 pt, weight 400, left aligned, 16 pt margin.
- **Number row:** 1–10 spread evenly across the full width, 17 pt, weight 400. The selected number has a red filled circle, 36 pt across, with a white number.
- **Divider:** a hairline full-width line under the number row.
- **Tiers:** up to 4 equal columns, left aligned, **no truncation**. Use the full label from the reference ("RECLINER", "PRIME PLUS", and so on), wrapping to 2 lines if needed rather than showing "…".
  - Label: 12 pt, weight 400, grey, uppercase.
  - Price: 20 pt, weight 500.
  - "AVAILABLE": 12 pt, weight 500, green.
- **Button:** "Select seats" pinned at the bottom with 16 pt side margins and a home-indicator safe area below it.

## 3. iOS share sheet: rebuild to match 17

This is iOS chrome, not BMS. Use the system font stack `-apple-system, "SF Pro Text", system-ui`, never Roboto. On an iPhone this renders as real SF Pro.

SwiftUI isn't an option here: this is a web app on GitHub Pages. Copy the look in CSS.

- **Sheet:** background `#F2F2F7`, 38 pt top corner radius, full width, slides up with an iOS spring, with a dimmed backdrop.
- **Header:** a 60 pt white rounded-square preview tile on the left showing a small BMS group-hold card thumbnail. Next to it, one grey line of the message ("Rohan is holding 6 seats for Monsoon Heist…") at 15 pt, truncated. On the right, a 44 pt circular close button: white with a hairline border and a black ✕.
- **Hairline separators** between sections, inset 20 pt.
- **People row:** 4 visible with a horizontal scroll.
  - 64 pt circular avatars: initials on pastel fills, or the group icon for "Friday movie gang".
  - A small WhatsApp-green badge (22 pt rounded square, white chat glyph) at the bottom right of each avatar.
  - Name below in 2 lines max, 13 pt, black, centred.
- **Apps row:** 64 pt squircles with 14 pt radius: AirDrop (dark tile, blue rings), Messages (green bubble), Mail (blue envelope), WhatsApp (dark tile, green phone bubble). Labels at 13 pt.
  - Draw these as simple stylised SVGs, not copied logo files.
  - Tapping **WhatsApp** continues the existing flow.
- **Actions row:** 64 pt light-grey circles with black line icons: Copy, Save to Files and more. Labels at 13 pt.
- **Grouped list:** a rounded 12 pt `#E9E9EB` block with rows of 22 pt icon plus 17 pt label, separated by inset hairlines. Use generic rows: "Add to Reading List", "Add Bookmark", "Print". No third-party brands.
- **"Edit Actions":** a pill button centred at the bottom.

## 4. Ticket screen: rebuild to match 16

This is the friend's ticket after paying. Keep the group context, but base the layout on the real M-Ticket:

- **Header:** grey `#E5E5E5` backdrop. "SHARE YOUR TICKET" with a share icon, centred, 15 pt, letter-spaced. On the right, a 36 pt circular close button with a red outline and a red ✕.
- **Ticket card:** white, 16 pt radius, 20 pt side margins.
  - **Top part:** poster thumb (about 80 × 104 pt, radius 8) on the left. Then the title "Monsoon Heist (U/A)" at 20 pt, weight 500; "Hindi, 2D", "Fri, 20 Nov | 09:15 PM" and "Cineplex: Phoenix Marketcity, Kurla" at 15 pt grey. A vertical "M-Ticket" label rotated 90° on the right edge.
  - **Perforation:** two semicircle notches cut into the left and right edges, the same grey as the backdrop. Above them, a grey pill "Tap for support, details & more actions".
  - **Middle:** QR (about 120 pt) on the left. On the right, a centred column: "1 Ticket(s)" grey; "SCREEN 4" at 22 pt; "PP-D09" grey; "BOOKING ID: G7HK2Q9" at 14 pt, weight 500.
  - **Note band:** a grey band reading "Cancellation available till 8:55 PM".
  - **Footer:** "Total Amount" on the left and "₹ 277.14" on the right.
- **Group context:** a slim green strip directly above the card, inside the grey area: "You're in, next to Amit · 4 of 6 in". This is our only addition.
- **Below the card:** only the "Rate Movie"-style white row, here relabelled "View group". No rewards or ads, which are out of scope.

## 5. Bookings list card: match 14 and 18

Check the `BookingCard` against 18 at the same zoom:
- **Title:** 17 pt, weight 500.
- **Language and cinema lines:** grey, 15 pt.
- **Date line:** 17 pt, weight 500.
- **Ticket line:** "6 tickets: PP - D05…D10" at 15 pt, weight 500.
- **Labels:** "M-Ticket" grey at the top right; "SCREEN 4" at the bottom right.
- **Footer:** a full-width hairline above it, then the badge, a 1 pt vertical divider, and the message.
- **"Ordered on:" lines:** grey, sitting outside the card.

## 6. General type and spacing audit

For each of 05, 06, 08, 11, 12 and 14, open `/kit` and the reference side by side at 402 pt width, using the overlay where it helps. List the three biggest differences per screen in font size, weight, line height, padding or gaps, fix them, and record every change with its old → new value in `docs/decisions.md`.

Common things to check:
- Text in the kit tends to run one step too bold. BMS uses 400 for body and 500 for emphasis, and 700 almost never.
- Section padding should be 16 pt.
- Row heights in the price and payment lists are about 48–56 pt.

## Acceptance
- The seat-count sheet looks like 19 when 6 is selected, including the real SUV image.
- The share sheet reads as iOS at a glance next to 17.
- The ticket reads as a BMS M-Ticket next to 16.
- Capture `shots/02b-*.png` for the seat-count sheet, share sheet, ticket and booking card. Show them to me next to the references.
- `npm test` passes (29/29) and `npm run build` is clean.
- `git add -A`, commit "02b refine: real vehicle art, iOS share sheet, M-ticket, type audit", and push to main.
