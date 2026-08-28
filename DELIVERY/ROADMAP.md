# Delivery roadmap

Assumption: work begins after visual direction and phase-gate approval on 20 August 2026. Submission deadline is 27 August 2026; re-check the official brief daily.

## 20 August — lock the bet

- accept product/MVP and non-goals;
- generate three visual directions and select one;
- confirm name/disclaimer and seeded demo cases;
- convert design tokens and screen inventory into build tickets;
- freeze the demo story.

Exit: selected visual target, approved state machine, no unresolved scope question affecting the primary path.

## 21 August — foundation

- initialize monorepo and local runtime;
- implement schemas, domain states, synthetic seed/reset, database migrations;
- create design tokens, shell, accessible layout, and first case overview;
- create mock session and adapter contracts;
- add CI checks.

Exit: seeded case loads from database through API into responsive UI; audit event visible.

## 22 August — citizen resolution

- implement deadline/authority explanation;
- build wrong-vehicle guided contest and autosave;
- add upload validation, progress, and synthetic fixtures;
- create review/submit/receipt/timeline;
- write domain and API tests alongside work.

Exit: citizen submission persists once, survives retry/refresh, and creates review task.

## 23 August — authority loop

- reviewer queue and case evidence view;
- information request and supplement path;
- human quash/reject with reason code and confirmation;
- citizen timeline/order update;
- operations SLA slice.

Exit: the primary lifecycle completes end to end without manual database changes.

## 24 August — AI assistance and second scenario

- add server-only structured AI extraction/summary with feature flag;
- implement manual fallback and source/confidence UI;
- run synthetic evals and record results;
- add payment mismatch scenario if the core remains stable.

Exit: disabling AI does not break the flow; no unsupported AI claim enters the demo.

## 25 August — inclusion and resilience

- complete Hindi demo path and long-string QA;
- keyboard, NVDA, zoom, forced colours, reduced motion;
- slow-network, interrupted upload, offline/revisit behavior;
- security, authorization, input, idempotency, and log-redaction checks;
- responsive visual comparison against selected mock.

Exit: primary path passes the acceptance matrix on mobile and desktop.

## 26 August — submission build

- deploy public demo and test from private/signed-out sessions;
- freeze dependencies and seed data;
- write final submission narrative and disclosures;
- record the required two-minute video and captions;
- create local fallback recording/build;
- rehearse live demo with failure recovery.

Exit: submission package complete; no new feature work.

## 27 August — verification and submit

- re-check official deadline/rules;
- two clean public-demo runs on separate devices/networks;
- verify all links, captions, audio, forms, seeded IDs, and reset;
- check no secrets/real data/log leaks;
- submit with time buffer and preserve receipt.

Exit: submission receipt saved. No deadline-day architecture changes.

## Work-in-progress limit

At most one end-to-end feature is open per person. A vertical slice includes UI, API, persistence, audit, tests, error state, accessibility, and demo fixture before a new slice starts.
