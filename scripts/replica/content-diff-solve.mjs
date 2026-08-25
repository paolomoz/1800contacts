#!/usr/bin/env node
/**
 * content-diff-solve.mjs — human-solve variant of diff/content-diff.mjs for a
 * live source behind an INTERACTIVE bot challenge (PerimeterX "Press & Hold").
 *
 * content-diff.mjs's --headed only does a passive wait+reload (Cloudflare); it
 * can't clear PerimeterX. This launches headed stealth Chrome, waits for a human
 * to solve, then runs the SHARED content-inventory instrument (inventory +
 * diffInventories from diff/content-inventory.mjs — same code content-diff uses,
 * so the measurement stays symmetric) on the solved live page and the local
 * prototype, and prints the structural flags.
 *
 * Source = LIVE (arg 1), Target = PROTO (arg 2), matching the replica gate's
 * `content-diff.mjs "$LIVE" "$PROTO"` orientation: a MISSING flag = live content
 * with no proto match (proto dropped it).
 *
 * Usage: node content-diff-solve.mjs <liveURL> <protoURL>
 *          [--live-main <sel>] [--proto-main main] [--profile generic]
 *          [--solve-timeout 240000] [--dismiss sel,...] [--json]
 * Exit: 0 ran, 1 error, 3 not solved in time.
 */
/* eslint-disable import/no-extraneous-dependencies, import/extensions, no-await-in-loop, no-restricted-syntax, no-console, max-len */
import { chromium } from 'playwright';
import { existsSync } from 'fs';
import { dirname, resolve as resolvePath } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIFF = ['../diff', '../../diff/scripts'].map((p) => resolvePath(HERE, p)).find((p) => existsSync(resolvePath(p, 'content-inventory.mjs')));
if (!DIFF) { console.error('diff scripts not found'); process.exit(1); }
const { inventory, diffInventories, summarise } = await import(pathToFileURL(resolvePath(DIFF, 'content-inventory.mjs')).href);
const { resolveProfile } = await import(pathToFileURL(resolvePath(DIFF, 'diff-profiles.mjs')).href);
const { REAL_CHROME_UA, launchStealthHeaded, newLiveContext, dismissOverlays } = await import(pathToFileURL(resolvePath(DIFF, 'live-session.mjs')).href);

const CHALLENGE = /(press\s*&?\s*hold|before we continue|are you a human|verify you are human|access to this page has been denied)/i;

function parseArgs(argv) {
  const rest = argv.slice(2); const pos = [];
  const opts = { profile: 'generic', liveMain: null, protoMain: 'main', solveTimeout: 240000, dismiss: [], json: false, vh: 900, width: 1440 };
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === '--profile') opts.profile = rest[i += 1];
    else if (a === '--live-main') opts.liveMain = rest[i += 1];
    else if (a === '--proto-main') opts.protoMain = rest[i += 1];
    else if (a === '--solve-timeout') opts.solveTimeout = Number(rest[i += 1]);
    else if (a === '--dismiss') opts.dismiss = (rest[i += 1] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--width') opts.width = Number(rest[i += 1]);
    else if (a === '--json') opts.json = true;
    else pos.push(a);
  }
  const [live, proto] = pos;
  if (!live || !proto) { console.error('need <liveURL> <protoURL>'); process.exit(1); }
  return { live, proto, opts };
}

async function waitForSolve(page, opts) {
  const deadline = Date.now() + opts.solveTimeout; let stable = 0;
  console.log('\n────────────────────────────────────────────────────────');
  console.log('  Solve the "Press & Hold" challenge in the Chrome window.');
  console.log(`  Waiting up to ${Math.round(opts.solveTimeout / 1000)}s…`);
  console.log('────────────────────────────────────────────────────────\n');
  while (Date.now() < deadline) {
    await page.waitForTimeout(2500);
    let text = ''; let h = 0;
    try {
      text = (await page.evaluate(() => (document.body ? document.body.innerText : ''))) || '';
      h = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
    } catch { /* mid-nav */ }
    if (!CHALLENGE.test(text) && h > opts.vh * 1.5 && text.length > 800) {
      stable += 1;
      if (stable >= 2) { console.log(`✅ cleared — content height ${h}px`); return true; }
    } else stable = 0;
  }
  return false;
}

// Detect the live content root (1-800 Contacts has no <main> per audit F-006).
async function detectRoot(page) {
  return page.evaluate(() => {
    const cands = ['main', '[role="main"]', '#main', '#__next main', '.main-content', '#content', '.page-content'];
    for (const s of cands) { const el = document.querySelector(s); if (el && el.innerText && el.innerText.length > 400) return s; }
    return null;
  });
}

async function main() {
  const { live, proto, opts } = parseArgs(process.argv);
  const prof = resolveProfile(opts.profile);
  const browser = await launchStealthHeaded(chromium);
  try {
    const ctx = await newLiveContext(browser, { ua: REAL_CHROME_UA, viewport: { width: opts.width, height: opts.vh } });

    // ---- LIVE (source) — solve, then inventory ----
    const lp = await ctx.newPage();
    await lp.goto(live, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    if (!(await waitForSolve(lp, opts))) { console.error('challenge not solved within timeout'); process.exit(3); }
    await lp.waitForTimeout(1200);
    await dismissOverlays(lp, { extra: opts.dismiss, lateWindowMs: 6000 });
    const liveMain = opts.liveMain || (await detectRoot(lp)) || 'body';
    console.log(`live content root: ${liveMain}${liveMain === 'body' ? ' (no main container found — chrome-inclusive)' : ''}`);
    const srcInv = await lp.evaluate(inventory, [liveMain, prof.eyebrow]);

    // ---- PROTO (target) — localhost, no solve ----
    const pp = await ctx.newPage();
    await pp.goto(proto, { waitUntil: 'networkidle', timeout: 30000 });
    await pp.waitForTimeout(400);
    const tgtInv = await pp.evaluate(inventory, [opts.protoMain, prof.eyebrow]);

    console.log(`\nlive  inventory: ${summarise(srcInv)}`);
    console.log(`proto inventory: ${summarise(tgtInv)}`);

    const { flags } = diffInventories(srcInv.items, tgtInv.items, prof);
    const red = flags.filter((f) => f.sev === '🔴');
    console.log(`\n${flags.length} flag(s): ${red.length} structural 🔴`);
    for (const f of flags) console.log(`  ${f.sev} ${f.kind} — ${f.msg}`);
    if (opts.json) console.log(`\n${JSON.stringify({ srcInv, tgtInv, flags }, null, 2)}`);
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(`content-diff-solve error: ${e.message}`); process.exit(1); });
