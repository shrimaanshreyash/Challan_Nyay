# Third-party notices register

Record exact versions, licences, source URLs, and modification notes before release. Do not ship an item whose licence is blank or unclear.

| Item | Category | Intended use | Source | Licence | Version/status | Action |
|---|---|---|---|---|---|---|
| React + React DOM | Library | UI | https://react.dev/ | MIT | 19.2.0 installed | Include licence in release bundle |
| Vite | Build tool | Web application | https://vite.dev/ | MIT | 6.4.2 installed | Include licence in release bundle |
| @vitejs/plugin-react | Build plugin | React transform | https://github.com/vitejs/vite-plugin-react | MIT | 5.0.4 installed | Include licence in release bundle |
| Fastify | Framework | API | https://fastify.dev/ | MIT | 5.6.1 installed | Include licence in release bundle |
| Phosphor Icons for React | Icons | Interface icons | https://phosphoricons.com/ | MIT | 2.1.10 installed | Include licence in release bundle |
| Node.js built-in SQLite | Database | Local demo persistence | https://nodejs.org/api/sqlite.html | Node.js licence | Node 22.18.0 experimental API | Replace with PostgreSQL for production |
| PostgreSQL | Database | Persistence | https://www.postgresql.org/ | PostgreSQL Licence | Planned | Record server version |
| OpenTelemetry | Observability | Server traces/metrics | https://opentelemetry.io/ | Apache-2.0 | Planned | Record packages/versions |
| DM Sans | Font | Latin interface | https://fonts.google.com/specimen/DM+Sans | SIL OFL 1.1 | Google Fonts hosted import | Self-host for production resilience |
| Manrope | Font | Headings | https://fonts.google.com/specimen/Manrope | SIL OFL 1.1 | Google Fonts hosted import | Self-host for production resilience |
| Noto Sans families | Fonts | Indian scripts | https://fonts.google.com/noto | SIL OFL 1.1 | Candidate | List exact families/subsets |
| OpenAI API | Hosted service | Optional AI assist | https://platform.openai.com/ | Service terms | Planned | Record model/config and data review |
| GOV.UK Design System | Reference | Pattern inspiration only | https://design-system.service.gov.uk/ | Crown copyright / documented terms | Reference only | Do not copy brand/assets |
| UX4G/GIGW | Reference | Indian public-service guidance | https://www.ux4g.gov.in/ | Verify per asset/document | Reference only | Cite; do not imply adoption/endorsement |
| OpenStreetMap | Map data/rendering | Embedded event-location map and external map link | https://www.openstreetmap.org/copyright | ODbL data; map tiles subject to OSM tile policy | Live attributed embed | Keep attribution visible; replace with contracted provider for production scale |

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
| `DESIGN/references/selected-option-1-civic-precision.png` | Selected design target | OpenAI image generation | 2026-08-22 | `D3E97EBDEDF7B08453C9B1003B7F0467F525DAC7E7E73EC2BDC1E71189FAE34B` | Design reference only; no government logo or emblem |
| `apps/web/public/assets/challan-nyay-road-hero-v2.png` | Public-entry road illustration | OpenAI image generation | 2026-08-27 | `881F9898DDD2FE54B8B0D8F89B72168F7745A68871DCD671C05332347EBE0AB0` | Original synthetic illustration generated from art direction; no government logo, emblem, flag, official building, readable plate or real person; no source reference artwork is shipped |
| `apps/web/public/assets/synthetic-number-plate-v1.png` | Derived plate-evidence crop | OpenAI image generation | 2026-08-27 | `43960E6ABE80D6AD322265726B515244C64F8E07CA24569D607EB56F139BCB7F` | Fully synthetic plate `TS09 AB 1234`; no real citizen data, government marks or source document; captioned synthetic in the case view |

## Competition disclosure draft

> Built with OpenAI Codex. The application uses open-source web libraries listed in the project notices. Any AI-assisted extraction in the demo runs on fictional documents and is advisory; all decisions are made by a human reviewer. Government, court, payment, identity, and notification integrations are mocked.
