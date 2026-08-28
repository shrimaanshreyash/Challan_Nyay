# Indian eChallan current state

**Research date:** 20 August 2026  
**Scope:** nationwide citizen challan discovery, payment, contest/grievance, and handoff—not one state's enforcement policy.

## Official scale

The Ministry of Road Transport and Highways' Rajya Sabha answer, based on NIC data as of 19 March 2026, reports:

| Measure | 2023 | 2024 | 2025 |
|---|---:|---:|---:|
| Camera challans | 20,430,046 | 29,294,158 | 37,382,307 |
| Manual challans | 1,647,404 | 2,334,098 | 1,967,420 |
| Complaints | 112,500 | 168,487 | 307,150 |

That is 39,349,727 reported camera and manual challans in 2025. Complaints grew approximately 82.3% from 2024 to 2025 and were approximately 2.73 times the 2023 volume. The data is large enough to justify a national service pattern, while the state tables also show uneven implementation and reporting.

Source: [Rajya Sabha Unstarred Question 3764, answered 25 March 2026](https://sansad.in/getFile/annex/270/AU3764_TntZ75.pdf?source=pqars).

## Rule 167 process

The official parliamentary answer summarizes G.S.R. 48(E), dated 20 January 2026:

1. Within 45 days of issuance, the recipient either accepts and pays or contests on the designated portal with documentary evidence, before the authority specified by the State Government.
2. If not contested in that period, the challan is deemed accepted and payment is due within a further 30 days.
3. If contested, the authority must consider the submission and documentary evidence.
4. If the authority does not resolve the matter within 30 days, or quashes it with written reasons, the challan ceases to have effect and the order is uploaded.
5. If the authority rejects the submission with written reasons, the person may pay within 30 days or apply to the appropriate court after depositing 50% in the manner specified by the State Government.

This product must present these clocks as guidance tied to the seeded case and jurisdiction configuration, not as personalized legal advice. The [Gazette notification](https://egazette.gov.in/WriteReadData/2026/269493.pdf) remains the authoritative rule text.

## Is it nationwide?

**Short answer:** the programme and central rule framework are nationwide, but the digital experience is not a single uniform nationwide implementation.

Observed evidence:

- Official NIC data covers many states and union territories.
- The legacy portal routes many state/UT codes to the NextGen portal.
- Delhi has separate challan and notice links.
- State governments designate the contest authority and manner.
- Virtual Court and regular court handoffs can differ by jurisdiction and case state.

Product implication:

- Create one canonical case model and citizen experience.
- Store jurisdiction, authority, rule version, and adapter capability on each case.
- Render state-specific requirements from configuration, never hard-coded assumptions.
- Show an honest coverage label: `Demo jurisdiction`, `Mock adapter`, or later `Verified live integration`.

## Current portal observations

### NextGen eChallan

The public service surface exposes separate cards for pending challan status, payment, print, receipt, pending transaction, grievance creation, and grievance status. It includes screen-reader and text-size controls, language options, and anti-scam warnings.

Live capture on 22 August 2026 showed five visible language choices: English, Hindi, Marathi, Kannada, and Malayalam. The payment lookup supports challan number, vehicle number, or driving-licence number; vehicle-number mode initially asks only for the vehicle number and CAPTCHA. The CAPTCHA exposes refresh and audio controls. This does not prove that phone or OTP verification is absent later in the journey.

The public grievance entry page begins with a toggle for challan number, vehicle number, or driving-licence number, then CAPTCHA. Before that gate it does not explain contest eligibility, the Rule 167 clocks, common grounds, the evidence checklist, review steps, SLA, or what happens after a decision.

### Legacy eChallan

The legacy surface contains separate transaction-status services and explicit Delhi routes. It also warns users not to pay both the eChallan portal and Virtual Court where a transferred case appears payable in more than one place. That warning is evidence of a system-boundary problem, not merely a visual problem.

## Service fragmentation map

```text
Notice / discovery
  -> Legacy portal, NextGen portal, Delhi/state service, or third-party app
  -> Challan detail and enforcement evidence
  -> Accept/pay OR contest/grievance
      -> Payment gateway and reconciliation
      -> State-designated authority review
          -> Quashed / rejected / needs information / unresolved clock
          -> Pay OR appropriate court path
  -> Virtual Court / regular court / RTO or VAHAN consequences
```

## Constraints for a truthful prototype

- The hackathon cannot prove universal live coverage.
- It can prove a reusable national service contract with state-configured adapters.
- It must not automate CAPTCHA or scrape portal data.
- It must not interpret absence from one portal as absence of a legal case.
- It must model payment and court handoffs explicitly because they are core user states.

## Official references

- [Parivahan eChallan](https://echallan.parivahan.gov.in/)
- [NextGen eChallan services](https://echallan.parivahan.nic.in/challan/challan-services)
- [NextGen grievance entry](https://echallan.parivahan.nic.in/grievance)
- [Legacy grievance status](https://echallan.parivahan.gov.in/gsticket/search)
- [Five-year eChallan scale, PIB release](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2083423&lang=2&reg=48)
