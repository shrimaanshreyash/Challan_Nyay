# Definition of done

A vertical slice is done only when:

- the user behavior and edge states meet written acceptance criteria;
- UI is responsive and matches the selected visual target;
- keyboard, focus, errors, status announcements, and long text work;
- API inputs/outputs validate against shared runtime schemas;
- authorization, valid transition, version, and idempotency checks exist;
- persistence, audit event, and any outbox effect are real;
- unit/contract/integration/browser tests pass as appropriate;
- logs include correlation but no secret/evidence/identifier leakage;
- synthetic fixtures are deterministic and visibly marked;
- mock/integration status is truthful in UI and docs;
- relevant decisions, notices, and acceptance docs are updated;
- it works from a clean session, not only the developer's existing browser state.

“Compiles,” “looks right in one screenshot,” “the endpoint returned 200,” and “the model usually gets it” are not definitions of done.
