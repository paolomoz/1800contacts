#!/usr/bin/env node
// audit-cwv.mjs — lab Core Web Vitals (LCP / CLS / TBT / FCP / TTFB) for stardust:audit.
// Fresh headed-stealth browser per run (origin permits one navigation per session).
// Mobile run: 375x667 viewport, 4x CPU throttle + slow-4G network throttle (Lighthouse parity).
// Desktop run: 1440x900, no throttle. Usage: node audit-cwv.mjs <mobile|desktop> <url> <label>
import { writeFile, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [mode, url, label] = process.argv.slice(2);
if (!mode || !url) { console.error('usage: audit-cwv.mjs <mobile|desktop> <url> <label>'); process.exit(1); }

const browser = await chromium.launch({
  headless: false, channel: 'chrome',
  args: ['--disable-blink-features=AutomationControlled'],
  ignoreDefaultArgs: ['--enable-automation'],
});
const ctx = await browser.newContext(
  mode === 'mobile'
    ? { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } },
);
await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
const page = await ctx.newPage();

// vitals collectors registered before any document script runs
await page.addInitScript(() => {
  window.__vitals = { lcp: null, cls: 0, longtasks: [], fcp: null };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vitals.lcp = e.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vitals.longtasks.push({ start: e.startTime, dur: e.duration }); })
      .observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__vitals.fcp = e.startTime; })
      .observe({ type: 'paint', buffered: true });
  } catch (e) { window.__vitalsErr = String(e); }
});

const cdp = await ctx.newCDPSession(page);
if (mode === 'mobile') {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8,
  });
}

const resp = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(12000); // settle window for LCP/longtasks
const vitals = await page.evaluate(() => {
  const v = window.__vitals || {};
  const nav = performance.getEntriesByType('navigation')[0];
  const fcp = v.fcp ?? 0;
  // TBT: blocking time of long tasks after FCP (lab proxy for INP)
  const tbt = (v.longtasks || []).filter((t) => t.start > fcp).reduce((s, t) => s + Math.max(0, t.dur - 50), 0);
  return {
    lcpMs: v.lcp, clsScore: Math.round(v.cls * 1000) / 1000, tbtMs: Math.round(tbt), fcpMs: v.fcp,
    ttfbMs: nav ? Math.round(nav.responseStart) : null,
    transferKB: Math.round(performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
    resourceCount: performance.getEntriesByType('resource').length,
    domNodes: document.querySelectorAll('*').length,
    err: window.__vitalsErr || null,
  };
});
const rec = { mode, url, label: label || mode, status: resp?.status() ?? null, finalUrl: page.url(), measuredAt: new Date().toISOString(), ...vitals };
const OUT = 'stardust/audit/1800contacts-com/_cwv.json';
let all; try { all = JSON.parse(await readFile(OUT, 'utf8')); } catch { all = { runs: [] } }
all.runs.push(rec);
await writeFile(OUT, JSON.stringify(all, null, 2));
console.error(JSON.stringify(rec));
await browser.close();
