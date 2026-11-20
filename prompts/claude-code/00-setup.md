# 00 · Project setup, device frame and deploy

> **Claude Code prompt.** Run from the repo root. `CLAUDE.md` (which imports `AGENTS.md`) loads automatically.

**Before coding:** switch to plan mode, read the files listed under *Read first* (use the Read tool on the reference images), and show me the plan.
**When done:** take screenshots with `npx playwright screenshot --viewport-size=402,874 --device-scale-factor=3 <url> shots/<name>.png`, Read them next to the matching `reference/screens/` image, fix the 3 biggest differences, run `npm test`, then commit.

---

**Read first:** `AGENTS.md`, `docs/device-iphone17.md`, `docs/tokens.css`, `.github/workflows/deploy.yml`, `reference/README.md`

**Task**
1. Scaffold Vite + React 18 + TypeScript (strict) **in this repo root, which is not empty**: keep `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.agents/`, `.github/`, `docs/`, `reference/`, `prompts/`, `.gitattributes` untouched (scaffold into a temp folder and move the files in if needed). The repo is named `Navi-Design-Task` unless `git remote -v` says otherwise. Add Tailwind and map its theme (colours, radius, spacing, font) to the CSS variables in `docs/tokens.css` (import that file globally). Add Roboto 400/500/700 from Google Fonts.
2. Commit `package-lock.json`. Install: `zustand`, `motion`, `lucide-react`, `qrcode.react`, `vitest`, `@playwright/test`.
3. Set Vite `base` to `/<repo-name>/` (read the repo name from `git remote -v`). Use **hash routing** with routes `/` (demo stage placeholder), `/rohan`, `/friend/:name`, `/kit`.
4. Build `src/demo/DeviceFrame.tsx`: a 402 × 874 iPhone 17 frame with drawn status bar (time from props, default "9:41", signal/wifi/battery icons), Dynamic Island pill, rounded screen corners, home indicator, and a content area respecting top 62 / bottom 34 insets. When the window is ≤ 430 px wide, render children full screen with no frame and pad with `env(safe-area-inset-*)`.
5. `index.html`: viewport meta with `viewport-fit=cover`, `apple-mobile-web-app-capable`, status-bar style `default`, theme colour white. Add `public/manifest.webmanifest` with `display: standalone` and a simple red icon.
6. Build `src/dev/ReferenceOverlay.tsx`: when `?overlay=1` is in the URL, pressing `O` toggles a fixed overlay of `reference/screens/<file>` (chosen per route via a small map) with an opacity slider (0–100) and a "difference" blend toggle. Copy `reference/screens` into `public/reference` at build time (or import them) so the overlay works on Pages too.
7. Keep `.github/workflows/deploy.yml` as provided; make sure `npm run build` outputs to `dist` and `npm test` exists (an empty passing test is fine for now). Add `shots/` to `.gitignore`.
8. Create `docs/decisions.md` with a heading.

**Acceptance**
- `npm run dev` shows a blank white iPhone 17 frame on desktop and full screen on a 402 px window.
- `?overlay=1` + `O` shows `06-seat-layout-empty.jpg` over `/rohan`.
- After pushing to `main`, the GitHub Action deploys and `https://<user>.github.io/<repo>/` loads. (Remind me to enable Pages → Source: GitHub Actions in repo settings.)
