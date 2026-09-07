# System architecture

## Architecture choice

Build a **modular monolith with explicit external adapters**, not microservices. It is fast enough for the hackathon, simple to run, and still demonstrates credible national-scale boundaries.

## Implemented stack and production target

Installed versions are pinned in the lockfiles. A row marked as a target is an explicit production boundary, not a completed integration.

| Layer | Current choice | Status and reason |
|---|---|---|
| Web | React 19 + Vite 6, JavaScript modules | Implemented: small static client, stable browser routes and accessible React components |
| Styling/UI | Native CSS with semantic tokens and responsive media rules | Implemented: avoids runtime UI weight and keeps high contrast/low-data behavior explicit |
| API | Fastify 5 + strict JSON Schema request contracts | Implemented: one testable service boundary with role and payload validation |
| Domain | Framework-free JavaScript modules | Implemented: issue contracts, evidence passports, payments and workflow projections remain independently testable |
| Database | SQLite adapter locally; PostgreSQL adapter and migrations for deployment | Implemented boundary; managed PostgreSQL and live durability proof remain pending |
| Evidence | Synthetic files plus normalized source/original/derived metadata | Implemented for the demo; authorized object storage and ingest scanning are production targets |
| Maps | Attributed OpenStreetMap embed and external link | Implemented demo context; a contracted provider is required for national production traffic |
| AI assist | No model is required by the working path | Deliberately absent: no model decides, submits, pays or blocks the service |
| Validation | Fastify JSON Schema plus domain validation | Implemented on every consequential route |
| Tests | Node test runner + Playwright Test | Implemented: contract, repository, race/restart and real-browser lifecycle checks |
| Observability | Fastify structured request logs and persisted correlation IDs | Implemented baseline; OpenTelemetry export remains a target |
| Assisted channel | Deterministic WhatsApp state machine + Meta Cloud API adapter | Shared repository, durable outbox, delivery receipts and provider payloads are implemented. The developer phone resource authenticated locally; public webhook and real test-recipient proof remain pending |
| Local runtime | Node.js 22 + npm workspaces by prefix | Implemented and documented without a Docker dependency |

Primary documentation: [React](https://react.dev/), [Vite](https://vite.dev/), [Fastify validation](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/), [PostgreSQL](https://www.postgresql.org/docs/current/), and [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/).

## Current code layout

```text
apps/
  web/          citizen and reviewer interfaces
  api/          HTTP API and adapter composition
api/            Vercel Fastify gateway
ARCHITECTURE/   boundaries, data flow and deployment truth
DELIVERY/       acceptance criteria, tests and submission controls
GOVERNANCE/     decisions, data, safety and third-party records
playwright.config.mjs
```

## Logical architecture

```text
Citizen + authority React client
WhatsApp fixture or Meta webhook -> HMAC boundary -> inbox/conversation/outbox -> Meta sender
  -> Fastify JSON-schema routes
       -> session/role boundary
       -> issue, payment and workflow domain services
       -> repository contract
            -> SQLite local/test adapter
            -> PostgreSQL deployment adapter
       -> normalized evidence/map/provider boundaries
```

## Application modules

- **Case:** discovery, normalized case view, parties, jurisdiction, evidence references.
- **Contest:** ground selection, draft, declaration, submission, supplemental evidence.
- **Rules:** effective-dated clocks, jurisdiction capabilities, eligibility guidance.
- **Review:** queue, assignment, request for information, reasoned decision.
- **Payment:** attempt ledger and reconciliation; never mixed with contest state.
- **Handoff:** configured court/RTO destination and status boundary.
- **Evidence:** normalized source, retained-original metadata, derived lineage and map provenance.
- **AI assist:** explicitly optional and not implemented in the consequential path.
- **Audit:** append-only consequential events and receipts.
- **Content:** versioned plain-language and translations.
- **Operations:** SLA, queue ageing, quality and exception measures.
- **Channel:** pseudonymous sender mapping, deterministic commands, event replay, outbox and one-time web continuity; never a second case database.

## Data flow — contest submission

1. Web sends draft version, confirmed facts, evidence references, declaration, and an idempotency key.
2. API validates schemas, role, ownership, evidence state, current case version, and legal transition.
3. One repository transaction advances the case version, appends workflow/audit events, records the idempotent response and clears any recovered draft.
4. The authority queue projects its task from the same persisted case/workflow state; it does not use a separate mock inbox.
5. The API returns the committed receipt and citizen tracker state immediately.
6. A human reviewer reads the same issue packet and evidence passport and records one contract-allowed outcome.

## Reliability patterns

- optimistic concurrency version on mutable aggregates;
- idempotency keys for submit, decide, pay, reconcile, and upload-finalize actions;
- atomic case, workflow, audit and idempotency writes;
- provider adapters reserved for later retry/dead-letter delivery work;
- time stored in UTC and rendered with jurisdiction/user context;
- rule and content versions attached to the case event;
- graceful core flow when AI, notifications, or analytics are unavailable.

## Deployment shape

The current public deployment is intentionally paused while round-two hardening remains local. The release target is one static Vite client, one Fastify serverless gateway and one managed PostgreSQL database. Seeded access uses isolated synthetic sessions and a separately authenticated reviewer workspace. The local SQLite path remains the deterministic fallback; managed-database and deployed cold-start proof are required before the public URL is re-enabled.
