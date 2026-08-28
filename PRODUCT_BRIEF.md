# Product brief

## Product

**Name:** Challan Nyay  
**Category:** public-service workflow redesign  
**Position:** an independent, nationwide-by-design challan understanding and resolution prototype  
**North-star sentence:** From “I found a fine” to “I know what happened and what happens next.”

## Problem

The Indian challan journey is not one journey. A citizen can encounter an old portal, NextGen eChallan, a state-specific site, Delhi-specific services, separate payment transaction pages, a grievance form, and a Virtual or regular Court handoff. A wrong or unclear challan then becomes a routing, evidence, deadline, and status problem.

The visible form is only the surface. The harder problem is an incomplete service loop:

- the citizen does not know the correct jurisdiction or channel;
- evidence requirements appear late or remain unclear;
- status is a label rather than an explanatory timeline;
- payment reconciliation and court handoffs form dead zones;
- reviewers receive uneven submissions and must verify facts across divisions;
- decisions may lack citizen-readable reasons;
- the new Rule 167 time windows are difficult to understand and operationalize.

## Audience

### Primary citizen users

- vehicle owners and drivers across Indian states and union territories;
- people dealing with a suspected wrong plate, vehicle, owner, offence, date, place, or evidence;
- people whose payment succeeded at the bank but remains pending in the challan system;
- people facing a court transfer, vehicle-service block, or stale grievance;
- users on low-cost Android devices, slow networks, or in languages other than English.

### Operational users

- state or UT traffic-police and transport reviewers;
- helpdesk and assisted-service operators;
- supervisors monitoring queues, ageing, and reason quality;
- platform administrators managing jurisdiction rules and content.

## Job to be done

When I receive or discover a challan, help me verify it, understand my options and deadlines, prepare the right evidence, submit through the correct channel, and follow the complete resolution without guessing.

## Product principles

1. Explain before asking.
2. Route before collecting.
3. Ask once; reuse safely.
4. Show the clock and the next step.
5. Make evidence requirements concrete.
6. Keep consequential decisions human and reasoned.
7. Design for interruption, translation, and assisted service.
8. State clearly what is official, mocked, unknown, or outside the product.

## MVP outcome

The three-minute demo must prove one complete contested-challan lifecycle using synthetic data:

- citizen searches and opens a seeded challan;
- service explains the offence, evidence, jurisdiction, and Rule 167 clock;
- citizen chooses “vehicle in evidence is not mine,” reviews AI-assisted extraction, uploads synthetic proof, and submits;
- mocked jurisdiction adapter creates a review task;
- authority reviewer sees a complete packet and a ticking SLA;
- reviewer quashes or rejects with a structured, citizen-readable reason;
- citizen sees the order, immutable timeline, and next lawful action.

## Explicit non-goals for the hackathon

- no real challan search, submission, Aadhaar, OTP, court, RTO, payment, SMS, email, or government API;
- no determination of legal liability or guilt by AI;
- no nationwide legal-advice engine;
- no replacement of state discretion, court review, or human authority;
- no mass analytics on citizen identity;
- no native mobile application; the first build is a responsive web application.

## Why it can stand out

Many challengers can redesign a homepage or add a chatbot. Challan Nyay demonstrates the difficult middle and back office: jurisdiction routing, evidence completeness, state transitions, SLA handling, reasoned decisions, auditability, and citizen comprehension. The polished UI is the door; the working resolution architecture is the proof.

## Success measures

- median time from challan open to contest submission;
- contest completion and abandonment rate;
- evidence-complete submission rate;
- first-decision time and Rule 167 SLA compliance;
- percentage of decisions with a valid reason code and plain-language explanation;
- payment-reconciliation time in the simulated workflow;
- duplicate submission and invalid-transition rate;
- comprehension score for “what happened, deadline, and next step”;
- WCAG 2.2 AA and keyboard completion rate;
- mobile performance under a throttled slow-network profile.

## Nationwide answer

The legal framework and eChallan programme are national, and official data spans many states and UTs. The present citizen experience is not one universally consistent portal or process. State designation of authorities, staged NextGen migration, separate jurisdiction portals, and different court/payment handoffs remain material. Therefore, “nationwide” in this project means a common citizen and case model with jurisdiction-configured rules and adapters—not a false claim of one live national integration.

