# Service blueprint

## End-to-end blueprint

| Stage | Citizen frontstage | Authority frontstage | Backstage process | Supporting system | Evidence of success |
|---|---|---|---|---|---|
| Discover | Verifies source and finds case | — | Jurisdiction/capability lookup | Mock challan adapter, content registry | Correct case and coverage label |
| Understand | Reads allegation, evidence, deadline, choices | — | Rule-version and deadline calculation | Domain rules service | User can explain next step |
| Prepare | Selects ground, answers prompts, uploads evidence | — | File validation, extraction, completeness | Evidence store, AI assist | Complete, confirmed packet |
| Submit | Confirms declaration and receives receipt | New case appears in queue | Idempotent submission, routing, audit event | Mock authority adapter | One case, one receipt, correct queue |
| Review | Tracks current owner and SLA | Reviews evidence and source-linked summary | Assignment, policy checks, version control | Case service, rules registry | Reasonable review packet |
| Clarify | Supplies requested item | Sends bounded request | Notification and supplement version | Mock notification adapter | No form restart or lost evidence |
| Decide | Reads reasoned order | Quashes/rejects with reason | Validate transition, sign metadata, publish event | Decision service | Order and timeline agree |
| Continue | Pays, closes, or follows court guidance | Monitors exceptions | Reconciliation or handoff event | Mock payment/court adapters | No ambiguous “pending” state |

## Business capabilities

- case discovery and identity association;
- jurisdiction and authority routing;
- deadline and rule-version management;
- evidence acquisition, validation, and retention;
- guided contest composition;
- submission and immutable receipt;
- review queue, assignment, and decision;
- request-for-information loop;
- payment attempt and reconciliation;
- court/RTO handoff tracking;
- notification and assisted service;
- audit, reporting, and content/language governance.

## Stakeholders

- citizens, owners, and authorized drivers;
- state/UT traffic police and transport departments;
- MoRTH/NIC eChallan platform teams;
- VAHAN/RTO service owners;
- payment providers and banks;
- Virtual Courts/eCourts and regular courts;
- helpdesk and Common Service Centre-style assisted channels;
- legal, privacy, security, accessibility, and language reviewers.

## Ownership principle

Every non-terminal case state has exactly one named next-action owner: citizen, authority reviewer, payment provider, platform reconciliation, or court/handoff destination. “System” is not an acceptable owner label in citizen copy.

## Operational views that make the redesign credible

- ageing queue grouped by jurisdiction and SLA;
- cases missing evidence before review;
- requests for information awaiting citizen action;
- reason-code distribution and unstructured-reason exceptions;
- payment ledger mismatch queue;
- handoffs without acknowledgment;
- translation/content version attached to each decision.

