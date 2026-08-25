#!/usr/bin/env node
/**
 * content-parity.mjs — replica content-fidelity check WITHOUT re-scraping the
 * bot-walled live site. The authoritative record of live content is extract's
 * capture (stardust/current/pages/<slug>.json); this diffs the prototype's
 * RENDERED inventory against that capture using the SAME shared instrument
 * (diff/content-inventory.mjs inventory + diffInventories), so a MISSING flag =
 * a captured-live heading/CTA/body the proto dropped.
 *
 * This complements (does not replace) content-diff.mjs: content-diff needs both
 * pages live; for a PerimeterX site the live content of record is the capture.
 *
 * Usage: node content-parity.mjs <capturedPageJson> <protoURL> [--proto-main main]
 *          [--profile generic] [--json]
 * Exit: 0 ran, 1 error.
 */
/* eslint-disable import/no-extraneous-dependencies, import/extensions, no-console, max-len */
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve as resolvePath } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIFF = ['../diff', '../../diff/scripts'].map((p) => resolvePath(HERE, p)).find((p) => existsSync(resolvePath(p, 'content-inventory.mjs')));
if (!DIFF) { console.error('diff scripts not found'); process.exit(1); }
const { inventory, diffInventories, summarise } = await import(pathToFileURL(resolvePath(DIFF, 'content-inventory.mjs')).href);
const { resolveProfile } = await import(pathToFileURL(resolvePath(DIFF, 'diff-profiles.mjs')).href);
const { REAL_CHROME_UA } = await import(pathToFileURL(resolvePath(DIFF, 'live-session.mjs')).href);

// Mirror content-inventory.mjs's in-page key normalisation so source keys match
// the proto item keys exactly.
const ARROWS = /[→➔➜›⇒➤>]+/g;
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const norm = (s) => clean(s).replace(ARROWS, ' ')
  .replace(/[‘’′]/g, "'").replace(/[“”″]/g, '"')
  .replace(/…/g, '...').replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ').trim()
  .toLowerCase().replace(/[.,;:!?·•]+$/g, '').trim();

function parseArgs(argv) {
  const rest = argv.slice(2); const pos = [];
  const opts = { protoMain: 'main', profile: 'generic', json: false };
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === '--proto-main') opts.protoMain = rest[i += 1];
    else if (a === '--profile') opts.profile = rest[i += 1];
    else if (a === '--json') opts.json = true;
    else pos.push(a);
  }
  const [json, proto] = pos;
  if (!json || !proto) { console.error('need <capturedPageJson> <protoURL>'); process.exit(1); }
  return { json, proto, opts };
}

// Build a source inventory from the captured page JSON. Headings→heading,
// ctas→cta (with href), body→body. Skip nav chrome the proto's <main> won't
// carry (the top nav links + tel/footer utility) so the diff targets MAIN content.
function sourceInventory(cap) {
  const items = []; let order = 0;
  const NAV = new Set(['contact lenses', 'how to order', 'online vision exam', 'vision insurance']);
  for (const h of (cap.headings || [])) {
    const text = clean(h.text); if (!text) continue;
    items.push({ role: 'heading', order: order++, text, key: norm(text) });
  }
  for (const c of (cap.ctas || [])) {
    const text = clean(c.label); if (!text) continue;
    const href = c.href || '';
    if (NAV.has(norm(text))) continue; // header nav — carried by proto header, outside <main>
    if (/^tel:|^mailto:/.test(href)) continue; // footer utility
    items.push({ role: 'cta', order: order++, text, key: norm(text), href });
  }
  for (const b of (cap.body || [])) {
    const text = clean(typeof b === 'string' ? b : (b.text || '')); if (!text || text.length < 3) continue;
    items.push({ role: 'body', order: order++, text, key: norm(text) });
  }
  return { items, imgCount: 0 };
}

async function main() {
  const { json, proto, opts } = parseArgs(process.argv);
  const prof = resolveProfile(opts.profile);
  const cap = JSON.parse(readFileSync(json, 'utf8'));
  const srcInv = sourceInventory(cap);

  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ userAgent: REAL_CHROME_UA, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(proto, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(400);
    const tgtInv = await page.evaluate(inventory, [opts.protoMain, prof.eyebrow]);

    console.log(`captured-live (main content): ${summarise(srcInv)}`);
    console.log(`proto:                        ${summarise(tgtInv)}`);

    const { flags } = diffInventories(srcInv.items, tgtInv.items, prof);
    const missing = flags.filter((f) => String(f.kind).startsWith('MISSING'));
    const roleSwap = flags.filter((f) => f.kind === 'ROLE SWAP');
    console.log(`\n${flags.length} flag(s): ${missing.length} MISSING (live content dropped by proto), ${roleSwap.length} ROLE SWAP\n`);
    for (const f of flags.filter((x) => x.kind !== 'EXTRA' && x.kind !== 'FONT FORK')) {
      console.log(`  ${f.sev} ${f.kind} — ${f.msg}`);
    }

    // ---- Reconciliation: content-parity diffs against the RAW capture (no
    // --dismiss, capture-time text concatenation), while the authoritative
    // live-vs-proto content-diff probe runs the SAME instrument on both sides.
    // Two residual classes are artifacts of the offline substitute, not real
    // drops — reclassify them so GENUINE reflects only true content loss:
    //  (a) whitespace/<br>: capture joined two text nodes without a space
    //      ("easieron"), inventory() space-joins them ("easier on") — the live
    //      probe would space-join BOTH sides and match.
    //  (b) duplicate-label: a CTA whose destination href IS already linked in
    //      the proto under another label (or absolute vs relative form).
    const squash = (s) => (s || '').replace(/\s+/g, '');
    const relHref = (h) => (h || '').replace(/^https?:\/\/[^/]+/i, '');
    const protoHrefs = new Set(tgtInv.items.filter((i) => i.role === 'cta' && i.href).map((i) => relHref(i.href)));
    const protoTok = new Set(tgtInv.items.flatMap((i) => (i.text.toLowerCase().match(/[a-z0-9]+/g) || [])));
    const usedR = new Array(tgtInv.items.length).fill(false);
    const genuine = []; const artifact = [];
    for (const s of srcInv.items) {
      const exact = tgtInv.items.findIndex((t, i) => !usedR[i] && t.key === s.key);
      if (exact >= 0) { usedR[exact] = true; continue; }
      const sq = squash(s.key);
      const wsIdx = tgtInv.items.findIndex((t, i) => !usedR[i] && squash(t.key) === sq);
      if (wsIdx >= 0) { usedR[wsIdx] = true; artifact.push({ s, why: 'whitespace/<br> concat (present in proto; capture joined without space)' }); continue; }
      if (s.role === 'cta' && s.href && protoHrefs.has(relHref(s.href))) { artifact.push({ s, why: 'duplicate label — destination already linked in proto' }); continue; }
      // (c) split/decorated body: the capture records a paragraph as one string,
      // but the proto splits an embedded link into a separate CTA node (JOIN/SPLIT
      // #87) or prefixes an emoji. If every word of the source body is present
      // somewhere in the proto's rendered text, the copy is not dropped.
      if (s.role === 'body') {
        const toks = (s.text.toLowerCase().match(/[a-z0-9]+/g) || []);
        if (toks.length >= 3 && toks.every((t) => protoTok.has(t))) { artifact.push({ s, why: 'text present, node-split (embedded CTA) or emoji-decorated' }); continue; }
      }
      genuine.push(s);
    }
    console.log(`\n── reconciled vs authoritative live-probe behaviour ──`);
    console.log(`  ${artifact.length} artifact (would match under the live content-diff probe), ${genuine.length} GENUINE drop(s)`);
    for (const a of artifact) console.log(`    ~ ${a.s.role} "${a.s.text.slice(0, 48)}" — ${a.why}`);
    for (const g of genuine) console.log(`    🔴 GENUINE ${g.role} "${g.text.slice(0, 48)}"${g.href ? ` → ${g.href}` : ''}`);
    // EXTRA here = proto content not in the captured MAIN list (e.g. footer copy,
    // decorative glyphs) — mostly noise for a same-site replica; summarise count only.
    const extra = flags.filter((f) => f.kind === 'EXTRA');
    if (extra.length) console.log(`\n  (+${extra.length} EXTRA proto-only nodes — footer/decorative, not diffed against main capture)`);
    if (opts.json) console.log(`\n${JSON.stringify({ srcInv, tgtInv, flags }, null, 2)}`);
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(`content-parity error: ${e.message}`); process.exit(1); });
