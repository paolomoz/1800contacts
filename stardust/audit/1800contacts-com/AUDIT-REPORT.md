# Site Audit — 1-800 Contacts (https://www.1800contacts.com/)

**Audited:** 2026-08-25 · **stardust:audit** v0.18.1 · **Overall score: 58 / 100**

> Synthesized from on-disk probes (`_brand-probe.json`, `_seo-probe.json`, `_cwv.json`) and 8 captured pages. The live site was **not re-crawled** — it sits behind PerimeterX / HUMAN Security bot protection, so re-crawling was wasteful. Pages audited: index, buy-contacts, lens-acuvue-oasys (PDP), exam, subscriptions, glasses, coupon, common-questions-faq. 1,126 URLs discovered total.

## Scorecard

| Dimension | Score | Weight |
|---|---|---|
| Brand expression | 73 | 10 |
| Visual hierarchy & craft | 58 | 15 |
| Conversion focus | 62 | 20 |
| Accessibility | 55 | 10 |
| Technical SEO | 62 | 15 |
| Content / LLM visibility | 60 | 15 |
| **Performance** | **38** | 15 |
| **Overall** | **58** | 100 |

Performance is the weakest dimension and the single biggest reason to migrate; accessibility and visual hierarchy are the next tier of concern. Brand expression scores well — the underlying "iris" design-token system is mature and is the site's most underexploited strength.

## Core Web Vitals

| Metric | Mobile (full load) | Desktop |
|---|---|---|
| LCP | **16.56 s** (poor) | 3.11 s (needs improvement) |
| CLS | **0.382** (poor) | 0.097 (good) |
| TBT (INP proxy) | **1363 ms** (poor) | 97 ms (good) |
| FCP | **8.70 s** (poor) | 2.14 s |

Mobile — the majority of e-commerce traffic — fails all four vitals. The desktop experience is acceptable; mobile is not. The Yottaa front-end optimizer, the Adobe Launch tag chain, and the PerimeterX challenge all sit on the critical path and inflate mobile LCP/TBT. (Note: several mobile runs returned HTTP 403 PerimeterX challenge stubs — 13 resources / 22 DOM nodes — and were correctly excluded; the 16.56 s figure is a real, full 198-resource render.)

## Findings (14)

### P1 — fix first
- **F-001 · Mobile CWV all POOR.** LCP 16.56 s, CLS 0.382, TBT 1363 ms. The EDS migration is the lever: static server-rendered hero with explicit image dimensions (kills CLS), tag chain + Yottaa + PerimeterX off the critical path, preload the LCP image, one first-party font.
- **F-002 · Primary CTA fails WCAG AA.** White on orange-600 (`#ffffff` on `#f36b00`) = **3.04:1** (AA needs 4.5). This is the most-used button — 9× on the home page. White reaches AA on orange only at orange-800 (`#df1400`, 4.96:1); reserve orange-600 for large/bold labels (passes AA-large 3:1) or switch the text-bearing primary button to indigo-700 (`#0013a2`, 13:1). Real ADA exposure for a brand that publishes an `/accessibility` page.
- **F-003 · PDP titles are brand-only across ~373 pages.** `lens/acuvue-oasys` title = "1-800 Contacts" (14 chars, no product term); generic boilerplate meta description. The largest indexable template cannot rank for its own product queries. Fix with templated intent-bearing titles + product-specific descriptions from ButterCMS/product data at build time.

### P2
- **F-004 · Broken H1 structure site-wide.** Home: 11 h1 in DOM / 1 visible. PDP: 3 competing visible h1. FAQ: **0 visible h1**. Outline skips h1 → h2 → h5. EDS section templates enforce one h1 + sequential levels by construction.
- **F-005 · Duplicate title + OG** across `/` and `/buy-contacts` ("1-800 Contacts | Order Contact Lenses Online"). `/buy-contacts` returns 200 but redirects to `/`, yet its canonical says `/buy-contacts`.
- **F-006 · Incomplete landmarks on every page.** No `<nav>`/`role=navigation`, no `<footer>`/`role=contentinfo`; `<main>` element (not just role) absent on most pages. EDS block scaffolding emits these for free.
- **F-007 · Structured-data gaps.** No Organization schema anywhere; no JSON-LD on `/subscriptions`, `/glasses`, `/coupon`; PDP Product lacks Offer/price/AggregateRating; no BreadcrumbList; no `llms.txt` (returns 403).
- **F-008 · Open Graph image + type missing site-wide.** `og:image` null on home + all landing pages; `og:type` null everywhere. Shared links render with no preview image.
- **F-009 · Fragmented CTA vocabulary.** The order-entry action carries 4 labels (Get started / First time here / Contact lenses / Back again); "Learn more" appears 5× to 5 destinations. Standardize on one primary verb ("Shop contacts") with descriptive secondary labels.
- **F-010 · More contrast failures in real roles** (8 pairs fail AA-normal): black-on-dark-blue button 1.65:1; light-blue `#8ac0e3` text 1.96:1; orange-on-pale-blue 2.61:1; white-on-`#5099d3` 3.07:1; teal `#00a08b` 3.28:1; muted gray `#848c9d` 3.38:1. The system already defines `--iris-color-neutral-wcag45` (`#6d7588`, 4.62:1) — it's just not used. Swap it in and lint token-to-role mapping against 4.5:1.
- **F-011 · PDP content thin, price locked in JS.** PDP = 117 prose words (truncated description); per-lens price lives only in the pack-size/quantity widget, not crawlable text. Answer engines can't cite "what does ACUVUE OASYS cost here." Render full description + spec table + starting price as crawlable text.

### P3
- **F-012 · Border-radius sprawl** — 12 distinct radii (4/5/6/8/10/11/12/16/19.5/24/30/32) plus 50% and compound corners. Consolidate to a 3-step scale (pill 30, card 16, control 8).
- **F-013 · Heading size decoupled from level** — h5 (29px) renders larger than h3/h4 (18-21px); h2 appears at both 41px and 29px; PDP adds 57/34/32/28. Bind each level to one size via a single modular ratio.
- **F-014 · Hero leads with an expiring promo.** H1 = "Flash sale: 30% off your first order today" with a countdown. The strongest slot and the H1 carry a dated offer rather than the durable "best price + free shipping" promise — demote the flash-sale to a secondary band.

## Accessibility: contrast pairs

**8 pairs fail WCAG AA-normal (4.5:1).** The system *has* WCAG-safe tokens; they're inconsistently applied. Passing roles (body text on white/pale sections, brand-blue links, secondary CTA white-on-indigo) already reach AAA (10-13:1). The failures cluster on the orange primary CTA, teal PDP accents, muted grays, and light-blue text.

Worst offenders: black-on-indigo button **1.65:1**, light-blue text **1.96:1**, orange-on-pale-blue **2.61:1**. Primary CTA white-on-orange **3.04:1**.

## Migration opportunities (why EDS helps)

Most P1/P2 findings are structural and get fixed *for free or cheaply* by the EDS rebuild:
- **Performance (F-001):** static, server-rendered pages with reserved image dimensions and deferred third-party tags directly target the mobile LCP/CLS/TBT failures.
- **Semantics (F-004, F-006):** EDS block templates enforce one h1, sequential headings, and full landmarks by construction.
- **SEO (F-003, F-005, F-008):** templated titles/descriptions/OG per page type, sourced from ButterCMS/product data at build time.
- **Structured data + LLM visibility (F-007, F-011):** add Organization + BreadcrumbList site-wide, complete Product schema on the PDP, publish `llms.txt`, render price as crawlable text.
- **Accessibility (F-002, F-010):** adopt the already-defined iris WCAG-safe tokens as the button/text contract and lint against 4.5:1.

**Recommended direction (from the audit's uplift options):** "Tomorrow's version of the site you have today" — keep the IA and the playful brand voice, fix all P1/P2 findings on EDS, and make the existing iris token system fully consistent and accessible.

## Caveats
- Reference benchmarking (Phase 5 / refero) was not run; PageSpeed field data was not probed (lab CWV only, TBT proxies INP).
- `altCoverage` reported 0.90 but the probe's generic-alt heuristic under-flags some "media image"/"callout image" strings, so true meaningful-alt coverage is modestly lower.
- Brand color share (0.27) is elevated by the flash-sale hero present at capture time.

---
*Data: `audit.json`, `_brand-probe.json`, `_seo-probe.json`, `_cwv.json` in this directory.*
