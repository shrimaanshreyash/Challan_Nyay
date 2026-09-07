# Third-party notices register

Record exact versions, licences, source URLs, and modification notes before release. Do not ship an item whose licence is blank or unclear.

| Item | Category | Intended use | Source | Licence | Version/status | Action |
|---|---|---|---|---|---|---|
| React + React DOM | Library | UI | https://react.dev/ | MIT | 19.2.0 installed | Include licence in release bundle |
| i18next | Library | Local translation resources, fallback and locale switching | https://www.i18next.com/ | MIT | 25.5.2 installed | All Hindi/Telugu copy is bundled locally; no hosted translation service receives page content |
| react-i18next | Library | React integration for i18next | https://react.i18next.com/ | MIT | 16.2.4 installed | Keep language state synchronized with the accessible site selector |
| pdf-lib | Library | Generate downloadable synthetic payment receipts as client-side PDF files | https://pdf-lib.js.org/ | MIT | 1.17.1 installed | Lazy-load only when a receipt is requested; PDF contains synthetic case data only |
| Vite | Build tool | Web application | https://vite.dev/ | MIT | 6.4.2 installed | Include licence in release bundle |
| @vitejs/plugin-react | Build plugin | React transform | https://github.com/vitejs/vite-plugin-react | MIT | 5.0.4 installed | Include licence in release bundle |
| Fastify | Framework | API | https://fastify.dev/ | MIT | 5.12.1 installed | Include licence in release bundle |
| Phosphor Icons for React | Icons | Interface icons | https://phosphoricons.com/ | MIT | 2.1.10 installed | Include licence in release bundle |
| Node.js built-in SQLite | Database | Local demo persistence | https://nodejs.org/api/sqlite.html | Node.js licence | Node 22.18.0 experimental API | Replace with PostgreSQL for production |
| PostgreSQL | Database | Deployment persistence | https://www.postgresql.org/ | PostgreSQL Licence | Adapter/migrations implemented; managed server pending | Record live server version after provisioning |
| OpenTelemetry | Observability | Server traces/metrics | https://opentelemetry.io/ | Apache-2.0 | Planned | Record packages/versions |
| DM Sans | Font | Latin interface | https://fonts.google.com/specimen/DM+Sans | SIL OFL 1.1 | Google Fonts hosted import | Self-host for production resilience |
| Manrope | Font | Headings | https://fonts.google.com/specimen/Manrope | SIL OFL 1.1 | Google Fonts hosted import | Self-host for production resilience |
| Noto Sans families | Fonts | Indian scripts | https://fonts.google.com/noto | SIL OFL 1.1 | Candidate | List exact families/subsets |
| OpenAI API | Hosted service | Optional AI assist | https://platform.openai.com/ | Service terms | Planned | Record model/config and data review |
| GOV.UK Design System | Reference | Pattern inspiration only | https://design-system.service.gov.uk/ | Crown copyright / documented terms | Reference only | Do not copy brand/assets |
| UX4G/GIGW | Reference | Indian public-service guidance | https://www.ux4g.gov.in/ | Verify per asset/document | Reference only | Cite; do not imply adoption/endorsement |
| OpenStreetMap | Map data/rendering | Embedded event-location map and external map link | https://www.openstreetmap.org/copyright | ODbL data; map tiles subject to OSM tile policy | Live attributed embed | Keep attribution visible; replace with contracted provider for production scale |
| node-postgres (`pg`) | Database driver | Managed PostgreSQL repository and transaction pooling | https://node-postgres.com/ | MIT | Implemented, production connection pending | Pinned to 8.23.0; credentials remain environment-only |
| Playwright Test | Browser testing | Real citizen/authority lifecycle and mobile regressions | https://playwright.dev/ | Apache-2.0 | 1.63.0 installed | Test-only dependency; retain failure traces outside the release bundle |
| axe-core Playwright | Automated accessibility testing | Serious/critical rule checks on representative citizen and authority screens | https://github.com/dequelabs/axe-core-npm | MPL-2.0 | 4.13.0 installed | Test-only; automated checks supplement manual keyboard and assistive-technology review |
| Meta WhatsApp Cloud API | Hosted messaging service | Future live transport for the implemented English/Hindi channel contract | https://developers.facebook.com/docs/whatsapp/cloud-api/ | Meta platform terms | Signed local fixtures only; no access token or test number connected | Verify business eligibility, templates, delivery receipts, retention and payment capability before any live claim |

## Asset-generation register

For each generated synthetic challan, vehicle image, document, illustration, or mock:

- filename and hash;
- creator/tool/model;
- date and prompt/brief reference;
- input-source confirmation (no real personal document);
- output usage terms checked;
- modifications;
- visible synthetic watermark status.

| Filename | Purpose | Creator/tool | Date | SHA-256 | Safety/modification note |
|---|---|---|---|---|---|
| `apps/web/public/assets/synthetic-enforcement-frame.png` | Demo enforcement evidence | OpenAI image generation | 2026-08-22 | `037712C3B97DDAD67294A897536CC19716591FA8D31D7B7CF0373B6565407D97` | Fully synthetic; no real document/person/plate; displayed with an explicit synthetic caption |
| `apps/web/public/assets/synthetic-enforcement-frame-preview.webp` | Derived browser evidence preview | Local FFmpeg conversion from the retained synthetic original | 2026-09-05 | `F11B35FE64E15DA730B4BDA8575A10976A4EDEA9E34F330B9D0716974B84E427` | Delivery rendition only; passport links it to the immutable-original PNG and low-data mode defers it by default |
| `DESIGN/references/selected-option-1-civic-precision.png` | Selected design target | OpenAI image generation | 2026-08-22 | `D3E97EBDEDF7B08453C9B1003B7F0467F525DAC7E7E73EC2BDC1E71189FAE34B` | Design reference only; no government logo or emblem |
| `apps/web/public/assets/challan-nyay-road-hero-v2.png` | Public-entry road illustration | OpenAI image generation | 2026-08-27 | `881F9898DDD2FE54B8B0D8F89B72168F7745A68871DCD671C05332347EBE0AB0` | Original synthetic illustration generated from art direction; no government logo, emblem, flag, official building, readable plate or real person; no source reference artwork is shipped |
| `apps/web/public/assets/challan-nyay-road-hero-v2.webp` | Optimized public-entry illustration | Local FFmpeg conversion from the generated PNG | 2026-09-05 | `F5779B67FCA8D4DD9AAB6C9B0AF20CD8FF1A5C7C50369F68B82DD70DEDE143F7` | Browser delivery rendition; low-data mode omits it and keeps the lookup fully usable |
| `apps/web/public/assets/synthetic-number-plate-v1.png` | Derived plate-evidence crop | OpenAI image generation | 2026-08-27 | `43960E6ABE80D6AD322265726B515244C64F8E07CA24569D607EB56F139BCB7F` | Fully synthetic plate `TS09 AB 1234`; no real citizen data, government marks or source document; captioned synthetic in the case view |
| `apps/web/public/assets/synthetic-number-plate-v2.jpg` | Flagship plate crop | OpenAI image generation and local optimization | 2026-09-03 | `DE83C181D2CA8940A1E3364056AACE9E53FAE250AE721C118D2450026E3E6B79` | Synthetic `TS09 CD 5678`; same-plate body-mismatch demo; no real citizen data or marks |
| `apps/web/public/assets/vehicles/registered-motorcycle-red.png` | Authorized vehicle thumbnail | OpenAI image generation and transparent resize | 2026-09-03 | `47A31515C5DD29BD5F74AB2465ED29C4ABDA2538B11C4895A7CE5079654B82AC` | Synthetic catalog asset; no person, logo, readable plate or source artwork |
| `apps/web/public/assets/vehicles/registered-hatchback-silver.png` | Authorized vehicle thumbnail | OpenAI image generation and transparent resize | 2026-09-03 | `F4CF443E84A6120BB186663E2948C16B95927B65B9C43BF2204364C1830BC524` | Synthetic catalog asset; no person, logo, readable plate or source artwork |
| `apps/web/public/assets/vehicles/registered-sedan-blue.png` | Authorized vehicle thumbnail | OpenAI image generation and transparent resize | 2026-09-03 | `CEBF0EECA1B7D1754F67EB28E48C3943B563FC3E11A632165D769199CB43D9B3` | Synthetic catalog asset; no person, logo, readable plate or source artwork |
| `apps/web/public/assets/vehicles/registered-fleet-sedan-white.png` | Authorized fleet thumbnail | OpenAI image generation and transparent resize | 2026-09-03 | `88A3A2999DFC5C358A6C2DAA6AF2B8A255BAD1A3578E3F50AF62DCC7F9683DFA` | Synthetic catalog asset; no person, logo, readable plate or source artwork |
| `apps/web/public/assets/vehicles/registered-delivery-van-white.png` | Authorized fleet thumbnail | OpenAI image generation and transparent resize | 2026-09-03 | `ED28009860FC30AC50624E3CC30132BEC564D04114B3C55B677A148AB5EF2DEE` | Synthetic catalog asset; no person, logo, readable plate or source artwork |
| `apps/web/public/assets/vehicles/detected-scooter-black.png` | Observed vehicle thumbnail | OpenAI image generation and transparent resize | 2026-09-03 | `57A16BDB024A8A0D9E8A67233C765110747AD8F95E5F8E8ADD0F484706EC105C` | Synthetic catalog asset; no person, logo, readable plate or source artwork |
| `apps/web/public/assets/evidence/guest-vehicle-speed-camera-v1.webp` | Guest vehicle-lookup enforcement frame | OpenAI image generation and local WebP conversion | 2026-09-07 | `D8ACF603DA65A27AD8A3BD524BB9F73A7735884E00848A708B8D9FE6D913E5A7` | Fully synthetic fixed-camera scene; no real person, incident, government mark or source artwork; visibly labelled synthetic in the case view |
| `apps/web/public/assets/evidence/guest-vehicle-plate-v1.webp` | Guest vehicle-lookup derived plate crop | OpenAI image generation and local WebP conversion | 2026-09-07 | `C6A3324D179B90418231407D21A0011596899A685D556DA10967923BDF249E6D` | Fully synthetic plate `UP16NX2041`; no real citizen data or source document; presented as a derived synthetic crop |

## Competition disclosure draft

> Built with OpenAI Codex. The application uses open-source web libraries listed in the project notices. Any AI-assisted extraction in the demo runs on fictional documents and is advisory; all decisions are made by a human reviewer. Government, court, payment, identity, and notification integrations are mocked.
