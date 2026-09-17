// Headless walk-through: screenshots every section at a given viewport.
// usage: node tools/shoot.mjs <width> <height> <outdir> [--preloader]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const [w = '1440', h = '900', out = 'shots', ...flags] = process.argv.slice(2);
const W = +w, H = +h;
const withPreloader = flags.includes('--preloader');
const reduced = flags.includes('--reduced');
const mobile = W < 768;
fs.mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
if (!withPreloader) await page.evaluateOnNewDocument(() => sessionStorage.setItem('smashVisited', '1'));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, withPreloader ? 5200 : 3200));
await page.screenshot({ path: path.join(out, `00-hero.png`) });

const ids = ['marquee-1', 'statement', 'contact', 'features', 'products', 'marquee-2', 'founder', 'teaser', 'facilities', 'close', 'footer'];
const scrollTo = async (y) => {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, 2200));
};
let n = 1;
for (const id of ids) {
  const top = await page.evaluate((id) => { const el = document.getElementById(id); return el.getBoundingClientRect().top + window.scrollY; }, id);
  if (id === 'contact' && !mobile && W >= 1024 && !reduced) {
    for (const p of [0, 0.3, 0.5, 0.75, 1]) {
      await scrollTo(top + p * H * 2.5);
      await page.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-contact-${Math.round(p * 100)}.png`) });
    }
    n++;
    continue;
  }
  const offset = id === 'statement' ? -80 : (id.startsWith('marquee') ? -Math.round(H * 0.45) : 0);
  await scrollTo(Math.max(0, top + offset));
  await page.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-${id}.png`) });
  n++;
}
// bottom of page
await scrollTo(await page.evaluate(() => document.body.scrollHeight));
await page.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-bottom.png`) });

const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, bodyScroll: document.body.scrollWidth }));
console.log(JSON.stringify({ W, H, overflow, errors }, null, 2));
await browser.close();
