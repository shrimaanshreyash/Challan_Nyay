# Test strategy

## Test pyramid

### Domain unit tests

- every allowed and forbidden case transition;
- Rule 167 configured clock boundaries and inclusive/exclusive assumptions;
- action-owner invariant;
- decision prerequisites;
- payment provider/ledger divergence;
- evidence completeness by ground/jurisdiction;
- synthetic-data invariant.

### Contract tests

- request and response schemas;
- adapter capability/version negotiation;
- idempotent command replay;
- webhook signature/replay behavior for simulated providers;
- safe mapping of external failure to domain state;
- no API drift between web and server types.

### Integration tests

- transaction creates submission, task, audit, and outbox atomically;
- worker retry and dead-letter behavior;
- evidence finalize/scan/extraction sequence;
- optimistic-concurrency conflict;
- row/role/jurisdiction access boundaries;
- reset affects only the synthetic demo tenant.

### Component tests

- error summary and focus;
- deadline/status/next-action content;
- upload resume and validation states;
- AI confirmation and fallback;
- decision confirmation;
- long-language strings and narrow layouts.

### Browser journeys

1. Primary wrong-vehicle contest to quashed order.
2. Request-for-information loop.
3. Payment mismatch and reconciliation.
4. Rejected contest to next-step guidance.
5. Unauthorized cross-case access.
6. Refresh/retry/interrupted upload.
7. Keyboard-only primary path.

## AI evals

- versioned synthetic dataset and expected structured outputs;
- field exact match and abstention;
- source-support check for summaries;
- prompt-injection fixtures;
- manual fallback test with feature disabled;
- regression run before model/prompt/schema change.

## Accessibility

- axe in component and browser CI for stable pages;
- manual NVDA + Firefox primary journey;
- keyboard focus order and modal trapping;
- 200% zoom, 320px width, forced colours, reduced motion;
- language attribute and status-message checks;
- no inaccessible CAPTCHA in demo.

## Performance and resilience

- browser performance budget on representative mobile throttling;
- API p95 measured locally for seeded flows, clearly labeled local;
- upload interruption and retry;
- AI/provider timeout and circuit/fallback;
- concurrent decision/submission commands;
- database restart recovery for durable jobs where feasible.

## Security

- authorization matrix for every route;
- CSRF/session/cookie posture;
- stored/reflected injection inputs;
- malicious/renamed/oversized upload fixtures;
- prompt injection in document text;
- idempotency and replay;
- dependency and secret scan;
- log snapshot confirming redaction.

## Release gate

No public demo build if:

- the primary end-to-end browser test fails;
- a consequential endpoint lacks authorization or idempotency tests;
- the disclaimer or mock labels are missing;
- the demo contains real data/secrets;
- a critical/serious accessibility issue blocks the main task;
- AI can make a decision or the flow breaks when AI is unavailable;
- the deployed seed/reset is unreliable.

## Evidence pack

Store test commands, summaries, screenshots, accessibility notes, AI-eval results, and deployment verification in a timestamped release evidence folder when implementation begins. Distinguish automated pass from manual verification.

