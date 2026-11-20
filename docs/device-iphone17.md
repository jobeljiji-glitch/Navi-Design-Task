# Target device: iPhone 17

| Property | Value |
| --- | --- |
| Screen (points = CSS px) | **402 × 874** |
| Native pixels | 1206 × 2622 (@3x, 460 ppi) |
| Status bar height | 54 pt |
| Safe area, portrait | top 62 pt, bottom 34 pt, left/right 0 |
| Dynamic Island | about 126 × 37 pt pill, centred, about 11 pt from the top (approximate; draw it, don't measure against it) |
| Home indicator | about 134 × 5 pt bar, centred, about 8 pt above the bottom edge (approximate) |
| OS | iOS 26 |

Source: Use Your Loaf, "iPhone 17 Screen Sizes" (useyourloaf.com/blog/iphone-17-screen-sizes/).

## How the prototype uses this

- **Laptop:** screens render inside a `DeviceFrame` component exactly 402 × 874, with a drawn status bar (time "9:41"; signal, wifi and battery icons), the Dynamic Island, and the home indicator. Content respects the 62 / 34 pt insets.
- **Real iPhone:** when the viewport is 430 px wide or less, **drop the frame** and render full screen, padding with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
  - `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
  - `<meta name="apple-mobile-web-app-capable" content="yes">` and `apple-mobile-web-app-status-bar-style` = `default`
  - A web app manifest with `"display": "standalone"` so "Add to Home Screen" opens it like an app.
- **Screenshots for comparison:** capture at 402 × 874, device scale factor 3.
