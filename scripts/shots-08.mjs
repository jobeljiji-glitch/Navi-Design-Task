// 08 screenshots: every Try-a-failure item at 402×874 @3× (iPhone 17), plus the ladder rungs.
// Usage: node scripts/shots-08.mjs [port]   (dev server must be running)
import { chromium } from '@playwright/test'

const port = process.argv[2] ?? '5173'
const base = `http://localhost:${port}/Navi-Design-Task/`

/** [shot name, failure id, optional steps after it runs] */
const SHOTS = [
  ['08-under-3h', 'under-3h', [['tap', 'Hold for group']]],
  ['08-cap', 'cap', [['tap', 'Hold for group']]],
  ['08-second-hold', 'second-hold', [['tap', 'Hold for group']]],
  ['08-two-holds', 'two-holds', [['tap', 'Hold for group']]],
  ['08-two-seats', 'two-seats', []],
  ['08-ladder-card', 'no-blocking', []],
  ['08-ladder-card-approve', 'no-blocking', [['tapRole', /Hold ₹1,662.84 on your card/], ['wait', 1200]]],
  ['08-ladder-pay-all', 'no-card', []],
  ['08-upi-declined', 'upi-declined', []],
  ['08-bank-timeout', 'bank-timeout', [['pin'], ['wait', 2600]]],
  ['08-own-fails', 'own-fails', [['pin'], ['wait', 900]]],
  ['08-cancel-block', 'cancel-block', []],
  ['08-conflict', 'conflict', []],
  ['08-friend-fails', 'friend-fails', []],
  ['08-cant-make-it', 'cant-make-it', [['wait', 1500]]],
  ['08-pending-deadline', 'pending', []],
  ['08-nobody', 'nobody', []],
  ['08-late', 'late', []],
  ['08-showtime-pending', 'showtime-pending', []],
  ['08-showtime-cleared', 'showtime-pending', [['wait', 4500]]],
  ['08-showtime-expired', 'showtime-expired', [['wait', 4500]]],
  ['08-after-show', 'after-show', []],
  ['08-cinema', 'cinema', []],
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
const only = process.argv[3]
for (const [name, id, steps] of SHOTS) {
  if (only && !name.includes(only)) continue
  const page = await ctx.newPage()
  // Bar collapsed so the app has the whole screen (as on a phone in the tour)
  await page.addInitScript(() => sessionStorage.setItem('demoBar:explore', 'closed'))
  await page.goto(`${base}#/?explore=1&failure=${id}`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1600)
  for (const [kind, arg] of steps) {
    if (kind === 'tap') await page.getByText(arg, { exact: true }).locator('visible=true').first().click()
    if (kind === 'tapRole') await page.getByRole('button', { name: arg }).locator('visible=true').first().click()
    if (kind === 'pin') {
      await page.getByTestId('approve-with-pin').locator('visible=true').first().click()
      for (const d of '1234') await page.getByTestId(`pin-key-${d}`).locator('visible=true').first().click()
    }
    if (kind === 'wait') await page.waitForTimeout(arg)
  }
  await page.waitForTimeout(700)
  await page.screenshot({ path: `shots/${name}.png` })
  console.log('shot', name)
  await page.close()
}
await browser.close()
