# Design-system direction

## Status

This is art direction, not a selected visual target. Before UI code begins, generate exactly three distinct visual options and select one. The recommended starting direction is **Civic Precision**.

## Experience character

- calm, trustworthy, contemporary, and legible;
- civic without imitating an official masthead;
- serious about evidence and deadlines without feeling punitive;
- dense enough for casework, but progressively disclosed for citizens;
- designed primarily for narrow Android screens, then desktop reviewer workspaces.

## Three options for the visual-selection round

### A. Civic Precision — recommended

Deep ink/navy structure, clear cobalt action, warm white surfaces, restrained status colours, crisp dividers, and timeline-led case pages. Inspired by GOV.UK's hierarchy and NYC's complete lifecycle, localized through UX4G form/accessibility patterns.

### B. Calm Assistance

Softer teal-led guidance, warmer surfaces, larger explanatory blocks, and stronger step-by-step reassurance. Best for first-time or low-literacy users, but risks looking like a generic support product if not disciplined.

### C. Case Ledger

Monochrome-first, document-like surfaces, strong timestamps, receipt/order typography, and an operational ledger aesthetic. Best for auditability and reviewer density, but could feel intimidating on the citizen entry flow.

## Proposed token palette for option A

These are candidate tokens and must pass automated and human contrast review before selection.

| Role | Token | Candidate | Use |
|---|---|---:|---|
| Page ink | `ink-950` | `#111827` | Primary text |
| Trust surface | `navy-900` | `#172554` | Header and high-trust summary |
| Primary action | `cobalt-600` | `#3157D5` | Links, primary buttons, focus family |
| Primary hover | `cobalt-700` | `#2546B8` | Hover/pressed |
| Canvas | `stone-25` | `#FAFAF8` | Page background |
| Surface | `white` | `#FFFFFF` | Cards/forms |
| Muted text | `slate-600` | `#586174` | Secondary text after contrast check |
| Border | `slate-300` | `#CBD2DC` | Dividers and input borders |
| Success | `green-700` | `#157347` | Quashed/paid/complete, with icon+text |
| Warning | `amber-700` | `#9A5A00` | Deadline/needs action, with icon+text |
| Danger | `red-700` | `#B42318` | Error/rejected/expired, with icon+text |
| Advisory accent | `teal-700` | `#087E8B` | AI-assisted or informational blocks |

No saffron/green flag mimic, gradient-heavy fintech styling, neon AI glow, glassmorphism, or official emblemography.

## Typography

- Interface family: `Inter` or a high-quality system sans for Latin; bundle only under a compatible licence.
- Indian scripts: `Noto Sans` script families selected per supported language and subset to control payload.
- Numbers and identifiers use tabular figures where available.
- Case numbers are selectable text, never embedded in imagery.
- Minimum body size target: 16px equivalent; critical legal/deadline text not below 14px equivalent.

## Form and layout rules

- One primary question or decision per citizen step.
- Maximum readable content width around 42–48rem; reviewer layouts may use wider grids.
- Labels above fields; hints before input; errors linked to fields and summarized at top.
- Primary action left-aligned in the reading flow; back is a text link, not an equal-weight button.
- Persistent mobile case summary contains status, days remaining, and save state—not a crowded navigation bar.
- Cards indicate distinct information groups, not every paragraph.
- Status chips always include text and cannot be the only representation of state.

## Components required

- independent-prototype banner;
- jurisdiction/coverage badge with explanation;
- case status and next-action panel;
- deadline clock with source details;
- allegation/evidence comparison;
- ground selector with eligibility/evidence preview;
- upload queue with resume and scan states;
- AI-assisted extraction review with confidence and source;
- completeness checklist;
- declaration and submission receipt;
- case timeline and state ladder;
- reasoned decision/order panel;
- reviewer queue table/list and SLA filters;
- evidence viewer and version comparison;
- request-for-information composer;
- decision confirmation with irreversible-action warning.

## Asset and icon policy

- Use a mature icon library such as Lucide under its published licence; record the version.
- No emoji as interface icons.
- No handcrafted or approximate government emblems.
- Use real synthetic document/image fixtures designed for the demo; never copy a citizen's real challan.
- Any generated image is registered with prompt/tool/source metadata in third-party notices.

## Visual-selection acceptance

The chosen option must show at least: mobile case overview, mobile contest step, desktop reviewer case, decision timeline, error state, and low-bandwidth state. Evaluate hierarchy, trust, distinctiveness, long-language resilience, contrast, and demo readability before implementation.

