# Screen inventory and content hierarchy

## P0 demo screens

### 1. Home / check entry — citizen mobile

Order:

1. independent-prototype and synthetic-data banner;
2. service name and one-sentence purpose;
3. primary `Check a challan` action with seeded demo helper;
4. anti-scam verification guidance;
5. three-step “how resolution works” summary;
6. accessibility/language/help links.

No large decorative hero, government seal, metric carousel, or generic chatbot opener.

### 2. Case overview — citizen mobile

Order:

1. status, next-action owner, and days/date;
2. primary action (`Contest` or contextual action);
3. allegation summary and amount;
4. enforcement evidence;
5. jurisdiction/authority/coverage;
6. timeline preview and files/help.

### 3. Contest preflight and ground

Order:

1. what contesting means and deadline;
2. who can submit and required declaration;
3. ground choices with short evidence preview;
4. estimated time and save behavior;
5. continue/back.

### 4. Evidence step

Order:

1. selected ground and exact question;
2. required/recommended checklist;
3. upload queue and constraints;
4. AI-assisted extracted fields with source/confidence;
5. manual confirmation;
6. saved/sync state.

### 5. Review and submit

Order:

1. completeness/errors;
2. allegation vs citizen claim;
3. evidence list;
4. declaration text/version;
5. irreversible-action explanation;
6. one submit action.

### 6. Receipt and timeline

Order:

1. submitted confirmation/reference;
2. authority and Rule 167 review clock;
3. current action owner;
4. event timeline;
5. request/decision/order when present;
6. help and downloaded receipt.

### 7. Reviewer queue — desktop

Order:

1. queue summary and approaching/expired clock exceptions;
2. filters: jurisdiction, SLA, ground, completeness, assignment;
3. sortable accessible case list;
4. selected filter summary and empty/error states.

### 8. Reviewer case — desktop

Order:

1. case status/SLA/assignment;
2. allegation and citizen-ground summary;
3. side-by-side evidence with accessible text equivalent;
4. confirmed facts and source-linked AI summary;
5. history and duplicates;
6. request information or decision controls;
7. decision preview/confirmation.

### 9. Decision returned — citizen mobile

Order:

1. outcome and closed/open state;
2. readable reason and evidence considered;
3. authority/date/order metadata;
4. next action/deadline;
5. complete timeline and receipt/order access.

## P1 screens

- payment mismatch and dual-ledger status;
- bounded information-request response;
- court/RTO handoff guidance;
- small operations SLA/reason-quality view;
- help topics and source glossary.

## Required states per screen

- initial/loading skeleton with stable layout;
- empty/unknown;
- validation error;
- service unavailable with preserved progress;
- offline/stale data;
- unauthorized/expired session without data leakage;
- long translation and 200% zoom;
- AI disabled or low confidence;
- slow/resuming upload;
- success with durable reference.

## Visual QA set

The selected design direction must be evaluated at:

- 360 × 800 citizen mobile;
- 390 × 844 citizen mobile;
- 768px tablet transition;
- 1440 × 900 reviewer desktop;
- 320px width at 200% browser zoom equivalent;
- English, Hindi, and pseudolocalized long text;
- forced colours and reduced motion.

