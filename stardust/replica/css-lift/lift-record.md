<!--
provenance:
  writtenBy: stardust:replica (Phase 3 — CSS lift)
  againstInput: https://www.1800contacts.com/ (homepage)
  date: 2026-08-25
  sources:
    - stardust/current/pages/index.json (customProps = live :root --iris-* token dump; headings; ctas; body; media)
    - stardust/current/assets/screenshots/index.png (ground truth, 1440x4164, fullPage)
    - stardust/replica/css-lift/crops/*.png (per-section crops + undimmed-top scrim recovery)
  note: |
    archived-home.html is the Internet Archive "Temporarily Offline" page, not the
    live CSS — it was NOT used. All values below trace to the live :root custom-property
    dump captured in index.json#customProps (the site's own design tokens, "iris" system)
    plus per-pixel sampling of the screenshot. Scrim recovery: the top ~907px of the
    capture sits under a 30%-black modal+consent scrim; true colors recovered by
    dividing observed RGB by 0.69 and cross-checked against the iris token table.
-->

# Design-token lift — 1-800 Contacts homepage

## Palette (verbatim from the live `:root` "iris" token dump — index.json#customProps)

These are the site's OWN CSS custom properties, captured live. The replica re-exposes
the subset the homepage actually paints.

| Role | Token (site) | Value | Where used (verified on screenshot) |
|---|---|---|---|
| Primary navy (headings, header bg, buttons, footer) | `--iris-color-indigo-700` | `#0013a2` | header bar, all section H2/H1, "First time here" & "Read more reviews" buttons, footer bg |
| Deep navy (footer deepest bands) | `--iris-color-indigo-800` | `#000083` | footer lower area |
| Mid blue (subheads, step labels, links) | `--iris-color-indigo-600` | `#0066be` | hero subhead, "How to order" subhead, review subhead, step labels (measured ~#0061b5 / #2e6baf under AA) |
| FAQ panel blue | `--iris-color-indigo-500` | `#5099d3` | FAQ section background (measured #5099d3 exact) |
| Light section fill | `--iris-color-indigo-200` | `#def1fa` | "Need something else" cards section, reviews section bg (measured #def1fa exact) |
| Hero / pale wash | `--iris-color-indigo-100`→custom | `#dbedf7` | hero background (scrim-recovered ~#dbedf7; nearest token indigo-200 #def1fa) |
| Promo bar mint | `--iris-color-green-*` | `#99dbd8` | top promo/countdown bar (scrim-recovered) |
| CTA orange | `--iris-color-orange-600` | `#f36b00` | all pill CTAs ("Back again", "Tell me more", "Shop glasses", "Learn more", "Get started", "Sign in") — measured #f36b00 exact |
| Star gold | `--iris-color-orange-400` | `#ffbe31` | review star rating (measured ~#fcbe2d ≈ token #ffbe31) |
| Body text | `--iris-color-neutral-800` | `#323d54` | review quote body, step body copy (measured #323d54 / #3d404d) |
| Muted body | `--iris-color-neutral-700` | `#5c667a` | small print, footer secondary links |
| Surface white | `--iris-color-white` | `#ffffff` | card faces, "How to order" section, FAQ accordion rows |
| Near-white | `--iris-color-neutral-100` | `#f9fcff` | insurance section subtle wash |

## Heading color decision (the one open ambiguity)

Section H2s measured `#0013a2` (indigo-700). The "How to order" H2 + step H5s measured
`#001d9b`, and review/hero subheads measured `#2e6baf`/`#0061b5`. Resolution:
- **`#001d9b` vs `#0013a2`**: delta is rgb(0,10,7) — below the fullPage-JPEG/anti-alias
  noise floor. There is no `#001d9b` token in the iris dump; `#0013a2` (indigo-700) is.
  **Decision: all dark headings use `--iris-color-indigo-700 #0013a2`.** (Assumption;
  the two are visually identical.)
- Subheads are genuinely a lighter blue → `--iris-color-indigo-600 #0066be`.

## Typography

- **Brand font:** 1-800 Contacts ships a **licensed rounded-geometric sans ("Ambit"-class)**
  for headings and a clean geometric sans for body. The woff2 files were behind the
  PerimeterX wall (fonts route blocked), so per the replica fonts policy they are NOT
  rehosted. Substitute = a metric-matched rounded stack with the brand name kept first
  so a licensed drop-in later wins:
  - headings: `'Ambit', 'Nunito', 'Quicksand', 'Segoe UI', system-ui, sans-serif` (weight 700)
  - body: `'Ambit', 'Nunito Sans', 'Helvetica Neue', system-ui, sans-serif` (weight 400/500)
  - **Fidelity gap (logged):** rendered glyph shapes differ from the licensed Ambit; sizes/
    weights/line-heights are matched to the capture.
- **Type ramp (measured off the 1440 capture, px):**
  - Hero H1: ~54px / 1.15, weight 700
  - Section H2 ("Need something else", "Huzzah", "How to order", "FAQs"): ~40px / 1.2, 700
  - Insurance H2: ~44px / 1.15, 700
  - Card H5 / step H5: ~26px / 1.25, 700
  - Subhead: ~22px / 1.3, 600
  - Body: ~17-18px / 1.55, 400
  - Small print: ~13px, 400
  - Promo bar: ~15px, 700

## Layout / container model

- Content max-width: **1332px** (`--container`), centered, side padding 24px → inner
  content box **~1284px wide** at 1440. **Corrected during the Phase-4 gate:** the initial
  lift assumed the 1200px boilerplate container, but the pixel probe measured live's FAQ
  card/heading box spanning x79→x1363 (width 1284, centered at x721). A 1200px container
  placed proto content 68px inboard of live and re-hot every left-aligned band (hero,
  insurance, FAQ). Widening to 1332px aligned all of them in one correction. This is a
  measured lift off the capture, not an eyeball.
- **FAQ mascot** (eyeball character hugging ACUVUE/DAILIES/1-800 boxes): a brand
  illustration in the live FAQ left column. Its source asset sat behind the PerimeterX
  wall, so per the capture-state policy it was recovered from the ground-truth stitched
  capture (`gates/index-1440/live.png`, region x32–322 / y3038–3474) into
  `prototypes/assets/faq-mascot.png` (290×436). It renders on the same `#5099d3` panel,
  so the baked-in background blends seamlessly. Logged fidelity note: raster lift of a
  vector illustration — swap for the licensed SVG if it later becomes available.
- Header bar height: ~64px (boilerplate `--nav-height` 64px) on navy `#0013a2`.
- Promo/countdown bar above header: ~42px tall, mint `#99dbd8`, centered navy text.
- Hero: full-bleed pale wash, left-aligned copy column (~50% width), product art bleeds
  right; min-height ~547px at 1440 (measured band 93→640).
- Cards section: 3-up grid, white cards on `#def1fa`, ~24px gap, card radius ~16px,
  image top / body + pill CTA below; carousel dots + right chevron.
- How-to-order: 3-column steps on white, centered orange "Get started" pill below.
- Reviews: 3-up quotes on `#def1fa`, gold stars, centered navy "Read more reviews" pill.
- FAQ: two-column on `#5099d3` — left title, right stack of white accordion rows
  (radius ~12px, chevron right).
- Footer: navy `#0013a2`, brand block + "We're here to help" + 4 link columns + social
  row + payment badges + legal row.

## Buttons (pill)

- radius: fully rounded (`border-radius: 999px` — measured pill ends)
- primary CTA: bg `#f36b00`, text white, weight 700, padding ~16px 40px
- secondary CTA: bg `#0013a2`, text white (hero "First time here", reviews "Read more")
- height ~52px hero / ~44px cards

## Radii / shadows

- cards: radius ~16px, soft shadow (very subtle, `0 1px 3px rgba(0,0,0,.08)`)
- faq rows: radius ~12px, no visible shadow on the blue panel
- buttons: pill (999px)
