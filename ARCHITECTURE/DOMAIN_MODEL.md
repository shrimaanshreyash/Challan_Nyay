# Domain model and state machines

## Core entities

| Entity | Purpose | Important fields |
|---|---|---|
| `Jurisdiction` | State/UT/authority configuration | code, authority, capabilities, rule version, destination links |
| `Challan` | Normalized allegation | synthetic source ID, issue time, offences, amount, place, evidence, jurisdiction |
| `VehicleRef` | Minimal vehicle reference | masked registration, class, make/model/colour, synthetic flag |
| `Case` | Citizen resolution aggregate | ID, challan, owner, state, action owner, version, clocks |
| `ContestDraft` | Recoverable work in progress | selected ground, answers, evidence refs, content version |
| `Submission` | Immutable declared packet | snapshot, declaration, submitted time, receipt |
| `EvidenceItem` | File or structured fact | type, source, hash, scan state, extraction, confirmation, retention |
| `ReviewTask` | Authority work unit | queue, assignee, SLA, completeness, status |
| `InformationRequest` | Specific supplement request | requested item, reason, due date, response version |
| `Decision` | Consequential human outcome | result, reason code, explanation, evidence considered, order metadata |
| `PaymentAttempt` | Payment/provider ledger | idempotency key, provider ref, amount, provider state, challan-ledger state |
| `Handoff` | Court/RTO transition | destination type, reference, transferred time, acknowledgment |
| `Notification` | Delivery record | channel, template version, destination class, status; no message body in logs |
| `AuditEvent` | Append-only accountability | actor, action, object, time, correlation, before/after references |
| `ConsentRecord` | Purpose and declaration evidence | purpose, text version, actor, time, withdrawal/expiry where relevant |

## Case state machine

```text
ISSUED
  -> VIEWED
      -> ACCEPTED -> PAYMENT_PENDING -> PAID
      -> CONTEST_DRAFT -> CONTEST_SUBMITTED -> TRIAGED -> UNDER_REVIEW
          -> NEEDS_INFORMATION -> SUPPLEMENT_SUBMITTED -> UNDER_REVIEW
          -> QUASHED
          -> REJECTED -> PAYABLE_AFTER_REJECTION -> PAID
                     -> COURT_HANDOFF_INITIATED -> COURT_TRANSFERRED
          -> RULE_CLOCK_REMEDY_PENDING -> QUASHED (mocked, rule-configured action)

Any applicable state -> DATA_CORRECTION_PENDING
Any payment state -> PAYMENT_RECONCILIATION
Terminal: PAID, QUASHED, CLOSED_AFTER_COURT_RESULT
```

`RULE_CLOCK_REMEDY_PENDING` is deliberately not an automatic legal conclusion in a real deployment. The prototype can simulate the Rule 167 consequence, but a production connector requires authority/legal confirmation of how the state applies in that jurisdiction.

## Action-owner invariant

Every open state has one next-action owner:

| State family | Owner |
|---|---|
| Draft / needs information | Citizen |
| Submitted / triaged / review | Authority |
| Payment processing | Payment provider or reconciliation team |
| Court transferred | Named court/handoff destination |
| Closed | None; next actions are optional appeal/payment guidance where legally applicable |

## Payment state machine

```text
CREATED -> PROVIDER_PENDING -> PROVIDER_SUCCEEDED -> LEDGER_POSTED -> RECEIPTED
                         |                   |
                         |                   -> RECONCILIATION_REQUIRED
                         -> PROVIDER_FAILED
                         -> REVERSAL_PENDING -> REVERSED
```

Rules:

- provider success is not identical to challan-ledger posting;
- while success is unconfirmed, suppress a high-pressure duplicate payment action;
- a retry uses a new attempt but remains linked to the same payment intent;
- all callback/reconciliation handlers are idempotent;
- the demo never transfers real money.

## Contest grounds in the synthetic demo

- vehicle in enforcement evidence is not mine;
- vehicle was sold/transferred before the event;
- challan facts contain a material error;
- alleged offence conflicts with supplied documentary evidence;
- duplicate challan for the same event;
- payment completed but challan remains unpaid (service issue, not merits contest);
- person or vehicle is not the responsible party under the configured scenario.

Grounds are content/configuration, not universal legal guarantees. Each shows a source date, jurisdiction applicability, required evidence, and review disclaimer.

## Domain invariants

- A `Submission` is immutable; supplements create new versions.
- Only an authorized human reviewer can create a `Decision`.
- A decision requires a valid transition, reason code, explanation, and evidence-considered list.
- Evidence used in a decision must be in `CLEAN` scan state and visible to the reviewer.
- AI output cannot populate a confirmed fact without explicit human confirmation.
- A public demo case and every linked record must carry `synthetic = true`.
- Dates are calculated from effective-dated rule configuration and stored with calculation inputs.
- Audit events cannot be updated or deleted through application endpoints.

## Seed scenarios

1. `CN-DEMO-WRONG-VEHICLE` — complete citizen-to-quash path.
2. `CN-DEMO-PAYMENT-MISMATCH` — provider success, ledger pending, reconciliation.
3. `CN-DEMO-COURT-HANDOFF` — transferred case with explicit destination guidance.
4. `CN-DEMO-NEEDS-INFO` — reviewer request and citizen supplement.
5. `CN-DEMO-REJECTED` — reasoned rejection, payment/court next step.

