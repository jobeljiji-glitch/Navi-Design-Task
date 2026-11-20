// Prompt 06 screenshots: 402 × 874 @3x against the running dev server (npm run dev).
// Usage: node scripts/capture-06.cjs [baseUrl] [filter]
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:5173/Navi-Design-Task/#';
const FILTER = process.argv[3] || '';
const SHOTS = path.resolve(__dirname, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });

async function zoomText(page, f) {
  await page.evaluate((f) => {
    const all = Array.from(document.querySelectorAll('body *'));
    const sizes = all.map((el) => {
      const cs = getComputedStyle(el);
      return { el, fs: parseFloat(cs.fontSize), lh: cs.lineHeight };
    });
    for (const { el, fs, lh } of sizes) {
      el.style.fontSize = `${fs * f}px`;
      if (lh.endsWith('px')) el.style.lineHeight = `${parseFloat(lh) * f}px`;
    }
  }, f);
}

const SHOTS_LIST = [
  ['/rohan/board?at=310', '06-board'],
  ['/rohan/board?at=neha', '06-board-neha'],
  ['/rohan/board?at=neha&sheet=release', '06-release-free'],
  ['/rohan/board?at=310&clock=1630&sheet=release', '06-release-fee'],
  ['/rohan/board?at=t30', '06-t30-board'],
  ['/rohan/board?at=t30&sheet=t30', '06-t30-sheet'],
  ['/rohan/board?at=t30&sheet=t30', '06-t30-sheet-release1', async (p) => {
    await p.locator('.device-frame-mobile [aria-label="Fewer seats to keep"]').first().click();
  }],
  ['/rohan/board?at=310&sheet=more', '06-more'],
  ['/rohan/board?at=grace', '06-resolving'],
  ['/rohan/board?at=grace&play=1', '06-settling', null, 2600],
  ['/rohan/receipt?at=receipt', '06-receipt'],
  ['/rohan/receipt?at=late', '06-receipt-late'],
  ['/rohan/orders?at=310', '06-orders'],
  ['/rohan/orders?at=late', '06-orders-settled'],
  ['/friend/kabir?at=810', '06-friend-late'],
  ['/friend/kabir?at=showtime', '06-friend-started'],
  ['/friend/sana?at=receipt', '06-friend-set'],
  ['/rohan/confirm', '06-confirm-16plus', async (p) => zoomText(p, 1.3)],
];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
  for (const [route, name, act, wait] of SHOTS_LIST) {
    if (FILTER && !name.includes(FILTER)) continue;
    const page = await context.newPage();
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(wait || 1200);
    if (act) {
      await act(page);
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
    console.log('saved', name);
    await page.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
