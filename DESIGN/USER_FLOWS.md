# User flows

## Flow A — contest a wrong-vehicle challan

```text
Home
  -> Check challan
  -> Enter seeded demo ID + jurisdiction hint
  -> Case overview
      -> Confirm allegation facts
      -> Compare enforcement image with vehicle profile
      -> Choose Contest
  -> Deadline and eligibility preflight
  -> Select ground: Vehicle shown is not mine
  -> Answer structured questions
  -> Upload synthetic registration image and vehicle photo
  -> Review AI extraction and correct fields
  -> Evidence completeness check
  -> Declaration and submission preview
  -> Submit once with idempotency key
  -> Receipt + authority + 30-day clock + timeline
  -> Reviewer receives case
  -> Reviewer compares evidence and selects Quash
  -> Reviewer provides structured reason and confirms order
  -> Citizen timeline updates
  -> Order explains outcome and closes case
```

Critical error paths:

- weak network during upload: queue/resume without losing form state;
- accidental retry: return the original submission receipt;
- missing required evidence: explain exact gap and preserve the draft;
- low AI confidence: show “could not read” and require manual input;
- stale case version: prevent overwrite, refresh events, preserve draft answers.

## Flow B — bank debit, challan still pending

```text
Case overview
  -> Payment status does not match
  -> Choose Report payment issue
  -> Enter synthetic bank/provider reference and payment time
  -> System finds mocked payment attempt
  -> Show two ledgers: provider succeeded, challan update pending
  -> Open reconciliation case
  -> Prevent duplicate payment CTA while reconciliation is active
  -> Mock worker reconciles or marks reversal pending
  -> Citizen receives status and receipt
```

## Flow C — case transferred to court

```text
Case overview
  -> Status: Transferred
  -> Explain destination, transfer time, reference, and unavailable actions
  -> Show official destination guidance without pretending integration
  -> Provide documents/checklist and deadline source
  -> Record handoff acknowledgement
```

The prototype may simulate this path but should not attempt an actual court filing.

## Flow D — request for information

```text
Reviewer case
  -> Request specific missing item + due date + reason
  -> Citizen timeline updates and notification is mocked
  -> Citizen opens the exact missing-item step
  -> Upload/answer; prior packet remains intact
  -> Resubmit supplement
  -> Same review task returns to queue with version comparison
```

## Flow E — rejection and next choice

```text
Reviewer rejects with valid reason code + plain-language explanation
  -> Citizen sees decision, evidence considered, date, and order metadata
  -> Shows pay-by date and court option from jurisdiction configuration
  -> Any deposit rule is labeled with source and configuration date
  -> User chooses simulated payment or reads court handoff guidance
```

## Assisted-service flow

An operator can help a citizen navigate while the citizen remains the declarant. The audit trail records the operator role, the citizen's confirmation, and the channel. Operators cannot make reviewer decisions or reuse evidence outside the case.

