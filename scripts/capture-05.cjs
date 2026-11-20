// Prompt 05 screenshots: 402 × 874 @3x against the running dev server (npm run dev).
// Usage: node scripts/capture-05.cjs [baseUrl]
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:5173/Navi-Design-Task/#';
const SHOTS = path.resolve(__dirname, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });

  const open = async (route, wait = 1200) => {
    const page = await context.newPage();
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(wait);
    return page;
  };
  const snap = async (page, name) => {
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
    console.log('saved', name);
  };
  const vis = (page, sel) => page.locator('.device-frame-mobile').locator(sel).first();

  // Static deep links
  const routes = [
    ['/friend/amit', '05-amit-chat'],
    ['/friend/amit?screen=pay', '05-amit-pay'],
    ['/friend/sana?after=amit&screen=pay', '05-sana-pay'],
    ['/friend/sana?conflict=1', '05-sana-conflict'],
    ['/friend/amit?assigned=1&screen=pay', '05-assigned'],
    ['/friend/amit?screen=phone', '05-phone'],
    ['/friend/amit?screen=otp', '05-otp'],
    ['/friend/amit?screen=upi', '05-upi-choice'],
    ['/friend/amit?screen=approve', '05-upi-approve'],
    ['/friend/priya?screen=pending', '05-pending'],
    ['/friend/sana?screen=failed', '05-failed'],
    ['/friend/sana?after=amit&screen=ticket', '05-ticket'],
    ['/friend/neha?screen=declined', '05-declined'],
  ];
  for (const [route, name] of routes) {
    const p = await open(route);
    await snap(p, name);
    await p.close();
  }

  // Can't make it sheet + cancellation sheet + 2 seats
  {
    const p = await open('/friend/neha?screen=pay');
    await vis(p, '[data-testid="cant-make-it"]').click();
    await p.waitForTimeout(700);
    await snap(p, '05-cant-make-it-sheet');
    await p.close();
    const q = await open('/friend/sana?screen=pay');
    await vis(q, '[aria-label="One more seat"]').click();
    await q.waitForTimeout(300);
    await snap(q, '05-two-seats');
    await q.close();
  }

  // Rohan: share sheet → chat → send → board
  {
    const p = await open('/rohan/held', 5200);
    await vis(p, 'text=Send to your group').click();
    await p.waitForTimeout(700);
    await snap(p, '05-share-sheet');
    await vis(p, '[aria-label="Friday movie"]').click();
    await p.waitForTimeout(700);
    await snap(p, '05-rohan-chat');
    await vis(p, '[data-testid="chat-send"]').click();
    await p.waitForTimeout(400);
    await snap(p, '05-rohan-chat-sent');
    await p.waitForTimeout(1200);
    await snap(p, '05-rohan-board');

    // Same page/store: Amit pays via the real UI on the friend route; Rohan's board must update.
    await p.goto(`${BASE}/friend/amit`);
    await p.waitForTimeout(800);
    await vis(p, '[data-testid="link-preview"]').click();
    await p.waitForTimeout(400);
    await vis(p, 'text=Pay ₹277.14 for D08').click();
    await p.waitForTimeout(300);
    await vis(p, 'text=Continue').click();
    await p.waitForTimeout(300);
    await vis(p, '[aria-label="Digit 1"]').click();
    for (const d of ['1', '2', '3', '4']) {
      await p.keyboard.type(d);
    }
    await p.waitForTimeout(700);
    await vis(p, '[data-testid="upi-app-kite"]').click();
    await p.waitForTimeout(300);
    await vis(p, '[data-testid="approve-with-pin"]').click();
    await p.waitForTimeout(500);
    for (const d of ['1', '2', '3', '4']) await vis(p, `[data-testid="pin-key-${d}"]`).click();
    await p.waitForTimeout(600);
    await snap(p, '05-flow-pending');
    await p.waitForTimeout(2200);
    await snap(p, '05-flow-ticket');
    await p.goto(`${BASE}/rohan/board`);
    await p.waitForTimeout(1000);
    await snap(p, '05-rohan-board-after-amit');
    const waiting = await vis(p, '[data-testid="split-waiting"]').innerText();
    console.log('Rohan waiting row after Amit:', waiting.replace(/\n/g, ' | '));
    await p.close();
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
