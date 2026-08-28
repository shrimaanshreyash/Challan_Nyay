# AGENTS.md

These rules apply to the entire `C:\ChallanNyay` tree. Read this file, `RULES.md`, and the relevant design or architecture document before changing the project.

## Phase rule

The current phase is implementation. The public entry now follows the user-approved reference-led redesign dated 27 August 2026: a calm two-line hero, road illustration, protected lookup and four clear service actions. Adapt the references to an independent prototype identity; never copy government emblems, programme logos, official claims or chatbot chrome. The first vertical slice remains the wrong-vehicle contest. Chatbot work is deferred to a later round and must not enter the first-round build.

## Product truth

- This is an independent hackathon prototype, not an official government system.
- Use synthetic people, vehicles, documents, challans, payments, decisions, and identifiers only.
- Never use official emblems, seals, department logos, or styling that implies endorsement.
- Never claim live integration, legal validity, production deployment, or government adoption unless independently verified.
- Never scrape or call an undocumented government API.
- Government, court, identity, payment, and notification connections must use explicit adapter interfaces; the hackathon build uses mock adapters.

## User and legal safety

- Do not provide legal guarantees. Use plain explanations and link to the authoritative rule or jurisdiction.
- AI may extract, translate, organize, summarize, or suggest a checklist. It may not decide guilt, quash a challan, reject a contest, manufacture evidence, or impersonate an authority.
- A human must confirm extracted facts and make every consequential decision.
- Treat every uploaded file as sensitive. Validate type and size, scan it, strip unnecessary metadata, and never log its contents.
- Never collect Aadhaar, real licence numbers, real registration numbers, or real payment credentials in the prototype.

## Engineering rules

- Keep domain logic framework-independent. The protected Product Design web template is JavaScript; new production services should use TypeScript in strict mode unless a decision record approves otherwise.
- Derive API and event types from shared runtime schemas; do not maintain drifting duplicate types.
- Validate every input and output at trust boundaries.
- Make submission, review decisions, payments, uploads, and integration events idempotent.
- Record append-only audit events for consequential state changes.
- Use structured logs with correlation IDs; redact tokens and personal data.
- Prefer simple, observable components over speculative infrastructure.
- Never commit secrets. Provide `.env.example` only after coding begins.
- Pin dependencies and record their licences. Do not add a package without a reason.

## Experience rules

- Mobile-first and usable on slow connections; drafts must survive refreshes and interrupted uploads.
- Meet WCAG 2.2 AA and follow GIGW 3.0/UX4G guidance where applicable.
- Never rely on colour alone. All interactive targets, focus states, errors, and status changes must be accessible.
- Use plain-language content, exact deadlines, and visible “what happens next” guidance.
- Do not use emoji, text symbols, or handcrafted SVGs as production icons. Use a licensed icon library.
- English is the authored source language. Translation keys are mandatory; long strings must not be embedded in components.

## Verification rules

- A feature is not demo-ready until its full user path works with realistic synthetic data.
- Test the citizen path and authority path together; a submitted case must really appear in the review queue.
- Cover happy paths, interrupted uploads, stale states, duplicate submissions, rejected transitions, and permission boundaries.
- Run unit, contract, accessibility, browser, and build checks before calling a milestone complete.
- Label findings accurately as planned, implemented, locally verified, or deployed.

## Change discipline

- Preserve user changes and unrelated material.
- Update `GOVERNANCE/DECISIONS.md` for material architecture, scope, legal, or design choices.
- Update `DELIVERY/ACCEPTANCE_CRITERIA.md` when a demo-visible behavior changes.
- Add every external asset, font, icon set, library, model, and hosted service to `GOVERNANCE/THIRD_PARTY_NOTICES.md`.
- Do not stage, commit, push, publish, submit, or contact anyone without explicit user authorization.
