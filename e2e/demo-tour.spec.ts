import { test, expect, type Page } from '@playwright/test'

/**
 * 07: the one-link demo. The guided tour must run start to finish with every bubble clear of the
 * element it points at, no IPO/ASBA wording anywhere, and Skip / Explore leaving everything usable.
 */

const BANNED = /\bIPO\b|ASBA/

async function rects(page: Page) {
  return page.evaluate(() => {
    const box = (e: Element | null) => {
      if (!e) return null
      const b = e.getBoundingClientRect()
      return b.width && b.height ? { l: b.left, t: b.top, r: b.right, b: b.bottom } : null
    }
    const r = (s: string) => box(document.querySelector(s))
    const bubbleEl = document.querySelector('[data-testid=coach-bubble]') as HTMLElement | null
    const collapsed = !!bubbleEl && getComputedStyle(bubbleEl).visibility === 'hidden'
    // 09: the bubble never covers the pinned CTA footer or an open sheet's content (unless the anchor is inside that footer)
    const ringEl = document.querySelector('[data-testid=coach-ring]')
    const ringBox = box(ringEl)
    const phoneEl = Array.from(document.querySelectorAll('[data-phone] .device-frame-mobile, [data-phone] .device-frame-desktop')).find((f) => f.getBoundingClientRect().width > 0)
    const avoid = phoneEl
      ? Array.from(phoneEl.querySelectorAll('[data-pinned-footer], [data-sheet-body]'))
          .map((e) => ({ e, b: box(e) }))
          .filter((x) => x.b && !(x.e.hasAttribute('data-pinned-footer') && ringBox && x.b.t <= ringBox.t + 4 && x.b.b >= ringBox.b - 4))
          .map((x) => x.b!)
      : []
    return { bubble: collapsed ? null : r('[data-testid=coach-bubble]'), pill: r('[data-testid=coach-pill]'), ring: ringBox, avoid }
  })
}

function hits(a: { l: number; t: number; r: number; b: number }, b: { l: number; t: number; r: number; b: number }) {
  return !(a.r <= b.l + 1 || a.l >= b.r - 1 || a.b <= b.t + 1 || a.t >= b.b - 1)
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
    // screens slide in: wait until the anchor is on screen and the bubble has settled beside it
    await expect.poll(async () => (await rects(page)).ring, { message: `step ${i} highlights something`, timeout: 8000 }).not.toBeNull()
    await page.waitForTimeout(700)
    const { bubble, pill, ring, avoid } = await rects(page)
    expect(ring, `step ${i} highlights something`).not.toBeNull()
    // Either the bubble (clear of the anchor, the CTA footer and sheet content) or, when nothing is clear, the pill
    expect(!!bubble || !!pill, `step ${i}: bubble or pill shows`).toBe(true)
    if (bubble) {
      expect(overlaps(bubble, ring!), `step ${i}: bubble covers the highlighted element`).toBe(false)
      for (const a of avoid) expect(hits(bubble, a), `step ${i}: bubble covers the CTA footer or sheet content`).toBe(false)
    }
    expect(await page.locator('body').innerText()).not.toMatch(BANNED)
    // 11: a newer banner replaces older ones, so a quick Next never leaves "Halfway there" up at the deadline
    if (i >= 12) expect(await page.locator('body').innerText(), `step ${i}: stale halfway banner`).not.toContain('Halfway there')
    if (bubble) await page.getByTestId('coach-next').click()
    else {
      await page.getByTestId('coach-pill').click()
      await page.getByTestId('coach-next').click()
    }
  }

  const done = page.getByTestId('done-card')
  await expect(done).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('payoff-0')).toHaveText('Rohan paid ₹277.14 — just his own seat')
  await expect(page.getByTestId('payoff-0-sub')).toHaveText('Kabir paid late, so his seat was never charged to Rohan.')
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
    await expect(phone(page).getByTestId('ledger-unblocked')).toContainText('₹1,385.70')
    await expect(phone(page).getByTestId('ledger-charged')).toContainText('₹277.14')
  })

  test('minimise collapses the bubble to a pill; tapping it restores (09)', async ({ page }) => {
    await page.goto('#/?step=5')
    await expect(page.getByTestId('coach-bubble')).toBeVisible({ timeout: 20_000 })
    await page.getByTestId('coach-minimise').click()
    await expect(page.getByTestId('coach-pill')).toHaveText('Step 5/14')
    await expect(page.getByTestId('coach-bubble')).toBeHidden()
    // stays minimised on the next step (the stage remounts the bubble per step)
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('coach-pill')).toHaveText('Step 6/14', { timeout: 20_000 })
    await page.getByTestId('coach-pill').click()
    await expect(page.getByTestId('coach-bubble')).toBeVisible()
    await expect(page.getByTestId('coach-progress')).toHaveText('Step 6 of 14')
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
    await expect(phone(page).locator('[data-tour~="friend-ticket"]')).toBeVisible() // Amit paid at 4:30 PM
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
    for (const id of ['board', 'remind', 'release', 't30', 'kept', 'late', 'settlement', 'receipt']) {
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

  test('10: a friend asks for a reminder; Rohan sees "Asked for a reminder"', async ({ page }) => {
    await page.goto('#/?explore=1&moment=remind')
    const remind = phone(page).getByTestId('remind-me')
    await expect(remind).toHaveText('Not sure yet? Remind me before 7:15 PM')
    await remind.click()
    const sheet = phone(page).getByTestId('remind-sheet')
    await expect(sheet).toContainText('Remind you before 7:15 PM?')
    await expect(sheet).toContainText('BookMyShow sends one reminder at 6:45 PM. Nothing else.')
    await expect(phone(page).getByTestId('remind-phone')).toHaveValue('98765 43211')
    await sheet.getByRole('button', { name: 'Remind me' }).click()
    await expect(phone(page).getByTestId('remind-toast')).toHaveText("We'll remind you at 6:45 PM")
    await expect(phone(page).getByTestId('remind-set')).toHaveText('Reminder set for 6:45 PM')
    await expect(phone(page).getByTestId('friend-pay-cta').or(phone(page).locator('[data-tour~="friend-pay-cta"]')).first()).toBeInViewport()
    await page.getByTestId('persona-Rohan').click() // desktop: the persona switcher is in the side panel
    const row = phone(page).getByTestId('seat-row-D09')
    await expect(row).toContainText('Sana · D09')
    await expect(row).toContainText('Opened, not paid')
    await expect(row).toContainText('Asked for a reminder')
  })
})
