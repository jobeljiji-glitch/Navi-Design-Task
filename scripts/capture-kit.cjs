const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4173;
const DIST_DIR = path.resolve(__dirname, '../dist');
const OUT_DIR = 'C:/Users/jobel/.gemini/antigravity/brain/1a57a747-503d-48d4-b394-491c5e0ca3eb';

// Simple static server for dist
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath.startsWith('/Navi-Design-Task/')) {
        reqPath = reqPath.replace('/Navi-Design-Task/', '/');
      }
      if (reqPath === '/' || !path.extname(reqPath)) {
        reqPath = '/index.html';
      }
      const filePath = path.join(DIST_DIR, reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mimeMap = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
          '.jpg': 'image/jpeg',
          '.png': 'image/png',
          '.woff2': 'font/woff2',
        };
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const fallback = path.join(DIST_DIR, 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(fallback).pipe(res);
      }
    });

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      resolve(server);
    });
  });
}

async function run() {
  const server = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  console.log('Navigating to kit page...');
  await page.goto(`http://localhost:${PORT}/Navi-Design-Task/#/kit`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Initial view (CTAs & Nav)
  await page.screenshot({ path: path.join(OUT_DIR, 'kit-01-ctas.png') });
  console.log('Saved kit-01-ctas.png');

  // 2. Click Seats tab
  const seatsTab = page.locator('.device-frame-mobile button:has-text("Seats & Grid")');
  if (await seatsTab.count() > 0) {
    await seatsTab.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, 'kit-02-seats.png') });
    console.log('Saved kit-02-seats.png');
  }

  // 3. Click Sheets tab
  const sheetsTab = page.locator('.device-frame-mobile button:has-text("Sheets & Count")');
  if (await sheetsTab.count() > 0) {
    await sheetsTab.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, 'kit-03-sheets.png') });
    console.log('Saved kit-03-sheets.png');

    // Click "Open BottomSheet" button
    const openSheetBtn = page.locator('.device-frame-mobile button:has-text("Open BottomSheet")');
    if (await openSheetBtn.count() > 0) {
      await openSheetBtn.first().click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT_DIR, 'kit-04-bottomsheet.png') });
      console.log('Saved kit-04-bottomsheet.png');
      // Click scrim or close
      await page.locator('.device-frame-mobile div[aria-hidden="true"]').first().click({ force: true });
      await page.waitForTimeout(500);
    }
  }

  // 4. Click Cards tab
  const cardsTab = page.locator('.device-frame-mobile button:has-text("Cards & Payment")');
  if (await cardsTab.count() > 0) {
    await cardsTab.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, 'kit-05-cards-payment.png') });
    console.log('Saved kit-05-cards-payment.png');
  }

  // 5. Click Group tab
  const groupTab = page.locator('.device-frame-mobile button:has-text("Group Hold")');
  if (await groupTab.count() > 0) {
    await groupTab.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, 'kit-06-group-hold.png') });
    console.log('Saved kit-06-group-hold.png');
  }

  await browser.close();
  server.close();
  console.log('Done capturing screenshots!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
