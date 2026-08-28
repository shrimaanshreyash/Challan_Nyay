# Design QA — 28 August 2026 submission pass

final result: passed

## Source and comparison evidence

- User-approved landing, challan-list, detail, complaint and dashboard references were supplied on 27 August 2026. Their local source files are intentionally excluded from the public repository.
- Baseline accessibility capture: DESIGN/audit-submission-2026-08-28/baseline-accessibility.png
- Final responsive landing capture: DESIGN/audit-submission-2026-08-28/landing-responsive.png
- Final Services capture: DESIGN/audit-submission-2026-08-28/services-responsive.png
- Final high-contrast capture: DESIGN/audit-submission-2026-08-28/dashboard-high-contrast.png

The controlled in-app browser viewport was 550 × 742 at 1.25 DPR. The supplied references are desktop compositions, so the final comparison checked hierarchy, information architecture, component language and responsive behavior rather than pretending a pixel-identical viewport comparison.

## Baseline findings

| Severity | Finding | Evidence | Resolution |
| --- | --- | --- | --- |
| P1 | A+ changed the app container from 16 px to 17.28 px while the hero heading stayed 36 px and body copy stayed 16 px. | Computed-style baseline in controlled browser. | Added scaled heading, body, control and helper typography rules; verified heading changes from 32 px to 34.56 px. |
| P1 | High contrast applied a class but left the primary card white. | Baseline card background remained white. | Added full-surface dark tokens and final-specificity overrides; verified card changes to rgb(13, 20, 32) with white text. |
| P1 | Single-case account did not demonstrate the reference architecture. | Dashboard/list implementation review. | Added two accounts, five vehicles, nine challans, payments, decisions, receipts, status filters and account switching. |
| P1 | Reviewer was hard to reach and the queue hid all but the first task. | End-to-end browser journey. | Added a visible reviewer CTA after submission and a selectable multi-case reviewer queue. |
| P2 | Services existed only as landing cards, not as a persistent navigation destination. | Header audit. | Added a responsive Services navigation item and a six-service catalogue page. |
| P2 | Mobile header hid navigation and wrapped the account label awkwardly. | Responsive screenshot. | Added a horizontally scrollable compact navigation strip and icon-only account action at narrow widths. |
| P2 | Landing page ended without task-specific guidance. | Landing audit. | Added five concise, keyboard-native FAQ accordions grounded in the official e-Challan journey. |

## Final interaction checks

- Vehicle-first, challan-number and driving-licence lookup controls are present; the arithmetic human check remains intentionally user-completed.
- Create-account dialog opens, exposes the synthetic OTP, closes with Escape/button and does not collect a real number.
- Account switcher changes from Amit Rao (3 vehicles, 6 challans) to Neha Logistics (2 vehicles, 3 challans).
- Account and current section survive a page reload.
- My Challans renders all six citizen cases and supports vehicle and status filtering.
- Paid cases expose provider and receipt IDs; disputed cases expose receipt and five-stage progress.
- Complaint flow exposes six reasons, evidence context, declaration and a durable submission receipt.
- Submitted flagship case enters the reviewer queue; a human decision returns a reasoned order and completed timeline.
- Detail view renders the enforcement frame, derived plate crop and live OpenStreetMap embed.
- High contrast and A−/A/A+ are visible, persistent and materially affect the rendered system.
- Services, Home, My Challans, How it works and Help remain keyboard-operable at the responsive viewport.
- Reduced-motion CSS removes nonessential transition and animation duration.

## Engineering verification

- API test suite: 7/7 passed.
- Web production build and Sites artifact preparation: passed.
- API health and demo reset: passed.
- Browser-observed runtime navigation/form failures: none.
- External integrations remain explicitly mocked except the attributed OpenStreetMap embed.

## Open limitations (truthful, non-blocking for round one)

- No real government, VAHAN, state-RTA, court, payment, identity, OTP or notification integration.
- Full reviewed localization is not complete; the entry flow demonstrates English, Hindi and Telugu.
- The chatbot remains intentionally deferred.
- The application is locally hosted for the current review and has not been deployed by this pass.
