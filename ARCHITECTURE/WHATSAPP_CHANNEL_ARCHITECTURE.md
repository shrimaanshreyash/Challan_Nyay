# WhatsApp citizen-channel architecture

Status: deterministic channel, Meta Cloud API sender and delivery-receipt persistence are implemented and locally verified. Meta credentials authenticate against the supplied developer phone resource, and a labelled outbound connectivity message was visibly received by the configured test recipient on 6 September 2026. Provider delivery/read receipts, a public callback and an automated end-to-end WhatsApp conversation are not yet claimed.

## Purpose

Provide a familiar, low-friction way to find, understand, act on and track a synthetic challan without building a separate chatbot product. The channel reuses the same case aggregate, dispute contracts, payment ledger, workflow events and audit records as the website.

## Scope for the round-two pilot

- Meta WhatsApp Cloud API developer test number;
- English and Hindi only;
- deterministic interactive reply buttons and list messages;
- vehicle-number or challan-number entry followed by explicit synthetic verification;
- multi-vehicle and multi-challan selection;
- view facts, amount, due guidance, status, owner and next action;
- pay one, a selected subset, or all eligible challans through a signed mock-payment web handoff;
- raise one of the six supported grievances and receive the issue-specific checklist;
- track submission, information request and reasoned outcome;
- hand off to the web without losing the current synthetic session.

The pilot does not claim an official government number, real identity linkage, real payment, real OTP, native WhatsApp payment eligibility or a live RTA database.

## Conversation map

1. Citizen sends `Hi` or opens the channel link.
2. Channel asks `English` / `Hindi` using reply buttons.
3. Main menu presents `Check challan`, `Track case`, `Pay challans`, `Raise grievance`, and `Payment help` through an interactive list.
4. Lookup asks for vehicle number first, with challan number as the alternate path.
5. Verification adapter confirms the synthetic account. Production would require an authorized registry/OTP provider; WhatsApp sender identity alone is insufficient proof of vehicle ownership.
6. If several vehicles or challans exist, the user selects one, toggles a subset, or chooses an explicit `Pay all eligible` action.
7. The channel shows a compact fact summary and asks for confirmation before any write.
8. Payment returns a signed, expiring, single-purpose HTTPS link to the existing mock payment screen.
9. Grievance selection loads the same server-owned issue contract as the website and requests only the required fields/evidence manifest.
10. Tracking reads the committed workflow projection and links back to the detailed case view inside the channel.

## Component boundary

```text
Meta webhook -> signature/auth boundary -> inbound event inbox
             -> conversation/session mapper -> allowlisted command router
             -> existing Challan Nyay application services
             -> transactional case/workflow/audit store
             -> outbound message outbox -> Meta messages API
```

The webhook authenticates the exact raw request body before parsing it, stores the provider event id and returns the previously committed result for a duplicate id. Normalized outbound messages are stored before delivery and atomically claimed from the outbox. Meta acceptance records the provider message id as `SENT`; signed provider receipts advance it to `DELIVERED`, `READ` or `FAILED`. Retryable provider errors return the row to `RETRY_PENDING`, while duplicate inbound events cannot resend already accepted rows.

## Required records

- `channel_conversations`: locale, current step, selected cases, version and expiry;
- `channel_inbox`: provider event id, received time, validation state, processing status and correlation id;
- `channel_outbox`: command/event reference, template or interactive payload class, delivery status and retry count;
- `channel_handoffs`: hashed one-time token, purpose, case/session scope and expiry.

Raw access tokens, UPI credentials and unnecessary phone identifiers are never written to logs. Normalized response payloads are persisted only for idempotent replay and delivery; this pilot contains synthetic case content. Secrets remain environment-only.

## Idempotency and ordering

- Provider message/event id is unique in the inbox.
- Consequential commands use `(session_id, operation, provider_event_id)` as the idempotency boundary.
- Each conversation carries an expected version so delayed button replies cannot act on a newer selection.
- Duplicate or out-of-order webhooks return the already stored outcome or a safe refresh menu.
- Provider delivery receipts and the synthetic challan-payment ledger remain separate state machines.

## AI boundary

No model call is required for menus, lookup, payment selection, grievance submission or tracking. If a later OpenAI free-text fallback is added, it may only return a structured allowlisted intent plus extracted candidate fields. The user must confirm the interpreted action. Unsupported or low-confidence input returns the deterministic menu. The model cannot decide guilt, validate evidence, issue an order or process a payment.

## Implementation stages

1. **Complete locally:** build and test provider-neutral webhook parsing, HMAC verification, inbox/outbox and deterministic conversation state with signed fixtures.
2. **Complete locally:** connect persisted case lookup, English/Hindi menus, multi-vehicle/multi-challan selection, tracking, issue-specific evidence guidance and a hashed one-time web handoff.
3. **Complete locally:** exchange the handoff into the same citizen workspace and open the selected case/payment or grievance surface without exposing a reusable session in the URL.
4. **Complete locally:** normalized text/button/list messages convert to bounded Meta Cloud API payloads; the credential-gated transport claims persisted messages and records safe provider outcomes.
5. **Outbound delivery visibly verified; public callback pending:** the supplied token can read the developer Cloud API phone resource, Meta accepted one labelled outbound connectivity message and the configured recipient visibly received it. A public HTTPS callback is still required to verify automated inbound text, interactive replies and provider delivery receipts end to end.
6. **Partially complete:** automated English/Hindi state, retry-cap, privacy, idempotency and one-time/expired-link checks pass; human copy review and real-network latency remain pending.
7. Record the actual verified boundary in the README and submission; never describe fixture-only proof as a live Meta integration.

## Current executable boundary

- `POST /api/channels/whatsapp/webhook` verifies `X-Hub-Signature-256` against the exact raw body.
- `GET /api/channels/whatsapp/webhook` supports Meta-style verification-token challenge handling.
- The sender is persisted only as a keyed HMAC pseudonym; the raw phone identifier is not stored.
- SQLite and PostgreSQL adapters implement the same channel conversation, inbox, outbox and handoff contract.
- A repeated provider message id returns the stored response and does not advance conversation state twice.
- Free text is accepted only in the explicit identifier-entry step. All subsequent commands are allowlisted button/list ids.
- `POST /api/channels/whatsapp/handoffs/exchange` consumes a signed opaque token once and returns a short-lived citizen session for the same persisted workspace.
- The website consumes that token, removes it from browser history, loads the selected case and opens the selected grievance/payment surface.
- The Meta transport preserves allowlisted command ids, enforces platform limits, sends only claimed outbox rows and stores the returned provider message id.
- Signed status webhooks update the persisted delivery lifecycle without storing Meta's raw recipient identifier.
- A transient failure may retry when Meta redelivers the same inbound event; an independent scheduled retry worker remains outside the current pilot boundary.
