# Design fidelity rules

- Match `reference/screens/` before inventing. If a screen has a reference, rebuild the reference first, then add the new elements.
- Use only variables from `docs/tokens.css` (via Tailwind theme). No raw hex, no arbitrary pixel colours.
- Sizes are in pt = CSS px at 402 wide. Reference images are 736 px wide: multiply measured pixels by 0.546.
- Copy is verbatim from `docs/spec.md` (new UI) or from the screenshots (existing UI).
- Line icons from `lucide-react`, `strokeWidth={1.75}`, 24 pt box unless the reference is clearly smaller.
- Bottom sheets: 70% black scrim, 16 pt top radius, grabber, iOS-style spring (`type: "spring", damping: 30, stiffness: 300`).
- Every new component (see design-system.md §5 "New") must look like it belongs in the app: same type scale, radii, greens and reds.
- Verify with the reference overlay (`?overlay=1`) and a 402 × 874 screenshot before finishing.
