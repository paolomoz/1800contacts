# Martech Stack & API Integrations — 1800contacts.com

Evidence: `analysis/netcapture.json` — home page rendered headed (real Chrome + stealth),
407 network requests across 58 real third-party hosts (Chrome-extension hosts filtered out),
175 XHR/fetch calls. Live `window` globals detected: `dataLayer, gtag, _satellite, adobe,
digitalData, _uxa, fbq, ttq, pintrk, rdt, uetq`.

## Platform / rendering

- **Custom SSR JavaScript app** — no `__NEXT_DATA__` / `__NUXT__`; first-party `/api/*` bootstrap.
- **CDN / edge:** Fastly (`server: Varnish`, `x-served-by: cache-*`, `via: 1.1 varnish`).
- **Front-end optimization:** **Yottaa** (`rapid-cdn.yottaa.com`, `qoe-1.yottaa.net`, `rapid-1.yottaa.net`).
- **Bot management:** **PerimeterX / HUMAN Security** — app `PXzviSWmJw`; `client.px-cloud.net`,
  `collector-pxzviswmjw.px-cloud.net`, `js.px-cloud.net`, `fst-ec.perimeterx.net`,
  first-party `/zviSWmJw/captcha/captcha.js`; `_pxhd`/`_px3` cookies. Interactive "Press & Hold" CAPTCHA on commerce routes.

## Content & commerce APIs

| System | Endpoint(s) | Purpose |
|---|---|---|
| **ButterCMS** (headless CMS) | `api.buttercms.com/v2/content/` (×many), `/v2/pages/exam_price/price-books/`, `/v2/pages/personalized_discount_configuration/personalized-discount-configuration/` | Marketing content, exam pricing, personalized-discount config. **Primary content source for EDS migration.** |
| First-party app APIs | `POST /api/startup`, `GET /api/session/client-ip`, `GET /api/sitePreferences/sessionAiApiKey` | SSR app bootstrap, session, feature/AI key |
| Commerce / cart | `/cart`, `/checkout`, `/reorder`, `/rapid-reorder` (robots-disallowed) | Live cart/order state (dynamic) |
| Prescription / Rx | `/upload-rx`, `/prescription-request`, `/rx-wallet`, `/rx-details` | Rx upload + verification + doctor lookup |
| Media | `img.1800contacts.com`, `gs.nmgassets.com` (product imagery) | Product/catalog images |
| Telemetry | `westus-0.in.applicationinsights.azure.com/v2/track` (Azure App Insights), `1800contacts.report-uri.com` (CSP reports) | Error/perf/CSP |

## Analytics & tag management — Adobe Experience Cloud (primary)

- **Adobe Launch / DTM:** `assets.adobedtm.com` (15 reqs), `_satellite` global — the master tag container.
- **Adobe Analytics + AEP Web SDK (Alloy):** first-party CNAME `analytics.1800contacts.com/ee/irl1/v1/interact` (`/ee/` = Adobe Edge Network interact); `adobe`, `digitalData` globals.
- **Adobe Audience Manager (demdex):** `dpm.demdex.net`, `adobedc.demdex.net`, `1800contacts.demdex.net`.
- **Adobe Advertising Cloud:** `cm.everesttech.net`.
- **Adobe Target:** delivered via Launch (personalization/experiments).

## Analytics — Google

- **GA4 / gtag:** `googletagmanager.com`, `google.com/ccm/collect` (Google consent-mode collect).
- **Google Ads / conversion:** `googleadservices.com`, `googleads.g.doubleclick.net`, `ad.doubleclick.net`.

## Advertising / conversion pixels

| Vendor | Global | Hosts |
|---|---|---|
| Meta (Facebook) Pixel | `fbq` | `connect.facebook.net` |
| TikTok | `ttq` | `analytics.tiktok.com`, `analytics-ipv6.tiktokw.us` |
| Pinterest | `pintrk` | `ct.pinterest.com`, `s.pinimg.com` |
| Reddit | `rdt` | `alb.reddit.com`, `pixel-config.reddit.com`, `redditstatic.com` |
| Microsoft / Bing UET | `uetq` | `bat.bing.com`, `bat.bing.net` |
| The Trade Desk | — | `js.adsrvr.org`, `insight.adsrvr.org`, `match.adsrvr.org` |

## Experience / CRO / Voice-of-Customer

- **Quantum Metric** (session replay/analytics): `ingest.quantummetric.com`, `cdn.quantummetric.com`.
- **ContentSquare** (experience analytics): `_uxa` global.
- **ZineOne** (real-time in-session personalization): `cloud3.zineone.com`, `cdn.zineone.com`.
- **Confirmit / Verint** (VoC survey): `digitalfeedback.us.confirmit.com`.
- `colrep.sitelabweb.com`, `geows.sitelabweb.com`, `session.sitelabweb.com` — geo/collector service (**verify vendor**).
- `crcldu.com`, `gs.wandzcdn.com` / `cfs.wandzapi.com`, `client.wra-api.net` — ad/affiliate or media services (**verify**).

## Customer engagement

- **NICE CXone / inContact** — `web-modules-de-na1.niceincontact.com`, `channels-de-na1.niceincontact.com`, `app-de-na1.niceincontact.com`, `services-public-de-na1.niceincontact.com`. Powers **Live Chat** + the **online vision exam** web modules.

## Consent / privacy

- Cookie/consent banner present on all pages (see `stardust/current/assets/screenshots/index.png`) — OneTrust-class CMP. `/ad-choices` page present. GDPR/CCPA posture.

## Migration guidance

The entire tag stack is orchestrated through **Adobe Launch (DTM)**. For EDS, port the **single Launch embed** into the page `<head>` (EDS `head.html`/`scripts.js`); GA4, Meta, TikTok, Pinterest, Reddit, Bing, Trade Desk, Quantum Metric, ContentSquare, and Target that are managed inside Launch migrate as one unit. Keep the AEP Web SDK first-party CNAME (`analytics.1800contacts.com`). Re-wire ButterCMS content into Document Authoring, and keep commerce/Rx/exam/chat as API/app integrations behind EDS blocks.

**Vendors to confirm with the client:** review platform (reviews render but vendor not exposed on captured pages — likely first-party or PowerReviews/Bazaarvoice), and `sitelabweb.com` / `crcldu.com` / `wandz*` services.
