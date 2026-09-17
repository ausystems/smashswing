// One PDF page per site page at 1440px wide, full height. usage: node tools/pdf.mjs <outdir>
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const out = process.argv[2] || 'qa/pdf';
fs.mkdirSync(out, { recursive: true });
const PAGES = [['home', '/'], ['products', '/products/'], ['technology', '/technology/'], ['case-studies', '/case-studies/'], ['contact', '/contact/']];
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox', '--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: Number(process.env.PDF_SCALE || 1) });
for (const [name, path] of PAGES) {
  await page.goto('http://localhost:5173' + path, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  await new Promise((r) => setTimeout(r, 800));
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.pdf({ path: `${out}/${name}.pdf`, width: '1440px', height: `${height}px`, printBackground: true, pageRanges: '1', margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log(name, height);
}
await browser.close();
