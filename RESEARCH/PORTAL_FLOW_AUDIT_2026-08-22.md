# Official eChallan flow and Challan Nyay gap audit

**Audit date:** 22 August 2026  
**Audience:** Indian vehicle owners and licence holders, including multilingual, low-literacy, mobile, keyboard, low-vision, and screen-reader users

## Executive read

The official journey begins with service selection and a lookup gate, not a preloaded case dashboard. The current NextGen portal offers distinct services for challan status, payment, print, payment receipt, pending transaction, grievance entry, and grievance status. Lookup uses a challan number, vehicle number, or driving-licence number plus a visual CAPTCHA with refresh and audio. Vehicle lookup does not initially require a phone number on the captured NextGen payment screen; OTP or registered-mobile verification can appear later where stronger identity confirmation is needed. The portal has useful accessibility controls and five visible language choices, but service context is fragmented and grievance guidance begins only after the identifier/CAPTCHA gate. Challan Nyay therefore needs a fast protected lookup before showing private case information, while preserving one canonical pay-or-contest case journey after entry.

## Evidence boundary

- Official screenshots were captured in this audit run from the live NextGen portal.
- No CAPTCHA was solved and no personal or real vehicle data was entered.
- The post-lookup table, gateway handoff, and official receipt could not be captured without valid case data and CAPTCHA completion. Later-step understanding comes from official portal text, the official manual, and transaction-status pages.
- Public complaints are qualitative signals, not a representative usability study.

## Official flow

### Step 1 — service hub: generally healthy, but fragmented

![Official NextGen service hub](official-flow-capture/01-nextgen-services.png)

The hub exposes seven separate citizen tasks plus text-size controls, screen-reader access, languages, anti-scam messaging, contact information, and department login. Citizens must nevertheless choose a service before the system identifies the case and its state.

### Step 2 — challan lookup: structurally clear, security friction remains

![Official NextGen pay lookup](official-flow-capture/02-pay-challan-lookup.png)

Payment lookup supports challan number, vehicle number, or driving-licence number. The CAPTCHA includes refresh and audio, which is stronger than an image-only challenge. The page explains little about what will be revealed, why an identifier is needed, whether OTP follows, or how to choose among payment, grievance, and transaction recovery.

### Step 3 — grievance entry: usable gate, weak early guidance

![Official grievance entry](official-flow-capture/03-grievance-entry.png)

The grievance page repeats the three identifier modes and CAPTCHA. Before that gate it does not explain common grounds, documentary evidence, the 45-day contest window, the review target, or possible reasoned outcomes.

### Step 4 — pending transaction recovery: important but isolated

![Official pending transaction lookup](official-flow-capture/04-pending-transaction.png)

The portal provides a dedicated pending-transaction lookup. This confirms reconciliation is a first-class service. A separate page, however, makes provider success, challan-ledger posting, retry safety, and receipt availability harder to understand as one state machine.

## Earlier Challan Nyay gaps

### Step 1 — direct case entry: visually clear, structurally unsafe

![Earlier direct case entry](current-prototype-audit/01-direct-case-entry.png)

Strengths included mismatch hierarchy, evidence, next-action owner, deadline, scam warning, and timeline. It also exposed a case without lookup, skipped the normal identifier journey, blended the amount into the alert colour, claimed multilingual readiness without a working selector, and lacked executable payment/recovery states.

### Step 2 — contest dialog: healthy core interaction

![Earlier contest dialog](current-prototype-audit/02-contest-dialog.png)

The dialog already had one clear ground, plain-language explanation, visible evidence, a declaration, disabled-until-valid submission, Escape close, and labelled controls. It needed verified entry, clearer pay-or-contest context, and localized content architecture.

## Requirements adopted for v2

| Requirement | Evidence | Product response |
|---|---|---|
| Protected entry before disclosure | Official lookup flow | Server-issued human check and synthetic challan/vehicle/DL lookup |
| Do not force a phone number at first entry | Captured NextGen vehicle lookup | One identifier first; stronger verification belongs only at sensitive steps |
| Accessible anti-bot path | Official audio CAPTCHA and GIGW | Text-readable arithmetic demo; production requires accessible risk protection and rate limiting |
| Multilingual access | GIGW language guidance | English, Hindi, and Telugu entry-flow pilot with Unicode and expandable translation keys |
| Clear amount and decision | User feedback and pay/contest workflow | Isolated amount card and explicit pay/contest actions after evidence review |
| Payment reliability | Official pending-transaction service | Idempotent mock payment, provider state, ledger state, receipt, and audit event |
| Grievance transparency | Rule 167 and grievance scale | Guided ground, receipt, current owner, review target, and reasoned human decision |
| Accessible shell | GIGW 3.0 / WCAG 2.1 AA | Skip link, landmarks, labels, focus, text controls, high contrast, responsive reflow |

## Source map

- [NextGen eChallan services](https://echallan.parivahan.nic.in/challan/challan-services)
- [NextGen pending transaction](https://echallan.parivahan.nic.in/challan/payment-verification)
- [NextGen grievance entry](https://echallan.parivahan.nic.in/grievance)
- [Legacy challan lookup](https://echallan.parivahan.gov.in/index/accused-challan)
- [Official eChallan user manual](https://echallan.parivahan.gov.in/www/user-manual.pdf)
- [GIGW 3.0 guidelines](https://guidelines.india.gov.in/guidelines/)
- [GIGW 3.0 focus areas](https://guidelines.india.gov.in/focus-areas/)
- [Central Motor Vehicles (Third Amendment) Rules, 2026](https://egazette.gov.in/WriteReadData/2026/269493.pdf)
- [Rajya Sabha answer 3764](https://sansad.in/getFile/annex/270/AU3764_TntZ75.pdf?source=pqars)

## Research limits and next evidence

- Run moderated mobile tests in at least six states and several language groups.
- Test verification with screen-reader and cognitive-accessibility users.
- Validate terminology with native speakers and legal/content reviewers before expanding to all 22 scheduled languages.
- Shadow authority reviewers and obtain official completion/error analytics before making frequency claims.
