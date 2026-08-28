# MVP scope

## The one proof

A synthetic wrong-vehicle challan moves from citizen understanding to evidence-complete contest, authority review, reasoned quashing, and citizen-visible order/timeline.

## Must ship

### Citizen

- responsive public entry and independent-prototype disclaimer;
- seeded challan lookup with jurisdiction/coverage explanation;
- case overview: allegation, source evidence, amount, status, deadline, next action;
- guided contest for the wrong-vehicle ground;
- synthetic evidence upload with progress, validation, and recovery;
- AI-assisted extraction or mismatch summary with confirmation and manual fallback;
- evidence completeness checklist and declaration preview;
- idempotent submit and durable receipt;
- timeline, information request, reasoned decision, order, and next action;
- English and Hindi for the complete demo path;
- accessible/slow-network behavior.

### Reviewer

- seeded demo entry;
- queue with jurisdiction, ground, evidence completeness, and SLA ageing;
- review view with original allegation evidence, citizen packet, and source-linked AI summary;
- request specific information;
- quash and reject actions with structured reason, explanation, and confirmation;
- decision event reflected immediately in the citizen timeline;
- simple operations view for approaching SLA and payment mismatch.

### Platform

- canonical domain states and valid-transition enforcement;
- PostgreSQL persistence and append-only audit events;
- object/file storage adapter;
- transactional outbox/worker for mocked side effects;
- mock government, authority, payment, court, identity, and notification adapters;
- deterministic synthetic fixtures and reset;
- structured logs, correlation IDs, and safe error handling;
- automated domain, API, browser, and accessibility checks.

## Should ship if the core is stable

- payment mismatch/reconciliation scenario;
- information-request supplement loop;
- Hindi reviewer-visible content summary;
- installed/offline-capable PWA shell;
- narrow operations dashboard with reason/SLA metrics.

## Demonstrate only if fully working

- court handoff scenario;
- draft translation to a third language;
- AI comparison of two synthetic vehicle images;
- simulated payment flow.

## Explicitly out

- real portal/API/CAPTCHA integration;
- real identity, payment, court, RTO, VAHAN, SMS, or email;
- full content for all states/UTs and languages;
- native mobile apps;
- legal-decision automation;
- complex analytics, multi-region deployment, or microservices;
- public citizen uploads of real data.

## Scope cut order

If time is at risk, cut in this order:

1. operations charts;
2. third language;
3. PWA installability;
4. court scenario;
5. payment mismatch scenario;
6. information-request loop.

Never cut the complete citizen-to-reviewer-to-citizen decision loop, disclaimer, accessibility basics, synthetic-data controls, or testable audit trail.

