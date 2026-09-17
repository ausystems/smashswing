// Scripted interaction pass for v2: menu, tabs, teaser, contact form. usage: node tools/interact.mjs <outdir>
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const out = process.argv[2] || 'qa/interact';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { errors };

// tabs on home: click + arrow keys + deep link
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await page.click('#tab-range');
report.tabsClick = await page.evaluate(() => ({ rangeSel: document.getElementById('tab-range').getAttribute('aria-selected'), simHidden: document.getElementById('panel-sim').hidden, rangeHidden: document.getElementById('panel-range').hidden }));
await page.keyboard.press('ArrowLeft');
report.tabsKey = await page.evaluate(() => ({ simSel: document.getElementById('tab-sim').getAttribute('aria-selected'), focused: document.activeElement.id }));
await page.goto('http://localhost:5173/products/#range', { waitUntil: 'networkidle0' });
report.deepLink = await page.evaluate(() => ({ rangeSel: document.getElementById('tab-range').getAttribute('aria-selected'), rangeHidden: document.getElementById('panel-range').hidden }));

// teaser
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await page.type('#teaser-email', 'nope');
await page.keyboard.press('Enter');
const t1 = await page.evaluate(() => document.getElementById('teaser-form').className);
await page.click('#teaser-email', { clickCount: 3 });
await page.type('#teaser-email', 'gm@club.com');
await page.keyboard.press('Enter');
const t2 = await page.evaluate(() => document.getElementById('teaser-form').className);
report.teaser = { invalid: t1, valid: t2 };

// contact form
await page.goto('http://localhost:5173/contact/', { waitUntil: 'networkidle0' });
await page.click('#contact-form button[type="submit"]');
report.contactInvalid = await page.evaluate(() => ({ errors: document.querySelectorAll('#contact-form .field.is-error').length, focused: document.activeElement.id }));
await page.screenshot({ path: `${out}/contact-errors.png` });
await page.type('#f-name', 'Ahmad Khalid');
await page.type('#f-email', 'ahmad@example.com');
await page.type('#f-venue', 'Range Test Club');
await page.click('#contact-form button[type="submit"]');
report.contactDone = await page.evaluate(() => ({ formHidden: document.getElementById('contact-form').hidden, doneHidden: document.getElementById('contact-done').hidden }));
await page.screenshot({ path: `${out}/contact-done.png` });

// keyboard path on home: count focusable stops and check the focus ring
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
const stops = [];
for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); stops.push(await page.evaluate(() => { const a = document.activeElement; return `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''} ${(a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 24)} | ${getComputedStyle(a).outlineColor}`; })); }
report.tabStops = stops;

// mobile menu
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await page.tap('#nav-burger');
report.menuOpen = await page.evaluate(() => ({ expanded: document.getElementById('nav-burger').getAttribute('aria-expanded'), display: getComputedStyle(document.getElementById('nav-menu')).display }));
await page.screenshot({ path: `${out}/menu-open-390.png` });
await page.keyboard.press('Escape');
report.menuClosed = await page.evaluate(() => getComputedStyle(document.getElementById('nav-menu')).display);
console.log(JSON.stringify(report, null, 2));
await browser.close();
