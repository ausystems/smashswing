// Full-page screenshots of every page at desktop and phone widths, plus overflow + console checks.
// usage: node tools/shoot.mjs <outdir>
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || 'qa';
fs.mkdirSync(out, { recursive: true });
const PAGES = ['/', '/products/', '/technology/', '/case-studies/', '/contact/'];
const SIZES = [[1440, 900], [390, 844]];
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
const report = [];
for (const [W, H] of SIZES) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1, isMobile: W < 768, hasTouch: W < 768 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  for (const p of PAGES) {
    await page.goto('http://localhost:5173' + p, { waitUntil: 'networkidle0' });
    // walk the page so lazy images load before the full-page capture
    await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await new Promise((r) => setTimeout(r, 900));
    const name = (p === '/' ? 'home' : p.replace(/\//g, '')) + `-${W}`;
    await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
    const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, h: document.documentElement.scrollHeight }));
    report.push({ page: p, W, overflow: info.sw > info.iw, height: info.h });
  }
  report.push({ W, errors });
  await page.close();
}
console.log(JSON.stringify(report, null, 2));
await browser.close();
