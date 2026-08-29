import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "../src/app.js";
import { ChallanRepository } from "../src/database.js";
import { DEMO_CASE_ID } from "../src/domain.js";

function createTestApp() {
  return buildApp({ repository: new ChallanRepository(":memory:"), logger: false });
}

test("seeded case exposes nationwide configuration and synthetic evidence", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const response = await app.inject({ method: "GET", url: `/api/cases/${DEMO_CASE_ID}` });
  assert.equal(response.statusCode, 200);
  const payload = response.json();
  assert.equal(payload.case.synthetic, true);
  assert.equal(payload.case.jurisdiction.adapterMode, "MOCK");
  assert.equal(payload.case.state, "VIEWED");
  assert.equal(payload.case.evidence[0].captureSource, "FIXED_CAMERA");
  assert.equal(payload.case.evidence[0].plateAssetPath, "/assets/synthetic-number-plate-v1.png");
  assert.equal(payload.case.evidence[0].plateRegistration, payload.case.detectedVehicle.registration);
  assert.equal(payload.case.evidence[0].location.synthetic, true);
  assert.equal(payload.case.evidence[0].integrity.originalRetained, true);
});

test("portfolio cases keep allegation, map and evidence metadata consistent", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const portfolio = await app.inject({ method: "GET", url: "/api/demo/accounts/DEMO-CITIZEN-01" });
  assert.equal(portfolio.statusCode, 200);
  const cases = portfolio.json().cases;
  const coordinatePairs = new Set();
  for (const caseRecord of cases) {
    const evidence = caseRecord.evidence[0];
    assert.equal(evidence.location.label, caseRecord.allegation.location);
    assert.equal(Number.isFinite(evidence.location.latitude), true);
    assert.equal(Number.isFinite(evidence.location.longitude), true);
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
  const challengeResponse = await app.inject({ method: "GET", url: "/api/lookup/challenge" });
  const challenge = challengeResponse.json().challenge;
  const [left, , right] = challenge.prompt.split(" ");
  const invalid = await app.inject({
    method: "POST",
    url: "/api/cases/lookup",
    payload: { lookupType: "VEHICLE", query: "TS09CD5678", challengeId: challenge.id, challengeAnswer: 999 },
  });
  assert.equal(invalid.statusCode, 422);
  const valid = await app.inject({
    method: "POST",
    url: "/api/cases/lookup",
    payload: { lookupType: "VEHICLE", query: "TS09CD5678", challengeId: challenge.id, challengeAnswer: Number(left) + Number(right) },
  });
  assert.equal(valid.statusCode, 200);
  assert.equal(valid.json().match.caseId, DEMO_CASE_ID);
  assert.equal(valid.json().match.synthetic, true);
});

test("signed lookup challenge survives a serverless instance change", async (t) => {
  const challengeApp = createTestApp();
  const lookupApp = createTestApp();
  t.after(() => Promise.all([challengeApp.close(), lookupApp.close()]));
  const challengeResponse = await challengeApp.inject({ method: "GET", url: "/api/lookup/challenge" });
  const challenge = challengeResponse.json().challenge;
  const [left, , right] = challenge.prompt.split(" ");

  const lookup = await lookupApp.inject({
    method: "POST",
    url: "/api/cases/lookup",
    payload: {
      lookupType: "VEHICLE",
      query: "TS09CD5678",
      challengeId: challenge.id,
      challengeAnswer: Number(left) + Number(right),
    },
  });

  assert.equal(lookup.statusCode, 200);
  assert.equal(lookup.json().match.caseId, DEMO_CASE_ID);
});

test("demo portfolios expose multiple accounts, vehicles and challans", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const accounts = await app.inject({ method: "GET", url: "/api/demo/accounts" });
  assert.equal(accounts.statusCode, 200);
  assert.equal(accounts.json().accounts.length, 2);
  const portfolio = await app.inject({ method: "GET", url: "/api/demo/accounts/DEMO-CITIZEN-01" });
  assert.equal(portfolio.statusCode, 200);
  assert.equal(portfolio.json().account.vehicles.length, 3);
  assert.equal(portfolio.json().cases.length, 6);
  assert.ok(portfolio.json().cases.some((item) => item.payment?.receiptId));
  assert.ok(portfolio.json().cases.some((item) => item.contest?.receiptId));
});

test("contest submission is durable and idempotent", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const request = {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "contest-demo-001" },
    payload: {
      ground: "WRONG_VEHICLE",
      statement: "The scooter shown is not my registered motorcycle.",
      declarationAccepted: true,
    },
  };
  const first = await app.inject(request);
  const replay = await app.inject(request);
  assert.equal(first.statusCode, 201);
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.json().idempotentReplay, true);
  assert.equal(first.json().case.state, "CONTEST_SUBMITTED");

  const after = await app.inject({ method: "GET", url: `/api/cases/${DEMO_CASE_ID}` });
  const submissionAudits = after.json().audit.filter((event) => event.eventType === "CONTEST_SUBMITTED");
  assert.equal(submissionAudits.length, 1);
});

test("human reviewer decision closes the loop with a reasoned order", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  await app.inject({
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/contest-submissions`,
    headers: { "idempotency-key": "contest-demo-002" },
    payload: { ground: "WRONG_VEHICLE", statement: "Wrong vehicle.", declarationAccepted: true },
  });
  const waitingTasks = await app.inject({ method: "GET", url: "/api/review/tasks" });
  assert.equal(waitingTasks.statusCode, 200);
  const mainTask = waitingTasks.json().tasks.find((item) => item.id === DEMO_CASE_ID);
  assert.equal(mainTask.evidence[0].synthetic, true);
  assert.equal(mainTask.detectedVehicle.type, "Scooter");
  const decision = await app.inject({
    method: "POST",
    url: `/api/review/tasks/${DEMO_CASE_ID}/decisions`,
    headers: { "idempotency-key": "decision-demo-001" },
    payload: {
      outcome: "QUASHED",
      reasonCode: "VEHICLE_MISMATCH_CONFIRMED",
      explanation: "The vehicle in the synthetic enforcement frame does not match the registered vehicle profile.",
    },
  });
  assert.equal(decision.statusCode, 201);
  assert.equal(decision.json().case.state, "QUASHED");
  assert.match(decision.json().decision.orderReference, /^CN-ORDER-/);
  const tasks = await app.inject({ method: "GET", url: "/api/review/tasks" });
  assert.equal(tasks.json().tasks.some((item) => item.id === DEMO_CASE_ID), false);
});

test("mock payment posts once without collecting financial details", async (t) => {
  const app = createTestApp();
  t.after(() => app.close());
  const paymentRequest = {
    method: "POST",
    url: `/api/cases/${DEMO_CASE_ID}/payment-attempts`,
    headers: { "idempotency-key": "payment-demo-001" },
    payload: { paymentMethod: "DEMO_UPI", confirmationAccepted: true },
  };
  const first = await app.inject(paymentRequest);
  const replay = await app.inject(paymentRequest);
  assert.equal(first.statusCode, 201);
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.json().idempotentReplay, true);
  assert.equal(first.json().case.state, "PAID");
  assert.equal(first.json().payment.ledgerStatus, "POSTED");
  assert.equal("accountNumber" in first.json().payment, false);
  const after = await app.inject({ method: "GET", url: `/api/cases/${DEMO_CASE_ID}` });
  assert.equal(after.json().audit.filter((event) => event.eventType === "PAYMENT_POSTED").length, 1);
});
