#!/usr/bin/env node
/**
 * stitch-shot-solve.mjs — human-solve variant of stitch-shot.mjs for sites
 * behind an INTERACTIVE bot challenge (PerimeterX / HUMAN "Press & Hold").
 *
 * live-session.mjs's solveWindow does a passive wait+reload (Cloudflare's
 * non-interactive challenge). PerimeterX Press & Hold needs a physical hold,
 * so this launches headed stealth Chrome, waits for YOU to solve it (polling
 * for real content), then runs the EXACT settle + freeze + scroll-stitch body
 * from stitch-shot.mjs so the capture instrument stays symmetric with the
 * headless proto capture.
 *
 * Usage: node stitch-shot-solve.mjs <url> <out.png> [--width 1440] [--vh 900]
 *          [--settle] [--dismiss sel,...] [--solve-timeout 240000]
 * Exit: 0 written, 1 error, 3 not solved in time.
 */
/* eslint-disable import/no-extraneous-dependencies, import/extensions, no-await-in-loop, no-restricted-syntax, brace-style, object-curly-newline, max-len */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve as resolvePath } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIVE_SESSION = ['../../diff/scripts/live-session.mjs', '../diff/live-session.mjs']
  .map((p) => resolvePath(HERE, p)).find((p) => existsSync(p));
if (!LIVE_SESSION) { console.error('live-session.mjs not found'); process.exit(1); }
const { REAL_CHROME_UA, isLiveHttpUrl, launchStealthHeaded, newLiveContext, dismissOverlays } = await import(pathToFileURL(LIVE_SESSION).href);

const CHALLENGE = /(press\s*&?\s*hold|before we continue|are you a human|verify you are human|access to this page has been denied)/i;

function parseArgs(argv) {
  const rest = argv.slice(2);
  const pos = [];
  const opts = { width: 1440, vh: 900, settle: false, dismiss: [], ua: REAL_CHROME_UA, wait: null, timeout: 60000, solveTimeout: 240000 };
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === '--width') opts.width = Number(rest[i += 1]);
    else if (a === '--vh') opts.vh = Number(rest[i += 1]);
    else if (a === '--settle') opts.settle = true;
    else if (a === '--dismiss') opts.dismiss = (rest[i += 1] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--solve-timeout') opts.solveTimeout = Number(rest[i += 1]);
    else if (a === '--wait') opts.wait = Number(rest[i += 1]);
    else pos.push(a);
  }
  const [url, out] = pos;
  if (!url || !out) { console.error('need <url> <out.png>'); process.exit(1); }
  if (opts.wait == null) opts.wait = opts.settle ? 3000 : 1200;
  return { url, out, opts };
}

async function dismissAndLog(page, url, opts) {
  const d = await dismissOverlays(page, { extra: opts.dismiss, lateWindowMs: isLiveHttpUrl(url) ? 6000 : 0 });
  if (d.consent) console.log(`consent dismissed via ${d.consent}`);
  for (const sel of d.marketing) console.log(`marketing modal dismissed via ${sel}`);
  return d;
}

// Poll until the human clears the interactive challenge: challenge text gone,
// real content present (height well above a one-viewport block page).
async function waitForSolve(page, opts) {
  const deadline = Date.now() + opts.solveTimeout;
  let stable = 0;
  console.log('\n────────────────────────────────────────────────────────');
  console.log('  Solve the "Press & Hold" challenge in the Chrome window.');
  console.log(`  Waiting up to ${Math.round(opts.solveTimeout / 1000)}s…`);
  console.log('────────────────────────────────────────────────────────\n');
  while (Date.now() < deadline) {
    await page.waitForTimeout(2500);
    let text = ''; let h = 0;
    try {
      text = (await page.evaluate(() => document.body ? document.body.innerText : '')) || '';
      h = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
    } catch { /* mid-nav */ }
    const challenged = CHALLENGE.test(text);
    if (!challenged && h > opts.vh * 1.5 && text.length > 800) {
      stable += 1;
      if (stable >= 2) { console.log(`✅ cleared — content height ${h}px`); return true; }
    } else stable = 0;
  }
  return false;
}

async function main() {
  const { url, out, opts } = parseArgs(process.argv);
  const browser = await launchStealthHeaded(chromium);
  try {
    const ctx = await newLiveContext(browser, { ua: opts.ua, viewport: { width: opts.width, height: opts.vh } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opts.timeout }).catch(() => {});

    const solved = await waitForSolve(page, opts);
    if (!solved) { console.error('challenge not solved within timeout'); process.exit(3); }

    await page.waitForTimeout(opts.wait);
    await dismissAndLog(page, url, opts);

    // ---- identical capture body to stitch-shot.mjs from here ----
    if (opts.settle) {
      await page.evaluate(async () => {
        for (let y = 0; y <= document.body.scrollHeight; y += 300) {
          window.scrollTo(0, y);
          await new Promise((r) => { setTimeout(r, 220); });
        }
      });
      await page.waitForTimeout(3000);
      await dismissAndLog(page, url, opts);
    }
    // Normalize fixed/sticky chrome for a symmetric stitch vs the static-header
    // proto (recorded traps: a fixed consent bar + a position:sticky header each
    // re-capture at every 900px chunk, manufacturing lower-band diffs the proto
    // can never null out). Hide consent/cookie/chat overlays; de-sticky top
    // chrome so it renders ONCE in flow, matching the proto.
    const norm = await page.evaluate(() => {
      const out = { hidden: 0, destickied: 0 };
      const CONSENT = /(this site uses cookies|tracking technologies|cookie|consent|privacy notice)/i;
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
        const r = el.getBoundingClientRect();
        const txt = (el.innerText || '').slice(0, 300);
        const cls = `${el.className || ''} ${el.id || ''}`;
        // consent bars, chat widgets, back-to-top: hide (proto has none)
        if ((CONSENT.test(txt) || /chat|cookie|consent|gorgias|drift|intercom/i.test(cls)) && r.height < 500) {
          el.style.setProperty('display', 'none', 'important'); out.hidden += 1; continue;
        }
        // top chrome (header/nav/promo) → static so it appears once, like the proto
        el.style.setProperty('position', 'static', 'important'); out.destickied += 1;
      }
      return out;
    });
    console.log(`chrome normalized: ${norm.hidden} overlay(s) hidden, ${norm.destickied} sticky element(s) de-stickied`);
    // re-measure height after normalization changes flow
    await page.waitForTimeout(400);

    await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important;}html{scroll-behavior:auto!important}' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);

    const totalH = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
    if (!totalH || totalH < 10) throw new Error(`page height ${totalH}px — blank render?`);

    const chunks = [];
    let y = 0; let prevActualY = null;
    while (y < totalH) {
      const target = Math.max(0, Math.min(y, totalH - opts.vh));
      await page.evaluate((ty) => window.scrollTo(0, ty), target);
      await page.waitForTimeout(450);
      await page.evaluate(async () => {
        const t0 = Date.now();
        const pend = () => [...document.querySelectorAll('img')].some((i) => {
          const r = i.getBoundingClientRect();
          return r.bottom > 0 && r.top < innerHeight && r.width > 10 && (!i.complete || i.naturalWidth === 0);
        });
        while (pend() && Date.now() - t0 < 3000) await new Promise((r) => { setTimeout(r, 150); });
      });
      const actualY = await page.evaluate(() => window.scrollY);
      if (prevActualY !== null && actualY <= prevActualY && target - actualY > 4) {
        throw new Error(`scroll stall at ${target}px (inner-scroller / scroll-jacked layout)`);
      }
      prevActualY = actualY;
      const buf = await page.screenshot();
      chunks.push({ y: actualY, buf });
      y += opts.vh;
    }

    const outPng = new PNG({ width: opts.width, height: totalH });
    for (const { y: cy, buf } of chunks) {
      const img = PNG.sync.read(buf);
      for (let row = 0; row < img.height; row += 1) {
        const destY = cy + row;
        if (destY >= totalH) break;
        img.data.copy(outPng.data, (destY * opts.width) * 4, (row * img.width) * 4, (row * img.width + Math.min(img.width, opts.width)) * 4);
      }
    }
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, PNG.sync.write(outPng));
    console.log(`stitched ${out}: ${opts.width}x${totalH} from ${chunks.length} chunks`);
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(`stitch-shot-solve error: ${e.message}`); process.exit(1); });
