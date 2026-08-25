# Page Types / Templates — 1800contacts.com

Nine templates cover 1,126 URLs. Types use the stardust catalog
(`landing | article | listing | program | form | static | unique`).

| # | Template | stardust type | ~Count | Representative URLs | Captured evidence |
|---|---|---|---:|---|---|
| 1 | Home / merchandising | `landing` | 3 | `/`, `/buy-contacts`, `/start` | `index`, `buy-contacts` (screenshots + JSON) |
| 2 | Marketing / informational landing | `landing` | ~90 | `/exam`, `/glasses`, `/subscriptions`, `/vision-insurance`, `/best-price-guarantee`, `/gajillion-percent-promise`, `/coupon`, `/rebates`, `/fsa-fund-use`, `/mobile-app`, `/welcome/*`, `/order-contacts/*` | `exam`, `glasses`, `coupon`, `subscriptions` |
| 3 | Product Listing Page (PLP) | `listing` | ~34 | `/lenses`, `/lenses/view-all`, `/lenses/acuvue`, `/lenses/toric-astigmatism`, `/contact-lens-solution` | blocked (bot mgmt) |
| 4 | Product Detail Page (PDP) | `unique` (commerce) | ~373 | `/lens/acuvue-oasys`, `/lens/biofinity`, `/lens/1-day-acuvue-moist-90`, `/contact-lens-solution/systane-ultra` | `lens-acuvue-oasys` (screenshot + JSON) |
| 5 | Blog article ("Eye Society") | `article` | ~524 | `/eyesociety/20-20-20-rule-for-eyes`, `/eyesociety/a-brief-history-of-contact-lenses`, `/eyesociety/why-does-my-eyelid-twitch` | blocked |
| 6 | Blog category hub | `listing` | 7 | `/eyesociety/category/eye-health`, `/eyesociety/category/contacts` | blocked |
| 7 | Eye-doctor directory | `listing` | 52 | `/eye-doctor-search`, `/eye-doctor-search/ca`, `/eye-doctor-search/ut` | blocked |
| 8 | FAQ / help | `static` | ~4 | `/common-questions-faq`, `/help-center`, `/how-to-order`, `/how-to-read-rx` | `common-questions-faq` |
| 9 | Legal / policy | `static` | ~12 | `/privacy/privacy-policy`, `/terms/terms-and-conditions`, `/accessibility`, `/patents`, `/ad-choices` | blocked (403) |
| — | Transactional flow (app, NOT migrated) | `form`/app | ~10 | `/checkout`, `/cart`, `/account/*`, `/upload-rx`, `/prescription-request`, `/exam` wizard | robots-disallowed |

## Per-template characterization (from captured pages)

**Home / merchandising (`index`, `buy-contacts`)** — promo countdown bar; offer hero; "Need something else?" 3-up card carousel; insurance logo strip; "How to order" 3-step; reviews rail; FAQ accordion; footer. High block density (16 headings, 16 real images).

**Marketing landing (`exam`, `glasses`, `subscriptions`, `coupon`)** — offer hero + value-prop feature grids + step lists + comparison tables ("ExpressExam vs. the doctor's office") + testimonial rails + CTA bands. Copy-heavy, conversion-oriented.

**PDP (`lens-acuvue-oasys`)** — image gallery + thumbnails; pack-size selector (2/24 pack); quantity; in-stock badge; price; "Continue" -> guided checkout wizard (Brand -> Prescription -> Checkout progress). "Included with every order" trust list; "Product description and details" spec accordion (lens type, material, water %, manufacturer); reviews rail (verified purchases); FAQ; Live Chat.

**FAQ (`common-questions-faq`)** — sectioned Q/A (Account, Prescription, Orders, Shipping, Payment, Product, International, Company) + contact block.

**PLP / blog / directory (not captured — bot-blocked)** — inferred from URL structure + IA; classified as index-driven `listing` templates for EDS (see `stardust/dynamic-blocks-map.md`).

## Notes

- LLM-inferred types are written to `stardust/state.json` `pages[].type`; confirm/refine in `stardust direct --prep`.
- PDP count (~373) = `/lens/*` (365) + `/contact-lens-solution/*` product pages (~7).
- Marketing-landing count (~90) aggregates `/welcome/*` (45), `/order-contacts/*` (18), and ~27 standalone informational pages.
