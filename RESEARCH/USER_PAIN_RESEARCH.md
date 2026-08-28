# User pain research

This synthesis combines official portal/rule observations, official scale data, reporting, and public user accounts. User accounts are qualitative evidence, not a representative survey.

## Ranked issue clusters

Scoring: severity and frequency are directional (`High`, `Medium`, `Low`). Confidence reflects the available evidence, not statistical certainty.

| Rank | Issue | User harm | Severity | Frequency | Confidence | Product response |
|---:|---|---|---|---|---|---|
| 1 | Fragmented discovery and jurisdiction routing | Citizens cannot tell which portal, authority, or court owns the case | High | High | High | Jurisdiction router, canonical case view, coverage labels |
| 2 | Wrong or unclear challan data/evidence | Wrong plate, vehicle, owner, offence, location, or illegible image can create cost and service blocks | High | Medium–High | High | Guided grounds, evidence viewer, fact confirmation, reviewer packet |
| 3 | Grievance black box | Generic status, unclear SLA, no reason, repeated follow-up | High | High | High | Timeline, 30-day clock, request-for-information loop, reasoned order |
| 4 | Payment reconciliation failures | Money debited while challan remains pending; duplicate-payment risk | High | Medium | High | Dedicated payment attempt state machine, idempotency, reconciliation case |
| 5 | Court and RTO handoff dead zones | Case blocks services but is not actionable in the visible portal | High | Medium | Medium–High | Explicit handoff state, owner, destination, and next-action checklist |
| 6 | Evidence requirements discovered too late | Submission is rejected or delayed because proof was missing or irrelevant | Medium–High | High | High | Ground-specific checklist before submission; completeness score |
| 7 | Authentication, CAPTCHA, and stale contact records | Legitimate users cannot enter or resume the service | Medium–High | Medium–High | High | Prototype uses safe demo access; production plan supports assisted and accessible identity |
| 8 | Scam and trust ambiguity | Citizens can pay or disclose data to convincing fake sites | High | Medium | High | Verifiable domain education, anti-scam notice, no payment links in unsolicited messages |
| 9 | Language, literacy, and accessibility gaps | Legal and system language makes the right next step hard to understand | High | High | High | Plain-language summaries, translations, accessible authentication, assisted mode |

## Cluster detail

### 1. Fragmentation

Observed:

- Official services are divided across legacy, NextGen, Delhi/state-specific, transaction, grievance, and court surfaces.
- A public user asked which Maharashtra/Parivahan service was valid and noted there was no holistic multi-state view.

Inference:

The service should ask for minimal discovery information, identify likely jurisdiction, and explain where the authoritative source lives before collecting a long dispute form.

### 2. Wrong or unclear case facts

Observed:

- Public reports include evidence images showing a different motorcycle or mismatched vehicle.
- A Times of India report citing RTI data said around 60% of Mumbai e-challan grievances in a 13-month period were rejected and that traffic-division verification could be involved.

Inference:

Citizens need an allegation-versus-evidence comparison and ground-specific proof. Reviewers need structured facts, original evidence, citizen evidence, and a reason code in one screen.

### 3. Grievance black box

Observed:

- Users report complaints remaining unchanged for months.
- The current public entry page exposes little process guidance before the number/CAPTCHA gate.
- Rule 167 introduces explicit contest and review time windows.

Inference:

A progress bar is insufficient. Show the actor currently responsible, elapsed time, deadline source, last meaningful event, expected next event, and escalation path.

### 4. Payment reconciliation

Observed:

- Hindustan Times reported that Pune vehicle owners had paid e-challans that remained pending in VAHAN, with an RTO official acknowledging a technical issue.
- Users report receipts while apps continue to show pending amounts.

Inference:

Payment is a distributed transaction. Model attempt ID, provider reference, bank state, challan-ledger state, retries, reversals, and manual reconciliation separately.

### 5. Court/RTO handoff

Observed:

- Users report Delhi challans affecting an NOC while being absent from the expected Virtual Court path.
- Other reports describe a challan visible to the RTO or private service but unavailable in the public payment route.

Inference:

The product must never collapse `transferred`, `not found`, and `closed` into the same status. Handoffs need a named system of record, timestamp, reference, and next-action owner.

### 6. Scam risk

Observed:

- Official portals display anti-scam notices.
- Reporting documents fake sites that closely mimic official pages.

Inference:

Trust must come from transparent identity, URLs, evidence provenance, and clear limitations—not borrowed government branding.

## Jobs and moments

| Moment | Citizen question | Required answer |
|---|---|---|
| Notice received | Is this real? | Source, jurisdiction, verification path, scam warning |
| Case opened | What exactly is alleged? | Plain summary, evidence, date/place/offence, legal source |
| Decision point | Pay or contest? | Options, deadline, consequences, no pressure copy |
| Contest preparation | What will help? | Valid grounds, examples, required/recommended evidence |
| After submission | Did it go through? | Receipt, immutable reference, authority, SLA, timeline |
| During review | Who has it? | Current actor, meaningful event, request for information |
| Decision | Why? | Structured reason, readable explanation, signed order metadata |
| Next step | What can I do now? | Pay, appeal/court, wait, or closed; deadline and destination |

## Research gaps to validate after the hackathon

- moderated interviews across at least six states/UTs and several language groups;
- accessibility testing with screen-reader and low-vision users;
- reviewer workflow shadowing with traffic-police/transport personnel;
- state-by-state authority, document, and appeal mapping;
- observed completion rates and failure analytics from official portals;
- legal review of edge cases under the amended Rule 167.

## Public evidence links

- [Which eChallan website is valid?](https://www.reddit.com/r/CarsIndia/comments/1ravqv5/which_is_valid_website_for_echallan/)
- [Wrong challan evidence example](https://www.reddit.com/r/hyderabad/comments/1p5z29y/wrong_challan/)
- [Mumbai grievance rejection report based on RTI](https://timesofindia.indiatimes.com/city/mumbai/60-of-e-challan-grievances-of-motorists-fined-in-13-mths-rejected-shows-rti-reply/articleshow/121323788.cms)
- [Long-running grievance user report](https://www.reddit.com/r/LegalAdviceIndia/comments/198mzk3/)
- [Pune paid-yet-pending report](https://www.hindustantimes.com/cities/pune-news/echallans-paid-yet-pending-vehicle-owners-hit-by-glitch-in-vahan-system-101779826468986.html)
- [Receipt but still pending user report](https://www.reddit.com/r/Echallan/comments/1v4544a/paid_e_challan_is_not_showing_in_the_application/)
- [Delhi handoff/NOC user report](https://www.reddit.com/r/LegalAdviceIndia/comments/1utlg7p/delhi_traffic_challan_stuck_help/)
- [RTO-only visibility user report](https://www.reddit.com/r/Echallan/comments/1u7kjf1/how_to_pay_rto_challan/)
- [Fake eChallan portal report](https://www.moneycontrol.com/news/trends/mumbai-comedian-reveals-sophisticated-challan-scam-fake-portal-mimics-official-morth-website-13777577.html)

