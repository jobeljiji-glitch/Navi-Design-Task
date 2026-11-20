import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * 07b: on a phone the demo stage is a 100dvh column [demo bar][app viewport]. The app gets only
 * the height the bar leaves, so bottom CTAs and sheet footers must sit fully inside the visual
 * viewport with the bar open and collapsed. Real-device bug: the bar pushed a full-height app down
 * and cut off the seat layout's Hold / Pay bar.
 */

test.skip(({ browserName }) => browserName !== 'webkit', 'iPhone layout check: WebKit only')

type BarState = 'open' | 'collapsed'

/** The full-screen app frame inside the stage. */
const app = (page: Page) => page.locator('.stage-app .device-frame-mobile')

async function setBar(page: Page, want: BarState) {
  const title = page.getByTestId('demo-bar-title')
  const pill = page.getByTestId('demo-pill')
  await expect(title.or(pill)).toBeVisible() // the stage chunk has loaded
  if (want === 'collapsed' && (await title.isVisible())) await title.click()
  if (want === 'open' && (await pill.isVisible())) await pill.click()
  await expect(want === 'open' ? title : pill).toBeVisible()
  await page.waitForTimeout(250)
}

/** Fully on screen, inside the app viewport, and not covered or cut off by anything. */
async function expectFullyVisible(page: Page, target: Locator, what: string) {
  await target.scrollIntoViewIfNeeded()
  await page.waitForTimeout(150)
  const r = await target.evaluate((el) => {
    const b = el.getBoundingClientRect()
    const appBox = document.querySelector('.stage-app')!.getBoundingClientRect()
    const vv = window.visualViewport
    const vh = vv ? vv.height : window.innerHeight
    // sample just inside each corner and the centre: the topmost element there must be this one
    const pts = [
      [b.left + 3, b.top + 3],
      [b.right - 3, b.top + 3],
      [b.left + 3, b.bottom - 3],
      [b.right - 3, b.bottom - 3],
      [(b.left + b.right) / 2, (b.top + b.bottom) / 2],
    ]
    const covered = pts.filter(([x, y]) => {
      const hit = document.elementFromPoint(x, y)
      return !hit || !(el === hit || el.contains(hit))
    }).length
    return { top: b.top, bottom: b.bottom, h: b.height, vh, appTop: appBox.top, appBottom: appBox.bottom, covered }
  })
  expect(r.h, `${what} has height`).toBeGreaterThan(20)
  expect(r.bottom, `${what} bottom ${r.bottom} inside the viewport ${r.vh}`).toBeLessThanOrEqual(r.vh + 0.5)
  expect(r.bottom, `${what} inside the app viewport`).toBeLessThanOrEqual(r.appBottom + 0.5)
  expect(r.top, `${what} below the demo bar`).toBeGreaterThanOrEqual(r.appTop - 0.5)
  expect(r.covered, `${what} is covered or clipped at ${r.covered} sample points`).toBe(0)
}

/** The app viewport ends at the bottom of the screen and the frame fills it exactly. */
async function expectAppFills(page: Page, bar: BarState) {
  const m = await page.evaluate(() => {
    const col = document.querySelector('[data-testid=stage-column]')!
    const a = document.querySelector('.stage-app')!.getBoundingClientRect()
    const f = document.querySelector('.stage-app .device-frame-mobile')!.getBoundingClientRect()
    const vv = window.visualViewport
    return {
      vh: vv ? vv.height : window.innerHeight,
      appTop: a.top,
      appBottom: a.bottom,
      frameTop: f.top,
      frameBottom: f.bottom,
      appH: parseFloat(getComputedStyle(col).getPropertyValue('--app-h')),
    }
  })
  expect(Math.abs(m.appBottom - m.vh), 'app viewport reaches the bottom of the screen').toBeLessThanOrEqual(1)
  expect(Math.abs(m.frameTop - m.appTop) + Math.abs(m.frameBottom - m.appBottom), 'frame fills the app viewport').toBeLessThanOrEqual(1)
  expect(Math.abs(m.appH - (m.appBottom - m.appTop)), '--app-h is the app viewport height').toBeLessThanOrEqual(1)
  if (bar === 'open') expect(m.appTop, 'app starts below the 40 pt bar').toBeGreaterThanOrEqual(40)
  else expect(m.appTop, 'collapsed: app takes the full height').toBeLessThanOrEqual(0.5)
}

for (const bar of ['open', 'collapsed'] as BarState[]) {
  test.describe(`demo bar ${bar}`, () => {
    test('seat layout: Hold for group / Pay bar is fully visible', async ({ page }) => {
      await page.goto('#/?explore=1&phone=/rohan/seats-selected')
      await setBar(page, bar)
      await expectAppFills(page, bar)
      await expectFullyVisible(page, app(page).getByTestId('hold-for-group'), 'Hold for group')
      await expectFullyVisible(page, app(page).getByRole('button', { name: /Pay ₹1,662\.84/ }), 'Pay')
    })

    test('hold sheet: footer CTA is fully visible', async ({ page }) => {
      await page.goto('#/?step=3')
      await page.getByRole('button', { name: 'Skip tutorial' }).click() // keeps the hold sheet open
      await setBar(page, bar)
      await expectAppFills(page, bar)
      await expectFullyVisible(page, app(page).locator('[data-tour~="hold-cta"]'), 'Hold sheet CTA')
    })

    test('Confirm booking: Continue is fully visible', async ({ page }) => {
      await page.goto('#/?explore=1&phone=/rohan/confirm')
      await setBar(page, bar)
      await expectAppFills(page, bar)
      await expectFullyVisible(page, app(page).getByRole('button', { name: 'Continue' }), 'Continue')
    })

    test('board: the last action scrolls fully into view', async ({ page }) => {
      await page.goto('#/?explore=1&moment=board')
      await setBar(page, bar)
      await expectAppFills(page, bar)
      await expect(app(page).getByTestId('board')).toBeVisible()
      await expectFullyVisible(page, app(page).getByTestId('board').getByRole('button').last(), 'Board last action')
    })
  })
}

test('bar state is remembered for the session; the tour starts collapsed', async ({ page }) => {
  await page.goto('#/?step=3')
  await expect(page.getByTestId('demo-pill')).toBeVisible()
  await expect(page.getByTestId('demo-bar-title')).toHaveCount(0)

  await page.goto('#/?explore=1&moment=board')
  await expect(page.getByTestId('demo-bar-title')).toBeVisible() // explore starts open
  await page.getByTestId('demo-bar-title').click()
  await expect(page.getByTestId('demo-pill')).toBeVisible()
  await page.reload()
  await page.goto('#/?explore=1&moment=receipt')
  await expect(page.getByTestId('demo-pill')).toBeVisible()
  await page.getByTestId('demo-pill').click()
  await expect(page.getByTestId('demo-bar-title')).toBeVisible()
})
