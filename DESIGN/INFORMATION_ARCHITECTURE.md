# Information architecture

## Public shell

- Home
  - Check a challan
  - Continue a saved case
  - Verify a message or website
  - Learn how contesting works
- Help
  - Common grounds and evidence
  - Payment pending after debit
  - Court or RTO handoff
  - Deadlines and terminology
  - Accessibility and assisted service
- About
  - Independent prototype disclosure
  - Coverage and integrations
  - Data and privacy
  - Sources

## Citizen case workspace

- Case overview
  - status and next action
  - deadline card
  - allegation facts
  - official/source evidence
  - jurisdiction and authority
- Choose an action
  - accept and simulated payment
  - contest
  - report payment mismatch
  - understand court handoff
- Contest builder
  - eligibility and declaration
  - select ground
  - answer ground-specific questions
  - upload synthetic evidence
  - review AI-assisted extraction
  - completeness check
  - final review and submit
- Case timeline
  - submission receipt
  - authority events
  - requests for information
  - decision/order
  - payment or court next step
- Files and receipts
- Help for this case

## Authority workspace

- Queue
  - jurisdiction
  - age/SLA
  - ground
  - completeness
  - risk/exception flags
- Case review
  - allegation and original evidence
  - citizen ground and evidence packet
  - AI-generated summary with source links
  - prior events and duplicate detection
  - request more information
  - quash or reject with reason code
  - decision preview and confirmation
- Supervisor
  - queue ageing
  - approaching/expired clocks
  - reason-code quality
  - reopened cases
  - payment-reconciliation backlog
- Configuration
  - jurisdictions and capabilities
  - rule versions and clocks
  - evidence guidance
  - content and language versions

## Primary navigation rule

Citizens see no more than four top-level choices: `Check challan`, `My cases`, `How it works`, and `Help`. Case work uses a contextual back link and step navigation, not the global navigation as a substitute.

## URL plan

The final routes may change during implementation, but the semantics should remain stable:

```text
/
/check
/verify
/help
/case/:caseId
/case/:caseId/contest/:step
/case/:caseId/timeline
/case/:caseId/files
/review
/review/case/:caseId
/review/operations
```

No personally identifying value appears in a URL. Public demo identifiers are opaque synthetic IDs.

