const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4176;
const DIST_DIR = path.resolve(__dirname, '../dist');
const SHOTS_DIR = path.resolve(__dirname, '../shots');

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

  async function captureDiff(route, filename, waitMs = 600) {
    const page = await context.newPage();
    page.on('dialog', d => d.dismiss());
    await page.goto(`http://localhost:${PORT}/Navi-Design-Task/?overlay=1#${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(waitMs);

    // Toggle overlay ON with 'O' key
    await page.keyboard.press('KeyO');
    await page.waitForTimeout(200);

    // Turn on difference blend checkbox
    const diffCheckbox = page.locator('input[type="checkbox"]');
    if (await diffCheckbox.count() > 0) {
      await diffCheckbox.check();
    }
    await page.waitForTimeout(300);

    const shotPath = path.join(SHOTS_DIR, filename);
    await page.screenshot({ path: shotPath });
    console.log(`Saved diff ${filename}`);
    await page.close();
  }

  console.log('Comparing 05-seat-count-sheet...');
  await captureDiff('/rohan/seat-count', 'diff-05.png', 800);

  console.log('Comparing 06-seat-layout-empty...');
  await captureDiff('/rohan/seats', 'diff-06.png', 600);

  console.log('Comparing 08-seat-layout-selected...');
  await captureDiff('/rohan/seats-selected', 'diff-08.png', 600);

  console.log('Comparing 11-confirm-booking...');
  await captureDiff('/rohan/confirm', 'diff-11.png', 600);

  console.log('Comparing 12-payment...');
  await captureDiff('/rohan/payment', 'diff-12.png', 600);

  await browser.close();
  server.close();
  console.log('All diff screenshots captured!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
