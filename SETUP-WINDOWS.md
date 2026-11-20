# Setup on Windows (Antigravity + Claude Code)

Written for your current setup: Antigravity IDE on Windows, a GitHub repo called `Navi-Design-Task` (branch `main`, containing only `.gitattributes`), currently sitting inside Antigravity's scratch folder.

Commands are for **PowerShell** (Antigravity's terminal: `Terminal → New Terminal`). Replace `<you>` with your GitHub username.

---

## Part 1: Put the repo in a proper place (5 min)

Right now the repo sits at `C:\Users\jobel\.gemini\antigravity-ide\scratch\Navi Design Task\Navi-Design-Task`, and Antigravity's workspace is the folder *above* it. Two problems: the agent's working folder isn't the repo root, and `scratch` is Antigravity's playground area. Move the repo somewhere normal:

```powershell
# 1. Check the repo is pushed and see its GitHub address
cd "C:\Users\jobel\.gemini\antigravity-ide\scratch\Navi Design Task\Navi-Design-Task"
git status
git remote -v

# 2. Clone a clean copy into a Projects folder
mkdir $HOME\Projects -Force
cd $HOME\Projects
git clone https://github.com/<you>/Navi-Design-Task.git
```

Then in Antigravity: **File → Open Folder → `C:\Users\jobel\Projects\Navi-Design-Task`**. The Explorer should now show the repo's files at the top level (just `.gitattributes` for now).

On GitHub: make sure the repo is **Public** (Settings → General → Danger Zone → Change visibility). Free GitHub Pages needs a public repo.

---

## Part 2: Install the tools (10 min)

```powershell
node -v      # need v22 or newer
git --version
```

If Node is missing or older:

```powershell
winget install OpenJS.NodeJS.LTS
```

**Close and reopen Antigravity** afterwards so the terminal sees the new `node`.

If `npm` later says *"running scripts is disabled on this system"*, run this once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Set your Git identity if you haven't:

```powershell
git config --global user.name "Jobel Jiji Joseph"
git config --global user.email "<your GitHub email>"
```

---

## Part 3: Add the kit to the repo (5 min)

Assuming the zip is in Downloads:

```powershell
cd $HOME\Projects\Navi-Design-Task
Expand-Archive -Path "$HOME\Downloads\bms-group-hold-kit.zip" -DestinationPath "$HOME\Downloads\kit" -Force
Copy-Item -Path "$HOME\Downloads\kit\bms-group-hold-kit\*" -Destination . -Recurse -Force
Get-ChildItem -Force   # you should see AGENTS.md, GEMINI.md, CLAUDE.md, .agents, .github, docs, prompts, reference
git add .
git commit -m "Add Group Hold starter kit"
git push
```

On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions.**

---

## Part 4: Configure Antigravity (5 min)

1. **Agent settings** (gear icon → Agent, or the settings shown on first launch):
   - Development preset: **Review-driven development**
   - Terminal execution: **Request review** for the first prompt; you can switch to Auto once you trust it
   - JavaScript execution in the browser: **Request review**
2. **Browser extension:** the first time the agent opens a browser, it asks you to set up the Antigravity Chrome extension. Accept; it needs Chrome installed. The agent uses it to screenshot and check its own screens.
3. **Conversation mode:** choose **Planning** (not Fast) in the agent panel.
4. **Model:** your panel currently shows *Claude Sonnet 4.6 (Thinking)*.
   - If you want to compare **tools** (Antigravity vs Claude Code), pick a **Gemini** model here, so the two builds come from different engines.
   - If you just want the best Antigravity output, try your top Gemini option and Claude on prompt 00 and keep whichever plan is better.
5. **Check the rules loaded.** In a new agent conversation, ask:
   > Which rule files are you following in this workspace? Summarise them in 3 lines.

   It should mention `GEMINI.md`, `AGENTS.md` and `.agents/rules/`. If it doesn't, the workspace folder is wrong (go back to Part 1).

---

## Part 5: Run the prompts (about 12 hours over the build phase)

For each prompt, `00` to `08`:

1. Open `prompts/antigravity/0X-….md` in the editor, select all (Ctrl+A), copy (Ctrl+C).
2. **Start a new agent conversation** (fresh context each time) and paste it.
3. Read the **implementation plan** artifact. Comment on anything wrong, then approve.
4. Approve terminal commands as they come (`npm create vite`, `npm install`, `npm test`, `git commit`…). Don't approve anything that deletes `docs/`, `reference/` or `prompts/`.
5. When it finishes, check its walkthrough screenshots against `reference/screens/`.
6. Run it yourself: `npm run dev`, then open the URL it prints (it will include `/Navi-Design-Task/`).
7. Tick the prompt's **Acceptance** list. If something fails, tell the agent exactly what, in the same conversation.
8. `git push` → GitHub **Actions** tab turns green → open `https://<you>.github.io/Navi-Design-Task/` on your iPhone.

After prompt 00, test the live link once on your phone before going further. Deploy problems are easier to fix on an empty app.

---

## Part 6: Claude Code in parallel (optional, for comparison)

1. Create a second public repo, e.g. `Navi-Design-Task-CC`, clone it to `$HOME\Projects`, copy the kit in (Part 3), push, and enable Pages.
2. Install Claude Code (needs a Pro, Max, Team or Enterprise plan):
   ```powershell
   irm https://claude.ai/install.ps1 | iex
   claude --version
   ```
   Installing Git for Windows is recommended (it provides Git Bash).
3. Start it in the repo:
   ```powershell
   cd $HOME\Projects\Navi-Design-Task-CC
   claude
   ```
   Log in through the browser the first time.
4. Install the screenshot browser once: `npx playwright install chromium`.
5. Paste `prompts/claude-code/00-setup.md`, review the plan, approve. Use `/clear` before each new prompt.

Compare the two live links on your phone after each prompt and note which is closer to `reference/screens/`.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Live page is blank or 404 | Vite `base` must be `/Navi-Design-Task/` (exact repo name, case-sensitive) |
| Refreshing a sub-page gives 404 | Must use hash routes (`/#/rohan`) |
| GitHub Action fails at `npm ci` | `package-lock.json` wasn't committed. Run `npm install`, commit the lock file, push |
| Action fails at "deploy" | Pages source isn't set to GitHub Actions |
| `npm` blocked in PowerShell | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Agent ignores the rules | Workspace isn't the repo root, or it's an old conversation. Reopen the folder and start a new conversation |
| Agent scaffolds into a subfolder | Tell it: "Scaffold in the repo root, keep docs/, reference/, prompts/ and the rule files" |
| Fonts look wrong | Check Roboto loaded (DevTools → Network). If the overlay still doesn't match, try Inter and compare |
