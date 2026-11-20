import { test, expect, type Page } from '@playwright/test'

/**
 * 07c: no white band at the top on iPhone. Browser: theme-color and the page background match
 * whatever is at the top (the demo bar, or the screen header when collapsed). Home-screen app
 * (black-translucent status bar): the strip under the status bar is the bar colour.
 * Also audits that none of our overlays paints a gradient / blur / mask / translucent white
 * over the top of the screen while inactive.
 */

test.skip(({ browserName }) => browserName !== 'webkit', 'iPhone chrome check: WebKit only')

const INK = 'rgb(28, 28, 28)' // --stage-ink
const WHITE = 'rgb(255, 255, 255)'
const NOTCH = 59 // iPhone 17 status-bar inset, emulated (Playwright can't fake env())

type Bar = 'open' | 'collapsed'
type Mode = 'browser' | 'standalone'

async function setup(page: Page, mode: Mode) {
  if (mode === 'standalone') {
    await page.addInitScript((notch) => {
      Object.defineProperty(navigator, 'standalone', { get: () => true })
      document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style')
        s.textContent = `:root { --sat: ${notch}px !important; }`
        document.head.appendChild(s)
      })
    }, NOTCH)
  }
}

async function setBar(page: Page, want: Bar) {
  const title = page.getByTestId('demo-bar-title')
  const pill = page.getByTestId('demo-pill')
  await expect(title.or(pill)).toBeVisible()
  if (want === 'collapsed' && (await title.isVisible())) await title.click()
  if (want === 'open' && (await pill.isVisible())) await pill.click()
  await expect(want === 'open' ? title : pill).toBeVisible()
  await page.waitForTimeout(700) // theme colour re-samples after screens settle
}

/** Anything visible in the top band that could wash it out (except the bar and its chips). */
async function topOverlays(page: Page, band: number) {
  return page.evaluate((band) => {
    const out: string[] = []
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height || r.top >= band || r.bottom <= 0) continue
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      if (el.closest('[data-testid=explore-chips], [data-testid=demo-pill]')) continue
      const bg = cs.backgroundColor
      const alpha = /rgba\([^)]*,\s*([\d.]+)\)$/.exec(bg)
      const translucentWhite = alpha && parseFloat(alpha[1]) > 0 && parseFloat(alpha[1]) < 1 && /rgba\(2[0-9]{2}, 2[0-9]{2}, 2[0-9]{2}/.test(bg)
      const webkitBackdrop = (cs as unknown as Record<string, string>).webkitBackdropFilter
      const bad =
        (cs.backgroundImage && cs.backgroundImage !== 'none' && /gradient/.test(cs.backgroundImage) && !el.closest('[data-poster]')) ||
        (cs.backdropFilter && cs.backdropFilter !== 'none') ||
        (webkitBackdrop && webkitBackdrop !== 'none') ||
        ((cs as unknown as Record<string, string>).maskImage ?? 'none') !== 'none' ||
        translucentWhite ||
        (parseFloat(cs.opacity) < 1 && parseFloat(cs.opacity) > 0 && r.width > 300)
      if (bad) out.push(`${el.tagName}.${el.className.toString().slice(0, 50)} bg=${bg} img=${cs.backgroundImage.slice(0, 40)} op=${cs.opacity}`)
    }
    return out
  }, band)
}

async function chrome(page: Page) {
  return page.evaluate(() => ({
    theme: document.querySelector<HTMLMetaElement>('meta[name=theme-color]')!.content,
    html: getComputedStyle(document.documentElement).backgroundColor,
    body: getComputedStyle(document.body).backgroundColor,
    statusStyle: document.querySelector<HTMLMetaElement>('meta[name=apple-mobile-web-app-status-bar-style]')!.content,
  }))
}

/** Colour actually painted at a point (ignoring transparent layers). */
async function paintedAt(page: Page, x: number, y: number) {
  return page.evaluate(
    ([x, y]) => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null
      if (!el) return null
      // the standalone strip is the frame's top border: report that when the point is inside it
      for (let n: HTMLElement | null = el; n; n = n.parentElement) {
        const cs = getComputedStyle(n)
        const b = n.getBoundingClientRect()
        const bt = parseFloat(cs.borderTopWidth)
        if (bt > 0 && y >= b.top && y < b.top + bt) return cs.borderTopColor
        if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') return cs.backgroundColor
      }
      return null
    },
    [x, y],
  )
}

for (const mode of ['browser', 'standalone'] as Mode[]) {
  for (const bar of ['open', 'collapsed'] as Bar[]) {
    test(`${mode}, bar ${bar}: top chrome matches, nothing washes it out`, async ({ page }) => {
      await setup(page, mode)
      await page.goto('#/?explore=1&phone=/rohan/seats-selected')
      await setBar(page, bar)
      const sat = mode === 'standalone' ? NOTCH : 0

      const c = await chrome(page)
      expect(c.statusStyle).toBe('black-translucent')
      const want = bar === 'open' ? INK : WHITE // collapsed: the seat layout's white header
      expect(c.theme, 'theme-color').toBe(want)
      expect(c.html, 'html background').toBe(want)
      expect(c.body, 'body background').toBe(want)

      // under the status bar: the bar colour in the home-screen app; the header in the browser
      if (sat) expect(await paintedAt(page, 30, sat / 2), 'strip under the status bar').toBe(INK)
      if (bar === 'open') {
        expect(await paintedAt(page, 4, sat + 20), 'demo bar').toBe(INK)
        const title = page.getByTestId('demo-bar-title')
        const t = await title.evaluate((el) => {
          let op = 1
          for (let n: Element | null = el; n; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity)
          return { color: getComputedStyle(el).color, op }
        })
        expect(t.op, 'bar text has no inherited opacity').toBe(1)
        expect(t.color, 'bar text colour is opaque').toMatch(/^rgb\(/)
        const bb = await page.getByTestId('explore-chips').boundingBox()
        expect(bb!.y, 'bar starts at the very top').toBeLessThanOrEqual(0.5)
        expect(Math.round(bb!.height), 'bar = inset + 40 pt').toBe(sat + 40)
      } else {
        const f = await page.locator('.stage-app .device-frame-mobile').boundingBox()
        expect(f!.y).toBeLessThanOrEqual(0.5)
      }

      expect(await topOverlays(page, sat + 60), 'overlays over the top band').toEqual([])
      await page.screenshot({ path: `shots/07c-top-${mode}-${bar}.png`, clip: { x: 0, y: 0, width: 393, height: 220 } })
    })
  }
}

test('theme colour follows persona and screen changes', async ({ page }) => {
  await page.goto('#/?explore=1&moment=board')
  await setBar(page, 'collapsed')
  const before = (await chrome(page)).theme
  await page.getByTestId('demo-pill').click()
  await page.getByTestId('persona-chip').click()
  await page.getByTestId('persona-Amit').click()
  await setBar(page, 'collapsed')
  const amit = (await chrome(page)).theme
  // board header (grey page) vs the friend's ticket page: both sampled, never the fixed white
  expect(before).toMatch(/^rgb/)
  expect(amit).toMatch(/^rgb/)
  await setBar(page, 'open')
  expect((await chrome(page)).theme).toBe(INK)
})
