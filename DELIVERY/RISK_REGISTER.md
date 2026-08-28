# Risk register

| ID | Risk | Likelihood | Impact | Early signal | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R1 | Scope becomes a nationwide portal clone | High | High | Many pages, no complete decision loop | Protect primary wrong-vehicle lifecycle; use scope cut order | Product |
| R2 | UI is polished but back office is fake | Medium | High | Reviewer screen reads static fixtures | Persist real submission/task/decision events end to end | Engineering |
| R3 | Rule interpretation is overstated | Medium | High | Copy gives personalized legal conclusion | Cite sources, effective-date rules, legal review, guidance disclaimer | Product/legal |
| R4 | “Nationwide” claim is misleading | High | High | No jurisdiction differences or coverage labels | Canonical model + configured adapter capability and explicit mock status | Product |
| R5 | Government impersonation/trademark issue | Medium | High | Emblems or copied masthead | Independent identity banner, original design, no official assets | Design |
| R6 | Real data enters demo | Medium | Critical | Upload accepts arbitrary citizen files | Seed-only identifiers, synthetic fixture allowlist, visible watermark | Security |
| R7 | AI hallucination changes case | Medium | Critical | Extraction auto-populates final facts/decision | Confirmation, source links, human-only decision invariant, AI-off path | AI/engineering |
| R8 | Public demo abuse/reset failure | Medium | High | Queue polluted or seeds missing | Isolated demo tenant, rate limits, deterministic reset, backups | Engineering |
| R9 | Slow network breaks upload | High | High | Draft lost or infinite spinner | Autosave, resumable upload, retry, bounded timeouts | Frontend |
| R10 | Accessibility added too late | High | High | Keyboard/screen-reader blocker near deadline | Accessible primitives and checks in each vertical slice | Design/QA |
| R11 | Payment scope consumes schedule | Medium | Medium | Realistic gateway work before primary loop | Mock ledger only; cut second scenario first | Product |
| R12 | Deployment provider fails | Medium | High | Preview restrictions or cold-start errors | Provider-neutral build, early deploy, local/video fallback | Delivery |
| R13 | Dependency/security issue | Medium | High | Last-minute upgrade or audit failure | Minimal pinned dependencies, scan daily, freeze 48 hours early | Engineering |
| R14 | Three-minute story is too broad | High | Medium | Rehearsal exceeds 3 minutes | One case, few cuts, architecture in final 20 seconds | Demo lead |
| R15 | Translation is unreviewed or breaks layout | Medium | High | AI-only copy, overflow | Human-reviewed demo language, pseudolocalization/visual QA | Content |
| R16 | Source links or competition rules change | Medium | Medium | Broken link or new requirement | Re-check official pages daily and on submission day | Delivery |

## Stop-ship risks

- real personal or payment data in any artifact;
- unauthorized live government/court/payment integration;
- AI can make a consequential decision;
- cross-case/cross-role data access;
- primary citizen-to-authority-to-citizen path is not deterministic;
- public claims exceed verified behavior;
- critical accessibility blocker on the main task.

