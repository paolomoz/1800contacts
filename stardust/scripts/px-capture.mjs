// Human-solved PerimeterX/HUMAN session capture.
//
// Opens a VISIBLE Chrome window at 1-800 Contacts. You solve the
// "Press & Hold" challenge by hand. The script polls for clearance,
// then saves the browser session (cookies + localStorage) to
// stardust/px-clearance.json so the crawler can reuse it via
// STARDUST_STORAGE_STATE.
//
// Run:  node stardust/scripts/px-capture.mjs [--url https://www.1800contacts.com/]
//
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
let url = 'https://www.1800contacts.com/';
let out = 'stardust/px-clearance.json';
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--url') url = argv[(i += 1)];
  else if (argv[i] === '--out') out = argv[(i += 1)];
}

const CHALLENGE = /(press\s*&?\s*hold|press and hold|are you a human|verify you are human|px-captcha|access to this page has been denied|blocked)/i;

// PerimeterX challenge/block cookies vs. a real cleared session.
function hasClearance(cookies) {
  return cookies.some((c) => c.name === '_px3' || c.name === '_pxvid' || c.name === '_pxde');
}

(async () => {
  console.log('Launching a visible Chrome window…');
  let browser;
  try {
    browser = await chromium.launch({ headless: false, channel: 'chrome', args: ['--start-maximized'] });
  } catch {
    console.log('System Chrome unavailable, falling back to bundled Chromium.');
    browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  }
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  console.log(`Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});

  console.log('\n────────────────────────────────────────────────────────');
  console.log('  In the Chrome window: solve the "Press & Hold" challenge.');
  console.log('  Waiting for you to clear it (up to 4 minutes)…');
  console.log('────────────────────────────────────────────────────────\n');

  const deadline = Date.now() + 4 * 60 * 1000;
  let cleared = false;
  let stableHits = 0;
  while (Date.now() < deadline) {
    await page.waitForTimeout(2500);
    let bodyText = '';
    let title = '';
    try {
      bodyText = (await page.evaluate(() => document.body ? document.body.innerText : '')) || '';
      title = await page.title();
    } catch { /* mid-navigation */ }
    const cookies = await context.cookies().catch(() => []);
    const challenged = CHALLENGE.test(bodyText) || CHALLENGE.test(title);
    // Cleared = real content present, no challenge text, and a PX clearance cookie set.
    if (!challenged && bodyText.length > 800 && hasClearance(cookies)) {
      stableHits += 1;
      if (stableHits >= 2) { cleared = true; break; } // require 2 consecutive clean polls
    } else {
      stableHits = 0;
    }
  }

  if (!cleared) {
    console.log('\n⚠️  Did not detect a cleared session within the time limit.');
    console.log('Saving whatever session state exists anyway (may be incomplete).');
  } else {
    console.log('\n✅ Clearance detected — real page content is loading.');
  }

  const state = await context.storageState();
  writeFileSync(out, JSON.stringify(state, null, 2));
  const pxCookies = state.cookies.filter((c) => c.name.startsWith('_px')).map((c) => c.name);
  console.log(`\nSaved session to ${out}`);
  console.log(`  cookies total: ${state.cookies.length}`);
  console.log(`  PerimeterX cookies: ${pxCookies.join(', ') || '(none — clearance likely failed)'}`);
  console.log(`  origins with localStorage: ${state.origins.length}`);

  // Quick verification probe in a FRESH context that only has the saved state.
  console.log('\nVerifying: opening a fresh context seeded only with the saved session…');
  const probe = await browser.newContext({ storageState: state });
  const ppage = await probe.newPage();
  const resp = await ppage.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => null);
  const pText = (await ppage.evaluate(() => document.body ? document.body.innerText : '').catch(() => '')) || '';
  const status = resp ? resp.status() : 'n/a';
  const stillBlocked = CHALLENGE.test(pText);
  console.log(`  probe HTTP status: ${status}`);
  console.log(`  probe still challenged: ${stillBlocked ? 'YES ❌' : 'NO ✅'}  (content length ${pText.length})`);
  await probe.close();

  console.log('\nClosing browser in 4s…');
  await page.waitForTimeout(4000);
  await browser.close();

  console.log('\nNext: run the crawler with the saved session, e.g.');
  console.log(`  STARDUST_STORAGE_STATE=${out} node stardust/scripts/crawl.mjs --url ${url} --max 25`);
  process.exit(cleared && !stillBlocked ? 0 : 1);
})().catch((e) => { console.error('capture failed:', e); process.exit(2); });
