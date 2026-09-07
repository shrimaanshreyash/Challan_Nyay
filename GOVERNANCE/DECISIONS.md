# Architecture and product decision log

Record material choices here. Statuses: `Proposed`, `Accepted`, `Superseded`.

## D-001 — Select Challan Nyay as the primary competition problem

- Status: Accepted
- Date: 20 August 2026
- Decision: Focus on the Indian traffic-challan resolution journey.
- Why: national scale, sharply rising grievance volume, time-sensitive 2026 rule change, visible citizen pain, and a differentiating two-sided workflow.
- Consequence: payment/check-only functionality is secondary; resolution is the core.

## D-002 — Nationwide-by-design, not universal-live

- Status: Accepted
- Date: 20 August 2026
- Decision: Use one canonical case model with state/UT rule and adapter configuration.
- Why: central framework and broad eChallan footprint coexist with fragmented jurisdiction implementation.
- Consequence: every case shows jurisdiction and adapter capability; no universal live claim.

## D-003 — Synthetic data and mocked integrations only

- Status: Accepted
- Date: 20 August 2026
- Decision: No real citizen data or live government, court, identity, payment, or notification transaction in the hackathon.
- Why: competition constraints, authorization, safety, privacy, and demo reliability.

## D-004 — Prove a two-sided resolution loop

- Status: Accepted
- Date: 20 August 2026
- Decision: Citizen submission must become a real reviewer task and a human decision must update the citizen case.
- Why: distinguishes the product from landing-page redesigns, chatbots, and payment aggregators.

## D-005 — AI is assistive, optional, and non-consequential

- Status: Accepted
- Date: 20 August 2026
- Decision: AI may extract, organize, translate, and summarize; it may not decide or submit.
- Why: legal consequence, error risk, explainability, and trust.

## D-006 — Responsive web first

- Status: Accepted
- Date: 20 August 2026
- Decision: Build a mobile-first responsive web application rather than native apps.
- Why: competition asks to rethink websites; one public URL is accessible and demoable across devices.

## D-007 — Modular monolith

- Status: Proposed pending implementation approval
- Date: 20 August 2026
- Decision: Next.js web + Fastify API/worker + PostgreSQL + object-store adapter in one workspace.
- Why: clear boundaries and realistic operation without microservice overhead.

## D-008 — Visual direction selected only after three options

- Status: Accepted
- Date: 20 August 2026
- Decision: Civic Precision (displayed option 1) was selected on 22 August 2026. Calm Assistance was rejected and Case Ledger was considered too dense for ordinary citizens.
- Why: reduce visual rework and judge distinctiveness/legibility with actual key screens.

## D-010 — Durable local prototype store

- Status: Accepted for the hackathon build
- Date: 22 August 2026
- Decision: Use Node's built-in SQLite adapter for the first working vertical slice, behind the repository/domain boundary; retain PostgreSQL as the production deployment target.
- Why: the five-day competition window requires a deterministic, zero-service local demo while still proving transactions, idempotency, audit events, and real persistence.
- Consequence: the submission must call this SQLite-backed local/demo persistence, not a production government datastore.

## D-009 — Licensing recommendation

- Status: Proposed; user confirmation required before adding a root licence
- Date: 20 August 2026
- Decision: Apache-2.0 for original code and CC BY 4.0 for original public documentation, excluding third-party assets and trademarks.
- Why: clear reuse and patent terms for civic technology while preserving attribution.

## D-011 — Official-flow-grounded citizen gateway

- Status: Accepted
- Date: 22 August 2026
- Decision: Start with protected synthetic lookup by challan, vehicle, or driving-licence number before revealing a case. Citizen actions converge on one case model after lookup.
- Why: match the natural Indian eChallan entry model while reducing portal fragmentation and unverified direct disclosure.

## D-012 — Accessible demo human check

- Status: Accepted
- Date: 22 August 2026
- Decision: Use an expiring, server-issued, text-readable arithmetic challenge locally. Never automate or copy an official CAPTCHA. Production requires accessible risk-based protection, rate limiting, abuse monitoring, and security review.
- Why: preserve a recognizable verification step without creating an image-only barrier or touching an official system.

## D-013 — Three-language reviewed pilot

- Status: Accepted
- Date: 22 August 2026
- Decision: Implement English, Hindi, and Telugu on citizen entry with Unicode and an expandable dictionary. Do not claim complete Indian-language coverage before human terminology review and full-flow localization.
- Why: prove the content architecture honestly before multiplying unreviewed translations.

## D-014 — Mock payment as a real state transition

- Status: Accepted
- Date: 22 August 2026
- Decision: Record attempt, provider, ledger, receipt, timeline, and audit state idempotently without collecting any real financial identifier or OTP.
- Why: payment reconciliation is a core public-service reliability problem, not only a visual screen.

## D-015 — Reference-led independent civic redesign

- Status: Accepted
- Date: 27 August 2026
- Decision: Use the five user-supplied eChallan mockups as visual inspiration, with the landing/search mock as the public-entry anchor and the detail/dispute mocks as operational-density references. Rebuild all identity and imagery as original Challan Nyay assets.
- Why: the references provide a clearer, more familiar citizen journey than a dashboard-first or text-heavy landing page.
- Consequence: official emblems, flags, ministry/Digital India marks, endorsement language and copied artwork are excluded. The API-backed resolution loop and explicit synthetic-data disclosures remain unchanged.

## D-016 — Defer chatbot to a later round

- Status: Accepted
- Date: 27 August 2026
- Decision: Do not include chatbot UI or functionality in the first-round build.
- Why: it adds scope without strengthening the working citizen-to-reviewer loop that judges can test today.
- Consequence: reconsider only after shortlisting, with a bounded useful job, accessibility review, factual-source controls and a non-AI fallback.

## D-017 — Explicit Vercel API gateway rewrite

- Status: Accepted
- Date: 29 August 2026
- Decision: Route `/api/:path*` through one concrete `api/index.js` Vercel Function, carry the original nested path in an internal rewrite parameter, and restore it before handing the request to Fastify.
- Why: Vite's local proxy hid a production-only routing gap; a built catch-all function did not receive nested requests on the deployed Vite project.
- Consequence: production routing is contract-tested, and the client converts non-JSON infrastructure responses into a safe citizen-facing service error instead of exposing parser text.

## D-018 — Stateless signed demo challenge

- Status: Accepted
- Date: 29 August 2026
- Decision: Carry the short-lived arithmetic answer in a signed, opaque challenge token rather than process memory. Use an environment secret when configured and a clearly scoped synthetic-demo fallback for this public prototype.
- Why: Vercel may serve the challenge and lookup from different isolated function instances, so process-local challenge state cannot reliably validate the next request.
- Consequence: the accessible human check works across serverless instances. It remains demo friction rather than a production anti-abuse control; replay prevention, rate limiting and managed bot protection stay mandatory before any real integration.

## D-019 — Durable session-isolated round-two state

- Status: Accepted
- Date: 3 September 2026
- Decision: Move the deployed source of truth from process-local SQLite to managed PostgreSQL and scope every mutable record to a server-issued synthetic session. Retain SQLite only as a repository-compatible local/test fallback.
- Why: multiple judges or citizens must be able to use the public demo concurrently without overwriting, resetting, or reading one shared case, and state must survive function recycling.
- Consequence: the public deployment requires a managed database environment variable and cold-start/cross-session proof before resubmission.

## D-020 — Separate protected authority workspace

- Status: Accepted
- Date: 3 September 2026
- Decision: Place government-side demo operations under a separate `/authority` surface (or later subdomain), omit it from citizen navigation, and enforce short-lived staff authentication, role checks, jurisdiction scope, and optimistic concurrency on the server.
- Why: a synchronized authority process proves end-to-end thinking, while mixing reviewer controls into the citizen site damages trust. A hidden path by itself is not security.
- Consequence: citizen and authority views share the same cases, packets, tasks, payments, decisions, and audit trail; no duplicate reviewer-only state is permitted.

## D-021 — Issue-specific evidence contracts

- Status: Accepted
- Date: 3 September 2026
- Decision: Each supported challan issue defines its own citizen questions, required and recommended proof, routing tag, reviewer checklist, reason codes, and safe outcomes.
- Why: a generic complaint form creates avoidable back-and-forth and cannot guide a citizen who has already paid, has sold the vehicle, sees a duplicate, or cannot understand the evidence.
- Consequence: UI and API validation both implement the contract in `DESIGN/ISSUE_SPECIFIC_RESOLUTION_FLOWS.md`; required proof cannot be enforced only in frontend copy.

## D-022 — Bounded Nyay Guide after core reliability

- Status: Accepted with implementation gate
- Date: 3 September 2026
- Decision: Reconsider the deferred chatbot only after persistence, isolation, mobile, issue-specific resolution, and authority-loop tests pass. If built, it is a case-grounded guide for explanation, document checklists, status ownership, and navigation—not a general assistant.
- Why: Dubai-style conversational guidance can reduce digital-literacy friction, but an unreliable or decorative chatbot would weaken the judged working journey.
- Consequence: guide answers require source references and non-chat parity; the guide cannot mutate cases or make consequential decisions and is the first feature cut if schedule or reliability slips.

## D-023 — Visual vehicle identity is part of evidence comparison

- Status: Accepted
- Date: 3 September 2026
- Decision: Model every authorized demo vehicle with registration, make/model label, body type, colour, and an original synthetic thumbnail, and reuse that identity anywhere a vehicle or challan is shown.
- Why: a registration number alone cannot help a citizen or reviewer recognize a plate-cloning, plate-swapping, or incorrect vehicle-body association. The visible vehicle profile makes the mismatch understandable immediately.
- Consequence: the flagship case uses the same captured and registered plate but a different observed body/colour. Computer vision remains optional and advisory; the original enforcement frame, registry fields, and human review remain the evidence source.

## D-024 — Compact mobile navigation replaces horizontal clipping

- Status: Accepted
- Date: 3 September 2026
- Decision: Under 760 px, place the five citizen destinations in an explicit two-column disclosure menu while keeping account and reviewer actions separately reachable with accessible names.
- Why: The earlier horizontal navigation clipped destinations and pushed the protected lookup below the useful mobile viewport.
- Consequence: The closed header is compact; the full menu remains keyboard and touch accessible without consuming the initial page height.

## D-025 — The dispute UI consumes server-owned issue contracts

- Status: Accepted
- Date: 3 September 2026
- Decision: Publish the six dispute contracts from the API, render their ground-specific fields in React, validate them on the server, and persist a normalized issue packet with every new submission.
- Why: Payment reconciliation, ownership transfer, driver nomination, duplicate notices, unclear evidence, and vehicle mismatch require different facts and reviewer checks.
- Consequence: The generic statement remains supporting context, but it cannot bypass the structured evidence requirements.

## D-026 — Local session isolation precedes the managed database claim

- Status: Accepted
- Date: 4 September 2026
- Decision: Implement the session and role model against the repository-compatible SQLite fallback first, while keeping managed Postgres as an explicit deployment gate.
- Why: The complete citizen/reviewer lifecycle can be tested now without pretending that process-local or ephemeral serverless storage is durable.
- Consequence: Local isolation is implemented and testable; no production durability claim is allowed until the Postgres adapter and cold-instance proof exist.

## D-027 — Reviewer information requests append a packet version

- Status: Accepted
- Date: 4 September 2026
- Decision: A reviewer may request one clearly named missing item and reason. The citizen response appends a supplement, returns ownership to the same queue, and preserves the original packet and timeline.
- Why: Real resolution work often needs one missing fact, but a generic back-and-forth inbox would create uncertainty and delay.
- Consequence: Decision controls pause while information is outstanding and resume only after the citizen response is recorded.

## D-028 — Missing reviewer imagery is an explicit evidence state

- Status: Accepted
- Date: 4 September 2026
- Decision: Historical records without a retained asset render a compact metadata fallback; the interface never reserves a large blank media area or substitutes another case's image.
- Why: A broken or unrelated image weakens evidence integrity and makes the reviewer workspace look unfinished.
- Consequence: Current flagship cases keep the original frame; metadata-only records remain usable and honestly limited.

## D-029 — URLs are authoritative and authority stays outside citizen navigation

- Status: Accepted
- Date: 4 September 2026
- Decision: Give top-level citizen views and case detail stable browser paths, make browser history work, and keep `/authority` out of the public navigation and service catalogue.
- Why: A national service must survive refresh, deep links and back navigation, while the operational workspace needs a distinct trust boundary.
- Consequence: The root path always opens Home rather than reviving a stale case; authority uses its own shell and role-checked sign-in.

## D-030 — Authority work is queue, batch and assignment based

- Status: Accepted
- Date: 4 September 2026
- Decision: Replace the small reviewer card strip with aggregate queue views, server-filtered paginated worklists, bounded batches, explicit assignment ownership and supervisor reassignment.
- Why: A real authority may hold hundreds of thousands of cases across many days and distribute work among multiple officers; loading or manually scanning one shared list cannot operate at that scale.
- Consequence: The demo uses a few complete synthetic cases plus realistic synthetic volume. Queue reads are aggregate/page based, and claim/reassign/decision actions are role checked, versioned and audited.

## D-031 — Citizen progress is projected from workflow events

- Status: Accepted
- Date: 4 September 2026
- Decision: Derive every visible citizen stage, owner, timestamp and next action from the same persisted case and assignment events used by the authority workspace.
- Why: A polished tracker is harmful if its steps are decorative or drift from the actual operational state.
- Consequence: Frontend visits and timers cannot advance progress. Submission, acknowledgement, assignment, review, information exchange, decision and closure require committed backend transitions and remain traceable after refresh.
- Implementation note: Seed histories are backfilled into `workflow_events`, new mutation timeline deltas are persisted in the same transaction, and citizen case/account reads return a versioned projection with current owner, next action and target source.

## D-032 — Mobile utility controls collapse into one accessibility panel

- Status: Accepted
- Date: 4 September 2026
- Decision: On narrow screens, keep a compact prototype disclosure and move font size, contrast and language into one labelled accessibility panel while preserving a single-row brand/navigation header.
- Why: The current wrapped utility bar consumes too much of the first viewport and makes the landing page feel like controls surrounding a website rather than a citizen service.
- Consequence: Every control remains accessible with 44 px targets, keyboard/focus support and a visible current value, but the primary lookup regains visual priority.

## D-033 — High contrast is a tokenized theme, not selector patches

- Status: Accepted
- Date: 4 September 2026
- Decision: Define semantic high-contrast tokens and require every component to inherit them instead of independently forcing black, white or yellow backgrounds.
- Why: The current mobile state creates dark text on dark surfaces, abrupt background bands and excessive yellow emphasis.
- Consequence: High contrast receives a full cross-page regression pass, including hero, lookup, account, dispute, tracker and authority surfaces at mobile and desktop widths.

## D-034 — Hide scrollbar chrome without disabling scrolling

- Status: Accepted
- Date: 4 September 2026
- Decision: Remove persistent visual scrollbar chrome in supported browsers while retaining native touch, wheel, keyboard and assistive scrolling.
- Why: The scrollbar adds noise to the compact mobile layout and desktop presentation, but removing overflow would make long public-service screens inaccessible.
- Consequence: Modal scroll locks are temporary, long content retains continuation cues, and scrolling behavior is included in regression tests.

## D-035 — One await-safe repository contract for SQLite and PostgreSQL

- Status: Accepted
- Date: 4 September 2026
- Decision: Keep SQLite as the local/test adapter and select managed PostgreSQL whenever a production database URL is configured. Application handlers await the same repository contract for both providers.
- Why: A synchronous SQLite-only API cannot preserve state across serverless instances, while rewriting domain behavior separately for PostgreSQL would create drift.
- Consequence: Vercel execution refuses missing production persistence when its environment is detected. PostgreSQL migrations use an advisory transaction lock, mutations atomically combine the case version, audit/workflow event and idempotency response, and live durability remains unclaimed until a managed database test passes.

## D-036 — WhatsApp is a deterministic channel adapter, not an on-site chatbot

- Status: Accepted
- Date: 4 September 2026
- Decision: Remove the planned on-site Nyay Guide and additional-language expansion from the round-two scope. After the eight core web phases pass, add an English/Hindi WhatsApp Cloud API adapter using interactive menus over the same case, dispute, payment and workflow services.
- Why: Many citizens already understand WhatsApp but still depend on assisted internet centres for challan work. A channel that completes an existing task is more useful than another conversational surface inside the website.
- Consequence: Primary actions require no LLM. Free text may later be mapped to a bounded intent with explicit confirmation, but may never decide guilt, submit silently or handle payment credentials. The demo starts with Meta's test number and signed mock-payment handoff; a nationwide number or native payment remains unclaimed until authorized and verified.

## D-037 — Client versions and strict request schemas guard every mutation

- Status: Accepted
- Date: 4 September 2026
- Decision: Send the case version displayed by the citizen/reviewer with every consequential request, reject unknown request fields, constrain identifiers and payload sizes, and require non-default signing secrets in production.
- Why: Repository-level locking cannot detect a screen that was already stale before its request began, and silently stripping unexpected fields hides client/server contract drift.
- Consequence: A stale screen receives `409 CASE_VERSION_CONFLICT` before domain mutation; invalid shapes receive a safe `INVALID_REQUEST`; local development may use documented synthetic defaults while production startup refuses them.

## D-038 — Recovery drafts and reviewer outcomes obey the issue contract

- Status: Accepted
- Date: 4 September 2026
- Decision: Persist one versioned, session-scoped grievance draft per case and derive reviewer evidence requests, checklists and allowed outcomes from the stored issue packet.
- Why: Citizens must be able to leave and resume without losing structured work, while an authority cannot safely apply a wrong-vehicle decision or generic evidence request to a payment-reconciliation case.
- Consequence: Stale draft writes conflict, successful submission clears the draft atomically, requested information must match the issue evidence contract, and the API rejects an outcome not allowed for that issue even if a client attempts it directly.

## D-039 — One evidence passport separates plate identity from vehicle identity

- Status: Accepted
- Date: 4 September 2026
- Decision: Normalize each enforcement item into a source envelope with an immutable-original record, derived-asset lineage, coordinate provenance and a registry-linked comparison passport returned to both citizen and authority surfaces.
- Why: A correctly read plate can still be attached to a different vehicle body. Showing only the plate crop or only a generated vehicle thumbnail can incorrectly imply that the allegation is proven.
- Consequence: The UI states plate match and body/colour mismatch separately, retains the original as the decision source, identifies every derived crop's parent, and keeps workflow mutations from replacing the evidence or registry snapshot.

## D-040 — Optimized previews are derived assets and low-data is user controlled

- Status: Accepted
- Date: 5 September 2026
- Decision: Keep the retained synthetic PNG as the immutable-original evidence record, deliver a separately hashed WebP rendition as its browser preview, and make large media/map loading explicitly optional in low-data mode.
- Why: Replacing the retained evidence file would break lineage, while forcing multi-megabyte imagery and an embedded map weakens access on constrained mobile connections.
- Consequence: The evidence passport identifies the WebP as a derived child of the retained original. Low-data mode persists per browser, never hides facts or next actions, and requires one clear opt-in before case media loads.

## D-041 — Release truth and browser proof are executable gates

- Status: Accepted
- Date: 5 September 2026
- Decision: Keep a deterministic Playwright suite for the primary citizen/authority lifecycle, mobile inclusion and account persistence, plus a machine-readable local release audit for claims, required files, secret signatures and asset budgets.
- Why: A successful manual demo or compilation cannot prove refresh persistence, session reset, mobile behavior or documentation truth reliably enough for a judged public link.
- Consequence: `npm run verify` is the local release gate. Failure traces and the JSON audit stay under ignored `output/`; managed-PostgreSQL and deployed-URL checks remain separately labelled pending until they actually run.

## D-042 — Channel continuity uses a persisted inbox and one-time web exchange

- Status: Accepted
- Date: 5 September 2026
- Decision: Implement the WhatsApp pilot first as HMAC-signed provider fixtures backed by the shared repository, a pseudonymous sender key, versioned conversation, idempotent inbox, pending outbox and hashed one-time handoff. Do not add an on-site chatbot or a separate channel case store.
- Why: The service must prove useful task continuity and retry safety before live Meta credentials are available, without confusing fixture behavior with message delivery.
- Consequence: English/Hindi selection, vehicle/challan lookup, multi-record browsing, tracking, pay-one/pay-all confirmation and issue-specific guidance are deterministic. The web exchange consumes the token once and opens the same session/case. Live Meta transport remains pending and explicitly unclaimed.

## D-043 — Pay all is one atomic aggregate command

- Status: Accepted
- Date: 5 September 2026
- Decision: Treat an assisted-channel pay-all choice as one bounded multi-case command with a single idempotency key and batch receipt, while retaining a payment record and workflow event on every included challan.
- Why: Sequential browser calls could leave a citizen with only part of the selected set posted after a retry, stale screen or network interruption.
- Consequence: The repository locks/checks all selected versions before writing, rolls the whole transaction back on conflict, and returns the same receipt on a duplicate request. This remains a synthetic payment demonstration and never collects financial credentials.

## D-044 — Dialogs isolate the active task semantically

- Status: Accepted
- Date: 5 September 2026
- Decision: When a dialog opens, move focus inside it, make every obscured application sibling inert and `aria-hidden`, wrap Tab/Shift+Tab within the dialog and restore the prior semantic state on close.
- Why: A visual overlay alone still exposes the complete case page to keyboard and screen-reader navigation, creating two competing tasks and misleading automated contrast results.
- Consequence: Account, grievance, single-payment and batch-payment dialogs share one accessible interaction boundary on mobile and desktop.

## D-045 — WhatsApp payment intent chooses a mock route before web handoff

- Status: Accepted
- Date: 7 September 2026
- Decision: After a citizen selects one, several or all eligible challans in WhatsApp, show an explicit review checkpoint and a choice of familiar UPI-app labels before creating the one-time signed web handoff. The selected route is carried into the web review, persisted on the synthetic payment and printed on the downloadable receipt.
- Why: Reopening the selection list after every choice looked like a loop and did not give the citizen a clear next action. A recognizable route choice makes the prototype easy to explain without collecting a UPI ID, PIN, OTP or financial credential.
- Consequence: Google Pay, PhonePe, Paytm and Other UPI are interface labels for a mock adapter only. No native app is invoked, no Razorpay credential is used, and no real payment occurs in this competition build.
