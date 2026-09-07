# Acceptance criteria

## AC-01 — independent identity

Given any public page, when a user views the header or service identity, then the product clearly states it is an independent prototype using synthetic data, and no official emblem/logo/endorsement appears.

## AC-02 — nationwide truth

Given a seeded case, when it loads, then its jurisdiction, configured authority, adapter mode, rule/content version, and coverage limitations are visible or reachable; no page claims universal live integration.

## AC-03 — case understanding

Given `CN-DEMO-WRONG-VEHICLE`, when the overview loads, then the user can identify the alleged offence, event date/place, amount, enforcement evidence, case status, next-action owner, deadline, and available actions without opening another page.

## AC-04 — deadline explanation

Given a case clock, when opened, then it shows the start event/date, days remaining, source, consequence, and any configured uncertainty. Date math is unit tested at boundaries and time-zone transitions.

## AC-05 — guided ground

Given the user chooses to contest, when selecting “vehicle shown is not mine,” then the UI shows eligibility guidance and required/recommended synthetic evidence before upload and collects structured answers.

## AC-06 — recoverable evidence

Given a valid synthetic file, when upload is interrupted, then the draft and completed fields remain, retry is available, and no duplicate evidence item is created. Invalid type/size is rejected accessibly.

## AC-07 — correctable AI

Given AI extraction is enabled, when candidate values appear, then the source and uncertainty are visible, every material value is editable/confirmable, and no value is treated as fact before confirmation. With AI disabled, manual completion still works.

## AC-08 — evidence completeness

Given a draft is missing required proof, when the user reviews it, then the exact missing item is explained and submission is safely blocked without losing work. Recommended evidence does not masquerade as required.

## AC-09 — idempotent submission

Given the same final submission is retried with the same idempotency key, then exactly one immutable submission, review task, receipt, and submission audit event exist.

## AC-10 — reviewer queue

Given a submitted contest, when the reviewer opens the queue, then it appears with correct jurisdiction, ground, completeness, age/SLA, and unassigned/assigned state.

## AC-11 — reasoned human decision

Given an authorized reviewer, when quashing or rejecting, then a valid reason code, plain-language explanation, evidence-considered list, confirmation, and current aggregate version are required. AI cannot invoke this endpoint.

## AC-12 — citizen decision

Given a confirmed reviewer decision, when the citizen reloads the case, then the status, order metadata, reason, evidence considered, decision time, and lawful configured next action agree with the timeline.

## AC-13 — information request

Given a reviewer requests one missing item, when the citizen responds, then the product opens the bounded supplement step, preserves the prior packet, stores a new version, and returns the same task to review.

## AC-14 — payment mismatch

Given provider state is `SUCCEEDED` and ledger state is not posted, then the UI labels reconciliation, suppresses duplicate-payment pressure, exposes the provider reference, and resolves through an idempotent mocked worker.

## AC-15 — authorization

Given a citizen/reviewer without access to a case, when any case, evidence, review, decision, or operations endpoint is requested, then access is denied without revealing whether the target exists; an audit/security event is recorded as appropriate.

## AC-16 — accessibility

The primary path completes by keyboard, passes automated axe checks, works at 200% zoom/320px width, announces errors/status, and is manually checked with NVDA + Firefox. Colour is never the sole state signal.

## AC-17 — slow network

Under the agreed throttled profile, the first useful citizen shell meets the documented target, no core action depends on AI/analytics, and interrupted save/upload behavior is recoverable.

## AC-18 — public demo

From a clean private browser, a judge can discover the seeded ID, finish the primary citizen flow, enter reviewer demo mode, decide the case, and see the citizen update without privileged setup, real data, or external side effects.

## AC-19 — observability

Given the primary flow, logs/traces can follow one correlation ID through lookup, submission, routing, review, and decision without containing evidence bodies, secrets, full identifiers, or contact information.

## AC-20 — truthful handoff

The submission, video, README, and UI consistently label each capability as implemented, mocked, planned, or unavailable. No planned feature appears as completed.

## AC-21 — protected citizen lookup

Given a fresh visit, when a citizen selects challan, vehicle, or DL lookup, then the case is not disclosed until the identifier and an unexpired server-issued human check are valid. The demo accepts only documented synthetic identifiers.

## AC-22 — language and accessible shell

The entry supports working English, Hindi, and Telugu selection with Unicode; skip navigation, text controls, high contrast, semantic headings, labelled fields, keyboard focus, and responsive reflow. It is labelled as a pilot, not complete 22-language coverage.

## AC-23 — mock payment integrity

Given an actionable synthetic case, when the citizen confirms a mock payment, then exactly one payment attempt and audit event exist for an idempotency key; provider and ledger states are distinct; a receipt is returned; and no UPI ID, card, bank account, password, or OTP is collected.

## AC-24 — reference-led public entry

At desktop and 390px mobile widths, the first screen presents the independent identity, concise two-line purpose, original road illustration, protected three-identifier lookup and four service actions without horizontal overflow. The lookup remains the visual and keyboard-primary action.

## AC-25 — first-round scope discipline

The first-round UI contains no chatbot, floating assistant, fake assistant transcript or non-working assistant control. The working lookup, case understanding, dispute, payment mock, tracking and reviewer loop remain the demonstrated scope.

## AC-26 — evidence and location consistency

Given any seeded case, when its detail page opens, then the allegation location, embedded map marker, capture source, detected vehicle, plate record and comparison language agree. Historical cases without retained visual evidence disclose that limitation instead of reusing an unrelated image.

## AC-27 — navigation position and high contrast

Given a citizen moves between top-level views, when the next view renders, then it starts at the top. When high contrast is enabled, the landing lookup, selected tab, demo badge, form values, helper copy and primary action remain readable with visible focus and state cues.

## AC-28 — public API gateway

Given the public Vercel URL, when the landing page requests any nested `/api/*` route, then the request reaches the Fastify handler, returns JSON with a correlation ID, and never exposes an HTML or plain-text parser error to the citizen.

## AC-29 — serverless-safe human check

Given the challenge and lookup requests execute on different serverless instances, when the citizen submits the correct answer before expiry, then the signed challenge validates and the synthetic case opens without relying on process-local memory.

## AC-30 — concurrent citizen isolation

Given two clean browser sessions receive separate signed synthetic workspaces, when both mutate the same seeded case ID, then every case, draft, payment, receipt, idempotency record, reset, and audit event remains scoped to its owning session before and after refresh or a function cold start.

## AC-31 — protected authority boundary

Given the authority URL is known, when an unauthenticated user or a citizen session requests any authority page or endpoint, then access is denied without case disclosure. A short-lived demo reviewer session sees only tasks in its configured synthetic jurisdiction and every action is role-checked server-side.

## AC-32 — issue-specific resolution contract

Given a citizen selects any supported issue, when the resolution flow opens, then its questions, required/recommended synthetic evidence, validation, routing tag, reviewer checklist, reason codes, and safe outcomes match `DESIGN/ISSUE_SPECIFIC_RESOLUTION_FLOWS.md`; a generic statement alone cannot bypass required structured proof.

## AC-33 — mobile-first citizen entry

At 320 px and 390 px widths, the identity/header is compact, the primary lookup begins in the first useful viewport, navigation is fully reachable without clipping, touch targets are at least 44 px, and loading/deferred media cannot block case facts or the next action.

## AC-34 — bounded guide parity

If Nyay Guide is enabled, every answer cites an authorized case field or approved help item and every suggested action is also reachable without chat. The guide cannot submit, pay, decide, predict guilt, or expose another session; disabling it leaves the complete primary journey intact.

## AC-35 — visual vehicle identity and body mismatch

Given an account has multiple vehicles, when the citizen views saved vehicles, challans, or a case, then each vehicle shows its registration, make/model label, body type, colour, and matching synthetic thumbnail. In the flagship wrong-vehicle case, the captured plate matches the authorized registration while the observed vehicle body and colour differ; both profiles and the original evidence remain visible without depending on AI.

## AC-36 — Mobile-first entry navigation

At 390 px, primary navigation is collapsed behind a labelled, keyboard-accessible menu. Opening it exposes Home, My challans, Services, How it works, and Help without horizontal clipping. The protected lookup begins in the first useful mobile viewport, and icon-only account/reviewer actions retain accessible names.

## AC-37 — API-driven issue-specific dispute packet

Given any of the six supported reasons, the dispute screen renders the server-owned questions and evidence checklist. Submission rejects incomplete structured details and stores the normalized routing tag, details, evidence requirements, reviewer checklist, and allowed outcomes with the contest.

## AC-38 — session-scoped local proof

Given two local citizen sessions, when each changes the same seeded case, then lookup, contest, payment, reset, audit and reviewer state remain isolated to the owning session after refresh. This criterion does not count as deployed durability until the managed Postgres adapter passes the same test across cold function instances.

## AC-39 — bounded missing-information loop

Given a reviewer cannot decide from the submitted packet, when they request one named item with a reason, then the citizen sees the request, adds a synthetic response as a new packet version, and returns the same case to the same review queue without overwriting prior evidence.

## AC-40 — citizen and authority route separation

Given a citizen browses the public site, then the authority workspace is absent from citizen navigation and services. Opening `/authority` requires a short-lived reviewer role, and the authority shell cannot be mistaken for a citizen destination.

## AC-41 — truthful reviewer evidence state

Given a historical task has no retained image path, when the reviewer opens it, then the page shows a compact source, timestamp and location fallback instead of an empty image frame or unrelated synthetic evidence.

## AC-42 — canonical navigation and connected landing journey

Given a citizen opens, refreshes, or returns through browser history, then Home, Services, My challans, Account, case detail and Authority resolve to stable paths. The landing journey explains Find, Understand, Choose, Resolve and Track as one connected process on desktop and mobile without a sticky header hiding its target heading.

## AC-43 — high-volume authority queue

Given a synthetic jurisdiction contains at least 100,000 historical cases, when an officer opens the authority workspace, then only aggregate counters and one cursor-paginated worklist page are returned. The interface provides New, Unassigned, My batch, Waiting for citizen, Due today, Escalated and Resolved views without rendering or transferring the complete dataset.

## AC-44 — multi-reviewer assignment safety

Given at least two reviewers and one supervisor, when cases are batched, claimed, released or reassigned, then every case has at most one active assignment, every ownership change is audited, workload counts update from persisted assignments, and two concurrent decisions result in one success plus one version conflict.

## AC-45 — operational filtering and ageing

Given cases span multiple days, issues, priorities and states, when an officer filters or searches, then results are jurisdiction-scoped, server-filtered, stably sorted and paginated. Each row exposes received age, SLA risk, completeness, current owner and assignment without loading evidence until opened.

## AC-46 — event-backed citizen tracker

Given a case progresses through submission, acknowledgement, assignment, review, information request/response and decision, when the citizen refreshes or reopens it, then every displayed stage, timestamp, owner and next action is reconstructed from committed workflow events. Visiting a page or waiting locally cannot advance the tracker.

## AC-47 — traceable cross-surface state

Given an authority officer claims, requests information, reassigns or decides a case, when the citizen view next reads the case, then it reflects the same aggregate version and audit event. The authority queue, reviewer case view, citizen tracker and final order cannot disagree about current state or owner.

## AC-48 — compact mobile service header

At 320–430 px, the prototype disclosure occupies one compact line and font, contrast and language controls are available through one labelled accessibility panel. Brand, account and navigation remain one row, all targets are at least 44 px, and the useful citizen heading is not delayed by a wrapped utility toolbar.

## AC-49 — coherent high-contrast rendering

Given high contrast is enabled at mobile or desktop width, then page, hero, lookup, cards, tabs, fields, timelines and navigation use one semantic token system. No heading crosses conflicting backgrounds, no navy text appears on a near-black surface, selected/disabled/focus states remain distinguishable, and yellow is limited to meaningful emphasis.

## AC-50 — scroll without visible scrollbar chrome

Given a page exceeds the viewport, when scrollbar chrome is visually hidden, then touch, wheel, keyboard, Page Up/Down, Home/End and assistive scrolling continue to work. Opening and closing a modal cannot leave the document scroll-locked.

## AC-51 — finished mobile journey presentation

At 320–430 px, the Find, Understand, Choose, Resolve and Track explanation presents one connected hierarchy with compact spacing, non-repetitive emphasis and a visible terminal receipt/final-order outcome. It has no clipped copy, oversized gaps or decorative element that competes with the step action.

## AC-52 — responsive accessibility regression matrix

The landing, account, challan list/detail, dispute, tracker and authority flows pass visual and interaction checks at 320, 360, 390, 412, 768, 1024 and 1440 px in default/high-contrast states and at 200% zoom. Screenshot review supplements but does not replace keyboard, focus, semantic and contrast-ratio verification.

## AC-53 — production repository selection

Given a managed PostgreSQL URL is configured, when the API starts, then it migrates and uses PostgreSQL through the shared repository contract. Given Vercel execution has no database URL, startup fails clearly instead of silently using ephemeral memory. Local development without a URL continues to use SQLite.

## AC-54 — atomic case mutation

Given a consequential write has an expected case version and idempotency key, when it commits, then the case payload/version, audit event, workflow event and stored response succeed in one transaction. A repeated key returns the original response, while a different stale write returns a version conflict and appends no event.

## AC-55 — WhatsApp channel parity

Given a synthetic citizen starts through the WhatsApp adapter, when they select English or Hindi and look up a vehicle/challan, then the adapter reads the same session-scoped cases and returns the same amount, evidence summary, owner, status and next action as the web experience. It must not maintain a second case database.

## AC-56 — deterministic WhatsApp actions

Given the citizen selects pay one, pay all, raise a grievance or track a case, then reply/list identifiers map to allowlisted commands, consequential writes require confirmation and idempotency, and every committed action produces the same workflow/audit event as its web equivalent. Unrecognized free text cannot mutate a case.

## AC-57 — safe channel identity and payment handoff

Given a WhatsApp sender provides a synthetic vehicle or challan identifier, then the demo performs its explicit synthetic verification before disclosing case details. Payment creates only a signed, expiring, single-purpose web handoff; the bot never requests or receives a UPI PIN, card number, bank credential, real OTP or reusable case token.

## AC-58 — strict API mutation boundary

Given a citizen or authority submits a consequential request, then its idempotency key and allowlisted fields pass a bounded runtime schema and its `expectedVersion` matches the displayed aggregate. Unknown fields fail with `INVALID_REQUEST`; a stale version fails with `CASE_VERSION_CONFLICT`; neither failure changes the case or audit log. Production startup rejects built-in signing secrets.

## AC-59 — versioned grievance draft recovery

Given a citizen starts any supported grievance, when fields change or they choose Save & close, then one session-scoped server draft stores the selected issue, structured answers, statement and declaration. Reopening restores the exact draft and version; a stale draft write fails with `DRAFT_VERSION_CONFLICT`, and successful submission removes the draft in the same transaction as the case mutation.

## AC-60 — issue-contract decision safety

Given an authority reviewer opens a submitted grievance, then the citizen answers, required/recommended evidence, routing tag and reviewer checklist come from its stored issue packet. Only that packet's allowed outcomes can be recorded, and a missing-information request can name only an item from the issue's evidence contract.

## AC-61 — immutable workflow backfill

Given a session already has persisted workflow events, when startup compatibility backfill runs again, then no historical event is duplicated or assigned a newer aggregate version. Backfill applies only to cases with no workflow-event history.

## AC-62 — shared evidence integrity passport

Given a challan has retained synthetic enforcement media, when the citizen or authority opens it, then both surfaces receive the same server-computed passport containing capture source/event ID, immutable-original asset/hash, derived-crop parent, plate comparison, body/colour comparison, registry snapshot and coordinate provenance. A matching plate is never presented as proof that the vehicle body also matches.

## AC-63 — evidence survives workflow mutations unchanged

Given a citizen submits, pays or supplements a case and an authority claims, requests information or decides it, then the original evidence envelope, derived-asset lineage and registry snapshot remain byte-for-byte unchanged. Request payloads cannot supply replacement evidence fields through these workflow routes.

## AC-64 — low-data mode preserves the service task

Given low-data mode is enabled, when a citizen opens Home or a case and an authority opens evidence, then decorative hero art, evidence previews, plate crops and the map embed are withheld by default while all facts, provenance, actions and external-map fallback remain usable. One explicit load action may fetch the deferred case media.

## AC-65 — compact accessibility controls and native scrolling

Given a 320 px or wider supported viewport, when a keyboard, touch or pointer user opens the accessibility panel, then text size, contrast, low-data and language controls remain labelled and reachable without horizontal document overflow. Visible scrollbar chrome may be hidden, but Page Down, wheel, touch and assistive scrolling remain native and functional.

## AC-66 — real-browser citizen-to-authority lifecycle

Given a clean synthetic browser session, when a citizen completes protected lookup, submits the wrong-vehicle packet, a separately authenticated reviewer claims and quashes it, and the citizen refreshes the case, then the recorded order and decision event remain visible. Reset returns only that synthetic session to its seed state.

## AC-67 — restart isolation and concurrent decision safety

Given two citizen sessions mutate the same seeded case differently in a file-backed local repository, when the application closes and reopens, then both states and the reviewer queue remain isolated and recoverable. Given two distinct decision commands target one displayed case version, exactly one commits and the other receives a version conflict.

## AC-68 — release claims are machine checked

Given a release candidate has been built, when the local release audit runs, then required gateway, persistence, disclosure and optimized-asset files exist; common live-secret signatures and official-looking asset filenames are absent; asset budgets pass; and the README continues to label the public deployment and managed-database proof honestly.

## AC-69 — atomic assisted-channel pay all

Given a verified channel session has two or more eligible challans, when the citizen confirms pay all through the one-time web handoff, then the review screen names every selected case and total amount before any write. One idempotency key either posts every selected case with one batch receipt or posts none; a stale version, missing case or duplicate selection cannot partially charge the synthetic ledger.

## AC-70 — modal focus and background isolation

Given any account, grievance or payment dialog is open, then focus enters the dialog, Tab and Shift+Tab remain inside it, Escape closes it, and the obscured application is inert and hidden from assistive technology until the dialog closes. Mobile dialog scans must not report background content as part of the active task.

## AC-71 — lookup-specific evidence and return context

Given a citizen opens a guest vehicle, challan-number or driving-licence result, then the case shows evidence belonging to that seeded lookup rather than landing artwork or another case. Back returns to the protected lookup even when a demo account is active; cases opened from the account dashboard or challan list return to their respective source.

## AC-72 — assisted payment selection and receipt continuity

Given a verified WhatsApp citizen selects one, several or all eligible challans, then each toggle leads to a visible Review and pay checkpoint instead of reopening the same list. Before handoff, the citizen chooses a clearly synthetic UPI-app route; the one-time web review opens with that route selected, commits through the same atomic payment service, and exposes a downloadable synthetic receipt containing the route, provider and challan-ledger states.
