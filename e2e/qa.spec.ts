import { test, expect, type Page } from '@playwright/test'
import { SCREENS } from './routes'

/**
 * 08 QA sweep on every route the clipping spec covers, plus every Try-a-failure deep link:
 * - every visible button / link / [role=button] has an accessible name,
 * - tap targets ≥ 44 × 44 pt (the element or a hit-area ancestor),
 * - text contrast ≥ 4.5:1 against the first opaque background behind it,
 * - no 600/700 text outside the logged exceptions (D-057, D-058, D-066).
 * Runs with reduced motion, so sheets render at rest.
 */

const FAILURE_IDS = [
  'under-3h', 'cap', 'second-hold', 'hold-running', 'over-cap', 'two-seats', 'no-blocking', 'no-card', 'upi-declined', 'bank-timeout', 'own-fails',
  'cancel-block', 'conflict', 'friend-fails', 'cant-make-it', 'pending', 'nobody', 'late', 'cutoff-pending', 'after-show', 'cinema',
]

const ROUTES = [...SCREENS.map((s) => ({ route: s.route, name: s.name })), ...FAILURE_IDS.map((id) => ({ route: `#/?explore=1&failure=${id}`, name: `Failure: ${id}` }))]

/** Exceptions, each logged in docs/decisions.md. */
const WEIGHT_OK = '[data-weight-ok], .status-bar, [data-chat], [data-poster], [data-testid="screen-shape"], [data-club]'
/** Dense grids where BMS itself uses small tiles (D-020 seat map); the row is the target, tested by the seat-pick logic. */
const SIZE_OK = '[data-seat-grid] *, [data-size-ok]'

async function audit(page: Page) {
  return page.evaluate(
    ({ WEIGHT_OK, SIZE_OK }) => {
      const out: string[] = []
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return false
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false
        if (el.closest('[aria-hidden="true"], [inert]')) return false
        // off-screen (the hidden desktop / mobile copy of the frame)
        if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false
        return !!(el as HTMLElement).offsetParent || cs.position === 'fixed'
      }
      const label = (el: Element) => (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)

      // 1, 2: names and target size
      for (const el of Array.from(document.querySelectorAll('button, a[href], [role="button"], [role="radio"], [role="tab"], input, select'))) {
        if (!visible(el) || (el as HTMLButtonElement).disabled) continue
        const name = el.getAttribute('aria-label') ?? el.getAttribute('aria-labelledby') ?? (el.textContent ?? '').trim() ?? ''
        const title = el.getAttribute('title') ?? ''
        if (!name && !title && !(el as HTMLInputElement).labels?.length && el.tagName !== 'INPUT') out.push(`no name: <${el.tagName.toLowerCase()} class="${(el.getAttribute('class') ?? '').slice(0, 40)}">`)
        if (el.closest(SIZE_OK)) continue
        if (el.matches('.hit-44')) {
          // the ::after hit area is max(box, 44) around the centre (src/index.css)
          const a = getComputedStyle(el, '::after')
          if (parseFloat(a.width) >= 43.5 && parseFloat(a.height) >= 43.5) continue
        }
        let ok = false
        for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
          const r = n.getBoundingClientRect()
          if (r.width >= 43.5 && r.height >= 43.5) {
            ok = n === el || n.querySelectorAll('button, a[href], [role="button"]').length === 1
            break
          }
          if (n !== el && n.matches('button, a[href], [role="button"]')) break
        }
        if (!ok) {
          const r = el.getBoundingClientRect()
          out.push(`small target ${Math.round(r.width)}×${Math.round(r.height)}: "${label(el) || el.getAttribute('aria-label')}"`)
        }
      }

      // 3, 4: contrast and weight on text nodes
      const lum = (c: number[]) => {
        const f = (v: number) => {
          v /= 255
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
      }
      const rgba = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number)
      const bgOf = (el: Element): number[] | null => {
        for (let n: Element | null = el; n; n = n.parentElement) {
          const cs = getComputedStyle(n)
          if (cs.backgroundImage !== 'none') return null // gradients / art: skip
          if (cs.backdropFilter && cs.backdropFilter !== 'none') return null // iOS banners: translucent over the app
          const c = rgba(cs.backgroundColor)
          if (c.length >= 3 && (c[3] === undefined || c[3] >= 0.95)) return c
          if (c.length === 4 && c[3] > 0.05) return null // translucent layer: can't know what's behind
        }
        return [255, 255, 255]
      }
      // D-109 (user): BookMyShow's brand fills keep white text (as in the references), and the seat map keeps
      // its own colours (green numbers, greyed sold seats = inactive). Everything else must reach 4.5:1.
      const probe = document.createElement('div')
      document.body.appendChild(probe)
      const tokenRgb = (v: string) => {
        probe.style.color = `var(${v})`
        return getComputedStyle(probe).color
      }
      const BRAND_FILLS = ['--bms-red', '--bms-red-strong', '--showtime-green', '--seat-selected', '--badge-confirmed', '--seat-paid-friend'].map(tokenRgb)
      const BRAND_TEXT = ['--seat-number', '--seat-sold-text'].map(tokenRgb)
      probe.remove()
      const brandException = (fg: string, bg: number[]) => {
        const bgStr = `rgb(${bg.slice(0, 3).join(', ')})`
        return (fg === 'rgb(255, 255, 255)' && BRAND_FILLS.includes(bgStr)) || BRAND_TEXT.includes(fg)
      }
      const seen = new Set<Element>()
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const t = walker.currentNode
        const el = t.parentElement
        if (!el || seen.has(el) || !t.textContent?.trim() || !visible(el)) continue
        seen.add(el)
        const cs = getComputedStyle(el)
        if (Number(cs.fontWeight) >= 600 && !el.closest(WEIGHT_OK)) out.push(`weight ${cs.fontWeight}: "${label(el)}"`)
        if (el.closest('[data-contrast-ok], svg')) continue
        const fg = rgba(cs.color)
        const bg = bgOf(el)
        if (!bg || fg.length < 3 || brandException(cs.color, bg)) continue
        const a = fg[3] ?? 1
        const mix = [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a))
        const L1 = lum(mix)
        const L2 = lum(bg)
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
        const large = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && Number(cs.fontWeight) >= 700)
        if (ratio < (large ? 3 : 4.5)) out.push(`contrast ${ratio.toFixed(2)}: "${label(el)}" (${cs.color} on rgb(${bg.slice(0, 3).join(',')}))`)
      }
      return [...new Set(out)]
    },
    { WEIGHT_OK, SIZE_OK },
  )
}

test.use({ reducedMotion: 'reduce' })

for (const r of ROUTES) {
  test(`QA: ${r.name}`, async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('demoBar:explore', 'closed'))
    await page.goto(r.route)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1200)
    expect(await audit(page)).toEqual([])
  })
}

test('alert dialog takes focus and Escape-free OK returns to the app', async ({ page }) => {
  await page.goto('#/?explore=1&failure=cancel-block')
  await page.waitForTimeout(1500)
  const ok = page.getByTestId('hold-alert').locator('visible=true').getByRole('button', { name: 'OK' })
  await expect(ok).toBeFocused()
})

test('Tab stays inside an open bottom sheet', async ({ page }) => {
  await page.goto('#/?explore=1&failure=no-blocking')
  await page.waitForTimeout(1500)
  for (let i = 0; i < 25; i++) await page.keyboard.press('Tab')
  const inside = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))
  expect(inside).toBe(true)
})
