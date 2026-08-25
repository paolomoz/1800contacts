# Replica source-fidelity gate — homepage @1440

**Archetype:** `stardust/prototypes/index-proposed.html` · **Source:** https://www.1800contacts.com/
**Breakpoint:** 1440 · **Last run:** 2026-08-25 · **Iterations used:** 3 (hard cap)

## Pixel probe (stitched captures, symmetric instrument)

Live `gates/index-1440/live.png` (1440×4164, human-solved PerimeterX + chrome-normalized)
vs proto `proto.png` (1440×4157, headless). `scripts/replica/pixel-compare.mjs`, pixelmatch.

| Metric | Result | Bar | Verdict |
|---|---|---|---|
| Full-page pixel diff | **8.58%** (513,875 / 5,986,080) | ≤ 10% | ✅ PASS |
| Height delta | **7px** (proto 4157 vs live 4164) | \|Δ\| ≤ 8px | ✅ PASS |

### Per-500px band breakdown (final)
| Band | Diff | Note |
|---|---|---|
| 0–500 | 13.5% | hero — **font substitution** (Ambit→Nunito glyph shapes); geometry aligned |
| 500–1000 | 6.8% | hero lower / insurance |
| 1000–1500 | 9.6% | cards |
| 1500–2000 | 6.8% | cards lower / steps |
| 2000–2500 | 4.2% | steps / reviews |
| 2500–3000 | 6.5% | reviews |
| 3000–3500 | **15.8%** | FAQ — mascot raster + accordion label **font substitution**; geometry aligned |
| 3500–4000 | 7.0% | FAQ lower / footer |
| 4000–4157 | 3.7% | footer |

### Section-height alignment (measure-bands.mjs) — all within a few px
| Section | Live | Proto | Δ |
|---|---|---|---|
| promo | 42 | 42 | 0 |
| header | 50 | 52 | +2 |
| hero | 479 | 479 | 0 |
| insurance | 509 | 509 | 0 |
| cards | 673 | 673 | 0 |
| steps | 498 | 498 | 0 |
| reviews | 587 | 586 | −1 |
| faq | 666 | 666 | 0 |
| footer | 655 | ~652 | ~−3 |

## Residuals (documented, not defects)
The two remaining warm bands (hero 13.5%, FAQ 15.8%) are **licensed-font substitution**,
not structural drift. 1-800 Contacts ships an "Ambit"-class rounded geometric sans behind
the PerimeterX wall; per the replica fonts policy it is not rehosted — substituted with a
Nunito/Quicksand stack, brand family kept first in the stack. Glyph outlines differ; sizes,
weights, line-heights, colors, and every section geometry are matched to the capture. A
licensed Ambit drop-in later collapses both bands. The FAQ mascot is a raster lift from the
ground-truth capture (see `css-lift/lift-record.md`), which contributes a small amount to
the FAQ band vs a native vector.

## Iteration log
1. **i1** — added the missing "Look up my insurance" CTA (content-fidelity fix) + first
   per-section height pass. 27.78% → 15.79%, Δ 359→49px.
2. **i2** — exact per-section padding corrections from measured band deltas (hero −25,
   insurance +77, footer). 15.79% → 10.45%, Δ 49→13px.
3. **i3** — root-cause container width correction (1200→1332px, measured off live's
   x79→x1363 content box) realigned all left-aligned bands; recovered FAQ mascot from
   capture; widened faq-left column to 490px; re-balanced cards/steps/footer padding for
   the re-wrap. 10.45% → **8.58%**, Δ 13→**7px**.

## Gate status @1440
**PASS on both measured probes (pixel + height).** Remaining gate probes — content-diff
and visual-diff (DOM structural parity) — require live DOM access, which needs a fresh
human PerimeterX solve; not yet run. The 360 breakpoint gate also remains (needs its own
live solve for the mobile capture).
