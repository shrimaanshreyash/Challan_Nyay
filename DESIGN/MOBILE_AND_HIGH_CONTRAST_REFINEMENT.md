# Mobile and high-contrast refinement

Recorded: 4 September 2026  
Evidence: three user-supplied mobile screenshots of the landing journey, default header and high-contrast landing state.

## Observed problems

1. The five-step journey is understandable but visually repetitive. Equal circles, a thin rail and similar text blocks make it feel like a wireframe rather than a finished service explanation.
2. The mobile utility area wraps the prototype disclosure, font controls, contrast control and language picker into a tall two-row bar. Together with the brand header, it delays the primary citizen task.
3. The default mobile page shows a permanent browser scrollbar, adding visual noise beside the already dense header.
4. High contrast is not one coherent theme. The utility/header and lookup switch to dark surfaces while parts of the hero retain dark navy text, producing low-visibility headings and abrupt white/black bands.
5. The lookup panel becomes visually heavier than the citizen task in high contrast because every nested surface receives a separate dark or yellow block.

Screenshot evidence can identify these hierarchy and contrast risks, but it cannot prove keyboard behavior, screen-reader output, zoom resilience or WCAG contrast ratios. Those require implementation testing.

## Required mobile header structure

- Keep a single compact disclosure line: `Independent prototype · synthetic data only` with the full statement available through an accessible information control.
- Keep the brand/navigation header to one row. The primary visible controls are identity, account and menu.
- Move font sizing, high contrast and language into one labelled `Accessibility and language` panel on narrow screens. Controls remain reachable in one tap and have at least 44 px targets.
- The panel must trap focus only while modal, close with Escape, restore focus to its trigger and expose current selections to assistive technology.
- At 320–430 px, the useful hero heading and lookup entry must not be pushed down by duplicated utility rows.

## Required journey redesign

- Preserve the five product steps—Find, Understand, Choose, Resolve and Track—but replace the identical circle stack with a more deliberate mobile sequence.
- Use one strong lead step and four compact connected rows/cards. Each step contains one icon, a short action title and one outcome sentence; decorative numbering must not compete with the action.
- Make the flow direction obvious through spacing and a continuous connector, while avoiding oversized empty gaps.
- Add one clear terminal outcome at the end: `Receipt and final order saved to your case`.
- The section must read naturally with CSS disabled and keep a logical heading order.

## Required high-contrast system

- Implement high contrast through semantic colour tokens for page, surface, elevated surface, text, muted text, border, focus, action, success, warning and selected state.
- Every component consumes those tokens; do not patch isolated selectors with unrelated black, white and yellow values.
- In high contrast, all hero headings, body text, links, tabs, fields, cards and status text must meet the intended contrast on their actual background.
- Avoid background seams through text: a heading and its containing section always share one continuous surface.
- Yellow is reserved for primary action, current selection and focus emphasis—not every container.
- Respect `forced-colors: active`, visible keyboard focus, `prefers-reduced-motion`, 200% zoom and text scaling.

## Scrollbar rule

- Hide the decorative scrollbar track/thumb in supported desktop and mobile browsers while preserving normal wheel, touch, keyboard, Page Up/Down, Home/End and assistive scrolling.
- Do not disable overflow or lock page scrolling. Modal scroll locking must be temporary and restored on close.
- Long panels need visible content boundaries or continuation cues so hiding the scrollbar does not make additional content undiscoverable.

## Verification matrix

- Widths: 320, 360, 390, 412, 768, 1024 and 1440 px.
- States: default, high contrast, 200% zoom, larger text, reduced motion and forced-colours emulation where available.
- Flows: landing → accessibility panel → lookup; journey section; account dashboard; challan list/detail; dispute form; citizen tracker; authority queue and case review.
- Checks: no horizontal overflow, no clipped controls, no text/background collision, no permanent visible scrollbar, visible focus, correct reading order and unchanged API-backed behavior.

