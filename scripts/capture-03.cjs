const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4175;
const DIST_DIR = path.resolve(__dirname, '../dist');
const SHOTS_DIR = path.resolve(__dirname, '../shots');
const ARTIFACT_DIR = 'C:/Users/jobel/.gemini/antigravity/brain/1b3f6fd5-618f-4d4f-bc15-cd2702c54601';

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
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

  async function captureRoute(route, filename, waitMs = 500) {
    const page = await context.newPage();
    page.on('dialog', d => d.dismiss());
    await page.goto(`http://localhost:${PORT}/Navi-Design-Task/#${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(waitMs);

    const container = page.locator('.device-frame-mobile');
    const shotPath = path.join(SHOTS_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);

    await container.screenshot({ path: shotPath });
    fs.copyFileSync(shotPath, artifactPath);
    console.log(`Saved ${filename}`);
    await page.close();
  }

  console.log('1. Capturing 03-movie-detail.png...');
  await captureRoute('/rohan/movie', '03-movie-detail.png', 600);

  console.log('2. Capturing 03-showtimes.png...');
  await captureRoute('/rohan/showtimes', '03-showtimes.png', 600);

  console.log('3. Capturing 03-seat-count.png...');
  await captureRoute('/rohan/seat-count', '03-seat-count.png', 800);

  console.log('4. Capturing 03-seat-layout-empty.png...');
  await captureRoute('/rohan/seats', '03-seat-layout-empty.png', 600);

  console.log('5. Capturing 03-seat-layout-selected.png...');
  await captureRoute('/rohan/seats-selected', '03-seat-layout-selected.png', 600);

  console.log('6. Capturing 03-loader.png...');
  await captureRoute('/rohan/loader', '03-loader.png', 800);

  console.log('7. Capturing 03-confirm-booking.png...');
  await captureRoute('/rohan/confirm', '03-confirm-booking.png', 600);

  console.log('8. Capturing 03-payment.png...');
  await captureRoute('/rohan/payment', '03-payment.png', 600);

  await browser.close();
  server.close();
  console.log('All 03 screens captured successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
