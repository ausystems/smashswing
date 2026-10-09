// Verifies the homepage copy brief, em-dash ban, interactions and internal links.
// usage: node tools/verify-home.mjs   (dev server on :5173)
import puppeteer from 'puppeteer-core';
const BASE = 'http://localhost:5173';
const REQUIRED = [
  // hero
  'Multiplayer golf · Real balls · Live tracking', 'Multiplayer golf. No waiting.',
  'SmashSwing builds multiplayer golf simulators and indoor ranges for venues. Golfers hit real balls at one screen together while every shot is tracked.',
  'Simulator: 2–6 players', 'Indoor range: 12–24 players', 'Tracking: every ball at once', 'Book a demo', 'See the technology',
  // why
  'Traditional simulators take turns. SmashSwing lets everyone play.',
  'Multiple people hit real golf balls at one shared screen, at the same time. SmashSwing tracks every ball, detects where it hits and reacts instantly during games.',
  'Everyone hits at once', "Multiple golfers hit one screen at once. Every ball is tracked, with each shot shown from the player's own perspective.",
  'The screen reacts to every hit', 'The system detects exactly where each ball hits the screen, so game targets and scores react instantly.',
  'Licensed arcade games', 'Play arcade-style multiplayer games by hitting real golf balls at on-screen targets. Games like Asteroids bring non-golfers into the fun.',
  'More guests. More ways to earn.', 'Offer golf practice, multiplayer games, leagues, parties, corporate events and sports viewing in the same space.',
  // founder (unchanged)
  'I watched new concepts lose momentum after the first year. SmashSwing was built to keep the experience fresh.', 'TJ Schier', 'Founder and CEO. Former COO, Big Shots Golf.', 'See it working',
  // products
  'One golf system. Built for your space.', 'Two formats for golf clubs, driving ranges, resorts, restaurants and entertainment venues. One multiplayer experience.',
  'One simulator. Up to six golfers.', 'Two to six players hit real golf balls at one shared screen for practice, competitive games and group events.',
  'An indoor golf range for everyone.',
  'A year-round indoor driving range where 12 to 24 golfers can practice and compete together. Add multiplayer games, parties and corporate events to bring golfers and non-golfers into your space. Flexible setups support both traditional and adaptive golf experiences.',
  '12–24, based on space', 'Sized to fit your facility', '450–750 sq ft', '10–30 ft, based on your space', '2–6, based on space', '4,000–10,000 sq ft', '20–30 ft+',
  'Explore the simulator', 'Explore the range', 'Compare the products', 'Multiplayer Simulator', 'Cinematic Indoor Range',
  // ways to play
  'Ways to play', 'Practice. Play. Compete. All together.', 'Practice real golf or play fast multiplayer games. Virtual golf courses are planned for 2027.',
  'Licensed from Atari. Rocks shatter exactly where the ball strikes.', 'Licensed from Taito. Waves advance until the whole room clears them.', 'Coming soon',
  'Practice your swing, play closest to the pin or compete in long drive. Golfers can hit together and see their shots tracked.',
  'Play fast 2 to 4-minute multiplayer arcade games with real golf swings. Friends, families and groups can compete or play together.',
  'Fresh games and seasonal experiences give golf venues more ways to entertain guests and keep them coming back.',
  // virtual courses
  'Coming in 2027', 'Virtual golf courses. Everyone hits together.',
  'Four golfers hit together on one virtual course instead of taking turns. Estimated rounds last 60 to 75 minutes, or 30 to 45 minutes for a scramble.', 'Get first look',
  // installations
  'At The River Club of Mequon, members use SmashSwing for practice and games. See it yourself at our Texas demo facility.',
  'Avg. sessions daily', 'Entertainment game usage', '28%', 'Read the study', 'SmashSwing Demo Facility', 'Not open to the public.', 'Demos by request only.', 'Request a demo',
  // gallery + close
  'One room. One screen. Everyone in the game.', 'This is what playing together looks like.', "Hit. Don't sit.",
  'See how SmashSwing can bring multiplayer golf and more guests to your venue.',
];
const GONE = ['Everyone swings at', 'Two to sixteen', '128 ft', 'A simulator shows the shot', 'One room, more ways to use it', 'Same technology', 'rebuilt for a group',
  'A range, theater and arcade', 'Two modes. One screen', 'The first virtual course', 'A live private-club install', '400+', 'simulator replaced', 'See SmashSwing in Lewisville', '8–16', 'Patent pending · Multi-ball'];
const norm = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1440, height: 900 });
await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
const doc = await page.evaluate(() => {
  const c = document.body.cloneNode(true);
  c.querySelectorAll('br').forEach((b) => b.replaceWith(' '));
  c.querySelectorAll('script').forEach((s) => s.remove());
  return { text: c.textContent, html: document.documentElement.outerHTML, title: document.title, desc: document.querySelector('meta[name="description"]').content, h1: document.querySelectorAll('h1').length };
});
const T = norm(doc.text);
const missing = REQUIRED.filter((r) => !T.includes(norm(r)));
const lingering = GONE.filter((g) => T.includes(norm(g)));
const emDash = (doc.html.match(/—|&mdash;|&#8212;/g) || []).length;
console.log(`copy: ${REQUIRED.length - missing.length}/${REQUIRED.length} present`); missing.forEach((m) => console.log('  MISSING:', m));
console.log(`old copy remaining: ${lingering.length}`); lingering.forEach((m) => console.log('  STILL THERE:', m));
console.log(`em dashes in homepage HTML: ${emDash}`);
console.log(`title: ${doc.title}\ndescription: ${doc.desc}\nh1 count: ${doc.h1}`);

// tabs
await page.click('#tab-range');
const t1 = await page.evaluate(() => [document.getElementById('panel-sim').hidden, document.getElementById('panel-range').hidden, document.getElementById('tab-range').getAttribute('aria-selected')]);
await page.keyboard.press('ArrowLeft');
const t2 = await page.evaluate(() => [document.getElementById('panel-sim').hidden, document.activeElement.id]);
console.log(`tabs: click range -> sim hidden=${t1[0]} range hidden=${t1[1]} selected=${t1[2]} | ArrowLeft -> sim hidden=${t2[0]} focus=${t2[1]}`);

// gallery
const firstSlide = () => page.evaluate(() => { const s = [...document.querySelectorAll('.h-gal__slide')]; return s.find((x) => x.style.order === '0').querySelector('img').getAttribute('src').split('/').pop(); });
const g0 = await firstSlide();
await page.click('.h-gal__arrow--next'); const g1 = await firstSlide();
await page.keyboard.press('ArrowRight'); const g2 = await firstSlide();
await page.click('.h-gal__arrow--prev'); await page.click('.h-gal__arrow--prev'); await page.click('.h-gal__arrow--prev'); const g3 = await firstSlide();
const dots = await page.evaluate(() => [...document.querySelectorAll('.h-gal__dot')].map((d) => d.getAttribute('aria-current')).join(','));
console.log(`gallery: start ${g0} -> next ${g1} -> ArrowRight ${g2} -> prev x3 (wraps) ${g3} | dots ${dots}`);

// internal links + assets
const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href').split('#')[0]))]);
const results = [];
for (const h of hrefs) { const r = await fetch(BASE + h); results.push(`${r.status} ${h}`); }
console.log('internal links:', results.join('  '));
const pdf = await fetch(BASE + '/docs/smashswing-overview.pdf'); console.log(`overview pdf: ${pdf.status} ${pdf.headers.get('content-type')}`);

// mobile menu
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
await page.tap('#nav-burger');
const m1 = await page.evaluate(() => [getComputedStyle(document.getElementById('nav-menu')).display, document.getElementById('nav-burger').getAttribute('aria-expanded'), document.querySelectorAll('#nav-menu a').length]);
await page.keyboard.press('Escape');
const m2 = await page.evaluate(() => getComputedStyle(document.getElementById('nav-menu')).display);
console.log(`mobile menu: open display=${m1[0]} expanded=${m1[1]} links=${m1[2]} | after Escape display=${m2}`);
console.log(`console/page errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await browser.close();
