# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Citizens and vehicle operators across India who need to find, understand, pay, contest or track a traffic challan, including people using low-cost mobile devices, slow connections, assisted-service centres or languages other than English.
- Traffic and transport reviewers who must triage high-volume jurisdiction queues, inspect complete evidence packets, request missing information and record accountable decisions.
- Supervisors who need queue, ownership and SLA visibility without turning operational measures into employee scoring.

## Product Purpose

Challan Nyay is an independent public-service prototype that turns a fragmented challan experience into one traceable path from discovery to resolution. Success means a citizen can understand what happened, supply the right evidence once, reach the correct route and always know the current owner, target date and next action.

## Positioning

The product demonstrates the difficult middle and back office rather than only redesigning a government homepage: jurisdiction-aware routing, issue-specific evidence, shared citizen-authority workflow events, concurrency-safe ownership, reasoned human decisions and a citizen-readable audit trail.

## Operating Context

- Citizen lookup can start with a vehicle number, challan number or driving licence; account users can manage multiple registered vehicles.
- Evidence may originate from a fixed enforcement camera or an officer mobile capture and can include the enforcement frame, a cropped plate, capture metadata and a real map location.
- A case may move through submission, acknowledgement, assignment, review, an information request, response, decision and closure.
- Authority operations are jurisdiction-scoped and designed around queues, bounded batches, assignment leases, SLA risk and concurrent reviewers.
- The first public demonstration uses synthetic records and mock authentication only.

## Capabilities and Constraints

- No real government, court, Aadhaar, OTP, banking, messaging or enforcement API is connected in the hackathon prototype.
- AI may assist extraction or explanation but cannot determine liability, issue a decision, choose a payment or mutate a case without an explicit user or reviewer action.
- Vercel functions are treated as stateless; durable production operation requires the managed PostgreSQL repository and deployment secrets. Local development uses the repository-compatible SQLite implementation.
- Mutations are role-checked, idempotent, version-checked and audit-appended.
- English, Hindi and Telugu are the current website scope. Additional language expansion and an on-site chatbot are deliberately deferred; a deterministic English/Hindi WhatsApp channel is planned after the core web phases.

## Brand Commitments

- Name: Challan Nyay.
- Voice: calm, plain, respectful and action-oriented; explain before asking.
- Identity: restrained civic blue, clear status colours, authored road and vehicle imagery, and familiar service controls without pretending to be an official government site.
- Every public surface must state that this is an independent prototype using synthetic data.

## Evidence on Hand

- Complete synthetic citizen, vehicle, challan, payment, contest and reviewer scenarios in the repository.
- User-approved visual references derived from Dubai and Australian transport-service patterns, plus five supplied e-Challan concept images.
- Repository architecture, acceptance criteria, research notes and a working local two-sided demo.
- No real citizen data, government credentials, official endorsement or production database proof is available and none may be fabricated.

## Product Principles

1. Explain before asking and route before collecting.
2. Ask once, reuse safely and preserve progress across interruptions.
3. Make evidence requirements, ownership, timing and the next action concrete.
4. Keep consequential decisions human, reasoned and auditable.
5. Design for nationwide variation through configuration, not a false claim of one live national integration.

## Accessibility & Inclusion

The responsive web experience targets WCAG 2.2 AA, keyboard completion, visible focus, semantic structure, useful high contrast, text resizing, reduced motion and comprehension across ages and digital-literacy levels. Mobile is the primary constrained viewport, not a reduced desktop afterthought.
