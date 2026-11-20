// 09 screenshots at 402×874 @3× (iPhone 17): hold sheet, board row states, T−30, receipt before/after
// showtime, UPI approval, friend pay, the ₹10,000 cap, the 9:00 PM cut-off, a minimised coach bubble.
// Usage: node scripts/shots-09.mjs [port] [filter]   (dev server must be running)
import { chromium } from '@playwright/test'

const port = process.argv[2] ?? '5173'
const only = process.argv[3]
const base = `http://localhost:${port}/Navi-Design-Task/`

/** [shot name, hash route, optional steps] */
const SHOTS = [
  ['09-hold-sheet', '#/rohan/hold', []],
  ['09-hold-sheet-open', '#/rohan/hold', [['testid', 'money-line']]],
  ['09-upi-approval', '#/rohan/upi', []],
  ['09-held', '#/rohan/held', [['wait', 5200]]],
  ['09-board', '#/rohan/board?at=310', []],
  ['09-board-rows', '#/rohan/board?at=202&opened=sana', [['scroll', 'group-status-list']]],
  ['09-board-kept', '#/rohan/board?at=kept', [['scroll', 'group-status-list']]],
  ['09-reminder-share', '#/rohan/board?at=310', [['testid', 'share-reminder']]],
  ['09-t30', '#/rohan/board?at=t30&sheet=t30', []],
  ['09-receipt-before-showtime', '#/rohan/receipt?at=kept', []],
  ['09-receipt-after-showtime', '#/rohan/receipt?at=settled', []],
  ['09-orders', '#/rohan/orders?at=kept', []],
  ['09-friend-pay', '#/friend/amit?screen=pay', []],
  ['09-friend-upi-choice', '#/friend/amit?screen=upi&loggedIn=1', []],
  ['09-friend-late', '#/friend/kabir?at=810', []],
  ['09-cap', '#/?explore=1&failure=over-cap', [['tap', 'Hold for group']], true],
  ['09-cutoff-pending', '#/?explore=1&failure=cutoff-pending', [], true],
  ['09-cutoff-failed', '#/?explore=1&failure=cutoff-pending', [['wait', 4200]], true],
  ['09-bubble', '#/?step=3', [['wait', 1500]], true],
  ['09-bubble-minimised', '#/?step=3', [['testid', 'coach-minimise']], true],
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
for (const [name, route, steps, stage] of SHOTS) {
  if (only && !name.includes(only)) continue
  const page = await ctx.newPage()
  if (stage) await page.addInitScript(() => { sessionStorage.setItem('demoBar:explore', 'closed'); sessionStorage.setItem('demoBar:tour', 'closed') })
  await page.goto(`${base}${route}`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1600)
  for (const [kind, arg] of steps) {
    if (kind === 'tap') await page.getByText(arg, { exact: true }).locator('visible=true').first().click()
    if (kind === 'testid') await page.getByTestId(arg).locator('visible=true').first().click()
    if (kind === 'scroll') await page.getByTestId(arg).locator('visible=true').first().scrollIntoViewIfNeeded()
    if (kind === 'wait') await page.waitForTimeout(arg)
    await page.waitForTimeout(500)
  }
  await page.waitForTimeout(700)
  await page.screenshot({ path: `shots/${name}.png` })
  console.log('shot', name)
  await page.close()
}
await browser.close()
