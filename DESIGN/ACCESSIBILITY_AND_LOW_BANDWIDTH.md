# Accessibility and low-bandwidth plan

## Standards

- Target WCAG 2.2 AA.
- Follow GIGW 3.0 and UX4G guidance where relevant to Indian public services.
- Component-library compliance is not product compliance; test the actual flows and content.

## Accessibility acceptance areas

### Structure and navigation

- semantic landmarks and one clear H1;
- skip links and logical heading order;
- current step and current navigation exposed programmatically;
- browser back preserves safe draft state;
- all functions operable by keyboard with visible, unobscured focus.

### Forms and errors

- persistent labels; hints and errors linked with accessible descriptions;
- top error summary moves focus and links to each invalid field;
- no placeholder-only labels;
- no CAPTCHA in the prototype; production identity must meet accessible-authentication requirements;
- timeouts warn users and preserve drafts;
- repeated values are reused or editable rather than demanded again.

### Visual and motor

- candidate colours verified at normal, hover, focus, disabled, and status states;
- no information conveyed by colour alone;
- minimum target size aligned with WCAG 2.2 criteria;
- layouts survive 200% zoom and 320 CSS-pixel width without two-dimensional scrolling, except necessary data tables/viewers;
- motion is non-essential and honors reduced-motion preferences.

### Screen readers and dynamic state

- status messages use appropriate live regions without excessive interruption;
- upload, save, submission, and timeline updates have announced text equivalents;
- evidence images have purposeful descriptions or are marked decorative;
- extracted text is accessible separately from the image viewer;
- PDFs/orders have an HTML equivalent in the prototype.

### Language and cognition

- authored source is plain English, then professionally reviewed translations;
- avoid unexplained acronyms, legalese, double negatives, and blame;
- dates use unambiguous day-month-year presentation and include relative time carefully;
- preserve identifiers across scripts; do not transliterate vehicle/challan numbers;
- users can review all answers before declaration.

## Initial language strategy

The demo should fully support English and Hindi, with the architecture and visual QA proving one additional long-script path. Future coverage is jurisdiction-prioritized. Translation is never delegated blindly to AI: model output is a draft, reviewed by a competent human, versioned, and testable.

## Low-bandwidth budgets

- Server-render the first useful case shell where safe.
- Target an initial compressed JavaScript budget below 200 KB for the citizen entry path; exceptions require a recorded decision.
- Lazy-load evidence viewers, reviewer analytics, and AI features.
- Serve responsive images and thumbnails; do not fetch original evidence until requested.
- Queue uploads individually, show progress, retry with backoff, and resume where supported.
- Autosave locally on each completed step and server-side after authenticated actions.
- Show last successful sync and an offline/read-only banner.
- Never block core case understanding on AI or analytics availability.

## Performance targets for the demo

- LCP at or below 2.5 seconds on a representative mid-range mobile/throttled profile.
- CLS at or below 0.1.
- INP at or below 200 ms where measurable.
- A usable text-first shell under offline/revisit conditions.
- No unbounded spinners; after a short threshold, show what is happening and a safe retry.

These are local acceptance targets, not production SLO claims.

## Test matrix

- keyboard-only completion of Flow A;
- NVDA + Firefox on Windows;
- 200% zoom and 320px viewport;
- Windows high-contrast/forced-colours mode;
- reduced motion;
- Hindi and one longer-script layout;
- slow network, dropped upload, browser refresh, and offline revisit;
- automated axe checks plus manual inspection.

References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [GOV.UK accessibility strategy](https://design-system.service.gov.uk/accessibility/accessibility-strategy/), [UX4G](https://www.ux4g.gov.in/), and [GIGW](https://guidelines.india.gov.in/).
