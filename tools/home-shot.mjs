// Full-page captures of one page at several widths + overflow/console checks.
// usage: node tools/home-shot.mjs <outdir> [path] [widths comma list]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const out = process.argv[2] || 'qa/home';
const path = process.argv[3] || '/';
const widths = (process.argv[4] || '1440,390').split(',').map(Number);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
const report = [];
for (const W of widths) {
  const H = W < 768 ? 844 : W < 1024 ? 1024 : 900;
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, isMobile: W < 768, hasTouch: W < 768 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('http://localhost:5173' + path, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } window.scrollTo(0, 0); });
  await new Promise((r) => setTimeout(r, 900));
  const name = (path === '/' ? 'home' : path.replace(/\//g, ''));
  await page.screenshot({ path: `${out}/${name}-${W}.png`, fullPage: true });
  const info = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth, iw = window.innerWidth;
    // anything poking past the right edge
    const wide = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > iw + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 5).map((e) => `${e.tagName.toLowerCase()}.${(e.className || '').toString().split(' ')[0]} r=${Math.round(e.getBoundingClientRect().right)}`);
    // headings whose words were broken mid-word (line count vs natural)
    return { sw, iw, h: document.documentElement.scrollHeight, wide };
  });
  report.push({ W, ...info, errors });
  await page.close();
}
console.log(JSON.stringify(report, null, 1));
await browser.close();
