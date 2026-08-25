#!/usr/bin/env node
// audit-seo-probe.mjs — stardust:audit Phase 3/4 evidence collector for 1800contacts.com
// One headed-stealth Chrome session, sequential page loads with spacing (origin rate-limits
// rapid loads). Collects per-page: canonical, meta robots, hreflang, JSON-LD, landmarks,
// h1 count + heading order, img alt stats, extractable prose word count, OG completeness,
// first-prose-block answerability sample. Plus origin-level: llms.txt, robots meta on home.
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const PAGES = [
  ['index', 'https://www.1800contacts.com/'],
  ['buy-contacts', 'https://www.1800contacts.com/buy-contacts'],
  ['lens-acuvue-oasys', 'https://www.1800contacts.com/lens/acuvue-oasys'],
  ['exam', 'https://www.1800contacts.com/exam'],
  ['subscriptions', 'https://www.1800contacts.com/subscriptions'],
  ['glasses', 'https://www.1800contacts.com/glasses'],
  ['coupon', 'https://www.1800contacts.com/coupon'],
  ['common-questions-faq', 'https://www.1800contacts.com/common-questions-faq'],
];
const GAP_MS = 14000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  headless: false, channel: 'chrome',
  args: ['--disable-blink-features=AutomationControlled'],
  ignoreDefaultArgs: ['--enable-automation'],
});
const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
const page = await ctx.newPage();

const out = { fetchedAt: new Date().toISOString(), pages: {}, origin: {} };

for (const [slug, url] of PAGES) {
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(5000); // let SPA hydrate
    // scroll to trigger lazy content, then back
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y < h; y += window.innerHeight) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); }
      window.scrollTo(0, 0);
    });
    await sleep(1500);
    const data = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const qa = (s) => [...document.querySelectorAll(s)];
      const vis = (el) => { const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null; const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
      const meta = (n) => q(`meta[name="${n}"]`)?.content ?? null;
      const prop = (p) => q(`meta[property="${p}"]`)?.content ?? null;
      const jsonld = qa('script[type="application/ld+json"]').map((s) => {
        try { const j = JSON.parse(s.textContent); return { valid: true, types: [].concat(j).flatMap((x) => x['@graph'] ? x['@graph'].map((g) => g['@type']) : [x['@type']]).flat().filter(Boolean) }; }
        catch (e) { return { valid: false, error: String(e).slice(0, 120) }; }
      });
      const imgs = qa('img').filter(vis).filter((i) => (i.naturalWidth > 2 || i.width > 2));
      const genericAlt = new Set(['logo', 'image', 'picture', 'photo', 'img', 'icon']);
      const headings = qa('h1,h2,h3,h4,h5,h6').filter(vis).map((h) => ({ tag: h.tagName.toLowerCase(), text: h.innerText.trim().slice(0, 100) }));
      const main = q('main');
      const prose = main ? [...main.querySelectorAll('p,li')].filter(vis).map((p) => p.innerText.trim()).filter((t) => t.length > 0) : [];
      const words = prose.join(' ').split(/\s+/).filter(Boolean).length;
      const linkTexts = qa('a').filter(vis).map((a) => a.innerText.trim().toLowerCase()).filter(Boolean);
      const contentFree = linkTexts.filter((t) => ['here', 'click here', 'read this', 'more', 'this'].includes(t));
      return {
        title: document.title,
        titleLength: document.title.length,
        metaDescription: meta('description'),
        metaRobots: meta('robots'),
        canonical: q('link[rel="canonical"]')?.href ?? null,
        hreflang: qa('link[rel="alternate"][hreflang]').map((l) => l.hreflang),
        og: { title: prop('og:title'), description: prop('og:description'), image: prop('og:image'), type: prop('og:type'), url: prop('og:url') },
        twitter: { card: meta('twitter:card') },
        jsonld,
        landmarks: { main: !!q('main'), nav: !!q('nav'), footer: !!q('footer'), header: !!q('header'), banner: !!q('[role="banner"],header'), contentinfo: !!q('[role="contentinfo"],footer') },
        h1Count: qa('h1').filter(vis).length,
        h1Texts: qa('h1').filter(vis).map((h) => h.innerText.trim().slice(0, 120)),
        headingOutline: headings.slice(0, 40),
        imgTotal: imgs.length,
        imgEmptyAlt: imgs.filter((i) => !(i.getAttribute('alt') || '').trim()).length,
        imgGenericAlt: imgs.filter((i) => genericAlt.has((i.getAttribute('alt') || '').trim().toLowerCase())).length,
        proseWords: words,
        firstProseBlocks: prose.slice(0, 4).map((t) => t.slice(0, 220)),
        contentFreeLinks: contentFree.length,
        lang: document.documentElement.lang || null,
        viewportMeta: q('meta[name="viewport"]')?.content ?? null,
      };
    });
    out.pages[slug] = { url, finalUrl: page.url(), status: resp?.status() ?? null, ...data };
    console.error(`[probe] OK ${slug} status=${resp?.status()} jsonld=${data.jsonld.length} h1=${data.h1Count} words=${data.proseWords}`);
  } catch (e) {
    out.pages[slug] = { url, error: String(e).slice(0, 200) };
    console.error(`[probe] FAIL ${slug}: ${String(e).slice(0, 120)}`);
  }
  await sleep(GAP_MS);
}

// origin-level: llms.txt via in-browser fetch (curl is bot-blocked)
try {
  const llms = await page.evaluate(async () => {
    const r = await fetch('/llms.txt', { redirect: 'follow' });
    const text = r.ok ? (await r.text()).slice(0, 300) : null;
    return { status: r.status, contentType: r.headers.get('content-type'), sample: text };
  });
  out.origin.llmsTxt = llms;
} catch (e) { out.origin.llmsTxt = { error: String(e).slice(0, 120) }; }

await writeFile('stardust/audit/1800contacts-com/_seo-probe.json', JSON.stringify(out, null, 2));
console.error('[probe] written stardust/audit/1800contacts-com/_seo-probe.json');
await browser.close();
