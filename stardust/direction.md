---
_provenance:
  writtenBy: stardust:replica
  writtenAt: 2026-08-25T16:10:00Z
  againstInput: https://www.1800contacts.com/
  readArtifacts:
    - stardust/current/pages/index.json
    - stardust/replica/css-lift/lift-record.md
---

# Direction — preserve mode (same-design migration)

Mode: PRESERVE. The target spec is the captured current state of
https://www.1800contacts.com/ (homepage). No `stardust:direct` invocation, no
creative decisions.

Entry: **bounded-single** (replica pilot, homepage archetype only). The
`current/PRODUCT.md` / `DESIGN.md` / `DESIGN.json` descriptive-synthesis files
do not exist (crawl.mjs bounded run writes only pages/*.json + screenshots), so
per preserve-direction.md §1a the target spec is **synthesized** from the
captured page JSON + the Phase-3 CSS lift.

Synthesized (bounded-single): current/pages/index.json + Phase-3 CSS lift
(stardust/replica/css-lift/lift-record.md) → PRODUCT.md · DESIGN.md · DESIGN.json
(at 2026-08-25T16:10:00Z).

Permitted deltas: ONLY the entries of stardust/replica/inconsistency-register.md
(0 entries — pure replica).

Fidelity: ia verbatim · design verbatim · content verbatim.

## Known fidelity gaps (not deltas — measurement/capture limits)

- **Brand font substitution.** The licensed rounded-geometric brand face ("Ambit"-class)
  was behind PerimeterX; woff2 not rehosted. Metric-matched fallback stack used, brand
  name kept first. Glyph shapes differ; sizes/weights matched.
- **Live/dynamic surfaces replicated as captured static:** promo countdown timer (static
  digits), card carousel (static 3-up + dots), FAQ accordion (collapsed static),
  header search + Sign in (static chrome), live chat launcher. These are commerce/JS
  surfaces per analysis/IMPLEMENTATION-PLAN.md §3; the replica reproduces the captured
  visual state.
