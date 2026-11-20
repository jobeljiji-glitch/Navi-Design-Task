# Group Hold prototype: starter kit

Everything an AI coding agent needs to build the BookMyShow **Group Hold** prototype for iPhone 17, with the same inputs for **Antigravity** and **Claude Code** so you can compare their outputs.

## What's in the kit

```
AGENTS.md                      shared rules (both tools read this)
CLAUDE.md                      Claude Code: imports AGENTS.md + its own verification loop
GEMINI.md                      Antigravity: browser verification, plan artifacts
.agents/rules/                 Antigravity modular rules (design fidelity, logic)
.github/workflows/deploy.yml   GitHub Pages deploy on every push to main
docs/spec.md                   THE spec: rules, timers, copy, demo data, failures, tutorial
docs/design-system.md          tokens + component specs reconstructed from screenshots
docs/tokens.css                CSS variables (the only colours components may use)
docs/device-iphone17.md        402 × 874 frame, safe areas, real-iPhone behaviour
reference/screens/             12 real BookMyShow screenshots, renamed by screen
reference/README.md            what each screenshot is for, scale factor (1 px = 0.546 pt)
prompts/antigravity/00–08      9 prompts, Antigravity wording
prompts/claude-code/00–08      the same 9 prompts, Claude Code wording
```

## Prerequisites checklist

**Accounts and tools**
- [ ] GitHub account; **public** repo (free GitHub Pages needs public, or use Vercel for private)
- [ ] Node.js **22 LTS** and Git installed (Claude Code's npm install needs Node 22+)
- [ ] Antigravity installed and signed in
- [ ] Claude Code installed and signed in (needs a Pro, Max, Team or Enterprise plan). Windows: `irm https://claude.ai/install.ps1 | iex` in PowerShell
- [ ] An iPhone for the final check (Safari, Add to Home Screen)

**Setup (10 minutes)**
1. Create **two** public repos to compare fairly, e.g. `group-hold-ag` and `group-hold-cc`.
2. Copy this whole kit into the root of each and push.
3. In each repo: Settings → Pages → Source: **GitHub Actions**.
4. Open `group-hold-ag` in Antigravity and `group-hold-cc` in Claude Code.
5. Run the prompts in order, one at a time: `00` → `08`. Don't start the next one until the previous one's acceptance checks pass.
6. After each prompt, compare both deploys on your phone and keep notes on which is closer. You can also switch tools midway: both repos share the same structure.

**Windows step-by-step:** see `SETUP-WINDOWS.md`.

**Optional, but improves accuracy a lot.** Capture these extra screenshots (iPhone, same way as before) and add them to `reference/screens/` with a line in `reference/README.md`:
- [ ] **M-ticket / booking confirmed** screen (pattern for the friend's ticket)
- [ ] **A real BookMyShow link shared into a WhatsApp chat** (share any movie from the app): the real preview card layout
- [ ] BookMyShow **login / OTP** screen (pattern for the friend's phone verification)

## How accuracy is achieved (and why it beats prompting alone)

1. **Screenshots are the source of truth.** No official BookMyShow design kit exists; online "UI kits" are unofficial redesigns, so the kit doesn't use them.
2. **Measured tokens.** Colours were sampled and sizes measured from the screenshots (see `docs/design-system.md`), each marked measured or estimated.
3. **Rebuild real screens first** (prompt 03). New screens then inherit a proven visual language.
4. **Reference overlay** in the app (`?overlay=1`, press `O`): the real screenshot over your build, with an opacity slider and difference mode.
5. **Screenshot loop** after every screen (Antigravity's built-in browser; Playwright screenshots for Claude Code).
6. **Spec-driven logic with tests** (prompt 01), so screens never invent behaviour.
7. **Real-device check** on GitHub Pages at the end.

## Rough time budget

| Prompt | Hours |
| --- | --- |
| 00 setup | 0.5 |
| 01 logic | 1.5 |
| 02 design system | 1.5 |
| 03 baseline screens | 1.5 |
| 04 Rohan hold | 1.5 |
| 05 share + friend | 1.5 |
| 06 board + deadline | 1.5 |
| 07 demo stage + tutorial | 1.5 |
| 08 failures + QA | 1 |
| **Total** | **≈ 12** (fits the Build phase H20–H32) |

## Notes
- Everything in the prototype is fictional: film "Monsoon Heist", "Cineplex" cinema, friends' names. No real posters or logos.
- If you change a decision, change `docs/spec.md` first, then tell the agent to re-read it.
