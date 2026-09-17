// Scripted keyboard + interaction pass.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const out = process.argv[2] || 'shots-interact';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.evaluateOnNewDocument(() => sessionStorage.setItem('smashVisited', '1'));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 2500));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { errors };

// ---- keyboard path
const path = [];
for (let i = 0; i < 46; i++) {
  await page.keyboard.press('Tab');
  await sleep(40);
  path.push(await page.evaluate(() => {
    const a = document.activeElement;
    const r = a.getBoundingClientRect();
    const cs = getComputedStyle(a);
    return `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''}${a.className && typeof a.className === 'string' ? '.' + a.className.split(' ')[0] : ''} "${(a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 28)}" y=${Math.round(r.top + scrollY)} outline=${cs.outlineColor}/${cs.outlineWidth}`;
  }));
}
report.keyboardPath = path;

// ---- product tabs via keyboard
await page.focus('#tab-sim');
await page.keyboard.press('ArrowRight');
await sleep(350);
await page.screenshot({ path: `${out}/tabs-mid.png` });
await sleep(700);
report.tabs = await page.evaluate(() => ({
  rangeSelected: document.getElementById('tab-range').getAttribute('aria-selected'),
  rangeActive: document.getElementById('panel-range').classList.contains('is-active'),
  simInert: document.getElementById('panel-sim').inert,
  thumb: document.getElementById('pt-thumb').style.transform,
  videoActive: [...document.querySelectorAll('.pt__video')].map((v) => v.classList.contains('is-active') + ':' + getComputedStyle(v).opacity),
  focused: document.activeElement.id,
}));
await page.evaluate(() => { const el = document.getElementById('products'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY); });
await sleep(1200);
await page.screenshot({ path: `${out}/tabs-after.png` });

// ---- carousel keyboard + buttons + drag
await page.evaluate(() => { const el = document.getElementById('features'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + 200); });
await sleep(1200);
await page.focus('#fc-track');
await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowRight');
await sleep(900);
const c1 = await page.evaluate(() => ({ x: document.getElementById('fc-track').style.transform, rail: document.getElementById('fc-rail-fill').style.width, prev: document.getElementById('fc-prev').disabled, next: document.getElementById('fc-next').disabled }));
await page.click('#fc-prev');
await sleep(900);
const c2 = await page.evaluate(() => document.getElementById('fc-track').style.transform);
// drag
const tr = await page.evaluate(() => { const r = document.getElementById('fc-track').getBoundingClientRect(); return { x: r.left + 300, y: r.top + 100 }; });
await page.mouse.move(tr.x, tr.y);
await page.mouse.down();
for (let i = 1; i <= 12; i++) { await page.mouse.move(tr.x - i * 50, tr.y, { steps: 2 }); await sleep(16); }
await page.mouse.up();
await sleep(1000);
const c3 = await page.evaluate(() => ({ x: document.getElementById('fc-track').style.transform, dragging: document.getElementById('fc-track').className }));
await page.screenshot({ path: `${out}/carousel-after-drag.png` });
report.carousel = { afterKeys: c1, afterPrev: c2, afterDrag: c3 };

// ---- teaser
await page.evaluate(() => { const el = document.getElementById('teaser'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY); });
await sleep(1200);
await page.focus('#teaser-email');
await page.keyboard.type('not-an-email');
await page.keyboard.press('Enter');
await sleep(300);
const t1 = await page.evaluate(() => ({ errHidden: document.getElementById('teaser-error').hidden, invalid: document.getElementById('teaser-email').getAttribute('aria-invalid') }));
await page.screenshot({ path: `${out}/teaser-error.png` });
await page.click('#teaser-email', { clickCount: 3 });
await page.keyboard.type('gm@riverclub.com');
await page.keyboard.press('Enter');
await sleep(800);
const t2 = await page.evaluate(() => ({ doneHidden: document.getElementById('teaser-done').hidden, rowVis: document.getElementById('teaser-row').style.visibility, errHidden: document.getElementById('teaser-error').hidden }));
await page.screenshot({ path: `${out}/teaser-done.png` });
report.teaser = { invalid: t1, valid: t2 };

// ---- hero control, G key, cursor
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(1200);
await page.click('#hero-control');
await sleep(200);
report.heroControl = await page.evaluate(() => ({ pressed: document.getElementById('hero-control').getAttribute('aria-pressed'), paused: document.getElementById('hero-video').paused }));
await page.click('#hero-control');
await page.keyboard.press('g');
report.gridHi = await page.evaluate(() => document.getElementById('grid-lines').className);
await page.screenshot({ path: `${out}/grid-hi.png` });
await page.keyboard.press('g');
await page.mouse.move(700, 500);
await sleep(400);
await page.mouse.move(720, 520);
await sleep(400);
const cur1 = await page.evaluate(() => ({ opacity: getComputedStyle(document.getElementById('cursor')).opacity, tf: document.getElementById('cursor').style.transform }));
const btn = await page.evaluate(() => { const r = document.querySelector('#hero-actions .btn').getBoundingClientRect(); return { x: r.left + 20, y: r.top + 20 }; });
await page.mouse.move(btn.x, btn.y);
await sleep(500);
const cur2 = await page.evaluate(() => ({ tf: document.getElementById('cursor').style.transform, op: document.getElementById('cursor').style.opacity }));
report.cursor = { moved: cur1, hover: cur2 };

// ---- marquee motion
await page.evaluate(() => { const el = document.getElementById('marquee-1'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 300); });
await sleep(800);
const m1 = await page.evaluate(() => [...document.querySelectorAll('.marquee__track')].map((t) => t.style.transform));
await sleep(500);
const m2 = await page.evaluate(() => [...document.querySelectorAll('.marquee__track')].map((t) => t.style.transform));
report.marquee = { m1, m2 };

// ---- debug assets
await page.goto('http://localhost:5173/?debug=assets', { waitUntil: 'networkidle0' });
await sleep(2500);
report.debugAssets = await page.evaluate(() => ({ html: document.documentElement.className, outlined: [...document.querySelectorAll('[data-placeholder="true"]')].filter((el) => getComputedStyle(el).outlineStyle === 'dashed').length, total: document.querySelectorAll('[data-placeholder="true"]').length }));
await page.evaluate(() => { const el = document.getElementById('founder'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY); });
await sleep(1500);
await page.screenshot({ path: `${out}/debug-assets.png` });

// ---- mobile menu at 390
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await sleep(2500);
await page.tap('#nav-burger');
await sleep(900);
report.menu = await page.evaluate(() => ({ expanded: document.getElementById('nav-burger').getAttribute('aria-expanded'), open: document.getElementById('nav-menu').className, clip: document.getElementById('nav-menu').style.clipPath }));
await page.screenshot({ path: `${out}/menu-open.png` });
await page.keyboard.press('Escape');
await sleep(900);
report.menuClosed = await page.evaluate(() => document.getElementById('nav-menu').className + ' / ' + document.getElementById('nav-burger').getAttribute('aria-expanded'));

console.log(JSON.stringify(report, null, 2));
await browser.close();
