import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildApp } from "../src/app.js";
import { ChallanRepository } from "../src/database.js";
import { DEMO_CASE_ID } from "../src/domain.js";

function createTestApp() {
  return buildApp({ repository: new ChallanRepository(":memory:"), logger: false });
}

async function startCitizen(app) {
  const response = await app.inject({ method: "POST", url: "/api/demo/sessions", payload: {} });
  assert.equal(response.statusCode, 200);
  return response.json().token;
}

async function startReviewer(app, citizenToken) {
  const response = await app.inject({
    method: "POST",
    url: "/api/authority/sessions",
    headers: { authorization: `Bearer ${citizenToken}` },
    payload: { accessCode: "NYAY-REVIEW-2026" },
  });
  assert.equal(response.statusCode, 200);
  return response.json().token;
}

function authorized(token, request) {
  return { ...request, headers: { authorization: `Bearer ${token}`, ...(request.headers || {}) } };
}

const WHATSAPP_TEST_SECRET = "challan-nyay-synthetic-whatsapp-app-secret-v1";

function whatsappPayload({ id, from = "919900001234", text, command, title = "Selected option" }) {
  const message = command
    ? { id, from, type: "interactive", interactive: { list_reply: { id: command, title } } }
    : { id, from, type: "text", text: { body: text } };
  return { object: "whatsapp_business_account", entry: [{ changes: [{ value: { messages: [message] } }] }] };
}

async function sendWhatsApp(app, input, signatureSecret = WHATSAPP_TEST_SECRET) {
  const body = JSON.stringify(whatsappPayload(input));
  return sendSignedWhatsAppPayload(app, body, signatureSecret);
}

async function sendSignedWhatsAppPayload(app, payload, signatureSecret = WHATSAPP_TEST_SECRET) {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  const signature = `sha256=${createHmac("sha256", signatureSecret).update(body).digest("hex")}`;
  return app.inject({
    method: "POST",
    url: "/api/channels/whatsapp/webhook",
    headers: { "content-type": "application/json", "x-hub-signature-256": signature },
    body,
  });
}

test("seeded case exposes nationwide configuration and synthetic evidence", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const response = await app.inject(authorized(citizenToken, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  assert.equal(response.statusCode, 200);
  const payload = response.json();
  assert.equal(payload.case.synthetic, true);
  assert.equal(payload.case.jurisdiction.adapterMode, "MOCK");
  assert.equal(payload.case.state, "VIEWED");
  assert.equal(payload.case.evidence[0].captureSource, "FIXED_CAMERA");
  assert.equal(payload.case.evidence[0].plateAssetPath, "/assets/synthetic-number-plate-v2.jpg");
  assert.equal(payload.case.evidence[0].plateRegistration, payload.case.detectedVehicle.registration);
  assert.equal(payload.case.detectedVehicle.registration, payload.case.registeredVehicle.registration);
  assert.notEqual(payload.case.detectedVehicle.type, payload.case.registeredVehicle.type);
  assert.notEqual(payload.case.detectedVehicle.colour, payload.case.registeredVehicle.colour);
  assert.ok(payload.case.registeredVehicle.imageAssetPath);
  assert.equal(payload.case.evidence[0].location.synthetic, true);
  assert.equal(payload.case.evidence[0].integrity.originalRetained, true);
  assert.equal(payload.case.evidence[0].original.immutable, true);
  assert.ok(payload.case.evidence[0].derivedAssets.every((asset) => asset.derivedFrom === payload.case.evidence[0].original.assetId));
  assert.equal(payload.case.evidence[0].previewAssetPath, "/assets/synthetic-enforcement-frame-preview.webp");
  assert.equal(payload.case.evidencePassport.plateComparison.matches, true);
  assert.deepEqual(payload.case.evidencePassport.vehicleComparison.mismatches, ["VEHICLE_TYPE", "COLOUR"]);
  assert.equal(payload.case.evidencePassport.lineageStatus, "COMPLETE");
  assert.equal(payload.case.evidencePassport.registry.source, "SYNTHETIC_VEHICLE_REGISTRY_ADAPTER");
});

test("API exposes only supported synthetic assets for WhatsApp media delivery", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const asset = await app.inject({ method: "GET", url: "/assets/vehicles/registered-motorcycle-red.png" });
  assert.equal(asset.statusCode, 200);
  assert.equal(asset.headers["content-type"], "image/png");
  const traversal = await app.inject({ method: "GET", url: "/assets/%2e%2e/domain.js" });
  assert.equal(traversal.statusCode, 404);
});

test("a repository restart preserves demo progress after the seed dataset is synchronized", () => {
  const repository = new ChallanRepository(":memory:");
  const current = repository.getCase("CN-DEMO-WRONG-VEHICLE");
  repository.save({ ...current, version: 7, stateLabel: "Locally preserved" });

  repository.synchronizeSeedDataset();

  const preserved = repository.getCase("CN-DEMO-WRONG-VEHICLE");
  assert.equal(preserved.version, 7);
  assert.equal(preserved.stateLabel, "Locally preserved");
  repository.close();
});

test("portfolio cases keep allegation, map and evidence metadata consistent", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const portfolio = await app.inject(authorized(citizenToken, { method: "GET", url: "/api/demo/accounts/DEMO-CITIZEN-01" }));
  assert.equal(portfolio.statusCode, 200);
  const cases = portfolio.json().cases;
  const coordinatePairs = new Set();
  for (const caseRecord of cases) {
    const evidence = caseRecord.evidence[0];
    assert.equal(evidence.location.label, caseRecord.allegation.location);
    assert.equal(Number.isFinite(evidence.location.latitude), true);
    assert.equal(Number.isFinite(evidence.location.longitude), true);
    assert.equal(evidence.original.immutable, true);
    assert.ok(evidence.source.sourceId);
    assert.equal(caseRecord.evidencePassport.evidenceId, evidence.id);
    assert.equal(caseRecord.evidencePassport.location.displayPolicy, "APPROXIMATE_PUBLIC_MAP");
    coordinatePairs.add(`${evidence.location.latitude},${evidence.location.longitude}`);
    if (evidence.plateAssetPath) {
      assert.equal(evidence.plateRegistration, caseRecord.detectedVehicle.registration);
    }
  }
  assert.ok(coordinatePairs.size >= 5);
});

test("synthetic lookup requires a valid server challenge", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const challengeResponse = await app.inject(authorized(citizenToken, { method: "GET", url: "/api/lookup/challenge" }));
  const challenge = challengeResponse.json().challenge;
  const [left, , right] = challenge.prompt.split(" ");
  const invalid = await app.inject(authorized(citizenToken, {
    method: "POST",
    url: "/api/cases/lookup",
    payload: { lookupType: "VEHICLE", query: "TS09CD5678", challengeId: challenge.id, challengeAnswer: 99 },
  }));
  assert.equal(invalid.statusCode, 422);
  const valid = await app.inject(authorized(citizenToken, {
    method: "POST",
    url: "/api/cases/lookup",
    payload: { lookupType: "VEHICLE", query: "TS09CD5678", challengeId: challenge.id, challengeAnswer: Number(left) + Number(right) },
  }));
  assert.equal(valid.statusCode, 200);
  assert.equal(valid.json().match.caseId, DEMO_CASE_ID);
  assert.equal(valid.json().match.synthetic, true);
});

test("signed lookup challenge survives a serverless instance change", async (t) => {
  const challengeApp = createTestApp();
  const lookupApp = createTestApp();
  t.after(() => Promise.all([challengeApp.close(), lookupApp.close()]));
  const challengeCitizenToken = await startCitizen(challengeApp);
  const lookupCitizenToken = await startCitizen(lookupApp);
  const challengeResponse = await challengeApp.inject(authorized(challengeCitizenToken, { method: "GET", url: "/api/lookup/challenge" }));
  const challenge = challengeResponse.json().challenge;
  const [left, , right] = challenge.prompt.split(" ");

  const lookup = await lookupApp.inject(authorized(lookupCitizenToken, {
    method: "POST",
    url: "/api/cases/lookup",
    payload: {
      lookupType: "VEHICLE",
      query: "TS09CD5678",
      challengeId: challenge.id,
      challengeAnswer: Number(left) + Number(right),
    },
  }));

  assert.equal(lookup.statusCode, 200);
  assert.equal(lookup.json().match.caseId, DEMO_CASE_ID);
});

test("demo portfolios expose multiple accounts, vehicles and challans", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const accounts = await app.inject(authorized(citizenToken, { method: "GET", url: "/api/demo/accounts" }));
  assert.equal(accounts.statusCode, 200);
  assert.equal(accounts.json().accounts.length, 3);
  const portfolio = await app.inject(authorized(citizenToken, { method: "GET", url: "/api/demo/accounts/DEMO-CITIZEN-01" }));
  assert.equal(portfolio.statusCode, 200);
  assert.equal(portfolio.json().account.vehicles.length, 3);
  assert.equal(portfolio.json().cases.length, 10);
  assert.equal(portfolio.json().cases.filter((item) => item.state === "PAID").length, 4);
  assert.equal(portfolio.json().cases.filter((item) => ["UNDER_REVIEW", "INFORMATION_REQUESTED"].includes(item.state)).length, 2);
  assert.ok(portfolio.json().cases.some((item) => item.payment?.receiptId));
  assert.ok(portfolio.json().cases.some((item) => item.contest?.receiptId));
});

test("the API exposes the six issue-specific dispute contracts", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());

  const response = await app.inject({ method: "GET", url: "/api/dispute-ground-contracts" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().contracts.length, 6);
  assert.ok(response.json().contracts.every((contract) => contract.fields.length > 0));
});

test("contest submission is durable and idempotent", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const before = await app.inject(authorized(citizenToken, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  const request = authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "contest-demo-001" },
    payload: {
      ground: "WRONG_VEHICLE",
      statement: "The scooter shown is not my registered motorcycle.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE", "COLOUR"] },
      declarationAccepted: true,
    },
  });
  const first = await app.inject(request);
  const replay = await app.inject(request);
  assert.equal(first.statusCode, 201);
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.json().idempotentReplay, true);
  assert.equal(first.json().case.state, "CONTEST_SUBMITTED");
  assert.equal(first.json().case.contest.issuePacket.routingTag, "EVIDENCE_VEHICLE_MISMATCH");
  assert.deepEqual(first.json().case.evidence, before.json().case.evidence);
  assert.deepEqual(first.json().case.registeredVehicle, before.json().case.registeredVehicle);
  assert.deepEqual(first.json().case.evidencePassport, before.json().case.evidencePassport);

  const after = await app.inject(authorized(citizenToken, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  const submissionAudits = after.json().audit.filter((event) => event.eventType === "CONTEST_SUBMITTED");
  assert.equal(submissionAudits.length, 1);
  const eventCountBeforeBackfill = after.json().tracking.events.length;
  app.repository.backfillSessionWorkflowEvents();
  const afterBackfill = await app.inject(authorized(citizenToken, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  assert.equal(afterBackfill.json().tracking.events.length, eventCountBeforeBackfill);
});

test("a versioned contest draft survives interruption and is cleared only after submission", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const firstSave = await app.inject(authorized(citizenToken, {
    method: "PUT",
    url: `/api/cases/${DEMO_CASE_ID}/contest-draft`,
    payload: {
      expectedDraftVersion: 0,
      ground: "ALREADY_PAID",
      statement: "I paid earlier and need the two ledgers reconciled.",
      issueDetails: { paymentReference: "DEMO-PAY-8182", paymentDate: "2026-08-12", amountPaise: 100000 },
      declarationAccepted: false,
    },
  }));
  assert.equal(firstSave.statusCode, 200);
  assert.equal(firstSave.json().draft.version, 1);

  const restored = await app.inject(authorized(citizenToken, {
    method: "GET",
    url: `/api/cases/${DEMO_CASE_ID}/contest-draft`,
  }));
  assert.equal(restored.statusCode, 200);
  assert.equal(restored.json().draft.ground, "ALREADY_PAID");
  assert.equal(restored.json().draft.issueDetails.paymentReference, "DEMO-PAY-8182");

  const staleSave = await app.inject(authorized(citizenToken, {
    method: "PUT",
    url: `/api/cases/${DEMO_CASE_ID}/contest-draft`,
    payload: {
      expectedDraftVersion: 0,
      ground: "WRONG_VEHICLE",
      statement: "A stale tab must not overwrite the saved payment draft.",
      issueDetails: { mismatchFields: ["COLOUR"] },
      declarationAccepted: false,
    },
  }));
  assert.equal(staleSave.statusCode, 409);
  assert.equal(staleSave.json().code, "DRAFT_VERSION_CONFLICT");

  const submitted = await app.inject(authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "draft-submit-001" },
    payload: {
      expectedVersion: 1,
      ground: "ALREADY_PAID",
      statement: restored.json().draft.statement,
      issueDetails: restored.json().draft.issueDetails,
      declarationAccepted: true,
    },
  }));
  assert.equal(submitted.statusCode, 201);

  const afterSubmit = await app.inject(authorized(citizenToken, {
    method: "GET",
    url: `/api/cases/${DEMO_CASE_ID}/contest-draft`,
  }));
  assert.equal(afterSubmit.json().draft, null);
});

test("the selected issue contract rejects unsafe outcomes and permits its recovery route", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const reviewerToken = await startReviewer(app, citizenToken);
  const submitted = await app.inject(authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "payment-route-contest" },
    payload: {
      ground: "ALREADY_PAID",
      statement: "The prior payment needs reconciliation before another payment is requested.",
      issueDetails: { paymentReference: "DEMO-PAY-2026-4182", paymentDate: "2026-08-12", amountPaise: 100000 },
      declarationAccepted: true,
    },
  }));
  assert.equal(submitted.statusCode, 201);

  const unsafe = await app.inject(authorized(reviewerToken, {
    method: "POST",
    url: `/api/authority/tasks/${DEMO_CASE_ID}/decisions`,
    headers: { "idempotency-key": "unsafe-payment-quash" },
    payload: { outcome: "QUASHED", reasonCode: "UNSAFE", explanation: "This outcome is outside the issue contract." },
  }));
  assert.equal(unsafe.statusCode, 422);
  assert.equal(unsafe.json().code, "OUTCOME_NOT_PERMITTED");

  const routed = await app.inject(authorized(reviewerToken, {
    method: "POST",
    url: `/api/authority/tasks/${DEMO_CASE_ID}/decisions`,
    headers: { "idempotency-key": "safe-payment-reconcile" },
    payload: {
      expectedVersion: submitted.json().case.version,
      outcome: "RECONCILIATION",
      reasonCode: "PAYMENT_LEDGER_RECONCILIATION",
      explanation: "The supplied reference needs payment-ledger reconciliation before the citizen is asked to pay again.",
    },
  }));
  assert.equal(routed.statusCode, 201);
  assert.equal(routed.json().case.state, "RECONCILIATION");
  assert.equal(routed.json().decision.evidenceConsidered.includes("PROVIDER_ATTEMPT"), true);
});

test("mutation schemas reject unknown fields before domain logic runs", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const response = await app.inject(authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "schema-reject-001" },
    payload: {
      expectedVersion: 1,
      ground: "WRONG_VEHICLE",
      statement: "The visible vehicle does not match the registered profile.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE"] },
      declarationAccepted: true,
      unsafeUnexpectedField: "must not pass",
    },
  }));
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().code, "INVALID_REQUEST");
});

test("a stale client case version cannot mutate the latest case", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const response = await app.inject(authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "stale-client-001" },
    payload: {
      expectedVersion: 999,
      ground: "WRONG_VEHICLE",
      statement: "This stale screen must not overwrite the current case.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE"] },
      declarationAccepted: true,
    },
  }));
  assert.equal(response.statusCode, 409);
  assert.equal(response.json().code, "CASE_VERSION_CONFLICT");

  const after = await app.inject(authorized(citizenToken, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  assert.equal(after.json().case.version, 1);
  assert.equal(after.json().audit.some((event) => event.eventType === "CONTEST_SUBMITTED"), false);
});

test("production mode refuses built-in signing secrets", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSessionSecret = process.env.CHALLAN_NYAY_SESSION_SECRET;
  const previousChallengeSecret = process.env.CHALLAN_NYAY_CHALLENGE_SECRET;
  const repository = new ChallanRepository(":memory:");
  try {
    process.env.NODE_ENV = "production";
    delete process.env.CHALLAN_NYAY_SESSION_SECRET;
    delete process.env.CHALLAN_NYAY_CHALLENGE_SECRET;
    assert.throws(
      () => buildApp({ repository, logger: false }),
      (error) => error.code === "PRODUCTION_SECRET_REQUIRED",
    );
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousSessionSecret === undefined) delete process.env.CHALLAN_NYAY_SESSION_SECRET;
    else process.env.CHALLAN_NYAY_SESSION_SECRET = previousSessionSecret;
    if (previousChallengeSecret === undefined) delete process.env.CHALLAN_NYAY_CHALLENGE_SECRET;
    else process.env.CHALLAN_NYAY_CHALLENGE_SECRET = previousChallengeSecret;
    repository.close();
  }
});

test("concurrent retries with one idempotency key create one case mutation", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const request = authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "contest-concurrent-001" },
    payload: {
      ground: "WRONG_VEHICLE",
      statement: "The body type and colour in the evidence do not match.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE", "COLOUR"] },
      declarationAccepted: true,
    },
  });

  const [first, second] = await Promise.all([app.inject(request), app.inject(request)]);
  assert.deepEqual([first.statusCode, second.statusCode].sort(), [200, 201]);
  const responses = [first.json(), second.json()];
  assert.equal(responses.filter((item) => item.idempotentReplay).length, 1);
  assert.equal(responses[0].case.version, responses[1].case.version);

  const after = await app.inject(authorized(citizenToken, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  assert.equal(after.json().audit.filter((event) => event.eventType === "CONTEST_SUBMITTED").length, 1);
});

test("human reviewer decision closes the loop with a reasoned order", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const reviewerToken = await startReviewer(app, citizenToken);
  await app.inject(authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "contest-demo-002" },
    payload: {
      ground: "WRONG_VEHICLE",
      statement: "Wrong vehicle.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE", "COLOUR"] },
      declarationAccepted: true,
    },
  }));
  const waitingTasks = await app.inject(authorized(reviewerToken, { method: "GET", url: "/api/authority/tasks" }));
  assert.equal(waitingTasks.statusCode, 200);
  const mainTask = waitingTasks.json().tasks.find((item) => item.id === DEMO_CASE_ID);
  assert.equal(mainTask.evidence[0].synthetic, true);
  assert.equal(mainTask.detectedVehicle.type, "Scooter");
  const decision = await app.inject(authorized(reviewerToken, {
    method: "POST",
    url: `/api/authority/tasks/${DEMO_CASE_ID}/decisions`,
    headers: { "idempotency-key": "decision-demo-001" },
    payload: {
      outcome: "QUASHED",
      reasonCode: "VEHICLE_MISMATCH_CONFIRMED",
      explanation: "The vehicle in the synthetic enforcement frame does not match the registered vehicle profile.",
    },
  }));
  assert.equal(decision.statusCode, 201);
  assert.equal(decision.json().case.state, "QUASHED");
  assert.match(decision.json().decision.orderReference, /^CN-ORDER-/);
  const tasks = await app.inject(authorized(reviewerToken, { method: "GET", url: "/api/authority/tasks" }));
  assert.equal(tasks.json().tasks.some((item) => item.id === DEMO_CASE_ID), false);
});

test("authority queue uses aggregate counts and compact server-side work items", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const reviewerToken = await startReviewer(app, citizenToken);
  await app.inject(authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "queue-summary-001" },
    payload: {
      expectedVersion: 1,
      ground: "WRONG_VEHICLE",
      statement: "The evidence shows a different vehicle body and colour.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE", "COLOUR"] },
      declarationAccepted: true,
    },
  }));

  const summary = await app.inject(authorized(reviewerToken, {
    method: "GET",
    url: "/api/authority/queue-summary",
  }));
  assert.equal(summary.statusCode, 200);
  assert.ok(summary.json().summary.open >= 1);
  assert.ok(summary.json().summary.unassigned >= 1);
  assert.equal(summary.json().demonstrationScale.synthetic, true);

  const worklist = await app.inject(authorized(reviewerToken, {
    method: "GET",
    url: "/api/authority/work-items?view=UNASSIGNED&limit=10",
  }));
  assert.equal(worklist.statusCode, 200);
  const item = worklist.json().items.find((candidate) => candidate.id === DEMO_CASE_ID);
  assert.equal(item.vehicleRegistration, "TS09CD5678");
  assert.equal(item.issueCode, "WRONG_VEHICLE");
  assert.equal("evidence" in item, false);

  const detail = await app.inject(authorized(reviewerToken, {
    method: "GET",
    url: `/api/authority/tasks/${DEMO_CASE_ID}`,
  }));
  assert.equal(detail.statusCode, 200);
  assert.equal(detail.json().task.id, DEMO_CASE_ID);
  assert.equal(detail.json().task.evidence[0].synthetic, true);
});

test("two reviewers cannot claim the same active case", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const reviewerA = await startReviewer(app, citizenToken);
  const reviewerB = await startReviewer(app, citizenToken);
  await app.inject(authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "claim-contest-001" },
    payload: {
      expectedVersion: 1,
      ground: "WRONG_VEHICLE",
      statement: "This case needs a single accountable reviewer.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE"] },
      declarationAccepted: true,
    },
  }));

  const claim = (token, key) => app.inject(authorized(token, {
    method: "POST",
    url: `/api/authority/tasks/${DEMO_CASE_ID}/claim`,
    headers: { "idempotency-key": key },
    payload: {},
  }));
  const [first, second] = await Promise.all([
    claim(reviewerA, "reviewer-a-claim-001"),
    claim(reviewerB, "reviewer-b-claim-001"),
  ]);
  assert.deepEqual([first.statusCode, second.statusCode].sort(), [201, 409]);
  const winnerToken = first.statusCode === 201 ? reviewerA : reviewerB;
  const winnerKey = first.statusCode === 201 ? "reviewer-a-claim-001" : "reviewer-b-claim-001";
  const replay = await claim(winnerToken, winnerKey);
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.json().idempotentReplay, true);

  const caseResponse = await app.inject(authorized(citizenToken, {
    method: "GET",
    url: `/api/cases/${DEMO_CASE_ID}`,
  }));
  assert.equal(caseResponse.json().audit.filter((event) => event.eventType === "CASE_CLAIMED").length, 1);
});

test("mock payment posts once without collecting financial details", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const paymentRequest = authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/payment-attempts`,
    headers: { "idempotency-key": "payment-demo-001" },
    payload: { paymentMethod: "DEMO_UPI", confirmationAccepted: true },
  });
  const first = await app.inject(paymentRequest);
  const replay = await app.inject(paymentRequest);
  assert.equal(first.statusCode, 201);
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.json().idempotentReplay, true);
  assert.equal(first.json().case.state, "PAID");
  assert.equal(first.json().payment.ledgerStatus, "POSTED");
  assert.equal("accountNumber" in first.json().payment, false);
  const after = await app.inject(authorized(citizenToken, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  assert.equal(after.json().audit.filter((event) => event.eventType === "PAYMENT_POSTED").length, 1);
});

test("citizen sessions isolate the same seeded case and reject reviewer routes", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenA = await startCitizen(app);
  const citizenB = await startCitizen(app);

  const forbidden = await app.inject(authorized(citizenA, { method: "GET", url: "/api/authority/tasks" }));
  assert.equal(forbidden.statusCode, 403);

  await app.inject(authorized(citizenA, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "isolated-contest-a" },
    payload: {
      ground: "WRONG_VEHICLE",
      statement: "The vehicle body and colour do not match.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE", "COLOUR"] },
      declarationAccepted: true,
    },
  }));

  const caseA = await app.inject(authorized(citizenA, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  const caseB = await app.inject(authorized(citizenB, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  assert.equal(caseA.json().case.state, "CONTEST_SUBMITTED");
  assert.equal(caseB.json().case.state, "VIEWED");
});

test("isolated citizen and reviewer state survives a file-backed application restart", async (t) => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "challan-nyay-restart-"));
  const databasePath = join(temporaryDirectory, "restart-proof.db");
  let app = buildApp({ repository: new ChallanRepository(databasePath), logger: false });
  t.after(async () => {
    if (app) await app.close();
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  const citizenA = await startCitizen(app);
  const citizenB = await startCitizen(app);
  const reviewerA = await startReviewer(app, citizenA);
  const contest = await app.inject(authorized(citizenA, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "restart-contest-a" },
    payload: {
      expectedVersion: 1,
      ground: "WRONG_VEHICLE",
      statement: "The retained frame shows a different vehicle body and colour.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE", "COLOUR"] },
      declarationAccepted: true,
    },
  }));
  assert.equal(contest.statusCode, 201);
  const payment = await app.inject(authorized(citizenB, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/payment-attempts`,
    headers: { "idempotency-key": "restart-payment-b" },
    payload: { expectedVersion: 1, paymentMethod: "DEMO_UPI", confirmationAccepted: true },
  }));
  assert.equal(payment.statusCode, 201);

  await app.close();
  app = buildApp({ repository: new ChallanRepository(databasePath), logger: false });

  const afterRestartA = await app.inject(authorized(citizenA, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  const afterRestartB = await app.inject(authorized(citizenB, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  assert.equal(afterRestartA.statusCode, 200);
  assert.equal(afterRestartA.json().case.state, "CONTEST_SUBMITTED");
  assert.equal(afterRestartB.statusCode, 200);
  assert.equal(afterRestartB.json().case.state, "PAID");

  const reviewerQueue = await app.inject(authorized(reviewerA, { method: "GET", url: "/api/authority/tasks" }));
  assert.equal(reviewerQueue.statusCode, 200);
  assert.ok(reviewerQueue.json().tasks.some((item) => item.id === DEMO_CASE_ID));

  const resetA = await app.inject(authorized(citizenA, { method: "POST", url: "/api/demo/reset", payload: {} }));
  assert.equal(resetA.statusCode, 200);
  const unchangedB = await app.inject(authorized(citizenB, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  assert.equal(unchangedB.json().case.state, "PAID");
});

test("two concurrent reasoned decisions produce one commit and one version conflict", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const reviewerToken = await startReviewer(app, citizenToken);
  const submitted = await app.inject(authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "decision-race-contest" },
    payload: {
      expectedVersion: 1,
      ground: "WRONG_VEHICLE",
      statement: "The vehicle type and colour differ from the registry snapshot.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE", "COLOUR"] },
      declarationAccepted: true,
    },
  }));
  assert.equal(submitted.statusCode, 201);
  const expectedVersion = submitted.json().case.version;
  const claimed = await app.inject(authorized(reviewerToken, {
    method: "POST",
    url: `/api/authority/tasks/${DEMO_CASE_ID}/claim`,
    headers: { "idempotency-key": "decision-race-claim" },
    payload: {},
  }));
  assert.equal(claimed.statusCode, 201);

  const decisionRequest = (idempotencyKey) => app.inject(authorized(reviewerToken, {
    method: "POST",
    url: `/api/authority/tasks/${DEMO_CASE_ID}/decisions`,
    headers: { "idempotency-key": idempotencyKey },
    payload: {
      expectedVersion,
      outcome: "QUASHED",
      reasonCode: "VEHICLE_MISMATCH_CONFIRMED",
      explanation: "The retained evidence shows a vehicle body and colour that do not match the registry snapshot.",
    },
  }));
  const [first, second] = await Promise.all([
    decisionRequest("decision-race-a"),
    decisionRequest("decision-race-b"),
  ]);
  assert.deepEqual([first.statusCode, second.statusCode].sort(), [201, 409]);

  const after = await app.inject(authorized(citizenToken, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  assert.equal(after.json().case.state, "QUASHED");
  assert.equal(after.json().audit.filter((event) => event.eventType === "CASE_QUASHED").length, 1);
});

test("signed WhatsApp fixture is deterministic, idempotent and shares the citizen case store", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());

  const verification = await app.inject({
    method: "GET",
    url: "/api/channels/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=challan-nyay-synthetic-whatsapp-verify-v1&hub.challenge=fixture-accepted",
  });
  assert.equal(verification.statusCode, 200);
  assert.equal(verification.body, "fixture-accepted");

  const invalid = await app.inject({
    method: "POST",
    url: "/api/channels/whatsapp/webhook",
    headers: { "content-type": "application/json", "x-hub-signature-256": "sha256=invalid" },
    body: JSON.stringify(whatsappPayload({ id: "wamid.invalid", text: "Hi" })),
  });
  assert.equal(invalid.statusCode, 401);

  const hello = await sendWhatsApp(app, { id: "wamid.001", text: "Hi" });
  assert.equal(hello.statusCode, 200);
  assert.equal(hello.json().transport, "SIGNED_FIXTURE");
  assert.deepEqual(hello.json().responses[0].buttons.map((button) => button.id), ["LANG_EN", "LANG_HI"]);

  const duplicate = await sendWhatsApp(app, { id: "wamid.001", text: "Hi" });
  assert.equal(duplicate.statusCode, 200);
  assert.equal(duplicate.json().idempotentReplay, true);
  assert.deepEqual(duplicate.json().responses, hello.json().responses);

  await sendWhatsApp(app, { id: "wamid.002", command: "LANG_EN" });
  await sendWhatsApp(app, { id: "wamid.003", command: "CHECK_CHALLAN" });
  const lookup = await sendWhatsApp(app, { id: "wamid.004", text: "TS09CD5678" });
  assert.match(lookup.json().responses[0].body, /Confirm before any case details/i);

  const verified = await sendWhatsApp(app, { id: "wamid.005", command: "VERIFY_LOOKUP" });
  assert.match(verified.json().responses[0].body, /1 vehicle · 4 challans/);

  const payAll = await sendWhatsApp(app, { id: "wamid.005a", command: "PAY_ALL" });
  assert.match(payAll.json().responses[0].body, /2 eligible challans/);
  const payAllHandoff = await sendWhatsApp(app, { id: "wamid.005b", command: "CONFIRM_PAY_ALL" });
  assert.match(payAllHandoff.json().responses[0].body, /channelHandoff=/);

  const vehicles = await sendWhatsApp(app, { id: "wamid.006", command: "VIEW_VEHICLES" });
  const vehicleList = vehicles.json().responses.find((message) => message.type === "list");
  assert.deepEqual(
    vehicleList.rows.map((row) => row.title),
    ["TS09CD5678"],
  );

  const challans = await sendWhatsApp(app, { id: "wamid.007", command: "VIEW_CHALLANS" });
  assert.equal(challans.json().responses[0].rows.length, 4);
  assert.ok(challans.json().responses[0].rows.every((row) => row.title.startsWith("TS09CD5678")));
  assert.ok(challans.json().responses[0].rows.some((row) => row.id === `CASE:${DEMO_CASE_ID}`));

  const detail = await sendWhatsApp(app, { id: "wamid.008", command: `CASE:${DEMO_CASE_ID}` });
  const detailResponses = detail.json().responses;
  assert.equal(detailResponses.filter((message) => message.type === "image").length, 2);
  assert.equal(detailResponses.some((message) => message.type === "location"), true);
  assert.match(detailResponses.find((message) => message.type === "list").body, /Riding without a helmet/);
  assert.match(detailResponses.find((message) => message.type === "list").body, /Dilsukhnagar Check Post/);
  assert.match(detailResponses.find((message) => message.type === "text").body, /possible vehicle mismatch/i);

  await sendWhatsApp(app, { id: "wamid.009", command: `GRIEVANCE:${DEMO_CASE_ID}` });
  const issue = await sendWhatsApp(app, { id: "wamid.010", command: "GROUND:ALREADY_PAID" });
  assert.match(issue.json().responses[0].body, /payment details/i);
  assert.match(issue.json().responses[0].body, /SYNTHETIC_PAYMENT_RECEIPT_OR_REFERENCE \(required\)/);

  const handoff = await sendWhatsApp(app, { id: "wamid.011", command: "CONTINUE_GRIEVANCE" });
  const url = handoff.json().responses[0].body.match(/https?:\/\/\S+/)?.[0];
  assert.ok(url);
  const token = new URL(url).searchParams.get("channelHandoff");
  const exchange = await app.inject({
    method: "POST",
    url: "/api/channels/whatsapp/handoffs/exchange",
    payload: { token },
  });
  assert.equal(exchange.statusCode, 200);
  assert.equal(exchange.json().purpose, "RAISE_GRIEVANCE");
  assert.deepEqual(exchange.json().scope, { caseIds: [DEMO_CASE_ID], ground: "ALREADY_PAID" });
  assert.ok(exchange.json().token);

  const replayExchange = await app.inject({
    method: "POST",
    url: "/api/channels/whatsapp/handoffs/exchange",
    payload: { token },
  });
  assert.equal(replayExchange.statusCode, 410);

  const restart = await sendWhatsApp(app, { id: "wamid.012", text: "Hii" });
  assert.deepEqual(restart.json().responses[0].buttons.map((button) => button.id), ["LANG_EN", "LANG_HI"]);
});

test("WhatsApp preserves requested actions and supports one, several or all payment choices", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());

  await sendWhatsApp(app, { id: "wamid.selection.01", text: "Hi" });
  await sendWhatsApp(app, { id: "wamid.selection.02", command: "LANG_EN" });
  const paymentStart = await sendWhatsApp(app, { id: "wamid.selection.03", command: "PAY_CHALLANS" });
  assert.match(paymentStart.json().responses[0].body, /vehicle number/i);
  await sendWhatsApp(app, { id: "wamid.selection.04", text: "TS09CD5678" });
  const verified = await sendWhatsApp(app, { id: "wamid.selection.05", command: "VERIFY_LOOKUP" });
  const selection = verified.json().responses.find((message) => message.type === "list");
  const selectable = selection.rows.filter((row) => row.id.startsWith("TOGGLE_PAY:"));
  assert.equal(selectable.length, 2);
  assert.ok(selection.rows.some((row) => row.id === "PAY_ALL"));

  await sendWhatsApp(app, { id: "wamid.selection.06", command: selectable[0].id });
  const secondSelection = await sendWhatsApp(app, { id: "wamid.selection.07", command: selectable[1].id });
  assert.ok(secondSelection.json().responses[0].rows.some((row) => row.id === "REVIEW_SELECTED"));
  const review = await sendWhatsApp(app, { id: "wamid.selection.08", command: "REVIEW_SELECTED" });
  assert.match(review.json().responses[0].body, /Total: ₹2,000/);
  const handoff = await sendWhatsApp(app, { id: "wamid.selection.09", command: "CONFIRM_SELECTED_PAY" });
  const url = handoff.json().responses[0].body.match(/https?:\/\/\S+/)?.[0];
  const token = new URL(url).searchParams.get("channelHandoff");
  const exchange = await app.inject({ method: "POST", url: "/api/channels/whatsapp/handoffs/exchange", payload: { token } });
  assert.equal(exchange.json().purpose, "PAY_SELECTED");
  assert.equal(exchange.json().scope.caseIds.length, 2);

  const history = await sendWhatsApp(app, { id: "wamid.selection.10", command: "PAYMENT_HISTORY" });
  const receiptRows = history.json().responses[0].rows;
  assert.ok(receiptRows.some((row) => row.id === "RECEIPT:CN-DEMO-PAID-LANE"));
  const receipt = await sendWhatsApp(app, { id: "wamid.selection.11", command: "RECEIPT:CN-DEMO-PAID-LANE" });
  assert.match(receipt.json().responses[0].body, /CN-PAY-RCPT-PAID-318/);

  const trackingSender = "918811112222";
  await sendWhatsApp(app, { id: "wamid.track.01", from: trackingSender, text: "Hi" });
  await sendWhatsApp(app, { id: "wamid.track.02", from: trackingSender, command: "LANG_EN" });
  await sendWhatsApp(app, { id: "wamid.track.03", from: trackingSender, command: "TRACK_CASE" });
  await sendWhatsApp(app, { id: "wamid.track.04", from: trackingSender, text: "TS09CD5678" });
  const trackingVerified = await sendWhatsApp(app, { id: "wamid.track.05", from: trackingSender, command: "VERIFY_LOOKUP" });
  assert.equal(trackingVerified.json().responses[1].type, "list");
  assert.ok(trackingVerified.json().responses[1].rows.every((row) => row.id.startsWith("TRACK:")));
  const tracked = await sendWhatsApp(app, {
    id: "wamid.track.06",
    from: trackingSender,
    command: trackingVerified.json().responses[1].rows[0].id,
  });
  assert.match(tracked.json().responses[0].body, /Current stage:/);

  const helpSender = "918811113333";
  await sendWhatsApp(app, { id: "wamid.help.01", from: helpSender, text: "Hi" });
  await sendWhatsApp(app, { id: "wamid.help.02", from: helpSender, command: "LANG_EN" });
  await sendWhatsApp(app, { id: "wamid.help.03", from: helpSender, command: "PAYMENT_HELP" });
  await sendWhatsApp(app, { id: "wamid.help.04", from: helpSender, text: "TS09CD5678" });
  const helpVerified = await sendWhatsApp(app, { id: "wamid.help.05", from: helpSender, command: "VERIFY_LOOKUP" });
  assert.match(helpVerified.json().responses.find((message) => message.type === "buttons").body, /do not pay again/i);
});

test("Meta transport sends a claimed outbox item once and applies delivery receipts", async (t) => {
  const repository = new ChallanRepository(":memory:");
  const sends = [];
  const app = buildApp({
    repository,
    logger: false,
    whatsappTransport: {
      enabled: true,
      mode: "META_CLOUD_API",
      async send(recipient, message) {
        sends.push({ recipient, message });
        return { providerMessageId: "wamid.outbound.integration.1" };
      },
    },
  });
  t.after(() => app.close());

  const inbound = await sendWhatsApp(app, { id: "wamid.inbound.integration.1", text: "Hi" });
  assert.equal(inbound.statusCode, 200);
  assert.equal(inbound.json().transport, "META_CLOUD_API");
  assert.deepEqual(inbound.json().delivery, { mode: "META_CLOUD_API", attempted: 1, sent: 1, failed: 0 });
  assert.equal(sends.length, 1);

  const replay = await sendWhatsApp(app, { id: "wamid.inbound.integration.1", text: "Hi" });
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.json().idempotentReplay, true);
  assert.equal(replay.json().delivery.attempted, 0);
  assert.equal(sends.length, 1);

  const receiptPayload = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          statuses: [{
            id: "wamid.outbound.integration.1",
            status: "read",
            timestamp: "1788600000",
            recipient_id: "919900001234",
          }],
        },
      }],
    }],
  };
  const receipt = await sendSignedWhatsAppPayload(app, receiptPayload);
  assert.equal(receipt.statusCode, 200);
  assert.equal(receipt.json().statusUpdates, 1);
  const stored = repository.db.prepare(`
    SELECT delivery_status AS deliveryStatus, provider_message_id AS providerMessageId
    FROM channel_outbox WHERE provider_event_id = ?
  `).get("wamid.inbound.integration.1");
  assert.equal(stored.deliveryStatus, "READ");
  assert.equal(stored.providerMessageId, "wamid.outbound.integration.1");
});

test("pay-all posts selected challans atomically and replays one batch receipt", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const headers = { authorization: `Bearer ${citizenToken}`, "idempotency-key": "batch-payment-001" };
  const before = await app.inject(authorized(citizenToken, { method: "GET", url: "/api/demo/accounts/DEMO-CITIZEN-01" }));
  const cases = before.json().cases;
  const selected = [DEMO_CASE_ID, "CN-DEMO-SIGNAL-DUE"].map((caseId) => {
    const caseRecord = cases.find((item) => item.id === caseId);
    return { caseId, expectedVersion: caseRecord.version };
  });
  const payload = { items: selected, paymentMethod: "DEMO_UPI", confirmationAccepted: true };
  const first = await app.inject({ method: "POST", url: "/api/payment-batches", headers, payload });
  assert.equal(first.statusCode, 201);
  assert.equal(first.json().cases.length, 2);
  assert.equal(first.json().paymentBatch.totalPaise, 200000);
  assert.ok(first.json().cases.every((item) => item.state === "PAID"));

  const replay = await app.inject({ method: "POST", url: "/api/payment-batches", headers, payload });
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.json().idempotentReplay, true);
  assert.equal(replay.json().paymentBatch.id, first.json().paymentBatch.id);

  await app.inject(authorized(citizenToken, { method: "POST", url: "/api/demo/reset", payload: {} }));
  const stale = await app.inject({
    method: "POST",
    url: "/api/payment-batches",
    headers: { authorization: `Bearer ${citizenToken}`, "idempotency-key": "batch-payment-stale" },
    payload: {
      ...payload,
      items: [selected[0], { ...selected[1], expectedVersion: 99 }],
    },
  });
  assert.equal(stale.statusCode, 409);
  const unchanged = await app.inject(authorized(citizenToken, { method: "GET", url: `/api/cases/${DEMO_CASE_ID}` }));
  assert.equal(unchanged.json().case.state, "VIEWED");
});

test("WhatsApp conversations survive restart without storing a raw sender identifier", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "challan-nyay-channel-"));
  const databasePath = join(directory, "channel.db");

  let app = buildApp({ repository: new ChallanRepository(databasePath), logger: false });
  t.after(async () => {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  });
  await sendWhatsApp(app, { id: "wamid.restart.1", from: "918888887777", text: "Hi" });
  await sendWhatsApp(app, { id: "wamid.restart.2", from: "918888887777", command: "LANG_HI" });
  await app.close();

  app = buildApp({ repository: new ChallanRepository(databasePath), logger: false });
  const continued = await sendWhatsApp(app, { id: "wamid.restart.3", from: "918888887777", command: "CHECK_CHALLAN" });
  assert.match(continued.json().responses[0].body, /सिंथेटिक वाहन नंबर/);
  const repository = app.repository;
  const rawSenderCount = repository.db.prepare(`
    SELECT COUNT(*) AS count FROM channel_conversations WHERE sender_key = '918888887777'
  `).get().count;
  assert.equal(rawSenderCount, 0);
});

test("reviewer information request returns to the same citizen packet and timeline", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const citizenToken = await startCitizen(app);
  const reviewerToken = await startReviewer(app, citizenToken);

  await app.inject(authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "info-contest-001" },
    payload: {
      ground: "WRONG_VEHICLE",
      statement: "The captured vehicle is not my registered motorcycle.",
      issueDetails: { mismatchFields: ["VEHICLE_TYPE", "COLOUR"] },
      declarationAccepted: true,
    },
  }));

  const requested = await app.inject(authorized(reviewerToken, {
    method: "POST",
    url: `/api/authority/tasks/${DEMO_CASE_ID}/information-requests`,
    headers: { "idempotency-key": "info-request-001" },
    payload: { itemCode: "CLEAR_VEHICLE_PHOTO", reason: "A clearer synthetic vehicle image is needed for comparison." },
  }));
  assert.equal(requested.statusCode, 201);
  assert.equal(requested.json().case.state, "INFORMATION_REQUESTED");

  const responded = await app.inject(authorized(citizenToken, {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/information-responses`,
    headers: { "idempotency-key": "info-response-001" },
    payload: { evidenceCode: "CLEAR_VEHICLE_PHOTO", responseNote: "Synthetic registered-vehicle image supplied." },
  }));
  assert.equal(responded.statusCode, 201);
  assert.equal(responded.json().case.state, "CITIZEN_SUPPLEMENTED");
  assert.equal(responded.json().case.supplements.at(-1).packetVersion, 2);

  const reviewerTasks = await app.inject(authorized(reviewerToken, { method: "GET", url: "/api/authority/tasks" }));
  const task = reviewerTasks.json().tasks.find((item) => item.id === DEMO_CASE_ID);
  assert.equal(task.state, "CITIZEN_SUPPLEMENTED");

  const tracked = await app.inject(authorized(citizenToken, {
    method: "GET",
    url: `/api/cases/${DEMO_CASE_ID}`,
  }));
  assert.equal(tracked.statusCode, 200);
  assert.equal(tracked.json().tracking.currentStage, "Response received");
  assert.equal(tracked.json().tracking.currentOwner, "Assigned reviewing authority");
  assert.ok(tracked.json().tracking.events.some((event) => event.type === "REVIEW_STARTED"));
  assert.ok(tracked.json().tracking.events.some((event) => event.type === "INFORMATION_REQUESTED"));
  assert.ok(tracked.json().tracking.events.some((event) => event.type === "CITIZEN_SUPPLEMENTED"));
  assert.ok(tracked.json().tracking.events.every((event) => event.correlationId));

  const account = await app.inject(authorized(citizenToken, {
    method: "GET",
    url: "/api/demo/accounts/DEMO-CITIZEN-01",
  }));
  const trackedAccountCase = account.json().cases.find((item) => item.id === DEMO_CASE_ID);
  assert.equal(trackedAccountCase.tracking.currentStage, "Response received");
});
