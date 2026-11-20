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
