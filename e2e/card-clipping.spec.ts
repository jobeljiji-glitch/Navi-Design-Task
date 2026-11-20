import { test, expect, type Page } from '@playwright/test'

/**
 * 04e: no card may clip its content. On iOS Safari, cards in a flex-column scroller
 * were shrunk to fit the viewport (overflow:hidden made their min-height 0).
 * Worst case: 110% text zoom, emulated by scaling every element's font-size and line-height.
 */

const SCREENS: Array<{ route: string; name: string; shot?: string }> = [
  { route: '#/rohan/held', name: 'Group hold', shot: '04e-held' },
  { route: '#/friend/amit?screen=pay', name: 'Friend pay page', shot: '04e-friend-pay' },
  { route: '#/friend/sana?after=amit&screen=pay', name: 'Friend pay page (after Amit)' },
  { route: '#/friend/sana?conflict=1', name: 'Friend pay page (conflict)' },
  { route: '#/friend/sana?after=amit&screen=ticket', name: 'Friend ticket', shot: '04e-ticket' },
  { route: '#/friend/priya?screen=pending', name: 'Friend pending' },
  { route: '#/friend/neha?screen=declined', name: 'Friend declined' },
  { route: '#/rohan/confirm', name: 'Confirm booking', shot: '04e-confirm' },
  { route: '#/rohan/showtimes', name: 'Showtimes' },
  { route: '#/rohan/hold', name: 'Hold sheet', shot: '04e-hold-sheet' },
  // 06
  { route: '#/rohan/board?at=310', name: 'Board (3:10 PM)', shot: '06e-board' },
  { route: '#/rohan/board?at=neha', name: "Board (Neha can't make it)" },
  { route: '#/rohan/board?at=t30', name: 'Board (T−30 band)' },
  { route: '#/rohan/board?at=grace', name: 'Board (settling in grace)' },
  { route: '#/rohan/board?at=310&clock=1630&sheet=release', name: 'Release sheet (fee kept)' },
  { route: '#/rohan/board?at=t30&sheet=t30', name: 'T−30 sheet' },
  { route: '#/rohan/receipt?at=receipt', name: 'Receipt', shot: '06e-receipt' },
  { route: '#/rohan/receipt?at=late', name: 'Receipt (Kabir paid late)' },
  { route: '#/rohan/orders?at=310', name: 'Your Bookings (group hold)' },
  { route: '#/rohan/orders?at=late', name: 'Your Bookings (settled)' },
  { route: '#/friend/kabir?at=810', name: 'Friend late page', shot: '06e-friend-late' },
  { route: '#/friend/kabir?at=showtime', name: 'Friend: show started' },
  { route: '#/friend/sana?at=receipt', name: 'Friend ticket (group set)' },
  // 07 demo stage: the phone inside the stage, plus its own overlays (intro, done card)
  { route: '#/', name: 'Stage: intro', shot: '07-intro' },
  { route: '#/?step=3', name: 'Stage: step 3 (hold sheet)', shot: '07-step-03' },
  { route: '#/?step=8', name: 'Stage: step 8 (board, banner)' },
  { route: '#/?step=12', name: 'Stage: step 12 (T−30 sheet)', shot: '07-step-12' },
  { route: '#/?step=13', name: 'Stage: step 13 (receipt)' },
  { route: '#/?step=14', name: 'Stage: step 14 (Kabir late)' },
  { route: '#/?explore=1&moment=receipt', name: 'Stage: explore (receipt)', shot: '07-explore' },
]

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

test('Board: Neha can’t make it → release D05 free → receipt numbers', async ({ page }) => {
  await page.goto('#/rohan/board?at=neha')
  await page.waitForTimeout(900)
  const frame = page.locator('.device-frame-mobile')
  await frame.getByRole('button', { name: 'Release a seat', exact: true }).click()
  await expect(frame.getByTestId('release-fee-band')).toHaveText('Free until 4:15 PM')
  await frame.getByRole('button', { name: 'Release D05 · ₹277.14 back' }).click()
  await expect(frame.getByTestId('declined-Neha')).toHaveCount(0)
  await expect(frame.getByTestId('set-aside')).toHaveText('₹554.28 still set aside')

  await page.goto('#/rohan/receipt?at=late')
  await page.reload()
  await page.waitForTimeout(900)
  await expect(frame.getByTestId('ledger-paid')).toContainText('₹554.28')
  await expect(frame.getByTestId('ledger-unblocked')).toContainText('₹1,108.56')
  await expect(frame.getByTestId('refund-D06')).toContainText('₹277.14')
})

test('Group hold: content scrolls and the CTA follows the cards', async ({ page }) => {
  await page.goto('#/rohan/held')
  await page.waitForTimeout(900)
  await zoomText(page, 1.1)
  const order = await page.evaluate(() => {
    const root = document.querySelector('.device-frame-mobile')!
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-testid="status-card"], [data-testid="whos-in"], [data-testid="money-card"]'))
    const lastCardBottom = Math.max(...cards.map((c) => c.getBoundingClientRect().bottom))
    const cta = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.includes('Send to your group'))!
    return { lastCardBottom, ctaTop: cta.getBoundingClientRect().top }
  })
  expect(order.ctaTop).toBeGreaterThanOrEqual(order.lastCardBottom)
})
