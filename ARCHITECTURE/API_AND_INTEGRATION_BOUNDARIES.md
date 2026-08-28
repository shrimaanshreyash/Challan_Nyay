# API and integration boundaries

## API style

- JSON over HTTPS for commands and queries.
- Runtime schema validation for request and response.
- Opaque IDs; no real identifiers in routes.
- Version under `/api/v1` only when the first public contract exists.
- Problem-details-style errors with a stable code, correlation ID, safe message, and field errors.
- Optimistic concurrency with `version` or `If-Match` on case-changing commands.
- Idempotency key required for consequential POST operations.

## Planned citizen endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/cases/lookup` | Resolve a seeded case through the mock challan gateway |
| `GET` | `/cases/:id` | Case overview, capabilities, deadlines, action owner |
| `GET/PUT` | `/cases/:id/contest-draft` | Resume/save the current draft version |
| `POST` | `/evidence/uploads` | Create validated upload session |
| `POST` | `/evidence/uploads/:id/finalize` | Finalize, hash, scan, and enqueue extraction |
| `POST` | `/cases/:id/contest-submissions` | Validate and submit immutable packet |
| `POST` | `/cases/:id/supplements` | Respond to a bounded information request |
| `GET` | `/cases/:id/timeline` | Append-only citizen-safe events |
| `POST` | `/cases/:id/payment-issues` | Create reconciliation case for synthetic payment |

## Planned reviewer endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/review/tasks` | Filtered, paginated queue |
| `POST` | `/review/tasks/:id/assign` | Claim/assign with concurrency control |
| `GET` | `/review/tasks/:id` | Full authorized case packet |
| `POST` | `/review/tasks/:id/information-requests` | Request a specific supplement |
| `POST` | `/review/tasks/:id/decisions` | Create human reasoned decision |
| `GET` | `/operations/queues` | Aggregated synthetic demo metrics |

These are planned contracts, not implemented APIs.

## Adapter interfaces

### `ChallanGateway`

- lookup a challan;
- fetch allegation facts and source evidence metadata;
- read/write supported case status;
- advertise jurisdiction capabilities.

### `AuthorityGateway`

- submit a contest packet;
- receive acknowledgment/reference;
- publish a reasoned order or information request;
- report capability and schema version.

### `PaymentGateway`

- create a simulated intent;
- receive idempotent outcome event;
- query provider status;
- reconcile with challan ledger.

### `CourtGateway`

- create or read a handoff reference only where an authorized, documented integration exists;
- expose status and destination;
- never infer a court outcome from absence of data.

### `IdentityGateway`

- return a verified subject/session claim;
- never expose raw credentials to the case service;
- prototype uses seeded demo sessions, not Aadhaar or real OTP.

### `VehicleRegistryGateway`

- resolve vehicles an opaque verified subject is authorized to manage;
- return source authority, registry record reference, capability and adapter version;
- keep VAHAN or the authorized state-RTA registry as source of truth;
- prototype returns seeded vehicles and never submits a real mobile number or registry query.

### `EnforcementEvidenceGateway`

- accept normalized fixed-camera or authorized officer-mobile evidence envelopes;
- retain capture source, original-file reference, hash, timestamp, coordinates and accuracy;
- link every preview or plate crop to the immutable original and transformation record;
- prototype uses one seeded fixed-camera envelope and local synthetic assets.

### `MapGateway`

- render an approved event location without exposing provider secrets;
- preserve provider attribution and provide a low-bandwidth external fallback;
- prototype uses an attributed OpenStreetMap embed; production requires a contracted provider and privacy/rate review.

### `NotificationGateway`

- send template ID + safe variables;
- record delivery metadata;
- prototype writes to an in-app demo inbox.

### `AiAssistGateway`

- extract structured candidate fields;
- suggest a ground/checklist;
- draft a source-linked summary or translation;
- return model/config version, confidence, and safety metadata.

## Integration truth table

| Boundary | Hackathon mode | Real-world prerequisite |
|---|---|---|
| Government challan | Deterministic mock adapter | Documented API, authorization, sandbox, contract |
| Authority review | In-app reviewer workspace | Department workflow agreement and signing policy |
| Identity | Seeded demo citizen/reviewer | Approved identity federation and assisted-channel policy |
| Vehicle registry | Seeded account vehicles | Authorized VAHAN/state-RTA API and ownership/consent policy |
| Enforcement evidence | Synthetic fixed-camera frame and plate crop | Signed camera/officer-app feed, object storage, integrity and retention contract |
| Map | Attributed OpenStreetMap embed | Contracted provider, rate/privacy controls and key management |
| Payment | Synthetic provider ledger | PCI-scoped provider, callback verification, reconciliation contract |
| Court | Static mocked handoff | eCourts/Virtual Court authorization and legal mapping |
| Notifications | In-app inbox | Consent, templates, approved SMS/email provider |
| AI | Synthetic documents only | DPIA, retention review, model evals, data-control approval |

## Security requirements at boundaries

- outbound hosts allowlisted;
- signed webhooks with replay window and unique event ID;
- mTLS/service credentials where supported;
- secrets held outside source and rotated;
- strict upload content sniffing and malware scan;
- rate limits by route, identity, and case;
- no raw external payloads in ordinary logs;
- adapter failures mapped to explicit safe states, never silent success.
