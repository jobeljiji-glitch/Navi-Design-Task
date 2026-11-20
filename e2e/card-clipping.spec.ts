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
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('*')).filter(
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
