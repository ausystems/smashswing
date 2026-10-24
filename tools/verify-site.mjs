// Checks TJ's October feedback across the whole site: wording rules, the new sections,
// the carousel, the video pop-up, tabs, the mobile menu, the sticky header, the contact form and links.
// usage: node tools/verify-site.mjs   (dev server on :5173)
import puppeteer from 'puppeteer-core';
const B = 'http://localhost:5173';
const PAGES = ['/', '/products/', '/technology/', '/press/', '/contact/', '/consultation/'];
const BANNED = [/—/, /hit back/i, /every ball on the screen/i, /one system/i, /case studies/i, /where it.s playing/i];
const NEEDS = {
  '/': ['HIT, Don’t Sit! Multiplayer, multi-ball tracking indoor golf tech', 'Financing Available', 'Vanilla ice cream vs. a hot fudge sundae.', 'Hit! Don’t Sit!', 'In the news.', 'Who it’s for'],
  '/products/': ['Scale to fit your space.', '2 players', '6 players', 'The PING Adaptive Kit'],
  '/technology/': ['Where you hit matters.', 'Multi-player range mode', 'We fixed 3 problems with traditional simulators.'],
  '/press/': ['In the news.', 'What operators say', 'Watch SmashSwing and TJ.', 'Golf Business Tech Conference keynote', 'eMYRge golf tech presentation', 'What Topgolf’s struggles (and Chuck E. Cheese) can teach us'],
  '/contact/': ['Book a demo.', 'Tell us about your space.', 'SmashSwing in the news.', 'By appointment only. Not open to the public.'],
  '/consultation/': ['Book a consult call with TJ', 'Get the SmashSwing overview.'],
};
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? `  ${info}` : ''}`); if (!ok) fails.push(name); };
const errs = [];
async function open(path, W = 1440, H = 900) {
  const p = await browser.newPage();
  await p.setViewport({ width: W, height: H, isMobile: W < 768, hasTouch: W < 768 });
  p.on('pageerror', (e) => errs.push(`${path}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(`${path}: ${m.text()}`); });
  p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(B)) errs.push(`${path}: ${r.status()} ${r.url()}`); });
  await p.goto(B + path, { waitUntil: 'networkidle0' });
  return p;
}
const dotIndex = (p) => p.evaluate(() => [...document.querySelectorAll('.h-gal__dot')].findIndex((d) => d.getAttribute('aria-current') === 'true'));

// wording, required sections, booking links and internal links on every page
const links = new Set();
for (const path of PAGES) {
  const p = await open(path);
  const text = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  const html = await p.content();
  for (const re of BANNED) check(`${path} has no ${re}`, !re.test(text) && !(re.source === '\\u2014' && /—/.test(html)));
  for (const s of NEEDS[path]) check(`${path} says "${s}"`, text.toLowerCase().includes(s.toLowerCase()));
  check(`${path} header is sticky`, await p.evaluate(() => getComputedStyle(document.querySelector('.nav')).position === 'sticky'));
  check(`${path} nav has Press`, await p.evaluate(() => [...document.querySelectorAll('.nav__links a')].some((a) => a.textContent.trim() === 'Press')));
  if (path !== '/consultation/') check(`${path} financing link goes to Brickhouse`, await p.evaluate(() => [...document.querySelectorAll('a')].some((a) => a.href === 'https://partners.brickhousecapital.com/smash-swing-immersive-golf/' && a.textContent.trim() === 'Financing Available' && a.target === '_blank')));
  check(`${path} Financing Available in nav, menu and footer`, await p.evaluate(() => ['.nav__links', '.nav__menu', '.footer'].every((s) => [...document.querySelectorAll(`${s} a`)].some((a) => a.href === 'https://partners.brickhousecapital.com/smash-swing-immersive-golf/' && a.textContent.trim() === 'Financing Available' && a.target === '_blank'))));
  if (path === '/') check('/ founder thumbnail is the overview video frame', await p.evaluate(() => document.querySelector('.h-founder__media img').getAttribute('src').endsWith('founder-overview.webp')));
  if (path === '/') check('/ headline is TJ’s exact wording', await p.evaluate(() => document.querySelector('#hero-h').textContent.replace(/\s+/g, ' ').trim() === 'HIT, Don’t Sit! Multiplayer, multi-ball tracking indoor golf tech'));
  if (path === '/press/') check('/press/ has no old keynote or workshop', !/keynote highlights|workshop/i.test(text));
  check(`${path} Book a demo goes to Calendly`, await p.evaluate(() => document.querySelector('.nav__cta').href.startsWith('https://calendly.com/')));
  (await p.evaluate(() => [...document.querySelectorAll('a[href^="/"], img[src^="/"], video[poster^="/"], source[src^="/"]')].map((e) => e.getAttribute('href') || e.getAttribute('src') || e.getAttribute('poster')))).forEach((u) => links.add(u.split('#')[0]));
  await p.close();
}
const bad = [];
for (const u of links) { const r = await fetch(B + u); if (!r.ok) bad.push(`${r.status} ${u}`); }
check(`${links.size} internal links and files load`, !bad.length, bad.join(', '));

// carousel: moves on its own, arrows, dots, loop, pause button
let p = await open('/');
await p.evaluate(() => document.querySelector('[data-gallery]').scrollIntoView({ block: 'center' }));
await p.mouse.move(5, 5);
const n = await p.evaluate(() => document.querySelectorAll('.h-gal__dot').length);
check('carousel has dots and a pause button', n > 1 && (await p.evaluate(() => !!document.querySelector('.h-gal__toggle'))), `${n} dots`);
await sleep(4300);
check('carousel moves on its own', (await dotIndex(p)) === 1);
await p.click('.h-gal__arrow--next'); await sleep(1200);
check('next arrow', (await dotIndex(p)) === 2);
await p.evaluate((k) => document.querySelectorAll('.h-gal__dot')[k].click(), n - 1); await sleep(2500);
await p.click('.h-gal__arrow--next'); await sleep(2500);
check('next at the end loops to the start', (await dotIndex(p)) === 0);
await p.click('.h-gal__toggle');
check('pause button', (await p.evaluate(() => document.querySelector('.h-gal__toggle').getAttribute('aria-label'))) === 'Play the photos');

// video pop-up
await p.evaluate(() => document.querySelector('.h-founder .play-over').click()); await sleep(600);
check('overview opens in the pop-up', await p.evaluate(() => document.querySelector('#video-dialog').open && /vimeo\.com\/video\/1213445891/.test(document.querySelector('.s-dialog__frame iframe')?.src || '')));
await p.keyboard.press('Escape'); await sleep(300);
check('Esc closes it and stops the video', await p.evaluate(() => !document.querySelector('#video-dialog').open && !document.querySelector('.s-dialog__frame').children.length));
await p.close();
p = await open('/press/');
await p.evaluate(() => document.querySelector('[data-video="gbtc"]').click()); await sleep(600);
check('GBTC keynote opens in the pop-up', await p.evaluate(() => /vimeo\.com\/video\/1087479091\?h=6a324a2f1a/.test(document.querySelector('.s-dialog__frame iframe')?.src || '')));
await p.keyboard.press('Escape'); await sleep(300);
await p.close();
p = await open('/');
await p.evaluate(() => document.querySelector('[data-video="virtual"]').click()); await sleep(1500);
check('virtual courses clip plays', await p.evaluate(() => { const v = document.querySelector('.s-dialog__frame video'); return !!v && !v.paused; }));
await p.evaluate(() => document.querySelector('[data-close-dialog]').click());

// tabs and the sticky header
await p.evaluate(() => document.querySelector('#tab-range').click());
check('homepage tabs', await p.evaluate(() => document.querySelector('#panel-sim').hidden && !document.querySelector('#panel-range').hidden));
await p.evaluate(() => window.scrollTo(0, 3000)); await sleep(200);
check('header stays on screen', (await p.evaluate(() => Math.round(document.querySelector('.nav').getBoundingClientRect().top))) === 0);
await p.close();
p = await open('/products/#campus');
check('products deep link opens the campus tab', await p.evaluate(() => !document.querySelector('#panel-campus').hidden));
await p.close();

// mobile menu
p = await open('/technology/', 390, 844);
await p.evaluate(() => window.scrollTo(0, 2000)); await sleep(200);
await p.click('#nav-burger'); await sleep(200);
check('mobile menu opens under the header without jumping', await p.evaluate(() => document.querySelector('#nav-menu').classList.contains('is-open') && scrollY === 2000));
await p.keyboard.press('Escape');
await p.close();

// contact form: empty submit shows errors. Never submit a filled form here: it opens a real email to TJ.
p = await open('/contact/');
await p.click('#contact-form button[type="submit"]'); await sleep(200);
check('empty form shows errors', (await p.evaluate(() => document.querySelectorAll('.field.is-error').length)) === 3);
await p.close();

check('no console errors or failed requests', !errs.length, errs.join(' | '));
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED');
await browser.close();
process.exit(fails.length ? 1 : 0);
