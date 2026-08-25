#!/usr/bin/env node
// audit-brand-probe.mjs — logo, favicon, hero asset, raw JSON-LD, font files for stardust:audit.
// Fresh browser per page (origin rate-limits multi-nav sessions). Pages: home, PDP.
import { writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const PAGES = [
  ['index', 'https://www.1800contacts.com/'],
  ['lens-acuvue-oasys', 'https://www.1800contacts.com/lens/acuvue-oasys'],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await mkdir('stardust/current/assets', { recursive: true });
const out = { fetchedAt: new Date().toISOString(), pages: {} };

for (const [slug, url] of PAGES) {
  const browser = await chromium.launch({ headless: false, channel: 'chrome', args: ['--disable-blink-features=AutomationControlled'], ignoreDefaultArgs: ['--enable-automation'] });
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
  const fonts = new Set();
  ctx.on('response', (r) => { if (/\.(woff2?|ttf|otf)(\?|$)/.test(r.url())) fonts.add(r.url()); });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(6000);
    const data = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      // logo: inline svg in header/banner region, else img with logo-ish attr
      const banner = q('[role="banner"]') || q('header') || document.body;
      const svg = banner.querySelector('svg');
      const logoImg = banner.querySelector('img[src*="logo" i], img[alt*="logo" i], a[href="/"] img');
      const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent.slice(0, 4000));
      return {
        logoSvg: svg ? svg.outerHTML.slice(0, 20000) : null,
        logoImgSrc: logoImg ? (logoImg.currentSrc || logoImg.src) : null,
        favicon: q('link[rel~="icon"]')?.href ?? null,
        appleTouchIcon: q('link[rel="apple-touch-icon"]')?.href ?? null,
        themeColor: q('meta[name="theme-color"]')?.content ?? null,
        jsonldRaw: jsonld,
        generatorMeta: q('meta[name="generator"]')?.content ?? null,
      };
    });
    out.pages[slug] = data;
    if (slug === 'index' && data.logoSvg) await writeFile('stardust/current/assets/logo.svg', data.logoSvg);
    out.pages[slug].fontFiles = [...fonts];
    console.error(`[brand] OK ${slug} logoSvg=${!!data.logoSvg} favicon=${data.favicon} fonts=${fonts.size} jsonld=${data.jsonldRaw.length}`);
  } catch (e) { out.pages[slug] = { error: String(e).slice(0, 200) }; console.error(`[brand] FAIL ${slug}`); }
  await browser.close();
  await sleep(12000);
}
await writeFile('stardust/audit/1800contacts-com/_brand-probe.json', JSON.stringify(out, null, 2));
console.error('[brand] written');
