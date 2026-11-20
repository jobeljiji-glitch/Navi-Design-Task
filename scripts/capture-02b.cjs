const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4174;
const DIST_DIR = path.resolve(__dirname, '../dist');
const SHOTS_DIR = path.resolve(__dirname, '../shots');
const ARTIFACT_DIR = 'C:/Users/jobel/.gemini/antigravity/brain/03d599c3-8ba1-4a23-9b0a-3869839d201d';

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

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

  async function saveShot(locator, filename) {
    const shotPath = path.join(SHOTS_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    await locator.screenshot({ path: shotPath });
    fs.copyFileSync(shotPath, artifactPath);
    console.log(`Successfully saved ${filename}`);
  }

  // 1. Capture Seat Count Sheet (matching reference 19)
  console.log('1. Capturing seat count sheet...');
  {
    const page = await context.newPage();
    page.on('dialog', d => d.dismiss());
    await page.goto(`http://localhost:${PORT}/Navi-Design-Task/#/kit`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const container = page.locator('.device-frame-mobile');
    await container.locator('button:has-text("Sheets & Count")').click();
    await page.waitForTimeout(300);

    await container.locator('button:has-text("Open SeatCountSheet (6)")').click();
    await page.waitForTimeout(800);

    await saveShot(container, '02b-seat-count.png');
    await page.close();
  }

  // 2. Capture iOS Share Sheet (matching reference 17)
  console.log('2. Capturing share sheet...');
  {
    const page = await context.newPage();
    page.on('dialog', d => d.dismiss());
    await page.goto(`http://localhost:${PORT}/Navi-Design-Task/#/kit`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const container = page.locator('.device-frame-mobile');
    await container.locator('button:has-text("Sheets & Count")').click();
    await page.waitForTimeout(300);

    await container.locator('button:has-text("Open Share Sheet")').click();
    await page.waitForTimeout(800);

    await saveShot(container, '02b-share-sheet.png');
    await page.close();
  }

  // 3. Capture Ticket Screen (matching reference 16)
  console.log('3. Capturing ticket screen...');
  {
    const page = await context.newPage();
    page.on('dialog', d => d.dismiss());
    await page.goto(`http://localhost:${PORT}/Navi-Design-Task/#/kit`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const container = page.locator('.device-frame-mobile');
    await container.locator('button:has-text("Group Hold")').click();
    await page.waitForTimeout(300);

    const openTicketBtn = container.locator('button:has-text("Open full view")');
    await openTicketBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await openTicketBtn.click();

    // Reset scroll of root
    await page.evaluate(() => {
      const scrollable = document.querySelector('.device-frame-mobile > div');
      if (scrollable) scrollable.scrollTop = 0;
    });

    // Wait for full-screen ticket modal to appear
    const ticketCloseBtn = container.locator('button[aria-label="Close ticket"]').last();
    await ticketCloseBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(800);

    await saveShot(container, '02b-ticket.png');
    await page.close();
  }

  // 4. Capture Booking Card (matching reference 18)
  console.log('4. Capturing booking cards...');
  {
    const page = await context.newPage();
    page.on('dialog', d => d.dismiss());
    await page.goto(`http://localhost:${PORT}/Navi-Design-Task/#/kit`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const container = page.locator('.device-frame-mobile');
    await container.locator('button:has-text("Cards & Payment")').click();
    await page.waitForTimeout(300);

    // Scroll container so booking cards fill the screen
    await page.evaluate(() => {
      const scrollable = document.querySelector('.device-frame-mobile .overflow-y-auto');
      if (scrollable) {
        scrollable.scrollTop = 580;
      }
    });
    await page.waitForTimeout(600);

    await saveShot(container, '02b-booking-card.png');
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('All 4 shots captured cleanly and saved!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
