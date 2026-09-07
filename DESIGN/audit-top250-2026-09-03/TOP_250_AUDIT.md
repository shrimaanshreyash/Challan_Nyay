# Challan Nyay — Top 250 product audit

Date: 3 September 2026  
Surface audited: deployed citizen, account, dispute, evidence, and reviewer journeys  
Accessibility target: WCAG 2.2 AA-oriented primary path; screenshots alone do not prove compliance

## Overall verdict

Challan Nyay already has a credible top-10 wedge: an evidence-first, citizen-to-human-review resolution loop for a wrong-vehicle challan. The strongest screens make the mismatch, current owner, and next action unusually clear. The main top-10 risks are structural rather than decorative: the deployed database is process-local and ephemeral, the public reviewer surface has no session boundary, the primary assets total roughly 6.9 MB, and the 390 px header navigation clips. Several documented capabilities—draft recovery, uploads, information requests, authorization, full-flow localization, and payment reconciliation—are not implemented.

## Captured flow

1. **Landing and lookup — healthy on desktop, needs mobile tightening.**
   - Evidence: `01-landing.png`, `09-mobile-landing.png`
   - Strengths: clear purpose, vehicle-first entry, visible synthetic identifier, accessible human check, restrained trust language.
   - Risks: mobile header consumes substantial height and clips the last navigation item; lookup begins below the first mobile viewport.

2. **Case summary — strong.**
   - Evidence: `02-case-evidence.png`
   - Strengths: status, amount, authority, deadline, and plain-language mismatch are visible without hunting.
   - Risk: the amount card remains visually prominent even when the product asks the citizen to understand before paying.

3. **Evidence comparison — standout, with delivery-cost risk.**
   - Evidence: `03-evidence-comparison.png`
   - Strengths: original frame, derived plate crop, map, capture source, and registered/detected vehicle comparison form a coherent evidence chain.
   - Risks: original PNG assets are about 1.7 MB, 3.0 MB, and 2.1 MB; map attribution is visually dense; slow-network behavior is unproven.

4. **Guided dispute — clear but shallow.**
   - Evidence: `04-guided-dispute.png`
   - Strengths: structured grounds, prefilled factual statement, selected-case context, and explicit synthetic declaration.
   - Risks: the progress bar is mostly presentational; there is no recoverable draft, synthetic evidence selection/upload, or information-request response; the submit action falls below the initial viewport.

5. **Reviewer decision — credible concept, insufficient control.**
   - Evidence: `05-reviewer-desk.png`
   - Strengths: same evidence reaches the reviewer and decisions route back into the case lifecycle.
   - Risks: reviewer access is public, the reason is effectively predetermined, and there is no explicit evidence-considered confirmation, assignment, or concurrency state.

6. **Account entry — understandable, but exposes incompleteness.**
   - Evidence: `06-demo-account-entry.png`
   - Strengths: synthetic-only identity is clear and no real SMS or number is used.
   - Risks: “Future architecture” foregrounds what is absent; “Continue as guest” simply closes the dialog and can feel like no action occurred.

7. **Multi-vehicle dashboard — strong.**
   - Evidence: `07-account-dashboard.png`, `08-mobile-dashboard.png`
   - Strengths: two account profiles, multiple vehicles, six challans, grievance progress, payments, and clear summary counts make the service feel broader than one fixture.
   - Risks: mobile navigation is clipped; the utility/header stack is tall; responsive and 200% zoom behavior still need automated and manual verification.

## Accessibility evidence limits

The captured DOM shows semantic headings, labels, landmarks, alert regions, keyboard-oriented controls, text resizing, contrast controls, and a reduced-motion stylesheet. This audit did not establish screen-reader announcements, logical focus restoration after dialogs, 200% zoom success, forced-colours behavior, contrast ratios, or a complete keyboard-only journey. The external map contains a provider-generated untranslated marker label that Challan Nyay does not control.

## Highest-impact recommendations

1. Replace process-local production state with a durable, session-isolated demo store before adding features.
2. Fix mobile navigation/header reflow and optimize/lazy-load all imagery before further visual polish.
3. Deepen the wrong-vehicle resolution loop: recoverable dispute draft, safe synthetic evidence attachment, bounded information request, and explicit reasoned decision form.
4. Make one complete Hindi or Telugu primary path work end to end, and add a real low-data mode.
5. Keep any AI narrowly evidence-grounded and optional. Do not add a generic chatbot.

