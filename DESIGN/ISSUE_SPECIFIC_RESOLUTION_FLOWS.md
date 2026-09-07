# Issue-specific resolution flows

Status: round-two implementation contract  
Data boundary: synthetic demo data only; no real documents, IDs, OTPs, payments, or government connections.

## Why this exists

A single generic complaint box moves the citizen's confusion downstream. Challan Nyay should ask only for information that can resolve the selected issue, explain why each item is useful, and give the authority reviewer the corresponding checklist. Required and recommended evidence must never be mixed.

## Shared rules for every issue

1. The citizen first reviews the allegation, original enforcement evidence, location, vehicle/plate comparison, amount, deadline, and current owner.
2. Selecting an issue changes the questions, evidence checklist, privacy notice, validation, routing tag, and reviewer decision reasons.
3. A draft is recoverable and versioned. Submission is idempotent and produces one receipt.
4. The public demo offers only named synthetic sample files. It never invites real uploads.
5. A reviewer can request one missing item without deleting the earlier packet or forcing a restart.
6. A human makes the consequential decision and records evidence considered, a reason code, a citizen-readable explanation, and an immutable order reference.

## Resolution contract matrix

| Issue | Citizen questions | Required synthetic proof | Helpful proof | Authority checks | Safe outcomes |
|---|---|---|---|---|---|
| `WRONG_VEHICLE` | Which part differs: plate, vehicle type, colour, or all? Is the registered vehicle visible in the profile? | Registration profile already attached to the demo case; citizen confirms at least one mismatch field | Clearer vehicle photo if available in a real deployment | Compare original frame, plate crop, capture metadata, and registration profile; verify source integrity | Quash for confirmed mismatch; request clearer source evidence; reject with reasons |
| `ALREADY_PAID` | Payment date, amount, method, provider/reference, and whether money was debited | Synthetic receipt or provider reference matching amount/date | Bank acknowledgement in a future approved integration | Search idempotency/provider attempt, compare provider and challan-ledger states, suppress duplicate-payment pressure | Mark paid; route to reconciliation; request reference; reject mismatch with reasons |
| `DUPLICATE_CHALLAN` | Which other challan appears to describe the same event? | Select a synthetic related challan from the account | Supporting event details | Compare time, location, offence, source, vehicle, and prior payment/decision | Merge/close duplicate; keep both with distinct explanation; request clarification |
| `VEHICLE_SOLD` | Transfer date and event date; whether transfer was completed before the event | Synthetic transfer acknowledgement with date | Delivery note in a real approved workflow | Compare transfer effective date, event time, source registry reference, and jurisdiction rules | Quash/reroute when configured rule permits; request transfer confirmation; reject with reasons |
| `WRONG_DRIVER` | Was another person driving, and is nomination supported in this jurisdiction? | Synthetic declaration and jurisdiction-supported nomination fields | Driver acknowledgement in a real approved workflow | Verify nomination is legally supported, complete, consented, and within time | Nominate/reroute through configured process; request information; reject with reasons |
| `EVIDENCE_UNCLEAR` | What is unclear: plate, vehicle, offence, time, or location? | Citizen selects at least one unclear element | Short explanation | Inspect original retained media/metadata; never treat an enhanced crop as the original | Request source review/clearer evidence; quash if allegation cannot be supported; reject with reasons |

## Path details

### 1. Wrong vehicle

- Default flagship path because the visual mismatch is immediately understandable.
- The form uses selectable mismatch fields rather than relying on a long statement.
- The review screen places the original frame, derived plate crop, detected vehicle, registered vehicle, capture source, and location together.
- A plate crop is labelled as derived; the original remains the decision source.

### 2. Already paid

- Do not ask the citizen to pay again while reconciliation is unresolved.
- Keep provider success and challan-ledger posting as separate states.
- Required demo fields: payment date, amount, method, and synthetic provider reference or receipt.
- Show who owns the next action and a reconciliation reference/status.

### 3. Duplicate challan

- Let an account holder select one related synthetic challan; do not make them retype a known ID.
- Show a side-by-side event fingerprint: vehicle, offence, time, location, capture source, and amount.
- The authority must explain why events are the same or materially different.

### 4. Vehicle sold

- Compare the transfer-effective date with the enforcement-event date in one sentence.
- The interface must avoid promising automatic liability transfer; jurisdiction configuration controls the available remedy.
- Never collect a real buyer's personal details in the public prototype.

### 5. Wrong driver

- This is not universally equivalent to wrong vehicle. Keep it a separate configured path.
- Ask only for synthetic nomination data that the configured jurisdiction supports.
- Do not expose nominated-driver details to other citizen sessions.

### 6. Evidence unclear

- The citizen identifies the disputed element, then sees the original available evidence and metadata.
- Image enhancement may aid viewing but must be visibly labelled as derived and cannot invent missing detail.
- The authority response must state which original evidence was checked.

## Draft and information-request lifecycle

`DRAFT -> READY_TO_SUBMIT -> CONTEST_SUBMITTED -> UNDER_REVIEW -> INFORMATION_REQUESTED -> CITIZEN_SUPPLEMENTED -> UNDER_REVIEW -> QUASHED | REJECTED | RECONCILIATION`

- Every transition validates the current version.
- `INFORMATION_REQUESTED` names one bounded missing item, a reason, requester, and response deadline if configured.
- The supplement adds a new packet version and audit event; it never rewrites the submitted packet.
- Closed outcomes remain readable and downloadable from the citizen account.

## Mobile presentation

- One question per section; no eight-card wall on a narrow screen.
- A sticky bottom action shows `Save draft`, `Continue`, or `Submit`, never two competing primary actions.
- The current issue, completion count, and saved status remain visible.
- Evidence defaults to compact facts; images/maps load on request or according to low-data preference.

## Acceptance evidence

- Unit tests validate each issue's required fields and allowed outcomes.
- API tests prove idempotent submission, missing-item recovery, and stale-version rejection.
- Two browser sessions submit different issues without seeing or changing each other's state.
- The authority queue receives the correct routing tag and checklist for each issue.
- Mobile tests cover 320 px and 390 px without horizontal overflow or lost drafts.
