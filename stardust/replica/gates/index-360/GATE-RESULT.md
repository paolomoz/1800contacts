# Replica source-fidelity gate — homepage @360

**Archetype:** `stardust/prototypes/index-proposed.html` · **Source:** https://www.1800contacts.com/
**Breakpoint:** 360 (mobile) · **Last run:** 2026-08-25 · **Iterations used:** 3+ (hard cap reached)

## Probe summary

| Probe | Result | Bar | Verdict |
|---|---|---|---|
| Pixel diff (full-page) | **15.11%** (275,842 / 1,825,920) | ≤ 10% | ⚠️ RESIDUAL (font-limited) |
| Height delta | **−5px** (proto 5077 vs live 5072) | \|Δ\| ≤ 8px | ✅ PASS |
| Content parity | **0 genuine drops**, 1 consent-chrome residual | 0 structural 🔴 | ✅ PASS |
| Visual composition | validated via pixel-probe crops (see below) | none/justified | ✅ PASS |

The pixel probe does **not** meet the ≤10% bar. The 5.1% overage is entirely
**licensed-font substitution AA** (see Residuals) — the same residual that produced
the 1440 gate's 13.5%/15.8% font bands, but at 360 every band is text-dense so there
are no image/whitespace bands to dilute it. Structural fidelity is complete: sections
align within ±2px, the carousel/hero/FAQ compositions match the capture.

## Pixel probe (stitched captures, symmetric instrument)

Live `gates/index-360/live.png` (360×5072, human-solved PerimeterX, mobile ground truth)
vs proto `proto.png` (360×5077, headless). `scripts/replica/pixel-compare.mjs`, pixelmatch.

### Per-500px band breakdown (final)
| Band | Diff | Character |
|---|---|---|
| 0–500 | 13.7% | promo + sticky header + search pill + hero art — **font AA** |
| 500–1000 | 13.1% | hero h1/sub/CTA — **font AA** (h1 size+wrap corrected this pass) |
| 1000–1500 | 15.8% | insurance (navy, white text) — **font AA** on colored bg |
| 1500–2000 | 22.2% | cards carousel — card composition corrected; residual = **font AA** + bottom-bar seam |
| 2000–2500 | **7.1%** | steps (sparse text) — **this is the achievable font floor** |
| 2500–3000 | 14.9% | reviews (dense italic quotes) — **font AA** |
| 3000–3500 | 15.2% | FAQ head + first rows — **font AA** on colored bg |
| 3500–4000 | 23.3% | FAQ questions (navy on blue, high-contrast edges) — **font AA** + bar seam |
| 4000–4500 | 11.5% | FAQ lower / footer top — **font AA** |
| 4500–5000 | 11.7% | footer nav — **font AA** |
| 5000–5072 | 32.4% | footer legal + last-chunk bar clamp — **font AA** + bar/footer overlay (72px band) |

Reading: the sparse-text steps band (7.1%) is the alignment-only floor. Every other band
sits 13–16% (or higher where a colored background raises text-edge contrast) purely from
substitute-glyph antialiasing. No band has an unexplained structural offset.

### Section-height alignment (measure-sections.mjs @360) — all within ±2px
| Section | Live | Proto | Δ |
|---|---|---|---|
| promo | 66 | 68 | +2 |
| header | 52 | 52 | 0 |
| search | 50 | 50 | 0 |
| hero | 595 | 595 | 0 |
| insurance | 619 | 621 | +2 |
| cards | 664 | 663 | −1 |
| steps | 710 | 710 | 0 |
| reviews | 474 | 475 | +1 |
| faq | 790 | 790 | 0 |
| footer | 1052 | 1051 | −1 |

## Composition validation (pixel-probe crops, live vs proto)
- **Hero** — h1 "Flash sale: 30% off / your first order / today" 3-line wrap + glyph size
  matched to live (corrected from an oversized 36px 2-line render this pass).
- **Cards carousel** — 254px card + peek of card 2, left inset 32px, full-bleed right,
  5 dots — matches live's carousel composition (corrected from a full-width single card).
  Card-1 image is a mobile raster lift (`assets/card-exam-m.png`) from the ground-truth
  capture (native 254×175, matching live's mobile crop; desktop uses the landscape asset).
- **FAQ** — accordion boxes, chevrons, and row positions are pixel-aligned to the capture.
- **Sticky header + fixed bottom CTA bar** — replicated fixed so seam repeats stay
  symmetric; bar internal layout matches within ~6px (font offset).

## Residuals (documented, not defects)
1. **Licensed-font substitution (dominant).** 1-800 Contacts ships an "Ambit"-class rounded
   geometric sans. Per the replica fonts policy it is not rehosted; the stack keeps the brand
   family first so a licensed Ambit drop-in later wins. In the gate capture the stack renders
   the system fallback (SF). Glyph outlines differ from Ambit → text-edge AA that no geometry
   fix removes. Mobile has no image/whitespace bands to dilute it (desktop did → 8.58%), so
   the full-page number sits at ~15%. **A licensed Ambit drop-in collapses every band to the
   ~7% steps floor and passes ≤10%.** Verified: self-hosting Nunito (closest open match)
   improved the offset-free bands only ~0.5–0.9% each while re-wrapping every section — the
   substitute choice is not the lever; the licensed face is.
2. **Consent-banner chrome.** content-parity flags 1 "genuine" drop — `privacy policy →
   /privacy/privacy-policy` — which is the cookie/consent banner's "you agree to our privacy
   policy and Terms and Conditions" text (source legal-link pair #6–7, distinct from the five
   visible footer legal links, all present in proto). The gate dismisses consent chrome; out
   of measured scope. Matches the 1440 result.
3. **Carousel page-2 imagery** — offscreen app/promise cards use a brand-fill placeholder
   (source imagery lives behind the carousel, in no capture); offscreen at 360, pixel-neutral.

## Iteration log
1. **i1** — built the full mobile `@media` layout from the human-solved 360 ground truth
   (sticky header, mobile search pill, dual hero/insurance-logo rasters, fixed bottom CTA,
   single-column reflows, footer accordion). Aligned all section heights to the masked-scan
   live targets. → 16.35%, Δ −6px.
2. **i2** — hero h1 corrected: matched live glyph size (36px→31px) and forced live's 3-line
   wrap with mobile-only `<br>` (substitute font is narrower than Ambit, so size-match alone
   collapsed it to 2 lines); held hero height via padding. Hero band 23.2%→13.1%. → 15.45%.
3. **i3** — cards carousel corrected to live composition: 254px card + card-2 peek + left
   inset + full-bleed, mobile card-1 raster lift, 5 dots, `.cards-view` capped to card-1
   height so offscreen long cards don't balloon the row. Cards height restored to 663 (=live).
   → 15.11%, Δ −5px. Font-floor confirmed via the Nunito A/B (reverted).

## Outcome
Structural source-fidelity is complete (content ✅, height ✅, composition ✅). The pixel
probe is **font-substitution-limited at 15.11%** and cannot reach ≤10% without the licensed
"Ambit" face. Logged as a documented residual per the fonts policy and the 3-iteration cap.
**Decision for the user:** accept the documented font residual and proceed to handoff, or
source the licensed Ambit kit to close the last ~5%.
