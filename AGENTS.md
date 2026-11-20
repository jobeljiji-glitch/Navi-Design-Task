# AGENTS.md: shared rules for every coding agent (Antigravity, Claude Code, others)

## What we're building
A high-fidelity, interactive **prototype** of a new BookMyShow feature, **Group Hold**, for a 48-hour product design assignment. It must look like the real BookMyShow iOS app on an **iPhone 17 (402 × 874 pt)** and *explain the solution*: two phones (organiser + friend) driven by a scenario controller, with an optional guided tutorial.

It is a prototype: **no backend, no real payments**. All state is simulated in the browser.

## Sources of truth (in this order)
1. `docs/spec.md`: behaviour, rules, timers, copy, demo data, failure states, tutorial. **Use its copy verbatim.**
2. `reference/screens/*.jpg` + `reference/README.md`: how the real app looks. Open the images and look at them.
3. `docs/design-system.md` + `docs/tokens.css`: tokens and component specs.
4. `docs/device-iphone17.md`: frame, safe areas, real-device behaviour.

If two sources disagree, the higher one wins. If something isn't specified, choose the option most like the real BookMyShow app and note it in `docs/decisions.md`.

## Stack (don't change without a reason in `docs/decisions.md`)
- Vite + React 18 + TypeScript (strict)
- Tailwind CSS, with **all colours, radii and spacing mapped to the CSS variables in `docs/tokens.css`**
- State: Zustand store wrapping a **pure reducer** (`src/logic/`) that implements `docs/spec.md`
- Motion: `motion` (Framer Motion) for sheets, transitions and coach marks
- Icons: `lucide-react` with `strokeWidth={1.75}`
- QR: `qrcode.react`
- Tests: Vitest for `src/logic/`; Playwright for screenshots
- Font: Roboto (Google Fonts) 400/500/700
- Router: **hash routing** (`/#/…`), so GitHub Pages works on refresh
- Deploy: GitHub Pages via `.github/workflows/deploy.yml`; Vite `base` = `/<repo-name>/`

## Folder layout
```
src/
  logic/        pure domain: types, reducer, selectors, money math, clock (NO React)
  store/        Zustand store + simulated clock driver
  ds/           design-system components (tokens only, no raw hex)
  screens/      rohan/, friend/, upi/, chat/, shared/
  demo/         DeviceFrame, DemoStage, Controller, Tutorial (coach marks), PersonaSwitcher
  dev/          ReferenceOverlay (dev only)
docs/           spec, design system, tokens, device, decisions.md (agents append)
reference/      screenshots (read-only)
```

## Hard rules
- **No raw hex values in components.** Use tokens. Add a token if something is missing, and note it.
- **Logic lives in `src/logic/` and is unit-tested** before any UI uses it. Screens only read selectors and dispatch events.
- **Money:** use integer paise internally; format as `₹1,662.84` (Indian grouping, two decimals).
- **Time:** all time comes from the simulated clock in the store. Never call `Date.now()` in components.
- **No real brand assets:** no film posters, cinema logos, bank logos, WhatsApp or other third-party app icons, real contact photos, or BookMyShow logo artwork. The film, cinema and people are fictional (see spec). The chat screen is labelled "Chat (simulated)" and the UPI app is generic.
- **Accessibility:** tap targets ≥ 44 pt; every icon button has an `aria-label`; text contrast ≥ 4.5:1.
- **Out of scope:** see spec §8. Don't build it.

## Verification loop (do this for every screen)
1. Run the dev server and open the screen at **402 × 874**.
2. Turn on the reference overlay (`?overlay=1`, key `O`) for screens that have a reference, and compare in "difference" mode.
3. Take a screenshot, compare it with the reference image side by side, and list the 3 biggest differences. Fix them.
4. For logic: `npm test` must pass.
5. Commit with a message naming the step (e.g. `step-2: hold summary sheet`).

## Definition of done (whole prototype)
- Tutorial runs start to finish without errors; "Skip tour" leaves everything usable.
- Every ★ failure in spec §5 can be triggered from the controller and shows the specified copy.
- Laptop view shows both phones + controller; on an iPhone the app fills the screen with correct safe areas.
- Deployed to GitHub Pages and the link works logged out on a phone.
