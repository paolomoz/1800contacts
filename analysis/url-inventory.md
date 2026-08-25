# URL Inventory — 1800contacts.com

Source: `sitemap.xml` (declared in `robots.txt`), fetched 2026-08-25.
Total unique URLs after dedupe + trailing-slash normalization: **1,126**.
Full raw list: `all-urls-clean.txt`. Original sitemap: `1800c-sitemap.xml`.

## Counts by section (first path segment)

| Section | Unique paths | Type |
|---|---:|---|
| `/eyesociety/*` | 531 | Blog (524 articles + 7 category hubs) |
| `/lens/*` | 365 | Product detail pages (PDP) |
| `/eye-doctor-search/*` | 52 | Doctor directory (1 index + ~50 states) |
| `/welcome/*` | 45 | Campaign / affiliate landing pages |
| `/lenses/*` | 26 | Product listing pages (PLP) + `/view-all` |
| `/order-contacts/*` | 18 | SEO/marketing landing pages |
| `/exam/*` | 14 | Online vision exam hub + brand bridges |
| `/contact-lens-solution/*` | 8 | Accessory PDPs + index |
| `/privacy/*` | 5 | Legal |
| `/terms/*` | 4 | Legal |
| `/vision-insurance/*` | 3 | Insurance marketing |
| `/public-policy/*` | 2 | Advocacy |
| `/reviews/*` | 2 | Reviews |
| `/account/*` | 2 | Account (robots-disallowed app) |
| `/glasses/*` | 2 | Glasses landing + prototype |
| singleton pages | ~62 | Home + informational + utility + transactional |

Sum: 531 + 365 + 52 + 45 + 26 + 18 + 14 + 8 + 5 + 4 + 3 + 2 + 2 + 2 + 2 + ~62 ≈ **1,126**.

## Sampling note

Large template groups were **sampled**, not enumerated, for live capture:
- `/eyesociety/*` (531): sampled 3 category hubs + 6 articles.
- `/lens/*` (365): PDP template sampled (1 captured; rest blocked by bot management).
- `/eye-doctor-search/*` (52): index + 2 states sampled.
- `/welcome/*` (45), `/order-contacts/*` (18): representative sample.

All non-sampled URLs are enumerated in `all-urls-clean.txt`.

## EyeSociety category hubs (7)

`/eyesociety/category/{home, buzz, community, contacts, exam, eye-health, glasses}`

## PLP facets — `/lenses/*` (26)

By brand (`acuvue`, `air-optix`, `biofinity`, `clariti`, `dailies`, `freshlook`, `precision`, `proclear`, `soflens`, `ultra`, `biotrue-oneday`), by manufacturer (`alcon`, `bausch-lomb`, `coopervision`, `johnson`), by wear type (`daily-disposables`, `weekly-disposables`, `monthly-disposables`, `toric-astigmatism`, `multifocal-bifocal`, `color`, `soft`, `vial`), plus `contact-lens-solution` and `view-all`.

## Robots.txt disallowed (transactional app — not statically migrated)

`/cart`, `/checkout` (implied), `/account`, `/account-settings`, `/order-history`, `/my-subscriptions`, `/rx-wallet`, `/reorder`, `/rapid-reorder`, `/address-list`, `/dashboard`, `/rate-and-review`, `/upload-rx`, `/doctor`, `/thank-you`, `/browser-upgrade`, plus `*token=` / `*examVoucherToken=` param URLs and `/cms/v2/content`.
