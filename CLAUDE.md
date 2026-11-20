@AGENTS.md

# Claude Code specifics

- **Plan first.** For each prompt in `prompts/claude-code/`, start in plan mode, show the plan, then implement.
- **Look at the references.** Use the Read tool on `reference/screens/*.jpg` before building any screen that has a reference.
- **See your own output.** You can't see the browser directly, so after building a screen run:
  `npx playwright screenshot --viewport-size=402,874 --device-scale-factor=3 "http://localhost:5173/<base>/#/<route>" shots/<name>.png`
  then Read the PNG and the matching reference, and compare. Keep `shots/` out of git.
- **Small commits** after each working step, so a bad change can be rolled back with git.
- **Tests:** `npm test` for `src/logic/` must pass before you move on.
- Record any decision not covered by the spec in `docs/decisions.md` (one line each).
