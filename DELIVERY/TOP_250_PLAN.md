# Challan Nyay — 250 to 10 execution plan

Planning date: 3 September 2026  
Working deadline: 7 September 2026, using the current official brief as the conservative source of truth until the mentor group provides a more precise time.

## Winning product sentence

**Challan Nyay gives a citizen one evidence-first resolution passport for an incorrect challan: what happened, what proves it, who owns the next action, and when it will be resolved—across state-specific backends without changing the citizen journey.**

This remains one problem, not a portal clone: resolving a wrong or unclear challan without confusion, duplicate action, or an untraceable complaint.

## Current score against judging criteria

| Criterion | Current position | Main gap |
|---|---|---|
| Real problem | Strong | Add concise evidence from user pain to the resubmission story |
| Working build | Good locally | Production mutations are not durable across serverless instances |
| Usability | Strong desktop | Mobile navigation clips; primary lookup starts too low |
| Product thinking | Strong | Account entry and some labels still expose “future” thinking |
| End-to-end thinking | Strong concept | Persistence, session isolation, reviewer control, and recovery need proof |
| Honesty | Strong | Documentation must be updated so planned and implemented claims match |

## Product boundary for round two

- The judged surface remains the citizen journey. The authority workspace proves that the citizen's request reaches a real operational process; it is not a second product competing for attention.
- One browser session represents one isolated synthetic citizen workspace. Another citizen or judge cannot reset, pay, contest, or decide its cases.
- The authority workspace is not linked from citizen navigation. It uses a separate `/authority` entry, a separate visual shell, and server-enforced demo staff roles. A hidden URL alone is never treated as security.
- The same case, evidence packet, timeline, payment record, and audit events power both surfaces. There is no duplicated reviewer-only mock state.
- Mentorship feedback can reorder the backlog, but work on reliability, mobile access, and resolution depth does not wait for the call.

## Eight core phases

These phases finish the trustworthy web product before channel expansion. Phase status is updated only after its exit proof passes.

1. **Production data foundation — implemented locally; live proof pending Phase 8:** await-safe SQLite/PostgreSQL repository, migrations, atomic writes, idempotency and optimistic versions.
2. **Session, role and API boundary — complete locally:** isolated citizen workspaces, authority roles, route schemas, authorization and safe reset behavior.
3. **Authority operations at scale — core complete locally:** aggregate queues, cursor-paged worklists, bounded pages, assignment leases and SLA ageing are working; supervisor batch/reassignment controls remain a release-hardening item.
4. **Event-backed citizen tracking — complete locally:** one persisted workflow log drives citizen status, authority ownership, information requests, decisions and closure.
5. **Issue-specific recovery — complete locally:** six structured grievance paths, versioned draft recovery, required evidence, reviewer checklists, bounded information requests and contract-safe reasoned outcomes.
6. **Vehicle and evidence integrity — complete locally:** registry-style vehicle profiles and thumbnails, normalized fixed-camera/officer envelopes, original-to-crop lineage, plate/body comparison and coordinate provenance shared by citizen and authority views.
7. **Mobile, accessibility and performance — complete locally:** compact accessible utilities, 320/390 px layouts, tokenized high contrast, preserved keyboard/touch scrolling, low-data opt-in media and optimized WebP delivery are working.
8. **Automated proof and release freeze — local core complete; live gates pending:** four real-browser checks, isolated file-backed restart, concurrent-decision conflict and claim/asset audits pass. Managed-PostgreSQL cold-start and re-enabled public-URL checks still require the release environment.

## P0 — must complete before any new feature

### 1. Durable, isolated public demo

- Replace Vercel process-local SQLite state with managed PostgreSQL. Prefer a Vercel Marketplace Postgres integration so credentials remain environment variables and deployment stays simple; keep SQLite only for local development/tests.
- Give every judge a server-signed synthetic demo session/tenant so concurrent reviewers do not overwrite one shared case.
- Scope citizen, authority, reset, idempotency, draft, payment, and audit records to that session.
- Create a server-enforced `CITIZEN` and `DEMO_REVIEWER` role boundary. The authority route is separate and absent from the citizen navigation, but it is still authenticated and authorized.
- Add optimistic case versions so two tabs cannot silently overwrite a newer citizen or reviewer action.
- Prove contest -> authority queue -> information request/decision -> citizen timeline across separate requests and a cold start.

Exit check: two private-browser sessions can finish independently, refresh safely, and never see each other's mutated case.

### 2. Mobile and low-bandwidth delivery

- Replace the clipped mobile navigation with a compact accessible menu and keep lookup in the first useful viewport.
- Collapse the tall two-row utility controls into one compact disclosure plus a labelled `Accessibility and language` panel on narrow screens; keep brand, account and navigation in one separate row.
- Redesign the hero composition for narrow screens instead of merely stacking the desktop layout: smaller identity/header, shorter copy, lookup first, illustration cropped or deferred.
- Redesign the five-step mobile journey so it reads as a deliberate connected service process rather than five identical numbered circles. Use a strong lead step, compact connected follow-ups and a clear receipt/final-order outcome.
- Rebuild high contrast from semantic colour tokens across the entire page. Eliminate mixed black/white bands, dark text on dark hero backgrounds, and excessive yellow containers.
- Hide visible scrollbar chrome without disabling wheel, touch, keyboard or assistive scrolling; preserve clear continuation cues on long content.
- Reduce the three PNG assets from roughly 6.9 MB total using responsive WebP/AVIF outputs.
- Lazy-load evidence and map content; keep text and the next action usable before media loads.
- Add an honest low-data mode that avoids the map embed and large evidence previews while preserving facts and external links.
- Test 320 px, 390 px, 200% zoom, keyboard focus, reduced motion, and high contrast.

`DESIGN/MOBILE_AND_HIGH_CONTRAST_REFINEMENT.md` is the implementation and verification contract for these corrections.

Exit check: the lookup is reachable quickly on mobile, no header content clips, and the main journey remains usable with images disabled or delayed.

### 3. Automated production-path proof

- Add browser tests for guest lookup, dispute submission, reviewer decision, payment idempotency, account switching, mobile navigation, and reset.
- Add route schemas and safe input/output validation for every implemented API boundary.
- Add a deployment smoke test against the public URL with correlation IDs and no parser/HTML errors.

Exit check: one command produces a readable pass/fail report for the exact journey shown to judges.

## P1 — one deeper differentiator

Build **issue-specific resolution recovery**, not a second unrelated portal:

- autosave a contest draft;
- change the form, required evidence, validation, reviewer checklist, and safe next step for each supported issue;
- attach only provided synthetic sample evidence in the public demo, with a visible file manifest and no real uploads;
- let a reviewer request one missing item;
- let the citizen respond without restarting;
- require the reviewer to confirm evidence considered, reason code, and plain-language explanation;
- generate a printable/downloadable receipt and final order from the same audit trail.

The six round-two paths are:

1. wrong vehicle shown;
2. payment already made but challan still open;
3. duplicate challans for one event;
4. vehicle sold before the event;
5. registered owner was not the driver;
6. enforcement evidence is unclear.

`DESIGN/ISSUE_SPECIFIC_RESOLUTION_FLOWS.md` is the implementation contract for these paths.

### Visual vehicle identity

- Treat a saved vehicle as a registry-backed profile, not only a registration string: make, model, body type, colour, authorized plate, and a synthetic thumbnail.
- Reuse the same profile in saved vehicles, challan lists, case details, dispute review, and the authority evidence comparison.
- In the flagship mismatch case, show that the captured plate matches the citizen's registered plate while the observed body type and colour do not. This demonstrates a cloned/swapped plate or incorrect association without claiming AI is necessary.
- Production adapters should provide authoritative make/model/body/colour fields. Computer vision may suggest the observed vehicle class only when an authority can support it; the original image remains visible and a human confirms the comparison.
- Keep thumbnails small, original, lazy-loaded, and optional in low-data mode.

### Protected authority workspace

- `/authority/sign-in`: clearly labelled synthetic staff access; no citizen credential reuse.
- `/authority/queue`: an aggregate-first operations dashboard with server-side counts for New, Unassigned, Assigned to me, Waiting for citizen, Under review, Due today, Escalated, and Resolved. Never render the entire jurisdiction as a card strip.
- `/authority/worklists`: searchable, filterable, cursor-paginated tables for jurisdiction, issue, completeness, capture source, date range, age/SLA, assignee, and status. A reviewer opens a small assigned batch rather than scanning thousands of cases.
- `/authority/batches`: supervisors create or auto-route bounded batches by jurisdiction, issue and priority; reviewers claim work, supervisors reassign it, and expired claims return safely to the team queue.
- `/authority/cases/:caseId`: allegation, original evidence, citizen packet, comparison, prior actions, and current aggregate version.
- `/authority/cases/:caseId/request-information`: request one defined missing item with a plain-language reason.
- `/authority/cases/:caseId/decision`: evidence-considered checklist, allowed reason codes, citizen explanation, confirmation, and immutable order reference.
- `/authority/audit`: append-only event view for the selected synthetic session/jurisdiction.

The round-two demonstration should contain a few complete, realistic **synthetic** cases plus larger synthetic queue counts and rows. It must never use real citizen identifiers or suggest that private government data was obtained. Queue totals are aggregate queries; case rows are fetched page-by-page, not loaded into the browser as one large array.

### Multi-reviewer operating model

1. Intake validates and routes a new contest into a jurisdiction/team queue.
2. Triage assigns priority, completeness, due target and routing reason.
3. A supervisor or routing rule creates a bounded batch, typically 25–50 cases, for one reviewer.
4. Claiming a case records assignee, claim time and lease/version so two reviewers cannot decide the same case silently.
5. Requesting information returns the case to a waiting state without consuming the rest of the reviewer batch.
6. A reasoned decision records reviewer, evidence considered, reason code, timestamp and immutable order reference.
7. Supervisors can monitor ageing, workload, reassignments, reopened work and SLA risk without opening every case.

Operational roles remain deliberately small for the prototype: `SUPERVISOR`, `TRIAGE_OFFICER`, and `REVIEWER`. Permissions, jurisdiction and assignment are enforced by the API; hiding a control in React is not authorization.

### Event-backed citizen tracking

- Every citizen stage is projected from persisted workflow events created by actual API mutations. No frontend-only status, decorative completed step, or guessed timestamp is allowed.
- The tracker always shows the current owner, last completed event, exact timestamp, next expected action and target date/SLA source.
- The minimum real lifecycle is Submitted → Acknowledged → Assigned → Under review → Information requested/response received when needed → Decision issued → Resolved.
- Authority claim, request-information, citizen supplement, reassignment, decision and closure actions update the same append-only audit stream that powers the citizen tracker.
- Refreshing, switching account tabs or reopening the case must reproduce the same stage from persisted state. A visible stage cannot advance until its corresponding backend event commits.
- Demo data must exercise several real states across multiple vehicles and accounts, including an unassigned case, an assigned case, a waiting-for-citizen case, a resumed review, a resolved case and a payment-reconciliation case.

Citizen status and authority actions must remain synchronized from the same persisted records.

This turns the current three-screen happy path into a believable public-service process while staying inside the wrong-challan problem.

## P2 — only after P0 and P1 are stable

- Add a **WhatsApp citizen-service channel** only after the shared web workflow is stable. It is another adapter over the same cases, payments, disputes and audit events—not a disconnected bot database.
- Start with Meta's developer test number and webhook. Use deterministic reply buttons, list messages and structured commands for language, lookup, challan selection, pay one/pay all, grievance type, evidence checklist and tracking.
- Keep the WhatsApp pilot to English and Hindi. The existing website language scope remains unchanged; no additional language expansion is required for this submission.
- Do not build an on-site chatbot. An LLM is not required for primary WhatsApp actions; a later free-text fallback may only map user language to an allowed intent and must ask for confirmation before any action.
- Payment begins as a signed, expiring handoff to the existing mock payment route. Native WhatsApp payment must remain an adapter-gated future option until business eligibility, provider integration and reconciliation behavior are verified.
- Every inbound webhook, outbound action and callback is authenticated where supported, idempotent, correlated and recorded without logging message bodies or identifiers unnecessarily.
- Add a payment-deducted-but-not-posted reconciliation case only if the core journey is stable.
- Consider packet-completeness assistance only if it cites exact fields, remains editable and never decides the outcome.
- Do not add decorative AI, microservices, a framework rewrite or undocumented government integration.

## Four-day sequence

### 3 September — lock and de-risk

- confirm the exact resubmission deadline/time and any changed fields in the mentor group;
- lock the winning sentence and P0 scope;
- choose managed Postgres through the Vercel Marketplace as the production path and keep a provider boundary for local SQLite;
- specify session isolation, roles, issue contracts, and migration without rewriting the frontend;
- start repository/session tests before visual additions.

### 4 September — durable architecture and boundaries

- implement persistent session-scoped cases, audits, and idempotency;
- harden route validation and demo roles;
- create the protected authority shell and queue from the shared case store;
- replace the small-case card strip with aggregate queue counts, server-side worklists, batches, assignment ownership and SLA ageing;
- project the citizen tracker from the same assignment, information-request and decision events;
- add two-session, stale-version, cross-instance, and cold-start tests.

### 5 September — finish the web product, then open the channel

- implement ground-specific forms, draft recovery, synthetic evidence attachment, and information request/response;
- make the human reviewer decision explicit and reasoned;
- update dashboard/timeline/receipts from the same persisted state.
- finish vehicle/evidence consistency and the authority operational model by afternoon;
- begin the WhatsApp webhook and deterministic conversation adapter only after the shared API path passes.

### 6 September — inclusion, WhatsApp pilot and proof

- fix mobile navigation and modal reflow;
- optimize assets and add low-data behavior;
- connect the Meta developer test number if credentials and verification are available; otherwise run the same webhook contract against signed fixtures and label it local/mock-transport verified;
- verify English/Hindi menu paths, multi-vehicle selection, one/all challan selection, dispute handoff, tracking and safe payment handoff;
- run keyboard, zoom, contrast, slow-network, and error-recovery passes;
- update product claims and architecture truth tables.

### 7 September — freeze and resubmit

- no new features;
- run two clean public journeys in isolated sessions;
- record a new sub-two-minute video around the resolution passport;
- verify the live link, summary, credentials, disclosures, and submission receipt with time buffer.

## Questions for the mentors

1. What exact date, time, timezone, and form fields apply to the second submission?
2. The public brief says reviewers test the citizen experience; may the updated video briefly show the synchronized authority process as end-to-end proof?
3. Will multiple judges test the same public URL concurrently, and should each receive an isolated demo tenant?
4. Is a managed database expected/allowed for the public prototype, and are any credits or preferred providers available?
5. For a WhatsApp public-service channel, would you recommend deterministic interactive flows with AI only as a confirmed intent fallback, or is there a safer OpenAI pattern for multilingual free text?
6. Would mentors prefer one deeper wrong-challan recovery journey or a second payment-reconciliation scenario?
7. Is there an exact hour and timezone for the September 7 resubmission cutoff?

## Scope cut order

If time slips, cut in this order:

1. WhatsApp free-text AI fallback;
2. native in-chat payment in favor of a signed payment handoff;
3. second payment scenario;
4. downloadable order styling.

Never cut durable demo state, session isolation, mobile usability, primary-flow tests, or truthful mock disclosures.

## Post-Phase-8 additions

These are mandatory follow-on improvements after the eight core phases are complete and stable. They must not interrupt production durability, authority operations, citizen tracking, mobile accessibility, or submission verification.

1. **WhatsApp citizen-service channel** — English/Hindi deterministic menus over the same case API for lookup, understand, select, pay, contest and track; start with Meta's developer test number and never claim a nationwide official number.
2. **Assisted-service continuity** — let a citizen begin on WhatsApp and continue through a signed, expiring web handoff or assisted-service visit without re-entering the complete case; never expose the case through a reusable public link.
3. **Evidence-completeness assistance** — first use deterministic issue contracts to identify missing packet fields; any later model suggestion stays editable, cites the field and never judges the case.
4. **Additional showcase scenarios** — add deeper payment reconciliation or another mentor-approved case only when it exercises the same real workflow, audit trail and authority operations instead of creating a disconnected demo.

The on-site Nyay Guide/chatbot and further language expansion are explicitly removed from the round-two commitment. They may be reconsidered after submission, not during the core eight phases.
