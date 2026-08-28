# System architecture

## Architecture choice

Build a **modular monolith with explicit external adapters**, not microservices. It is fast enough for the hackathon, simple to run, and still demonstrates credible national-scale boundaries.

## Proposed implementation stack

Versions will be pinned to current stable releases at implementation time and recorded in the lockfile.

| Layer | Choice | Reason |
|---|---|---|
| Web | Next.js App Router, React, TypeScript strict mode | Fast server-rendered shell, responsive routes, accessible React ecosystem, production-ready bundling |
| Styling/UI | CSS variables/tokens, CSS Modules or Tailwind only if token-governed, Radix primitives selectively | Controlled visual language and accessible behavior without template appearance |
| API | Fastify with TypeScript and JSON Schema-derived contracts | Explicit service boundary, high-performance validation/serialization, testable adapters |
| Domain | Framework-free TypeScript modules | Legal clocks and transitions remain independently testable |
| Database | PostgreSQL | Transactions, constraints, JSONB where justified, audit/query support, optional row-level security |
| Evidence | S3-compatible object storage; local MinIO or filesystem adapter for development | Keeps files out of database and preserves provider portability |
| Jobs | PostgreSQL-backed job/outbox worker | Avoids Redis complexity in the MVP while providing retries and durable events |
| AI assist | OpenAI Responses API behind an `AiAssistGateway` | Image/file input and structured output; fully optional to core resolution |
| Validation | Shared JSON Schema/TypeBox-style runtime contracts | One runtime and TypeScript source for API boundaries |
| Tests | Vitest, Playwright, Testing Library, axe-core | Domain, contract, component, real-browser, and accessibility coverage |
| Observability | structured logs, correlation IDs, OpenTelemetry on the server | Trace citizen submission through routing, review, and decision |
| Local runtime | Node.js LTS, pnpm workspaces, Docker Compose for Postgres/object store | Reproducible contributor and judge setup |

Primary documentation: [Next.js App Router](https://nextjs.org/docs/app), [Fastify validation](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/), [PostgreSQL](https://www.postgresql.org/docs/current/), and [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/).

## Intended code layout after phase approval

```text
apps/
  web/          citizen and reviewer interfaces
  api/          HTTP API and adapter composition
  worker/       outbox, notifications, AI assist, reconciliation
packages/
  domain/       entities, transitions, clocks, policies
  contracts/    runtime schemas and generated TS types
  ui/           selected design tokens and components
  config/       lint, TypeScript, test configuration
fixtures/
  cases/        fictional challans, documents, decisions
infra/
  local/        Docker Compose and seed commands
```

This structure is planned only; it is not created during the documentation phase.

## Logical architecture

```text
Citizen Web -----------+
                       |
Reviewer Web ----------+--> Fastify API --> Application services --> PostgreSQL
                                           |       |                 + Outbox
                                           |       +--> Evidence adapter --> Object store
                                           +--> Domain rules
                                           +--> Mock government/court/payment/identity adapters
                                           +--> AI assist adapter (optional)

Worker <-------------------- PostgreSQL outbox/jobs
  +--> mock notifications
  +--> AI extraction/summarization
  +--> payment reconciliation simulation
  +--> deadline and queue events
```

## Application modules

- **Case:** discovery, normalized case view, parties, jurisdiction, evidence references.
- **Contest:** ground selection, draft, declaration, submission, supplemental evidence.
- **Rules:** effective-dated clocks, jurisdiction capabilities, eligibility guidance.
- **Review:** queue, assignment, request for information, reasoned decision.
- **Payment:** attempt ledger and reconciliation; never mixed with contest state.
- **Handoff:** court/RTO destination and acknowledgement.
- **Evidence:** validation, storage, metadata, scan state, retention.
- **AI assist:** extraction, suggested categorization, translation draft, reviewer summary.
- **Audit:** append-only consequential events and receipts.
- **Content:** versioned plain-language and translations.
- **Operations:** SLA, queue ageing, quality and exception measures.

## Data flow — contest submission

1. Web sends draft version, confirmed facts, evidence references, declaration, and an idempotency key.
2. API validates schemas, role, ownership, evidence state, current case version, and legal transition.
3. One database transaction creates the submission, state event, review task, audit event, and outbox event.
4. API returns a durable receipt immediately; it does not wait for AI or a notification.
5. Worker processes the outbox, creates optional AI summary, and sends a mocked notification.
6. Reviewer reads only confirmed citizen fields and source-linked AI assistance.

## Reliability patterns

- optimistic concurrency version on mutable aggregates;
- idempotency keys for submit, decide, pay, reconcile, and upload-finalize actions;
- transactional outbox for external effects;
- explicit retry/dead-letter state with operations visibility;
- time stored in UTC and rendered with jurisdiction/user context;
- rule and content versions attached to the case event;
- graceful core flow when AI, notifications, or analytics are unavailable.

## Deployment shape

For the hackathon: one public web service, one API/worker deployment, managed PostgreSQL, and S3-compatible storage. Seeded public demo access uses synthetic cases and a clearly displayed reviewer-demo entry. Keep a local Docker-based fallback and a recorded video. Provider selection is deferred until deployment is explicitly authorized.

