# Round-two authority and session architecture

## Outcome

Support many simultaneous synthetic citizens and a separate demo authority workspace without cross-session data leakage, lost progress, or a second disconnected mock system.

## Implementation status — 4 September 2026

- Implemented locally: signed citizen and reviewer sessions, role-checked routes, session-scoped cases/audit/idempotency, reviewer-to-citizen information requests, citizen supplements, and the shared decision timeline.
- Implemented in source: an await-safe repository contract, managed-PostgreSQL adapter, advisory-locked migrations, session/case/audit/idempotency/workflow/batch/assignment tables, atomic idempotent mutations, and optimistic stored-version updates.
- Verified locally: two SQLite citizen sessions mutate the same seeded case independently; stale versions add no audit event; one idempotency key creates one mutation; assignments retain one active row and increment on reassignment.
- Implemented locally: aggregate authority counters, cursor-paged compact worklists, a detail-on-open reviewer UI, 30-minute claim leases, and safe resolved-case reads.
- Implemented locally: seeded history and new mutations feed the persisted workflow log; citizen case/account responses project current stage, owner, next action, target source and traceable versioned events from that log.
- Implemented locally: issue-specific drafts are session-scoped and versioned, autosave/explicit-save restore exact structured answers, successful submission clears the draft atomically, and reviewers can record only outcomes allowed by the stored issue packet.
- Still required before claiming production durability: provision the managed database, set deployment secrets/URL, run the PostgreSQL integration test and prove isolation plus cold-start continuity against the deployed database.
- The public demo access code is intentionally mock authentication. It demonstrates the role boundary but is not a production staff identity system.

## Deployment shape

```text
Citizen browser                    Authority browser
challan-nyay.vercel.app            challan-nyay.vercel.app/authority
        |                                      |
        +---------- Vercel API function -------+
                           |
                 session + role boundary
                           |
                  domain/application layer
                           |
              managed Postgres repository
                           |
       cases, packets, tasks, payments, audit events
```

- Production target: managed Postgres installed through the Vercel Marketplace and exposed only through environment variables.
- Local/test fallback: SQLite behind the same repository contract.
- Vercel functions are treated as stateless. Process memory may cache configuration or a connection client, but it is never the source of truth for case state.
- Database connections use the provider's serverless/pooling path and run near the function region.

## Identity and isolation

### Citizen demo session

1. A clean browser requests a short-lived server-signed synthetic session token.
2. The token carries an opaque `session_id`, role `CITIZEN`, issued/expiry times, and demo schema version; it contains no case or personal data.
3. Lookup attaches the seeded portfolio to that session only after the human check succeeds.
4. Every read/write query includes `session_id`; client-supplied case IDs never replace that predicate.
5. Reset deletes/reseeds only that synthetic session.

### Authority demo session

1. Staff enter through `/authority/sign-in` or a future separate subdomain; no citizen-page link advertises the route.
2. Synthetic staff credentials create a short-lived, server-signed `DEMO_REVIEWER` session.
3. Server authorization limits the reviewer to the configured demo jurisdiction and allowed actions.
4. A reviewer sees only submitted work routed to that jurisdiction, not arbitrary citizen portfolios.
5. Decisions require re-confirmation and a current aggregate version.

Absence from navigation is a usability choice, not a security control. Authorization is enforced for every authority endpoint.

## Shared records

| Record | Key fields | Isolation/concurrency rule |
|---|---|---|
| `demo_sessions` | id, role, jurisdiction, expires_at, reset_at | server-issued opaque ID; no real identity |
| `cases` | session_id, case_id, version, state, payload | unique `(session_id, case_id)`; optimistic version check |
| `contest_drafts` | session_id, case_id, version, issue_code, answers | autosaved; only owner can read/write |
| `evidence_items` | session_id, case_id, packet_version, type, manifest | synthetic manifest in public demo; immutable after submission |
| `review_tasks` | session_id, case_id, jurisdiction, status, assigned_to, version | unique open task per submission version |
| `information_requests` | session_id, case_id, item_code, reason, status | one bounded request per active review step |
| `payment_attempts` | session_id, case_id, idempotency_key, provider_state, ledger_state | unique operation key per session |
| `decisions` | session_id, case_id, outcome, reason, evidence_ids, order_ref | human-only; immutable after confirmation |
| `audit_events` | session_id, case_id, sequence, actor_role, event, metadata | append-only; no evidence bodies/secrets |

## API surface

### Citizen

- `POST /api/demo/sessions`
- `GET /api/lookup/challenge`
- `POST /api/cases/lookup`
- `GET /api/cases/:caseId`
- `PUT /api/cases/:caseId/contest-draft`
- `POST /api/cases/:caseId/contest-submissions`
- `POST /api/cases/:caseId/information-responses`
- `POST /api/cases/:caseId/payment-attempts`
- `POST /api/demo/reset`

### Authority

- `POST /api/authority/sessions`
- `GET /api/authority/tasks`
- `POST /api/authority/tasks/:caseId/claim`
- `GET /api/authority/tasks/:caseId`
- `POST /api/authority/tasks/:caseId/information-requests`
- `POST /api/authority/tasks/:caseId/decisions`
- `GET /api/authority/cases/:caseId/audit`

Authority endpoints reject citizen tokens even if the URL is known. Citizen endpoints reject access to a case owned by another session using the same generic not-found response.

## Consistency rules

- Mutations include `expectedVersion`; stale writes return `409 CASE_VERSION_CONFLICT` with no partial change.
- Submission, task creation, receipt, and audit append happen in one transaction.
- Idempotency keys are scoped to `(session_id, operation_type, key)`.
- The citizen timeline is a read model of the same persisted events the authority workspace produces.
- Information requests and decisions cannot both close the same task; the current task version is checked transactionally.
- Draft writes compare their own `expectedDraftVersion`; a stale tab cannot overwrite a newer recovery draft.
- A reviewer information request must name an evidence item in the stored issue contract, and a citizen response must satisfy that exact requested item.
- Decision outcomes are allowlisted by the stored issue packet; unsupported outcome/issue combinations are rejected by the API rather than merely hidden in the UI.
- Compatibility backfill inserts workflow history only for cases with no workflow events, so startup cannot duplicate an existing timeline.
- Retryable infrastructure failures do not create duplicate submissions, payments, decisions, or receipts.

## High-volume authority operations

The current compact queue proves the two-sided lifecycle but is not the target operating model. The target supports many jurisdictions, hundreds of thousands of historical records, and multiple concurrent officers without downloading the full queue.

### Queue read model

- Dashboard counters are pre-aggregated by jurisdiction, status, priority and SLA bucket.
- Worklists use server-side filtering, stable sort keys and cursor pagination; the browser receives one page at a time.
- Search supports exact case, challan and normalized vehicle registration identifiers. Broad queries remain rate-limited and jurisdiction-scoped.
- Default views are `UNASSIGNED`, `MY_BATCH`, `WAITING_FOR_CITIZEN`, `DUE_TODAY`, `ESCALATED`, and `RECENTLY_RESOLVED`.
- List rows expose only the facts needed for routing: case reference, issue, received time, completeness, priority, SLA risk, assignee and current owner. Evidence bodies load only after a case is opened.

### Assignment and concurrency

- `work_batches` group bounded case sets by jurisdiction, routing tag, priority and due window.
- `case_assignments` record reviewer, assigned/claimed timestamps, lease expiry, status and aggregate version.
- A team queue may contain thousands of cases, but a reviewer acts only on explicitly assigned or claimed work.
- Claim, reassign, release, request-information and decide operations are transactional and append an audit event.
- Optimistic versions prevent two reviewers from silently deciding the same case; stale actions receive a conflict and the latest owner/state.
- Supervisor metrics are derived from assignment and case events: unassigned age, per-reviewer active load, completed today, returned cases, SLA risk and median handling time. They are operational signals, not employee scoring in the prototype.

### Synthetic demonstration boundary

A few showcase cases contain complete evidence, locations, issue packets and histories. Additional rows and aggregate volumes are realistic synthetic fixtures. No real citizen PII, real government credentials or claimed live authority database is used.

## Citizen status projection

The citizen timeline is a read model of the append-only workflow log, not an independently editable object.

| Citizen stage | Required persisted event | Current owner |
|---|---|---|
| Submitted | `CONTEST_SUBMITTED` | Intake service |
| Acknowledged | `SUBMISSION_ACKNOWLEDGED` | Jurisdiction queue |
| Assigned | `CASE_ASSIGNED` or `CASE_CLAIMED` | Named reviewer/team |
| Under review | `REVIEW_STARTED` | Reviewer |
| Information requested | `INFORMATION_REQUESTED` | Citizen |
| Response received | `CITIZEN_SUPPLEMENTED` | Reviewer queue |
| Decision issued | `CASE_QUASHED` or `CONTEST_REJECTED` | Issuing authority |
| Resolved | `CASE_CLOSED` or reconciled terminal event | Complete |

- Each projected stage carries the committed event time, actor role, case version, plain-language summary and trace/correlation reference.
- The API returns `currentStage`, `currentOwner`, `nextAction`, `targetAt`, `targetSource`, and ordered timeline events from the same case aggregate.
- The UI never marks a step complete because a timer elapsed or a screen was visited.
- Polling or later real-time delivery may refresh the projection, but transport does not define truth; persisted events do.

## Chat guide boundary

If implemented after P0/P1, Nyay Guide reads only the current authorized case, approved help content, and the selected issue contract. It can explain or navigate; it cannot mutate the case, infer guilt, predict a decision, expose another session, or replace the non-chat flow.

## Proof required before resubmission

1. Two isolated private-browser sessions mutate the same seeded case ID differently and remain independent after refresh.
2. A new function instance reads prior submitted state from Postgres.
3. Citizen token cannot call an authority endpoint; reviewer token cannot access an unrelated jurisdiction/session.
4. Two concurrent decisions yield one success and one version conflict.
5. Reset in session A does not change session B.
6. A citizen supplement returns to the same authority task and updates the shared timeline.
