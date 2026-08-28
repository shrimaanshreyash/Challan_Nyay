# Content guide

## Voice

Calm, direct, neutral, and respectful. The service should feel competent without sounding official or absolute.

Use:

- “Check the details before you choose.”
- “This evidence may help the reviewer understand your case.”
- “Your case is waiting for the reviewing authority.”
- “We could not read this field reliably. Enter it yourself.”

Avoid:

- “Don’t worry, we’ll cancel it.”
- “AI verified that you are innocent.”
- “Your complaint is invalid.”
- “Government approved.”
- “Pending” without owner, reason, date, and next event.

## Terminology

- Use `contest` for the Rule 167 merits submission.
- Use `grievance` for a service complaint only where the source portal uses it.
- Use `reviewing authority`, then display its configured name.
- Use `reasoned decision` or `order`, not `AI verdict`.
- Use `payment reconciliation` with an explanation such as “the bank and challan records do not match yet.”
- Explain `jurisdiction`, `Virtual Court`, `documentary evidence`, and `quashed` on first use.

## Status formula

Each status block answers four things:

1. What is the state?
2. Who owns the next action?
3. By when or how long is expected?
4. What can the citizen do now?

Example:

> **Under review**  
> The Hyderabad demo reviewing authority has your submitted evidence. The Rule 167 review clock in this synthetic case has 18 days remaining. You do not need to send the same files again. We will show a specific request here if more information is needed.

## Deadline formula

Never show only “12 days left.” Include the absolute date and source:

> Contest by 14 September 2026 (12 calendar days left). This date is calculated from the synthetic issue date using the configured 45-day Rule 167 window. Check the source and jurisdiction details.

## Error formula

- state what happened;
- state what was preserved;
- give one corrective action;
- include a correlation/reference only if support can use it.

Example:

> The upload stopped before it finished. Your answers and two completed files are saved. Try this file again when your connection improves.

## Decision content

A decision includes:

- outcome in plain language;
- reviewing authority and decision date;
- ground reviewed;
- evidence considered;
- structured reason and readable explanation;
- order/reference metadata;
- next action and deadline;
- source/appeal destination where configured;
- no celebratory or punitive tone.

## AI labels

- `AI-assisted draft — check before using`
- `Suggested from your confirmed details`
- `Could not read reliably`
- `This suggestion does not decide your case`

## Translation workflow

1. Write and legal/content-review source English.
2. Assign stable translation keys and context notes.
3. AI may produce a draft.
4. Competent human reviews meaning, legal nuance, numerals, dates, and tone.
5. Test in the actual UI, including long text and screen readers.
6. Store translation version on consequential receipts/orders.

Never translate vehicle/challan identifiers. Preserve official names and add a localized explanation when needed.

## Required global copy

> Challan Nyay is an independent prototype built with synthetic data and mocked integrations. It is not affiliated with or endorsed by any government authority. Do not enter real personal, vehicle, challan, or payment information.

