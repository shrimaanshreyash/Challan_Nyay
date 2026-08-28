# Citizen account and evidence pipeline

## Product boundary

The five reference screens describe one connected service, not five unrelated pages:

```text
Guest vehicle lookup -> Challan list -> Challan detail -> Pay or dispute -> Track outcome
          |                                                        ^
          +-> Optional mobile-verified account -> Saved vehicles --+
```

The public link must remain usable without an account. An account is an optional convenience for citizens who own or manage multiple vehicles.

## Identity and vehicle resolution

### Guest mode

1. Vehicle number is the primary lookup key.
2. Challan number is the second option for citizens arriving from a notice or message.
3. Driving-licence number is the third option.
4. The public request passes bot protection and rate limits before the challan adapter is queried.
5. The response is a bounded challan view, not a full citizen profile.

### Account mode

1. The citizen verifies a mobile-controlled session through an approved identity gateway.
2. The identity gateway returns an opaque verified-subject claim.
3. A `VehicleRegistryGateway` resolves vehicles the subject is authorized to manage from VAHAN or an authorized state-RTA source.
4. Challan Nyay stores only opaque links, consent/session metadata, preferences, and cached read models with short retention. The registry remains the source of truth.
5. Each vehicle is passed to the `ChallanGateway`; normalized notices are grouped into one account dashboard.

The current prototype uses a visible synthetic OTP and seeded vehicles. It sends no SMS, accepts no real number, and does not claim a live registry connection.

## Evidence ingestion

Two capture sources share one normalized envelope:

| Source | Ingestion path | Required metadata |
|---|---|---|
| Fixed camera | Signed camera/enforcement event through an authority adapter | device/source ID, captured time, coordinates, calibration/source metadata, original frame hash |
| Officer mobile | Authorized officer upload or signed enforcement-app event | officer/agency claim, captured time, coordinates and accuracy, original file hash, upload audit event |

For both sources:

1. Retain the immutable original in evidence object storage.
2. Validate type and size, scan the file, hash it, and record the ingest actor.
3. Create derived renditions such as a compressed preview and plate crop. Never replace the original with a crop.
4. Store latitude, longitude, accuracy, capture timestamp, capture source, and map-display consent/policy.
5. Link every derived asset to its source evidence ID and transformation metadata.
6. Display the original frame, plate crop, capture source, location map, plain-language allegation, and rule version together.

The seed case represents a fixed-camera event. `OFFICER_MOBILE` is the second supported architecture value; a real officer-upload connector remains out of scope until an authorized API and identity contract exist.

## Map provider boundary

`MapGateway` owns rendering/provider configuration. The browser receives only approved coordinates and a citizen-safe accuracy label.

- Hackathon mode: attributed OpenStreetMap embed with an external fallback link.
- Production mode: contracted tile/embed provider, rate and privacy controls, provider key outside source, and a low-bandwidth text/link fallback.
- The map is evidence context, not turn-by-turn navigation and not proof of guilt by itself.

## Service modules

```text
Citizen web
  -> IdentityGateway
  -> VehicleRegistryGateway
  -> ChallanGateway
  -> Case service
       -> Evidence store and rendition worker
       -> MapGateway
       -> Contest/review workflow
       -> PaymentGateway and reconciliation ledger
       -> Append-only audit log
```

Adapters normalize state-specific schemas while the citizen UI remains consistent. Each normalized record retains the source authority, jurisdiction, adapter version, rule version, and raw-source reference.

## Implemented now

- vehicle-first guest lookup with accessible human check;
- challan-number and driving-licence lookup alternatives;
- optional synthetic mobile-OTP account entry;
- saved multi-vehicle account dashboard;
- account challan list with working status filter and record download;
- API-backed seeded case, payment, contest, reviewer decision and audit timeline;
- original synthetic enforcement frame plus derived synthetic plate crop;
- capture-source and integrity metadata;
- live attributed OpenStreetMap location embed and fallback link.

## Deferred until authorized integration exists

- real OTP or identity federation;
- VAHAN/state-RTA vehicle ownership resolution;
- live challan, camera or officer-app feeds;
- real uploads, object storage, malware scanning and rendition jobs;
- real payment providers, callbacks and settlement reconciliation;
- production map-provider contract and keys.
