<!--
provenance:
  writtenBy: stardust:prepare-migration Phase 4.5 (dynamic-blocks pre-import gate)
  againstInput: 1800contacts.com migration analysis
  date: 2026-08-25
  evidence: sitemap IA + 8 captured pages; commerce routes bot-blocked (inferred from IA)
-->

# Dynamic Blocks Map — 1800contacts.com

Classifies every block that LISTS other pages as **dynamic** (reads an EDS query-index)
or **static** (editorial curation / app-owned). For each dynamic block: the index it reads
and the metadata contract its cards need. Mechanics: `rollout/reference/dynamic-listings.md`.

## Listing blocks

| Block | Appears on | Classification | Index | Fields needed |
|---|---|---|---|---|
| **EyeSociety category feed** | `/eyesociety/category/*` (7 hubs) | **Dynamic** | `eyesociety` | title, image, description (Tier-1 DOM); **category, publishdate** (Tier-2 meta) |
| **EyeSociety "related articles" rail** | blog articles (~524) | **Dynamic** | `eyesociety` | same as above; relatedness by shared `category` |
| **EyeSociety blog search / index** | `/eyesociety` root, search | **Dynamic** | `eyesociety` | title, publishdate, category |
| **Eye-doctor state index** | `/eye-doctor-search` | **Dynamic** | `eye-doctor-search` | state name/link (Tier-1 DOM); **state** code (Tier-2 meta) |
| **Doctors-in-state list** | `/eye-doctor-search/<state>` | **Static→app** | — | Individual doctor records are app/API data (not indexed pages). Keep static shell; hydrate via doctor-search API. |
| **PLP product grid** | `/lenses/*` (~34) | **Dynamic (catalog)** | `lenses` (optional) | brand, manufacturer, lenstype, packsize (Tier-2 meta). **Price/stock NOT indexed** — fetched live from commerce API. |
| **PDP "related lenses" rail** | `/lens/*` (~373) | **Dynamic (catalog)** | `lenses` | brand, lenstype join; price live |
| **Home "Need something else?" carousel** | `/` | **Static** | — | Editorial 3-up merchandising cards; hand-authored. |
| **Reviews rail** | home, PDP | **Static→app** | — | Reviews are an API feed (Tier-3 relationship, not indexed pages) — stays app/API-driven, not an EDS index. |
| **Insurance partner logo strip** | home, insurance LP | **Static** | — | Fixed brand list. |
| **Footer nav** | all | **Static** | — | Authored nav. |

## Metadata contract (emit as `<meta>` at author time)

A metadata-block row `KEY | VALUE` renders to `<meta name="<key lowercased>">`. Emit dates ISO `YYYY-MM-DD`.

**`article` (EyeSociety):**
- `Category` → `meta[name="category"]` — one of: buzz, community, contacts, exam, eye-health, glasses, home
- `PublishDate` → `meta[name="publishdate"]` — ISO date
- `Author` → `meta[name="author"]` (optional)

**`eye-doctor-search` (state page):**
- `State` → `meta[name="state"]` — 2-letter code (ak…wy)

**`lenses` PLP / `lens` PDP (only if PDPs are EDS-authored; else catalog stays in commerce app):**
- `Brand` → `meta[name="brand"]`
- `Manufacturer` → `meta[name="manufacturer"]`
- `LensType` → `meta[name="lenstype"]` — daily | weekly | monthly | toric | multifocal | color
- `PackSize` → `meta[name="packsize"]`
- **NOT** price/stock — those are live commerce-API values; do not freeze into the index.

Title, hero image (`og:image`), and authored internal links are page-intrinsic DOM — no metadata needed.

## Tier-3 relationships kept static (record, don't fake)

- **Reviews** — many-to-many product↔review; reviews are API records, not indexed pages. Block stays app/API-driven.
- **Doctors-in-state** — doctor records are directory/API data, not EDS pages. State index is dynamic; the doctor list within a state is API-hydrated.
- **Live pricing / promotions** — ButterCMS + ZineOne + commerce API; client-side fetch, never indexed.

## Summary

- Dynamic (index-driven): **eyesociety** (category feeds, related, search), **eye-doctor-search** (state index), **lenses** (catalog grid/related — optional, facets only).
- Static / editorial: home carousel, insurance strip, footer.
- App/API-driven (not EDS indexes): reviews, doctor records, price/stock, cart, exam, Rx.
- Indexes authored: `helix-query.yaml` (3 scoped indexes).
