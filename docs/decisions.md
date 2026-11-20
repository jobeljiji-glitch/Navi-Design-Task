# Decisions

This file is maintained by agents. Each entry records a choice that isn't obviously specified by `docs/spec.md` or the reference screens.

| ID | Decision | Reason |
|----|----------|--------|
| D-001 | Manual scaffold (no `npm create vite`) | Repo root is not empty; scaffolding tools would fail or overwrite existing files (`AGENTS.md`, `GEMINI.md`, etc.). Files were written directly. |
| D-002 | Reference screens copied to `public/reference/` via a Vite plugin (`buildStart` hook) | Needed so the `ReferenceOverlay` component can load images on GitHub Pages, where `reference/` is not served. The copy happens at dev-server start and at build time. |
| D-003 | Vitest config inlined in `vite.config.ts` (not a separate `vitest.config.ts`) | Keeps project root cleaner; `vite.config.ts` supports a `test` key natively. |
| D-004 | PWA icon is a programmatically-generated plain red (`--bms-red`) square PNG | No real brand assets allowed. The icon exists solely to satisfy the web manifest requirement. |
| D-005 | Hash routing (`HashRouter` from react-router-dom v6) | Required for GitHub Pages to serve the app on deep links without server-side routing. |
| D-006 | `tsconfig.app.json` for src + `tsconfig.node.json` for Vite config | Vite 6 / TS 5 split-config convention; avoids type collisions between DOM and Node environments. |
| D-007 | 05 Seat Count Audit: Title `text-[18px] font-medium` → `text-[22px] font-normal`; Numbers `text-[14px]` → `text-[17px] font-normal`; Tiers centered `text-[11px]/text-[18px] bold` → left-aligned `text-[12px] 400`/`text-[20px] 500` no truncation | Matches reference 05 and 19. BMS uses 400 for regular titles and numbers with 36 pt red circle for selection, and un-truncated tier details. |
| D-008 | 06 & 08 Seat Layout Audit: Bottom CTA bar total amount `font-bold` → `font-medium text-[18px]`; Legend items gap & padding normalized to 16 pt section margins; Showtime pill 4 pt solid green indicator preserved | Eliminates overly bold 700 weights on pricing, aligning with BMS emphasis (500) over 400 body. |
| D-009 | 11 Confirm Booking Audit: Summary ticket count `font-bold` → `font-medium`; Line items `text-[14px]` → `text-[15px] font-normal`; Order total `font-bold` → `font-medium text-[18px]` | Real BMS booking confirmation uses medium weights for numbers and regular 15 pt for fee items rather than bold headings. |
| D-010 | 12 Payment Audit: Amount Payable header `font-bold` → `font-medium text-[20px]`; Row title `text-[14px] font-medium` → `text-[15px] font-normal`; Row padding `p-4` → `px-4 py-3.5` (52 pt height) | Calibrates payment option list to match native BMS list cell dimensions and typography in reference 12. |
| D-011 | 14 & 18 Bookings List Audit: "Ordered on" `text-[12px]` → `text-[13px]` outside card; Title/date `16-17px font-bold` → `17px font-medium`; Footer hairline divider full-width `-mx-4` with 1 pt vertical separator before status message | Matches reference 18 layout exactly where cards have an external timestamp and internal separated footer. |
| D-012 | 16 M-Ticket Redesign: Semicircle perforation cutouts using `#E5E5E5` pseudo-cutouts; rotated 90° "M-Ticket" text; support pill; 120 pt QR code; green group context strip above card | Implements authentic BMS M-Ticket structure from reference 16 with single-ticket group context addition. |
| D-013 | 17 iOS Share Sheet Redesign: System font stack `-apple-system, "SF Pro Text", system-ui`; 38 pt top radius; 60 pt preview tile; 44 pt close button; 64 pt pastel contact avatars with WhatsApp badges; 64 pt stylised app squircles | Native iOS share sheet presentation without third-party dependencies as specified in prompt 02b. |
