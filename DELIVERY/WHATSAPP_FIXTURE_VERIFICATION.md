# WhatsApp channel verification

Date: 6 September 2026  
Scope: local deterministic channel contract, authenticated Meta developer-resource check and one user-confirmed outbound delivery; not an automated inbound or provider-receipt-verified end-to-end conversation.

## Implemented

- Meta-shaped webhook verification challenge and exact-body HMAC validation;
- keyed-HMAC sender pseudonym instead of persisted raw phone identifiers;
- persisted, versioned English/Hindi conversation state;
- idempotent provider-event inbox and pending outbound-message outbox;
- shared session-scoped citizen cases—there is no second WhatsApp case database;
- explicit synthetic verification before case disclosure;
- multi-vehicle and multi-challan lists;
- case facts, amount, registered-vehicle image, enforcement image, plate crop, approximate map location, owner and committed tracking state;
- pay-one, selected-few and pay-all confirmation with a signed, expiring handoff;
- an atomic pay-all endpoint and web review dialog: every selected case posts with one batch receipt or the transaction rolls back;
- payment history and receipt retrieval;
- all six grievance choices with server-owned issue-specific proof guidance;
- one-time handoff exchange into the same web case and preselected grievance;
- SQLite restart persistence and matching PostgreSQL migration/adapter contract.
- normalized Meta text, button, list, image and location payloads;
- authenticated Cloud API sender, bounded request timeout, durable claiming, duplicate suppression, provider message IDs, delivery/read receipts and bounded retry state.
- Meta accepted one clearly labelled synthetic connectivity message on 6 September 2026 and the configured recipient supplied visual confirmation that it arrived. This is user-visible delivery evidence, not a persisted provider delivery/read receipt.

## Automated proof

`npm test --prefix apps/api` verifies invalid signatures, webhook verification, duplicate replay, vehicle/case parity, pay-all confirmation, issue-specific guidance, one-time token use, sender pseudonymization and conversation recovery after closing and reopening the SQLite repository.

`npm run demo:whatsapp` creates an isolated in-memory application with provider delivery forcibly disabled, then prints a fresh signed-fixture walkthrough from language selection through protected lookup, multi-challan browsing and tracking. It never contacts the running API or sends an external message.

`npm run test:e2e` creates signed Meta-shaped events and verifies three complete continuations in Chromium: the already-paid guidance opens the same challan with that grievance selected, pay-all opens two eligible challans with the correct total before one atomic post, and selected payment opens only the citizen's chosen challan.

## Deliberately pending

- a public HTTPS webhook callback, Meta verification/subscription and a complete live inbound event;
- a persisted provider delivery/read receipt and a complete automated inbound reply sequence;
- approved message templates and production retention policy;
- real registry/OTP verification;
- real payment or native WhatsApp payment;
- live managed-PostgreSQL and deployed HTTPS verification;
- human-reviewed complete Hindi copy.

When local Meta credentials are loaded, health reports `META_CLOUD_API`; otherwise it reports `SIGNED_FIXTURE`. That label confirms configured transport, not end-to-end delivery. No submission or demo should call this a live WhatsApp conversation until the pending checks actually pass.
