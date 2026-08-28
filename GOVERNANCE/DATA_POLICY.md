# Demo data and privacy policy

## Scope

The hackathon build processes fictional demo data only. It is not a channel for submitting or resolving a real traffic challan.

## Data allowed

- seeded fictional names and contact channels;
- fictional plates, licences, challan numbers, offence events, payments, and orders;
- synthetic/generated vehicle and document images visibly marked as demo material;
- product telemetry tied to a demo tenant and opaque session/case ID;
- AI input/output derived only from those synthetic fixtures.

## Data prohibited

- real Aadhaar, driving licence, registration, phone, email, address, signature, bank/card/UPI data;
- real challan numbers, notices, evidence, receipts, judgments, or citizen complaints;
- biometric identification or face recognition;
- scraped government data or CAPTCHA output;
- production credentials or secrets.

## Collection rules

- explain purpose before each field/upload;
- reject or warn against arbitrary real-document uploads in the public demo;
- collect the minimum needed for the demonstrated task;
- do not use data for advertising, profiling, model training, or unrelated analytics;
- do not put personal values in URLs, analytics events, or ordinary logs.

## Retention plan

For the public demo:

- reset citizen/reviewer case data on a short scheduled cycle or on demand;
- expire uploaded demo objects rapidly after the event unless needed for reproducible test evidence;
- retain only aggregated non-identifying operational measures longer;
- separate immutable test evidence from public demo records;
- provide a full demo-tenant reset that cannot target another environment.

Exact intervals are selected with the hosting architecture and displayed in the live privacy notice.

## Access

- citizens see only their seeded session/case;
- reviewers see only assigned/configured demo jurisdictions;
- supervisors see synthetic aggregates and authorized cases;
- support cannot silently impersonate a reviewer;
- access to evidence creates an auditable event where proportionate.

## AI processing

- server-side only; minimum necessary crop/document;
- structured output and human confirmation;
- review current provider data controls and file expiry before deployment;
- AI feature flags allow complete disablement;
- never send secrets or arbitrary system prompts from uploaded text.

## Incident response for the demo

If real data is uploaded or exposed:

1. disable the affected intake/view immediately;
2. preserve minimal security evidence without copying the sensitive content;
3. delete/quarantine the material according to approved procedure;
4. rotate any exposed secret;
5. document scope, cause, action, and prevention;
6. do not publicly disclose personal content.

## Future production requirement

Before any real-data pilot, complete legal/privacy review, data-flow inventory, purpose/retention schedule, processor/vendor review, data-subject rights workflow, jurisdiction hosting requirements, security testing, incident plan, and government authorization. The hackathon controls are not sufficient for production.

