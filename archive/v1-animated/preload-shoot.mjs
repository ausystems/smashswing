import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const t0 = Date.now();
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
const marks = [400, 1000, 1700, 2300, 2900, 3800];
for (const m of marks) {
  const wait = m - (Date.now() - t0);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  await page.screenshot({ path: `${out}/t${String(m).padStart(4, '0')}.png` });
}
const state = await page.evaluate(() => ({ count: document.getElementById('preloader-count').textContent, done: document.getElementById('preloader').className, lead: getComputedStyle(document.getElementById('hero-lead')).opacity }));
console.log(JSON.stringify(state));
await browser.close();
