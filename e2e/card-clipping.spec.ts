import { test, expect, type Page } from '@playwright/test'

/**
 * 04e: no card may clip its content. On iOS Safari, cards in a flex-column scroller
 * were shrunk to fit the viewport (overflow:hidden made their min-height 0).
 * Worst case: 110% text zoom, emulated by scaling every element's font-size and line-height.
 */

import { SCREENS as BASE } from './routes'

// Failure screens with cards (the limit toasts and #7 sit on the seat layout, which has none; qa.spec covers them)
const FAILURES = ['no-blocking', 'no-card', 'upi-declined', 'cancel-block', 'conflict', 'friend-fails', 'cant-make-it', 'pending', 'nobody', 'cutoff-pending', 'after-show', 'cinema']
const SCREENS: Array<{ route: string; name: string; shot?: string }> = [...BASE, ...FAILURES.map((id) => ({ route: `#/?explore=1&failure=${id}`, name: `08 failure: ${id}` }))]

async function zoomText(page: Page, factor = 1.1) {
  await page.evaluate((f) => {
    const all = Array.from(document.querySelectorAll<HTMLElement>('body *'))
    // Read everything first, then write, so parents and children scale once each.
    const sizes = all.map((el) => {
      const cs = getComputedStyle(el)
      return { el, fs: parseFloat(cs.fontSize), lh: cs.lineHeight }
    })
    for (const { el, fs, lh } of sizes) {
      el.style.fontSize = `${fs * f}px`
      if (lh.endsWith('px')) el.style.lineHeight = `${parseFloat(lh) * f}px`
    }
  }, factor)
  await page.waitForTimeout(150)
}

/** Every card / flush band / sheet section on the visible (full-screen) frame. */
async function clipped(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector('.device-frame-mobile') ?? document.body
    // A card is anything painted with the card shadow token (works with or without data-card).
    const probe = document.createElement('div')
    probe.style.boxShadow = 'var(--card-shadow)'
    root.appendChild(probe)
    const cardShadow = getComputedStyle(probe).boxShadow
    probe.remove()
    // 07: stage overlays (intro, done card) sit outside the phone
    const overlays = Array.from(document.querySelectorAll<HTMLElement>('[data-stage-overlay][data-card], [data-stage-overlay] [data-card]'))
    const nodes = [...overlays, ...Array.from(root.querySelectorAll<HTMLElement>('*'))].filter(
      (el) =>
        el.hasAttribute('data-card') ||
        getComputedStyle(el).boxShadow === cardShadow ||
        /band$/.test(el.getAttribute('data-testid') ?? '') ||
        el.getAttribute('data-testid') === 'held-until',
    )
    return nodes
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({
        what: el.getAttribute('data-testid') ?? el.textContent?.trim().slice(0, 40) ?? el.tagName,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        count: nodes.length,
      }))
  })
}

for (const s of SCREENS) {
  test(`${s.name}: no card clips its content at 110% text`, async ({ page }, info) => {
    await page.goto(s.route)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(900)
    await zoomText(page, 1.1)

    const cards = await clipped(page)
    expect(cards.length, 'found cards to check').toBeGreaterThan(0)
    for (const c of cards) {
      expect(c.scrollHeight, `"${c.what}" is clipped (${c.scrollHeight} > ${c.clientHeight})`).toBeLessThanOrEqual(c.clientHeight + 1)
    }

    if (s.shot && info.project.name.startsWith('webkit')) {
      // Let the 4 s bank-SMS banner leave so the shot shows the cards
      if (s.route.includes('/rohan/held')) await page.waitForTimeout(4800)
      await page.screenshot({ path: `shots/${s.shot}-webkit.png`, fullPage: false })
    }
  })
}

test('Confirm booking: the 16+ badge holds its text at larger sizes (min 22 pt)', async ({ page }) => {
  await page.goto('#/rohan/confirm')
  await page.waitForTimeout(900)
  for (const f of [1, 1.3]) {
    if (f !== 1) await zoomText(page, f)
    const b = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('.device-frame-mobile [data-testid="age-badge"]')!
      const text = el.firstElementChild!.getBoundingClientRect()
      const box = el.getBoundingClientRect()
      return { w: box.width, h: box.height, fits: text.left >= box.left - 0.5 && text.right <= box.right + 0.5 && text.top >= box.top - 0.5 && text.bottom <= box.bottom + 0.5 }
    })
    expect(b.w).toBeGreaterThanOrEqual(22)
    expect(b.h).toBeGreaterThanOrEqual(22)
    expect(b.fits, `16+ overflows its badge at ${f}×`).toBe(true)
  }
})

test('Board: Neha can’t make it → release D05 free → receipts before and after showtime', async ({ page }) => {
  await page.goto('#/rohan/board?at=neha')
  await page.waitForTimeout(900)
  const frame = page.locator('.device-frame-mobile')
  await frame.getByRole('button', { name: 'Release a seat', exact: true }).click()
  await expect(frame.getByTestId('release-fee-band')).toHaveText('Free until 5:45 PM')
  await frame.getByRole('button', { name: 'Release D05 · ₹277.14 less to cover' }).click()
  await expect(frame.getByTestId('declined-Neha')).toHaveCount(0)
  await expect(frame.getByTestId('set-aside')).toHaveText('₹554.28 left to cover')
  await expect(frame.getByTestId('headline-sub')).toHaveText('₹1,385.70 blocked · unblocked at showtime')

  // 09: provisional receipt while D06 is kept, then the final one after the showtime settlement
  await page.goto('#/rohan/receipt?at=kept')
  await page.reload()
  await page.waitForTimeout(900)
  await expect(frame.getByTestId('receipt-title')).toHaveText('Seats kept · settles at 9:15 PM')
  await expect(frame.getByTestId('receipt-row-D06')).toContainText('Charged at 9:15 PM unless a friend pays')
  await expect(frame.getByTestId('ledger-charged')).toContainText('₹277.14')

  await page.goto('#/rohan/receipt?at=settled')
  await page.reload()
  await page.waitForTimeout(900)
  await expect(frame.getByTestId('ledger-charged')).toContainText('₹277.14')
  await expect(frame.getByTestId('ledger-unblocked')).toContainText('₹1,385.70')
  await expect(frame.getByTestId('receipt-row-D06')).toContainText('Paid late')
  expect(await frame.innerText()).not.toMatch(/refund/i)
})

test('Group hold: the CTA is pinned in view, the cards scroll above it (09)', async ({ page }) => {
  await page.goto('#/rohan/held')
  await page.waitForTimeout(900)
  await zoomText(page, 1.1)
  const order = await page.evaluate(() => {
    const root = document.querySelector('.device-frame-mobile')!
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-testid="status-card"], [data-testid="whos-in"], [data-testid="money-card"]'))
    const scroller = cards[0].parentElement!
    const cta = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.includes('Send to your group'))!
    const footer = cta.closest('[data-pinned-footer]')!
    return { scrollBottom: scroller.getBoundingClientRect().bottom, footerTop: footer.getBoundingClientRect().top, ctaBottom: cta.getBoundingClientRect().bottom, frameBottom: root.getBoundingClientRect().bottom, cards: cards.length }
  })
  expect(order.cards).toBe(3)
  expect(order.scrollBottom).toBeLessThanOrEqual(order.footerTop + 1)
  expect(order.ctaBottom).toBeLessThanOrEqual(order.frameBottom)
})
