# Design QA

## Evidence

- Source visual truth: user-supplied landing reference from 27 August 2026; the local source file is excluded from the public repository.
- Source dimensions: 1448 × 1086 px
- Browser-rendered implementation: `C:\ChallanNyay\DESIGN\qa-v3\implementation-desktop-final.png`
- Implementation screenshot dimensions: 1265 × 712 px
- Browser viewport: 1280 × 720 CSS px at device pixel ratio 1.25
- Density normalization: source resized to 1265 × 948 px and top-cropped to 1265 × 712 px; implementation capture used at native returned size.
- Same-frame comparison: `C:\ChallanNyay\DESIGN\qa-v3\comparison-landing-final.png`
- Responsive evidence: `C:\ChallanNyay\DESIGN\qa-v3\implementation-mobile-v2.png`, `implementation-mobile-lower-v2.png`, and `implementation-mobile-footer-v2.png`
- State: signed-out public landing page with vehicle-number lookup selected and no personal data entered.

## Full-view comparison

The reference and implementation were placed together in one 2530 × 712 px comparison image. Both use a white navigation shell, two-line purpose-led hero, pale blue road scene, prominent three-mode lookup, restrained navy palette and a small warm action accent. Challan Nyay intentionally replaces the reference's official identity, flag, ministry marks and endorsement language with an independent-prototype identity and explicit synthetic-data disclosure.

## Focused-region comparison

The combined image is an above-the-fold crop where the navigation, hero typography, illustration, tabs, input and primary search action remain readable at original size. A separate focused crop was not needed. The 390 × 844 responsive captures were reviewed separately because the source did not provide a mobile target.

## Required fidelity surfaces

- Fonts and typography: Manrope/DM Sans hierarchy is close in weight and clarity to the reference. The final two-line heading no longer dominates the lookup. Small utility and disclosure text remains readable and secondary.
- Spacing and layout rhythm: the final hero moves the lookup above the fold, preserves generous air, and keeps service cards and trust information on a consistent grid. Mobile reflows without horizontal overflow.
- Colors and tokens: navy, pale blue and white match the reference's high-trust balance. Orange is limited to the primary search action; semantic green remains limited to safety/success content.
- Image quality and asset fidelity: the original generated road illustration fits the intended crop on desktop and mobile. No official logos, flags, readable plates, CSS drawings or placeholder imagery are used.
- Copy and content: the purpose, lookup choices and next-step services are concise and citizen-oriented. Prototype and synthetic-data limitations are more explicit than the reference by design.

## Comparison history

### Iteration 1

- [P2] The first implementation rendered the hero heading over three large lines, pushing the lookup too low compared with the reference.
- Fix: reduced the heading scale, increased the safe copy width, tightened hero padding and reduced the copy-to-lookup gap.
- Post-fix evidence: `implementation-desktop-final.png` and `comparison-landing-final.png` show a balanced two-line heading with the lookup field and action visible above the fold.

### Final pass

- No actionable P0, P1 or P2 visual findings remain.
- Intentional differences accepted: independent branding, permanent prototype disclaimer, accessible text-readable human check, no chatbot and no official programme marks.

## Browser checks

- Tested: demo-detail prefill, English/Hindi switching, navigation scroll, reviewer-demo entry, citizen-home return, desktop rendering, 390 px mobile landing, mobile service cards and mobile trust/footer layout.
- Lookup submission was not completed in the browser because the visible human check requires explicit user confirmation before solving. Server challenge validation and the complete citizen/reviewer state loop are covered by the API test suite.
- Console warnings/errors: none in the final browser pass.
- Horizontal overflow: none at the 390 px responsive viewport.

## Follow-up polish

- [P3] Complete reviewed translations for the case and reviewer surfaces after the entry-flow pilot.
- [P3] Consider a bounded chatbot only after shortlisting and only if it improves a tested task without replacing the plain-language flow.

## User-directed polish pass — 27 August 2026

- Reported evidence: user-supplied implementation screenshot from 27 August 2026; the temporary source file is excluded from the public repository.
- Final wide implementation: `C:\ChallanNyay\DESIGN\qa-v4-desktop-final.png` at 1885 × 943 px from a 1900 × 950 CSS viewport.
- Final mobile implementation: `C:\ChallanNyay\DESIGN\qa-v4-mobile-final.png` at 375 × 811 px from a 390 × 844 CSS viewport.

Findings and fixes:

- [P1] The text-size control used CSS `zoom` on the entire application, enlarging fixed-width containers and producing the off-centre, edge-heavy layout visible in the reported screenshot. Replaced whole-layout zoom with inherited base-text scaling.
- [P2] The road illustration was absolutely positioned inside the constrained content shell, so its visual crop stopped at the shell boundary. Moved the image to the full-width hero surface while keeping copy and controls on the content grid.
- [P1] Demo lookup was technically supported but undiscoverable: changing tabs cleared the valid identifier and the text-only helper was easy to miss. The default vehicle identifier is now prefilled, every tab inserts its matching identifier, and a visible demo-ready status explains the next action.
- [P2] The hero and lookup were larger and denser than the selected reference. Reduced headline scale, tightened vertical spacing, shortened the human-check copy, compressed the privacy message and aligned the primary action with the reference navy.

Verification:

- Wide and 390 px mobile layouts have no horizontal overflow.
- Tab switching verified `TS09CD5678` for Vehicle number and `DL-DEMO-2026` for Driving licence.
- Human-check challenge loads from the API and the primary button enables after the challenge arrives.
- Enlarged text no longer changes container positions or widths.
- Final web build, seven API tests and four Sites packaging tests passed.

final result: passed
