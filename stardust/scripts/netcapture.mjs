#!/usr/bin/env node
// netcapture.mjs — supplemental martech/API surface capture for migration analysis.
// Loads representative pages, records every network request (host + path),
// script tags, JSON-LD, and known vendor globals. Output: analysis/netcapture.json
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const ORIGIN = 'https://www.1800contacts.com';
const PAGES = process.argv[2]
  ? process.argv[2].split(',')
  : ['/', '/lens/acuvue-oasys-1-day-90-pack', '/lenses/acuvue',
     '/eyesociety/20-20-20-rule-for-eyes', '/eye-doctor-search/ca', '/exam'];

const browser = await chromium.launch({
  headless: false, channel: 'chrome',
  args: ['--disable-blink-features=AutomationControlled'],
  ignoreDefaultArgs: ['--enable-automation'],
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });

const out = { fetchedAt: new Date().toISOString(), pages: {} };

for (const p of PAGES) {
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => {
    try {
      const u = new URL(r.url());
      requests.push({
        method: r.method(),
        host: u.host,
        path: u.pathname.slice(0, 120),
        type: r.resourceType(),
      });
    } catch {}
  });
  try {
    await page.goto(ORIGIN + p, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(3000);

    const domInfo = await page.evaluate(() => {
      const scripts = [...document.querySelectorAll('script[src]')].map((s) => s.src);
      const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((s) => s.textContent.slice(0, 3000));
      const globals = {};
      const known = ['dataLayer', 'utag', 'utag_data', 'ga', 'gtag', 'gtm', '_satellite',
        'adobe', 's', 'digitalData', 'analytics', 'mixpanel', 'amplitude', 'heap',
        'optimizely', 'Optimizely', '_uxa', 'FS', 'Kameleoon', 'branch', 'fbq', 'ttq',
        'pintrk', 'snaptr', 'twq', 'obApi', 'criteo_q', '_tfa', 'rdt', 'ire', 'uetq',
        'OneTrust', 'OnetrustActiveGroups', 'ketch', 'transcend', 'Osano', 'truste',
        '__NEXT_DATA__', '__NUXT__', 'Shopify', 'BOOMR', 'newrelic', 'Sentry',
        'zE', 'Kustomer', 'Forethought', 'Intercom', 'drift', 'LC_API',
        'yotpo', 'BV', 'trustpilot', 'PowerReviews', '_klOnsite', 'attentive',
        'Rokt', 'tatari', 'friendbuyAPI', 'ShopPay', 'paypal', 'Stripe', 'afterpay', 'Klarna'];
      for (const k of known) { try { if (window[k] !== undefined) globals[k] = typeof window[k]; } catch {} }
      const nextData = document.getElementById('__NEXT_DATA__');
      const metas = [...document.querySelectorAll('meta[name="generator"], meta[name="framework"]')]
        .map((m) => m.outerHTML);
      return {
        scripts, jsonld, globals, metas,
        nextDataPresent: !!nextData,
        nextBuildId: nextData ? (JSON.parse(nextData.textContent).buildId || null) : null,
        title: document.title,
      };
    });

    // aggregate hosts
    const hostCounts = {};
    for (const r of requests) hostCounts[r.host] = (hostCounts[r.host] || 0) + 1;
    // keep xhr/fetch endpoints in full
    const apiCalls = requests.filter((r) => r.type === 'xhr' || r.type === 'fetch');

    out.pages[p] = { hostCounts, apiCalls, ...domInfo, requestCount: requests.length };
    console.log(`[net] ${p}: ${requests.length} requests, ${Object.keys(hostCounts).length} hosts, ${apiCalls.length} xhr/fetch`);
  } catch (e) {
    out.pages[p] = { error: String(e.message || e) };
    console.log(`[net] ${p}: ERROR ${e.message}`);
  }
  await page.close();
}

await browser.close();
await mkdir('analysis', { recursive: true });
await writeFile('analysis/netcapture.json', JSON.stringify(out, null, 2));
console.log('[net] wrote analysis/netcapture.json');
