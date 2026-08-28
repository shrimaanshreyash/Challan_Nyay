# Business architecture

## Public-value thesis

Challan Nyay reduces the cost of uncertainty for citizens and the cost of incomplete, misrouted work for authorities. It does not earn from fines, dispute outcomes, or citizen distress.

## Outcomes by stakeholder

| Stakeholder | Current burden | Desired outcome | Product capability |
|---|---|---|---|
| Citizen/vehicle owner | Portal guessing, unclear evidence/deadlines/status | Correct route, complete packet, understandable decision | Discovery, guidance, contest builder, timeline |
| Reviewer | Unstructured complaints and scattered evidence | Comparable, evidence-complete cases with valid transitions | Queue, packet, request, reasoned decision |
| Supervisor | Ageing invisible until escalation | SLA/risk visibility and reason quality | Operations controls and audit |
| State/UT authority | Local rules mixed into generic portal behavior | Configured jurisdiction capabilities and rule versions | Rules/content registry and adapter contract |
| NIC/MoRTH platform team | Integration heterogeneity | Stable canonical exchange model | Versioned schemas and capability negotiation |
| Payment/bank teams | Ambiguous provider vs ledger state | Traceable reconciliation | Payment attempt state machine |
| Courts/RTO | Incomplete or opaque handoffs | Named destination, reference, and state | Handoff module |
| Helpdesk/assisted service | Repeated explanations and lost context | Citizen-consented, bounded assistance | Assisted-service role and case context |

## Capability map

### Experience

- source verification and case discovery;
- plain-language case understanding;
- action/deadline guidance;
- evidence-led contest preparation;
- receipt, timeline, and decision comprehension;
- multilingual, accessible, assisted service.

### Case operations

- jurisdiction routing and capability detection;
- submission validation and immutable versioning;
- work allocation and SLA monitoring;
- information request and supplement;
- reasoned decision/order publication;
- payment reconciliation and court/RTO handoff.

### Control

- effective-dated rules and content;
- identity, role, jurisdiction, and evidence access;
- audit, observability, quality, and exception management;
- privacy, retention, consent, and incident management;
- adapter certification and change governance.

## Operating model

### Product owner

Owns the national/common service contract, canonical domain, citizen experience, accessibility, analytics definitions, and adapter conformance.

### Jurisdiction owner

Owns authority identity, configured grounds/evidence, local destinations, content approval, reviewer access, and operational SLA handling.

### Review team

Owns human review and reasoned decisions. AI output is advisory and cannot alter authority.

### Platform operations

Owns availability, queues, evidence infrastructure, audit integrity, security, incident response, and adapter health.

### Content/legal/accessibility governance

Approves effective-dated source explanations, translations, form questions, deadline semantics, and accessibility conformance evidence.

## Value and funding boundaries

Preferred public-interest models:

- government-funded open digital public infrastructure;
- licensed deployment/support to authorities without citizen outcome fees;
- implementation and operations contract with transparent service levels;
- open-source core with paid integration/support, if the user adopts the recommended licence.

Prohibited incentives:

- percentage of collected fines;
- paid priority for disputes;
- sale of case data or advertising targeting;
- commissions from loans, legal leads, or payment retries;
- reviewer performance based only on closure/rejection volume.

## Service-level framework

Legal clocks and platform SLOs are distinct:

- Rule clock: configured from authoritative law/jurisdiction and visible to citizen/reviewer.
- Platform SLO: availability, submission durability, job latency, notification delivery, and reconciliation handling.
- Operations target: reviewer queue response and reason quality; it cannot silently redefine the legal clock.

Each clock stores the source, version, start event, pause/exception rule, owner, and measurement evidence.

## Rollout model after the hackathon

1. Independent synthetic usability and accessibility validation.
2. One-authority sandbox using fictional cases and documented APIs.
3. Shadow workflow where staff compare packets without making live decisions.
4. Limited real pilot only after legal/privacy/security approval and citizen support plan.
5. Jurisdiction expansion through adapter conformance and content/rule certification.

No phase is described as nationwide production until real authorized coverage and acceptance evidence exist.

## Business KPIs

- evidence-complete submission rate;
- correct-jurisdiction routing rate;
- citizen completion and comprehension;
- reviewer handling time separated from decision outcome;
- request-for-information and reopened-case rate;
- decision reason completeness;
- ageing/SLA distribution;
- payment mismatch resolution time;
- accessibility completion parity by channel/language;
- helpdesk contacts per resolved case;
- adapter error and manual-exception rate.

