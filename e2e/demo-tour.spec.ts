import { test, expect, type Page } from '@playwright/test'

/**
 * 07: the one-link demo. The guided tour must run start to finish with every bubble clear of the
 * element it points at, no IPO/ASBA wording anywhere, and Skip / Explore leaving everything usable.
 */

const BANNED = /\bIPO\b|ASBA/

async function rects(page: Page) {
  return page.evaluate(() => {
    const r = (s: string) => {
      const e = document.querySelector(s)
      if (!e) return null
      const b = e.getBoundingClientRect()
      return b.width && b.height ? { l: b.left, t: b.top, r: b.right, b: b.bottom } : null
    }
    return { bubble: r('[data-testid=coach-bubble]'), ring: r('[data-testid=coach-ring]') }
  })
}

function overlaps(a: { l: number; t: number; r: number; b: number }, b: { l: number; t: number; r: number; b: number }) {
  // the ring sits 4 pt outside the anchor: shrink it back to the anchor before comparing
  const anchor = { l: b.l + 4, t: b.t + 4, r: b.r - 4, b: b.b - 4 }
  return !(a.r <= anchor.l || a.l >= anchor.r || a.b <= anchor.t || a.t >= anchor.b)
}

async function runWholeTour(page: Page) {
  await page.goto('#/')
  await expect(page.getByTestId('intro')).toContainText("Rohan wants 6 seats for Friday. He shouldn't have to pay for everyone.")
  await page.getByTestId('intro').getByRole('button', { name: 'Start guided demo' }).click()

  for (let i = 1; i <= 14; i++) {
    const progress = page.getByTestId('coach-progress')
    // step 13 waits for the settlement animation before it shows
    await expect(progress).toHaveText(`Step ${i} of 14`, { timeout: 20_000 })
    await expect(page.getByTestId('coach-bubble')).toBeVisible({ timeout: 20_000 })
    // screens slide in: wait until the anchor is on screen and the bubble has settled beside it
    await expect.poll(async () => (await rects(page)).ring, { message: `step ${i} highlights something`, timeout: 8000 }).not.toBeNull()
    await page.waitForTimeout(400)
    const { bubble, ring } = await rects(page)
    expect(ring, `step ${i} highlights something`).not.toBeNull()
    expect(overlaps(bubble!, ring!), `step ${i}: bubble covers the highlighted element`).toBe(false)
    expect(await page.locator('body').innerText()).not.toMatch(BANNED)
    await page.getByTestId('coach-next').click()
  }

  const done = page.getByTestId('done-card')
  await expect(done).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('payoff-0')).toHaveText('Rohan paid ₹277.14 — just his own seat')
  await expect(page.getByTestId('payoff-0-sub')).toHaveText("He covered Kabir's seat at 7:25 PM and got it back when Kabir paid.")
  await expect(page.getByTestId('payoff-1')).toHaveText('Friends chased: 0')
  await expect(page.getByTestId('payoff-2')).toHaveText('Seats left empty: 0')
  await expect(done).toContainText('Every held seat ended up paid.')
  expect(await page.locator('body').innerText()).not.toMatch(BANNED)
}

/** The phone screen that's showing (framed on desktop, full-screen on a phone). */
const phone = (page: Page) => page.locator('[data-phone] .device-frame-mobile:visible, [data-phone] .device-frame-desktop:visible').first()

test.describe('phone (402 pt class)', () => {
  test('guided demo runs start to finish', async ({ page }) => {
    test.setTimeout(120_000)
    await runWholeTour(page)
    await expect(phone(page).getByTestId('refund-D06')).toContainText('₹277.14')
  })

  test('the real taps advance the tour (no Next)', async ({ page }) => {
    await page.goto('#/')
    await page.getByRole('button', { name: 'Start guided demo' }).click()
    await phone(page).getByRole('button', { name: 'Book tickets' }).click()
    await expect(page.getByTestId('coach-progress')).toHaveText('Step 1 of 14') // now points at 9:15 PM
    await phone(page).locator('[data-tour~="pill-915"] button').first().click()
    await expect(page.getByTestId('coach-progress')).toHaveText('Step 2 of 14')
    await phone(page).locator('[data-tour~="seat-count-select"] button').click()
    await phone(page).getByRole('button', { name: /Seat 7 \(available/ }).nth(3).click() // D07
    await phone(page).getByTestId('hold-for-group').getByRole('button').first().click()
    await expect(page.getByTestId('coach-progress')).toHaveText('Step 3 of 14')
  })

  test('persona switch shows the interstitial, tap skips it', async ({ page }) => {
    await page.goto('#/?step=5')
    await page.getByTestId('coach-next').click()
    const card = page.getByTestId('interstitial')
    await expect(card).toContainText("Meanwhile, on Amit's phone… 📱")
    await card.click()
    await expect(card).toBeHidden({ timeout: 1000 })
    await expect(page.getByTestId('coach-progress')).toHaveText('Step 6 of 14')
    await expect(phone(page).getByTestId('link-preview')).toBeVisible()
  })

  test('keyboard: bubble takes focus, → is Next, Esc skips', async ({ page }) => {
    await page.goto('#/?step=8')
    const bubble = page.getByTestId('coach-bubble')
    await expect(bubble).toBeFocused()
    await expect(bubble).toHaveAttribute('role', 'dialog')
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('coach-progress')).toHaveText('Step 9 of 14')
    await page.keyboard.press('Escape')
    await expect(bubble).toBeHidden()
    await expect(page.getByTestId('explore-chips')).toBeVisible()
  })

  test('Skip tutorial leaves everything usable; Explore chips work', async ({ page }) => {
    await page.goto('#/?step=8')
    await page.getByRole('button', { name: 'Skip tutorial' }).click()
    await page.getByTestId('persona-chip').click()
    await page.getByTestId('persona-Amit').click()
    await expect(phone(page).locator('[data-tour~="friend-ticket"]')).toBeVisible() // Amit paid at 2:02 PM
    await page.getByTestId('clock-chip').click()
    await page.getByRole('button', { name: 'Skip to 6:45 PM' }).click()
    await expect(page.getByTestId('clock-chip')).toContainText('6:45 PM')
    await page.getByTestId('persona-chip').click()
    await page.getByTestId('persona-Rohan').click()
    await expect(phone(page).getByTestId('board')).toBeVisible()
    await page.getByTestId('more-chip').click()
    await page.getByRole('button', { name: 'Restart demo' }).click()
    await expect(page.getByTestId('intro')).toBeVisible()
  })

  test('reduced motion: the spotlight ring does not pulse', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('#/?step=3')
    const ring = page.getByTestId('coach-ring')
    await expect(ring).toBeVisible()
    expect(await ring.evaluate((e) => getComputedStyle(e).animationName)).toBe('none')
  })
})

test.describe('desktop (≥ 1024 px)', () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 })

  test('guided demo runs start to finish, bubbles beside the phone', async ({ page }) => {
    test.setTimeout(120_000)
    await runWholeTour(page)
  })

  test('story steps are clickable; Back goes back', async ({ page }) => {
    await page.goto('#/')
    await page.getByTestId('intro').getByRole('button', { name: 'Start guided demo' }).click()
    await page.getByTestId('story-9').click()
    await expect(page.getByTestId('coach-progress')).toHaveText('Step 9 of 14')
    await expect(phone(page).getByTestId('declined-Neha')).toBeVisible()
    await page.getByTestId('coach-bubble').getByRole('button', { name: 'Back' }).click()
    await expect(page.getByTestId('coach-progress')).toHaveText('Step 8 of 14')
    await expect(page.getByTestId('story-8')).toHaveAttribute('aria-current', 'step')
  })

  test('jump to moment and every failure visibly change the phone', async ({ page }) => {
    await page.goto('#/?explore=1')
    for (const id of ['board', 'release', 't30', 'settlement', 'receipt', 'late']) {
      const before = await phone(page).innerText()
      await page.getByTestId(`moment-${id}`).click()
      await expect.poll(() => phone(page).innerText(), { message: `moment ${id}` }).not.toBe(before)
    }
    const failures = ['no-blocking', 'cancel-block', 'conflict', 'cant-make-it', 'pending', 'nobody', 'late', 'cinema']
    for (const id of failures) {
      await page.getByTestId('moment-board').click() // a known baseline
      await page.waitForTimeout(300)
      const before = await phone(page).innerText()
      await page.getByTestId(`failure-${id}`).click()
      await expect.poll(() => phone(page).innerText(), { message: `failure ${id}` }).not.toBe(before)
    }
    await expect(phone(page).getByTestId('hold-alert')).toContainText('The cinema cancelled this show. Everyone gets a full refund, including fees.')
  })
})
