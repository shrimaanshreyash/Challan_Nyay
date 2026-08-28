# Requirements traceability

| Requirement or promise | Source | Planned proof | Acceptance/test |
|---|---|---|---|
| Rethink a public-service website | Competition brief | Complete redesigned challan resolution service | AC-03 through AC-18 |
| Codex used | Competition brief/FAQ | Tool/process disclosure in write-up | Submission checklist |
| Every demo feature works | Competition brief/FAQ | Live vertical slice; no concept-only clicks | Browser journeys + AC-18 |
| Public unrestricted demo | Competition brief/FAQ | Signed-out deployed path with seeded IDs | AC-18 |
| Synthetic/mock data | Competition/authorization boundary | Visible watermark, demo tenant, mock adapters | AC-01, AC-02, security tests |
| No undocumented APIs | Competition rule | Adapter interfaces and no live calls | Integration truth table |
| Disclose tools/open source | Competition rule | Third-party register and final write-up | Submission checklist |
| Contest within 45 days | Rule 167 summary | Deadline panel and tested clock | AC-04 |
| Documentary evidence | Rule 167 summary | Ground-specific evidence builder | AC-05 through AC-08 |
| Authority resolution/reason | Rule 167 summary | Human decision with reason/order | AC-11, AC-12 |
| 30-day review consequence | Rule 167 summary | SLA state and configured exception handling | Domain tests and legal disclaimer |
| Rejection next step | Rule 167 summary | Pay/court guidance from configuration | AC-12 |
| Nationwide relevance | User requirement | Canonical model + jurisdiction adapter labels | AC-02 |
| Website redesign quality | User requirement | Three visual options, selected target, P0 screens | Visual QA set |
| Frontend/backend architecture | User requirement | Modular monolith and API/domain documents | Architecture review |
| Accessibility/inclusion | Product principles/GIGW/WCAG | WCAG 2.2 AA target and low-bandwidth path | AC-16, AC-17 |
| Winning differentiation | Product strategy | Citizen + authority + audit + reasoned closure | Demo storyboard |

## Traceability rule during implementation

Each demo-visible ticket links to at least one acceptance criterion and one screen/flow. Each pull request states which requirement it advances and includes verification evidence. If a promise has no implemented proof, remove it from the submission or label it planned.
