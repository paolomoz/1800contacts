#!/usr/bin/env node
// audit-seo-probe2.mjs — v2: one FRESH headed browser per page (origin permits a single
// navigation per session before returning 403). Collects SEO fields + computed-style
// aggregates for brand extraction. Merges into _seo-probe.json.
import { writeFile, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const ALL = [
  ['index', 'https://www.1800contacts.com/'],
  ['buy-contacts', 'https://www.1800contacts.com/buy-contacts'],
  ['lens-acuvue-oasys', 'https://www.1800contacts.com/lens/acuvue-oasys'],
  ['exam', 'https://www.1800contacts.com/exam'],
  ['subscriptions', 'https://www.1800contacts.com/subscriptions'],
  ['glasses', 'https://www.1800contacts.com/glasses'],
  ['coupon', 'https://www.1800contacts.com/coupon'],
  ['common-questions-faq', 'https://www.1800contacts.com/common-questions-faq'],
];
const only = process.argv.slice(2);
const PAGES = only.length ? ALL.filter(([s]) => only.includes(s)) : ALL;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const OUT = 'stardust/audit/1800contacts-com/_seo-probe.json';
let out;
try { out = JSON.parse(await readFile(OUT, 'utf8')); } catch { out = { fetchedAt: new Date().toISOString(), pages: {}, origin: {} }; }

for (const [slug, url] of PAGES) {
  const browser = await chromium.launch({
    headless: false, channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
    ignoreDefaultArgs: ['--enable-automation'],
  });
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(6000);
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y < h; y += window.innerHeight) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 220)); }
      window.scrollTo(0, 0);
    });
    await sleep(1500);
    const data = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const qa = (s) => [...document.querySelectorAll(s)];
      // strict visibility: walks ancestors for display:none and checks area
      const vis = (el) => {
        for (let n = el; n && n !== document.body; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          if (n.getAttribute && (n.getAttribute('aria-hidden') === 'true' || n.hasAttribute('hidden'))) return false;
        }
        const r = el.getBoundingClientRect();
        return r.width > 1 && r.height > 1;
      };
      const meta = (n) => q(`meta[name="${n}"]`)?.content ?? null;
      const prop = (p) => q(`meta[property="${p}"]`)?.content ?? null;
      const jsonld = qa('script[type="application/ld+json"]').map((s) => {
        try { const j = JSON.parse(s.textContent); return { valid: true, types: [].concat(j).flatMap((x) => x['@graph'] ? x['@graph'].map((g) => g['@type']) : [x['@type']]).flat().filter(Boolean) }; }
        catch (e) { return { valid: false, error: String(e).slice(0, 120) }; }
      });
      const imgs = qa('img').filter((i) => (i.naturalWidth > 2 || i.width > 2)).filter(vis);
      const genericAlt = new Set(['logo', 'image', 'picture', 'photo', 'img', 'icon']);
      const allH1 = qa('h1');
      const visH1 = allH1.filter(vis);
      const headings = qa('h1,h2,h3,h4,h5,h6').filter(vis).map((h) => ({ tag: h.tagName.toLowerCase(), text: h.innerText.trim().slice(0, 100) }));
      const root = q('main') || document.body;
      const prose = [...root.querySelectorAll('p,li')].filter(vis).map((p) => p.innerText.trim()).filter((t) => t.length > 0);
      const words = prose.join(' ').split(/\s+/).filter(Boolean).length;
      const linkTexts = qa('a').filter(vis).map((a) => a.innerText.trim().toLowerCase()).filter(Boolean);
      const contentFree = linkTexts.filter((t) => ['here', 'click here', 'read this', 'more', 'this'].includes(t));
      // ---- style aggregates for brand extraction ----
      const count = (m, k) => { if (!k) return; m[k] = (m[k] || 0) + 1; };
      const fontsHeading = {}, fontsBody = {}, headingSizes = {}, radii = {}, shadows = {}, btnStyles = {}, bgColors = {}, textColors = {};
      qa('h1,h2,h3,h4,h5,h6').filter(vis).forEach((h) => {
        const cs = getComputedStyle(h);
        count(fontsHeading, cs.fontFamily.split(',')[0].replace(/"/g, '').trim());
        count(headingSizes, `${h.tagName.toLowerCase()}:${cs.fontSize}`);
      });
      qa('p,li,span').filter(vis).slice(0, 400).forEach((p) => {
        const cs = getComputedStyle(p);
        count(fontsBody, cs.fontFamily.split(',')[0].replace(/"/g, '').trim());
        count(textColors, cs.color);
      });
      qa('a,button').filter(vis).forEach((b) => {
        const cs = getComputedStyle(b);
        if (cs.borderRadius && cs.borderRadius !== '0px') count(radii, cs.borderRadius);
        if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          count(btnStyles, `${cs.backgroundColor}|${cs.color}|${cs.borderRadius}`);
        }
      });
      qa('div,section').filter(vis).slice(0, 600).forEach((d) => {
        const cs = getComputedStyle(d);
        if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') count(bgColors, cs.backgroundColor);
        if (cs.borderRadius && cs.borderRadius !== '0px') count(radii, cs.borderRadius);
        if (cs.boxShadow && cs.boxShadow !== 'none') count(shadows, cs.boxShadow);
      });
      const top = (m, n = 10) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
      return {
        title: document.title, titleLength: document.title.length,
        metaDescription: meta('description'), metaRobots: meta('robots'),
        canonical: q('link[rel="canonical"]')?.href ?? null,
        hreflang: qa('link[rel="alternate"][hreflang]').map((l) => l.hreflang),
        og: { title: prop('og:title'), description: prop('og:description'), image: prop('og:image'), type: prop('og:type'), url: prop('og:url') },
        jsonld,
        landmarks: { main: !!q('main'), nav: !!q('nav'), header: !!q('header'), footer: !!q('footer'), roleBanner: !!q('[role="banner"]'), roleMain: !!q('[role="main"]'), roleContentinfo: !!q('[role="contentinfo"]'), roleNav: !!q('[role="navigation"]') },
        h1CountDom: allH1.length, h1CountVisible: visH1.length,
        h1Texts: visH1.map((h) => h.innerText.trim().slice(0, 120)),
        headingOutline: headings.slice(0, 40),
        imgTotal: imgs.length,
        imgEmptyAlt: imgs.filter((i) => !(i.getAttribute('alt') || '').trim()).length,
        imgGenericAlt: imgs.filter((i) => genericAlt.has((i.getAttribute('alt') || '').trim().toLowerCase())).length,
        proseWords: words,
        firstProseBlocks: prose.slice(0, 4).map((t) => t.slice(0, 220)),
        contentFreeLinks: contentFree.length,
        lang: document.documentElement.lang || null,
        style: { fontsHeading: top(fontsHeading), fontsBody: top(fontsBody), headingSizes: top(headingSizes, 20), radii: top(radii, 12), shadows: top(shadows, 5), buttons: top(btnStyles, 10), bgColors: top(bgColors, 12), textColors: top(textColors, 8) },
      };
    });
    out.pages[slug] = { url, finalUrl: page.url(), status: resp?.status() ?? null, ...data };
    console.error(`[probe2] OK ${slug} status=${resp?.status()} h1dom=${data.h1CountDom} h1vis=${data.h1CountVisible} words=${data.proseWords} jsonld=${data.jsonld.length}`);
  } catch (e) {
    out.pages[slug] = { ...(out.pages[slug] || {}), url, error: String(e).slice(0, 200) };
    console.error(`[probe2] FAIL ${slug}: ${String(e).slice(0, 120)}`);
  }
  await browser.close();
  await sleep(9000);
}

await writeFile(OUT, JSON.stringify(out, null, 2));
console.error('[probe2] merged into ' + OUT);
