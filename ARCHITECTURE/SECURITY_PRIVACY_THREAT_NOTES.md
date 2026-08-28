# Security, privacy, and threat notes

This is a pre-coding threat inventory, not a formal production certification.

## Assets

- identity/session claims;
- challan and vehicle references;
- citizen evidence and declarations;
- authority decisions and order metadata;
- payment attempt references;
- court/handoff status;
- audit trail and jurisdiction rules;
- API keys, signing secrets, and adapter credentials.

## Trust boundaries

```text
Public browser
  | HTTPS, session, CSRF/input controls
Application API
  | least-privilege database and object-store credentials
Database / evidence store
  | outbox and controlled worker
Worker / AI provider / mock external adapters
Reviewer browser
  | stronger role/session and consequential-action confirmation
```

## Major threats and controls

| Threat | Example | Required controls |
|---|---|---|
| Official impersonation | Fake government appearance or domain | Independent banner, no emblems, transparent coverage/integration labels |
| Broken object authorization | Guessing another case ID | Opaque IDs, ownership/role check on every request, negative tests |
| Reviewer privilege abuse | Unauthorized decision or evidence access | RBAC/ABAC, jurisdiction scope, re-auth for decision, immutable audit |
| Evidence malware | Crafted PDF/image | Allowlisted formats, byte sniffing, limits, quarantine, scanner, safe renderer |
| Stored XSS/document injection | HTML/script in evidence or notes | Treat as data, escape output, sandbox viewer, strict CSP |
| Prompt injection | Document tells model to ignore rules | Untrusted-content boundary, structured task, no tools/actions, source validation |
| Decision automation | AI output becomes a legal result | Human-only decision endpoint and domain invariant |
| Duplicate submission/payment | Retry creates multiple consequences | Idempotency keys, unique constraints, receipt replay |
| Webhook spoof/replay | Fake provider success | Signature, timestamp window, event uniqueness, allowlist |
| Status race | Citizen/reviewer overwrite newer state | Optimistic concurrency and valid-transition checks |
| Data leakage in logs | Evidence text or identifiers recorded | Structured redaction, safe IDs, no bodies/files/tokens |
| Excess retention | Old evidence remains indefinitely | Purpose-based schedule, deletion/tombstone workflow, legal hold separation |
| Enumeration/abuse | Bulk challan lookup | Rate limits, anomaly detection, verified session in production, generic errors |
| Supply-chain compromise | Malicious dependency | Minimal dependencies, pinned lockfile, licence/security review, update scanning |
| Demo takeover | Public reviewer credentials used destructively | Resettable synthetic data, isolated demo tenant, rate limits, no external effects |

## Privacy principles

- data minimization and explicit purpose;
- collect once and disclose use before collection;
- separate identity, case, evidence, and analytics identifiers;
- short default evidence retention in the prototype;
- encryption in transit and at rest in any hosted environment;
- least-privilege role and jurisdiction access;
- no advertising, profiling, or sale of case data;
- consent/declaration text version stored with the action;
- safe export/correction/deletion design subject to lawful retention.

## Demo data isolation

- every record has `synthetic = true` and a demo-tenant ID;
- seed reset never touches non-demo data;
- file fixtures contain visible `SYNTHETIC DEMO — NOT VALID` markings;
- no user-provided real uploads are requested or accepted;
- reviewer actions have no external effects;
- all identifiers, phone numbers, emails, plates, references, and signatures are fictional.

## Authentication plan

Hackathon citizen access uses seeded case IDs and a clearly fake demo verification factor. Reviewer access uses an explicit demo-role entry and short session. A production plan would require an approved identity architecture, accessible authentication, assisted-channel recovery, and jurisdiction-specific authority federation; it would not casually collect Aadhaar.

## Security acceptance before public demo

- secret scan and dependency audit;
- authorization tests for every case/evidence/review endpoint;
- CSP, secure headers, CSRF posture, and cookie settings verified;
- upload validation tested with invalid MIME, oversized, renamed, and malicious fixtures;
- injection tests for notes, filenames, AI input, and translations;
- idempotency and concurrent-transition tests;
- public demo reset and abuse limits tested;
- logs reviewed to confirm no evidence or secret leakage.
