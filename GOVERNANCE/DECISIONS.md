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
