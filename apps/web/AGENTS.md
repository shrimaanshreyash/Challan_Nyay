# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Challan Nyay decisions

- The public-entry visual anchor is the user-supplied landing reference from 27 August 2026; the other four supplied references guide challan list, case detail and dispute-flow density. Local reference files are intentionally excluded from the public repository.
- Match the reference hierarchy and calm high-trust feel, but replace every official emblem, flag, ministry mark, Digital India mark, endorsement claim and chatbot element with the independent Challan Nyay identity.
- Use the original generated road illustration at `public/assets/challan-nyay-road-hero-v2.png`; do not reuse or crop artwork from the reference.
- Preserve a restrained navy, pale-blue and white system with one warm action accent. Keep the landing airy and operational screens information-dense but understandable.
- The user rejected the earlier option 2 and found option 3 too dense. The previous Civic Precision target remains useful for case hierarchy, not as the public landing-page source of truth.
- Chatbot integration is explicitly deferred to a second round. Do not add a floating assistant, fake chatbot or chatbot placeholder to the current UI.
- Citizen entry has two modes: vehicle-first guest lookup, and an optional synthetic mobile-OTP account that groups every vehicle the citizen is authorized to manage. Challan number is the second lookup option and driving licence is third.
- A future account is an identity/session layer over official registry adapters; it must not become a shadow copy of VAHAN or state-RTA ownership records.
- Enforcement evidence must distinguish fixed-camera capture from officer-mobile upload and preserve the original frame, a derived plate crop, capture coordinates, timestamp, source, and integrity metadata.
- Location is rendered through an attributed map integration with a low-bandwidth external link. Do not substitute a generated map illustration for an operational map.
- Colours may be refined, but must remain accessible and must not imitate official Indian government branding.
- The backend resolution loop is the product proof. Never replace API-backed case, contest, review, decision, or audit behavior with static fixtures in the UI.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
