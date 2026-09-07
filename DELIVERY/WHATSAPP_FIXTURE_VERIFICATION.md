# WhatsApp channel verification

Date: 7 September 2026
Scope: deterministic full-flow channel proof plus a public Meta developer callback whose live inbound `Hi` → language-selection reply was user-confirmed. This is not a production WhatsApp number or native payment service.

## Implemented

- Meta-shaped webhook verification challenge and exact-body HMAC validation;
- keyed-HMAC sender pseudonym instead of persisted raw phone identifiers;
- persisted, versioned English/Hindi conversation state;
- idempotent provider-event inbox and pending outbound-message outbox;
- shared session-scoped citizen cases—there is no second WhatsApp case database;
- explicit synthetic verification before case disclosure;
- multi-vehicle and multi-challan lists;
- case facts, amount, registered-vehicle image, enforcement image, plate crop, approximate map location, owner and committed tracking state;
- pay-one, selected-few and pay-all review with a non-looping selection checkpoint, mock UPI-app choice and a signed, expiring handoff;
- an atomic pay-all endpoint and web review dialog: every selected case posts with one batch receipt or the transaction rolls back;
- payment history, route-linked receipt retrieval and downloadable web receipts;
- all six grievance choices with server-owned issue-specific proof guidance;
- one-time handoff exchange into the same web case and preselected grievance;
- SQLite restart persistence and matching PostgreSQL migration/adapter contract.
- normalized Meta text, button, list, image and location payloads;
- authenticated Cloud API sender, bounded request timeout, durable claiming, duplicate suppression, provider message IDs, delivery/read receipts and bounded retry state.
- Meta accepted clearly labelled synthetic connectivity messages on 6 September 2026. On 7 September, the public callback received a user `Hi` and returned the live English/Hindi selector through the configured developer test number.

## Automated proof

`npm test --prefix apps/api` verifies invalid signatures, webhook verification, duplicate replay, vehicle/case parity, the select → review → mock UPI-app → handoff sequence, issue-specific guidance, one-time token use, sender pseudonymization and conversation recovery after closing and reopening the SQLite repository.

`npm run demo:whatsapp` creates an isolated in-memory application with provider delivery forcibly disabled, then prints a fresh signed-fixture walkthrough from language selection through protected lookup, multi-challan browsing and tracking. It never contacts the running API or sends an external message.

`npm run test:e2e` creates signed Meta-shaped events and verifies three complete continuations in Chromium: the already-paid guidance opens the same challan with that grievance selected, pay-all opens two eligible challans with the selected mock UPI route before one atomic post and receipt download, and selected payment opens only the citizen's chosen challan.

## Deliberately pending

- a final user-originating pass through every post-deployment button path and persisted provider delivery/read receipt inspection;
- approved message templates and production retention policy;
- real registry/OTP verification;
- real payment or native WhatsApp payment;
- human-reviewed complete Hindi copy.

When Meta credentials are loaded, health reports `META_CLOUD_API`; otherwise it reports `SIGNED_FIXTURE`. The submission may call this a live developer-number pilot with automated full-flow proof, but must not call it a production nationwide WhatsApp service or native WhatsApp payment.
