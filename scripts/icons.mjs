// Renders public/favicon.svg to the home-screen and manifest PNGs (08). Usage: node scripts/icons.mjs
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/favicon.svg', 'utf8')
const browser = await chromium.launch()
for (const [size, out, bleed] of [
  [180, 'public/apple-touch-icon.png', true], // iOS rounds the corners itself: full-bleed square
  [192, 'public/icon-192.png', false],
  [512, 'public/icon-512.png', false],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  // Full-bleed: drop the rounded corners so iOS's own mask doesn't show a second radius
  const art = bleed ? svg.replace('rx="112"', 'rx="0"') : svg
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${art}`)
  await page.screenshot({ path: out, omitBackground: true })
  console.log('icon', out)
  await page.close()
}
await browser.close()
