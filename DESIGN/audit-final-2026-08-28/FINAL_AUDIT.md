# Challan Nyay final submission audit

Date: 28 August 2026

## Verdict

Challan Nyay is a credible end-to-end civic-service prototype, not merely a visual redesign. The main wrong-vehicle journey connects citizen lookup, evidence, location, grievance submission, reviewer handling, reasoned outcome, audit history and payment records. It is strong enough to present for the top-250 review after the priority defects below are corrected. It is not ready to freeze unchanged for a top-10-quality submission.

## Scores

| Lens | Score | Verdict |
|---|---:|---|
| Architecture and service pipeline | 8.2/10 | Strong modular-monolith concept and real API-backed loop; implementation is appropriately mocked but some secondary fixtures break evidence consistency. |
| Citizen experience | 8.0/10 | Clear entry, optional account, multi-vehicle dashboard, filters, evidence, grievance and tracking; navigation scroll and partial localization need attention. |
| Visual design and accessibility | 7.4/10 | Calm, distinctive and coherent in the normal theme; high-contrast mode has a visible contrast failure on the most important landing card. |

## Captured flow

1. Landing and protected lookup — healthy. The purpose, demo identifier and primary action are immediately visible.
2. High-contrast mode — needs correction. Dark navy copy remains on the dark lookup card and the selected tab loses readable contrast.
3. Optional account entry — healthy. The prototype boundary and synthetic OTP are explicit.
4. Multi-vehicle dashboard — healthy. Vehicles, active notices, grievance progress and payment history form a convincing account experience.
5. My challans — healthy. Six citizen cases are filterable and use meaningful status-specific actions.
6. Case detail — strong with one navigation issue. Original evidence, plate crop, map, mismatch comparison, deadline and next owner are present; entering the screen can retain the previous scroll position.
7. Grievance builder — healthy. Reasons, evidence packet, statement, declaration and selected-case context are clear.
8. Grievance tracking — needs data correction. The seeded Mumbai officer-upload case displays Hyderabad coordinates and a fixed-camera/red-motorcycle explanation.
9. Reviewer loop — healthy for a transparent demo. The queue, evidence comparison and reasoned human decision are visible and API backed.
10. Services and accessibility controls — mostly healthy. Services, focus indication, text-size controls and preference persistence work; the language selector is an entry-flow pilot rather than complete localization.

## Priority before submission

1. Fix the high-contrast lookup card and verify every core screen at keyboard focus and 200% browser zoom.
2. Make every secondary case's coordinates, capture source, plate crop, detected vehicle and explanation internally consistent.
3. Reset scroll position or move focus to the new page heading after SPA navigation.
4. Align the submission checklist with the live two-minute video rule, then complete public-link and signed-out checks.

## Innovation decision

Do not add a chatbot before the deadline. The differentiated innovation is already the evidence-to-resolution chain: source-labelled evidence, derived plate lineage, location context, deterministic mismatch explanation, jurisdiction routing, accountable owner, reasoned decision and trackable receipt. Make that chain flawless and make it the first minute of the demo. Pending-payment reconciliation is the best second-round feature.

## Verification evidence

- API tests: 7/7 passed.
- Static hosting tests: 4/4 passed.
- Production web build completed successfully.
- No browser console errors were observed during the audited path.
- Audit screenshots were retained locally as `01-landing.png` through `12-services.png`; internal visual-iteration captures are intentionally excluded from the public repository.

## Evidence limits

This audit does not claim WCAG 2.2 AA conformance. Formal axe, NVDA/screen-reader, 200% zoom, slow-network, deployment, HTTPS and signed-out public-link checks remain separate acceptance work.

## Post-audit resolution addendum

The submission-critical defects above were corrected and rechecked on 28 August 2026:

- The landing lookup now has explicit high-contrast states for headings, helper copy, values, tabs, demo status and the safety notice. The safety icon is aligned with the first line of its copy.
- Seeded cases now carry city-specific coordinates. Map bounds are calculated around the current case instead of a Hyderabad constant.
- Capture-source wording, detected and registered vehicle descriptions, plate metadata and mismatch language are derived from the selected case. Historical records without a retained image disclose that limitation instead of displaying unrelated visual evidence.
- Top-level SPA navigation and case changes reset the document to the top.
- The delivery checklist now uses the official two-minute video limit.
- A prototype favicon removes the prior missing-resource console error.

### Post-fix verification

- API tests: 7/7 passed, including portfolio evidence and coordinate consistency.
- Static hosting tests: 4/4 passed.
- Production web build: passed.
- Clean mobile browser session: zero console errors and zero warnings.
- Desktop checks: normal landing, high contrast, complete showcase evidence, Mumbai officer-upload review, paid historical record and navigation scroll reset all passed.
- Browser evidence: `output/playwright/normal-landing.png`, `high-contrast-landing.png`, `showcase-case.png`, `mumbai-review-case.png`, `paid-history-case.png` and `mobile-landing.png`.

The remaining work is release work rather than product repair: deploy to a public HTTPS URL, repeat signed-out testing on that build, record the two-minute walkthrough and assemble the final submission text.
