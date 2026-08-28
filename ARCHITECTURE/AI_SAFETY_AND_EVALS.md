# AI safety and evaluation plan

## Product role

AI is an optional administrative assistant. The core case lookup, draft, submission, queue, decision, order, and timeline must continue to work when AI is disabled.

## Allowed uses

- extract candidate text and fields from a synthetic challan/image;
- identify likely mismatches for human attention;
- suggest an applicable contest-ground category from user-confirmed facts;
- generate a ground-specific evidence checklist from approved content;
- simplify official/source text while preserving a link and disclaimer;
- draft translations for human review;
- summarize a case for the reviewer with citations to packet items;
- flag missing, unreadable, or contradictory inputs.

## Prohibited uses

- decide guilt, liability, quashing, rejection, penalty, or court outcome;
- generate, edit, or fabricate evidence;
- claim a legal ground will succeed;
- infer sensitive traits or identify people from images;
- submit or alter a case without explicit user confirmation;
- hide uncertainty or omit material contrary evidence;
- train on or reuse uploaded evidence outside the declared purpose.

## Interaction contract

Every AI-assisted result contains:

- label: `AI-assisted draft`;
- source item/region references;
- model and prompt/config version in internal metadata;
- field-level confidence or `unknown`;
- a visible correction path;
- confirmation actor and time;
- safe fallback when the model is unavailable.

## Implementation boundary

Use the OpenAI Responses API through a server-only gateway with structured JSON output. Never expose an API key to the browser. Send only the minimum synthetic document or cropped region needed. Set appropriate file expiry/retention controls and review current OpenAI platform data controls before any real-data pilot.

Official references: [OpenAI Responses API with image input](https://developers.openai.com/api/reference/typescript/resources/beta/subresources/responses/methods/create), [platform data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint), and [Evals runs](https://developers.openai.com/api/reference/cli/resources/evals/subresources/runs/methods/create).

## Evaluation dataset

Create versioned synthetic cases covering:

- clear and blurry plates;
- multiple Indian plate formats and deliberately invalid formats;
- English/Hindi and one additional-script document;
- wrong-vehicle mismatch, no mismatch, and ambiguous evidence;
- rotated, cropped, compressed, and low-light images;
- adversarial text inside documents attempting to instruct the model;
- missing pages, duplicate evidence, and conflicting documents;
- unsupported ground and out-of-jurisdiction cases.

No real citizen document enters the eval set.

## Metrics and gates

| Capability | Metric | Initial gate |
|---|---|---|
| Field extraction | exact match by field | 98% on clear synthetic fields; lower confidence triggers manual entry |
| Plate extraction | character exact match | 99% on clear fixtures; never auto-confirm |
| Ground suggestion | top-1 appropriate category | 90% with 100% safe abstention on unsupported cases |
| Evidence checklist | required-item recall | 100% against approved configuration |
| Reviewer summary | factual support | Every material statement links to a packet source |
| Translation draft | human review pass | No unreviewed translation ships as final legal guidance |
| Safety | fabricated evidence/decision rate | 0 tolerated |

Gates are development targets for the synthetic set, not broad real-world performance claims.

## Failure handling

- Low confidence: require manual entry and explain that the image could not be read reliably.
- Schema failure: retry once with bounded strategy, then fall back.
- Prompt injection in an uploaded document: treat document text as untrusted data, never instructions.
- Service unavailable: keep the user on the same step with manual controls.
- Unsupported language: preserve the original and route to human-reviewed content.
- Disagreement between user and extraction: store both; confirmed user value controls the submission, original evidence remains visible.

## Audit and monitoring

- record feature, model/config, latency, token/cost bucket, confidence, correction, and outcome without raw sensitive content;
- sample only synthetic/demo runs during the hackathon;
- track correction rate by field and language;
- rerun regression evals before model, prompt, schema, or OCR changes;
- provide an emergency feature flag to disable each AI feature independently.
