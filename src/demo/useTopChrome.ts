import { useEffect } from 'react'

/**
 * 07c: make the browser chrome match the top of the page (iOS 26 Safari tints and fades its
 * status-bar area from `theme-color` and the page background; a fixed white made a white band
 * over the dark demo bar).
 *
 * - bar open: the demo bar colour
 * - bar collapsed: the colour of the current screen's header (sampled under the status bar,
 *   ignoring stage overlays like the Demo tab), re-sampled on persona / screen change
 * - framed layouts: the stage backdrop
 * `<meta name="theme-color">`, html and body all get the same colour.
 */
export type TopSource = 'bar' | 'screen' | 'stage'

const DEFAULT = '#ffffff'

function meta(): HTMLMetaElement {
  let m = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!m) {
    m = document.createElement('meta')
    m.name = 'theme-color'
    document.head.appendChild(m)
  }
  return m
}

function opaque(c: string) {
  if (!c || c === 'transparent') return false
  const m = /rgba\([^)]*,\s*([\d.]+)\)$/.exec(c)
  return !m || parseFloat(m[1]) >= 0.99
}

/** A token's colour in the same `rgb()` form the sampled colours use. */
function token(name: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(${name}, ${DEFAULT})`
  document.body.appendChild(probe)
  const c = getComputedStyle(probe).color
  probe.remove()
  return c
}

/** Colour of the app's own first painted layer just below the top inset, at the screen's left edge. */
export function sampleScreenTop(): string {
  const app = document.querySelector<HTMLElement>('.stage-app')
  if (!app) return DEFAULT
  const r = app.getBoundingClientRect()
  const sat = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0
  const x = r.left + 4
  const y = r.top + sat + 2
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest('[data-stage-overlay]')) continue
    if (!app.contains(el)) continue
    for (let n: Element | null = el; n && n !== app; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor
      if (opaque(bg)) return bg
    }
  }
  return token('--bg-surface')
}

export function applyTopColour(c: string) {
  meta().content = c
  document.documentElement.style.backgroundColor = c
  document.body.style.backgroundColor = c
}

export function useTopChrome(source: TopSource, deps: unknown[]) {
  useEffect(() => {
    const pick = () =>
      applyTopColour(source === 'bar' ? token('--stage-ink') : source === 'stage' ? token('--stage-bg') : sampleScreenTop())
    pick()
    // screens slide / load lazily: sample again once they've settled
    const t1 = setTimeout(pick, 120)
    const t2 = setTimeout(pick, 500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [source, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving the stage (standalone routes): back to the app default.
  useEffect(() => () => applyTopColour(DEFAULT), [])
}
