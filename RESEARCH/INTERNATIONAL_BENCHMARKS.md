# International service benchmarks

The goal is to borrow proven service patterns, not copy another country's identity, law, or visual style.

## Benchmark matrix

| Service | Strong pattern | What Challan Nyay should adopt | What not to copy |
|---|---|---|---|
| [GOV.UK appeal a parking fine](https://www.gov.uk/appeal-parking-fine) | Plain language, deadlines above the fold, postcode jurisdiction routing, progressive disclosure | One question per step, route first, explain deadlines and discount/payment consequences clearly | UK-specific typography/brand or legal assumptions |
| [NYC Pay or Dispute](https://www.nyc.gov/site/finance/vehicles/nyc-pay-or-dispute.page) | Unified pay/dispute choice, evidence upload, saved cases, receipts and history | One case ledger for payment and contest; evidence capture and decision history | Dense municipal navigation and US hearing terminology |
| [NYC ticket hearing guide](https://portal.311.nyc.gov/article/?kanumber=KA-02275) | Confirmation, evidence preparation, hearing/decision lifecycle, appeal | Explicit “what happens next” and durable submission receipt | Fixed NYC timelines or hearing model |
| [Singapore Police Force appeal](https://www.police.gov.sg/E-Services/Submit-Appeal-Against-Traffic-Offence) | Prerequisites, acceptable circumstances, documentary proof, estimated completion time | Preflight checklist and honest time estimate before starting | Restrictive eligibility rules or the heavy surrounding site chrome |
| [Auckland Transport dispute](https://at.govt.nz/infringements-fines/dispute-your-infringement?format=webp) | Who can dispute, grounds and evidence, offence images, step checklist, response target | Ground-specific evidence and realistic success/process explanation | New Zealand legal grounds or transfer-liability rules |
| [Netherlands CJIB disagreement flow](https://www.cjib.nl/en/do-you-disagree-traffic-fine) | Letter-code identification, deadline, exact required information, receipt, appeal ladder | Case-type router, visible state ladder, receipt and next decision expectation | Netherlands payment-pause rules without Indian legal validation |
| [New Zealand Ministry of Justice disputing fines](https://www.justice.govt.nz/fines/about-fines/disputing-fines/) | Clear glossary, evidence, court path, responsibility separation | Contextual glossary and explicit boundary between administrative review and court | Email/PDF-heavy process |

## Recommended design synthesis

1. **GOV.UK information discipline:** a calm page title, one-sentence purpose, deadline/status summary, then one primary task.
2. **NYC lifecycle completeness:** search, pay or dispute, evidence, submission history, decision, and receipt in one case ledger.
3. **Auckland evidence guidance:** show common grounds and proof before the user commits to a form.
4. **CJIB state clarity:** a visible ladder that names the current owner and the next possible transition.
5. **UX4G localization:** Indian accessibility, multilingual, content, form, and government-service conventions without implying official endorsement.

## Competitive context

Private Indian products such as Google Pay and Park+ help users check or pay challans. That validates demand and means a generic check/pay experience is crowded. The defensible hackathon wedge is the merits-dispute and resolution lifecycle: evidence quality, jurisdiction routing, authority workflow, reasoned decisions, SLA, audit, and court/payment handoffs.

References:

- [Google Pay India traffic challan help](https://support.google.com/pay/india/answer/16376992?hl=en-GB)
- [Park+ App Store listing](https://apps.apple.com/in/app/park-fastag-rto-parivahan/id1244749178)

## Design-system references

- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [GOV.UK accessibility strategy](https://design-system.service.gov.uk/accessibility/accessibility-strategy/)
- [UX4G](https://www.ux4g.gov.in/)
- [UX4G documentation](https://doc.ux4g.gov.in/)
- [GIGW 3.0](https://guidelines.india.gov.in/)

