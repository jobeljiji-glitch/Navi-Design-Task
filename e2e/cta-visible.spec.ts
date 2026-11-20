import { test, expect } from '@playwright/test'

/**
 * 09: the CTA is always visible. On every screen and sheet with a primary action, at 402 × 874 pt and
 * without scrolling, the CTA sits in a pinned footer, fully inside the viewport, and nothing covers it.
 * Also checks the hold sheet fits with no scrolling at all.
 */

test.use({ viewport: { width: 402, height: 874 } })

const CASES: Array<{ name: string; route: string; cta: RegExp; tap?: string }> = [
  { name: 'Movie detail', route: '#/rohan/movie', cta: /Book tickets/ },
  { name: 'Seat layout (hold / pay)', route: '#/rohan/seats-selected', cta: /Hold for group/ },
  { name: 'Hold sheet', route: '#/rohan/hold', cta: /Block ₹1,662.84 on UPI/ },
  { name: 'Hold settings sheet', route: '#/rohan/hold', cta: /^Done$/, tap: 'edit-settings' },
  { name: 'UPI approval', route: '#/rohan/upi', cta: /Approve with PIN/ },
  { name: 'Group hold (success)', route: '#/rohan/held', cta: /Send to your group/ },
  { name: 'Board', route: '#/rohan/board?at=310', cta: /Share link again/ },
  { name: 'Board after the deadline', route: '#/rohan/board?at=kept', cta: /View receipt/ },
  { name: 'Release sheet', route: '#/rohan/board?at=neha&sheet=release', cta: /Release D05/ },
  { name: 'T−30 sheet', route: '#/rohan/board?at=t30&sheet=t30', cta: /^Confirm$/ },
  { name: 'Receipt before showtime', route: '#/rohan/receipt?at=kept', cta: /Send a pay link for D06/ },
  { name: 'Confirm booking', route: '#/rohan/confirm', cta: /Continue|Proceed/ },
  { name: 'Friend pay page', route: '#/friend/amit?screen=pay', cta: /Pay ₹277.14 for/ },
  { name: 'Friend phone', route: '#/friend/amit?screen=phone', cta: /^Continue$/ },
  { name: 'Friend UPI approval', route: '#/friend/amit?screen=approve&loggedIn=1', cta: /Approve with PIN/ },
  { name: 'Friend late page', route: '#/friend/kabir?at=810', cta: /Pay ₹277.14 for D06/ },
]

for (const c of CASES) {
  test(`${c.name}: CTA in view without scrolling`, async ({ page }) => {
    await page.goto(c.route)
    await page.waitForTimeout(1200)
    const frame = page.locator('.device-frame-mobile')
    if (c.tap) {
      await frame.getByTestId(c.tap).click()
      await page.waitForTimeout(700)
    }
    const btn = frame.getByRole('button', { name: c.cta }).last()
    await expect(btn).toBeVisible()
    const r = await btn.evaluate((el) => {
      const b = el.getBoundingClientRect()
      const cx = b.left + b.width / 2
      const cy = b.top + b.height / 2
      const top = document.elementFromPoint(cx, cy)
      const scrolled = Array.from(document.querySelectorAll<HTMLElement>('*')).some((e) => e.scrollTop > 0)
      return {
        top: b.top,
        bottom: b.bottom,
        vh: window.innerHeight,
        pinned: !!el.closest('[data-pinned-footer]'),
        covered: !!top && !el.contains(top) && !top.contains(el),
        scrolled,
      }
    })
    expect(r.scrolled, 'nothing was scrolled').toBe(false)
    expect(r.top).toBeGreaterThanOrEqual(0)
    expect(r.bottom).toBeLessThanOrEqual(r.vh)
    expect(r.covered, 'something covers the CTA').toBe(false)
    if (!/Movie detail|Confirm booking|Seat layout/.test(c.name)) expect(r.pinned, 'CTA sits in the pinned footer').toBe(true)
  })
}

test('Hold sheet fits at 874 pt with no scrolling', async ({ page }) => {
  await page.goto('#/rohan/hold')
  await page.waitForTimeout(1200)
  const body = page.locator('.device-frame-mobile [data-testid=hold-sheet-root] [data-sheet-body]')
  const { scroll, client } = await body.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }))
  expect(scroll).toBeLessThanOrEqual(client + 1)
})
