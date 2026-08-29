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
