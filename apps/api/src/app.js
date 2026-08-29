import Fastify from "fastify";
import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { ChallanRepository } from "./database.js";
import { decideCase, DEMO_ACCOUNTS, payCase, submitContest } from "./domain.js";

function requireIdempotencyKey(request) {
  const key = request.headers["idempotency-key"];
  if (!key || String(key).length < 8) {
    const error = new Error("A valid Idempotency-Key header is required.");
    error.code = "IDEMPOTENCY_KEY_REQUIRED";
    error.statusCode = 400;
    throw error;
  }
  return String(key);
}

const DEMO_CHALLENGE_SECRET = "challan-nyay-synthetic-demo-challenge-v1";

function signChallenge(payload, secret) {
  const { answer, ...publicPayload } = payload;
  const encoded = Buffer.from(JSON.stringify(publicPayload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(`${encoded}:${answer}`).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyChallenge(token, submittedAnswer, secret) {
  const [encoded, signature, extra] = String(token || "").split(".");
  if (!encoded || !signature || extra) return false;
  const expected = createHmac("sha256", secret).update(`${encoded}:${Number(submittedAnswer)}`).digest("base64url");
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return false;
  try {
    const challenge = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return Number(challenge.expiresAt) >= Date.now();
  } catch {
    return false;
  }
}

export function buildApp({
  repository = new ChallanRepository(),
  logger = true,
  challengeSecret = process.env.CHALLAN_NYAY_CHALLENGE_SECRET || DEMO_CHALLENGE_SECRET,
} = {}) {
  const app = Fastify({ logger, requestIdHeader: "x-correlation-id", genReqId: () => randomUUID() });
  app.decorate("repository", repository);

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-correlation-id", request.id);
    reply.header("cache-control", "no-store");
    return payload;
  });

  app.get("/health", async () => ({ status: "ok", service: "challan-nyay-api", syntheticOnly: true }));

  app.get("/api/lookup/challenge", async () => {
    const left = randomInt(2, 10);
    const right = randomInt(2, 10);
    const expiresAtMs = Date.now() + 5 * 60 * 1000;
    const expiresAt = new Date(expiresAtMs).toISOString();
    const id = signChallenge({ answer: left + right, expiresAt: expiresAtMs, nonce: randomUUID() }, challengeSecret);
    return { challenge: { id, prompt: `${left} + ${right}`, expiresAt, accessibilityLabel: `What is ${left} plus ${right}?` } };
  });

  app.get("/api/demo/accounts", async () => ({
    accounts: DEMO_ACCOUNTS.map(({ caseIds, ...account }) => ({
      ...account,
      challanCount: caseIds.length,
    })),
  }));

  app.get("/api/demo/accounts/:accountId", async (request, reply) => {
    const account = DEMO_ACCOUNTS.find((item) => item.id === request.params.accountId);
    if (!account) return reply.code(404).send({ code: "ACCOUNT_NOT_FOUND", message: "Demo account not found." });
    return { account, cases: repository.listCases(account.caseIds) };
  });

  app.post("/api/cases/lookup", async (request, reply) => {
    const input = request.body || {};
    const lookupType = String(input.lookupType || "").toUpperCase();
    const query = String(input.query || "").toUpperCase().replace(/\s+/g, "");
    if (!["CHALLAN", "VEHICLE", "DL"].includes(lookupType) || !query) {
      return reply.code(422).send({ code: "LOOKUP_INPUT_REQUIRED", message: "Choose a lookup type and enter the synthetic identifier." });
    }
    if (!verifyChallenge(input.challengeId, input.challengeAnswer, challengeSecret)) {
      return reply.code(422).send({ code: "HUMAN_CHECK_FAILED", message: "The human-check answer is incorrect or expired. Refresh it and try again." });
    }
    const allCases = repository.listCases();
    const account = DEMO_ACCOUNTS.find((item) => item.dlNumber === query);
    const caseRecord = lookupType === "CHALLAN"
      ? allCases.find((item) => item.id === query)
      : lookupType === "VEHICLE"
        ? allCases.find((item) => item.id === "CN-DEMO-WRONG-VEHICLE" && item.registeredVehicle.registration === query)
          || allCases.find((item) => item.registeredVehicle.registration === query)
        : account
          ? repository.getCase(account.caseIds[0])
          : null;
    if (!caseRecord) return reply.code(404).send({ code: "NO_SYNTHETIC_MATCH", message: "No synthetic challan matched those demo details." });
    return { match: { caseId: caseRecord.id, jurisdiction: caseRecord.jurisdiction.name, state: caseRecord.state, synthetic: true } };
  });

  app.get("/api/cases/:caseId", async (request, reply) => {
    const caseRecord = repository.getCase(request.params.caseId);
    if (!caseRecord) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    return { case: caseRecord, audit: repository.listAudit(caseRecord.id) };
  });

  app.post("/api/cases/:caseId/contest-submissions", async (request, reply) => {
    const idempotencyKey = requireIdempotencyKey(request);
    const operationKey = `contest:${request.params.caseId}:${idempotencyKey}`;
    const replay = repository.getIdempotent(operationKey);
    if (replay) return reply.code(200).send({ ...replay, idempotentReplay: true });

    const current = repository.getCase(request.params.caseId);
    if (!current) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    const next = submitContest(current, request.body || {});
    repository.updateCase({
      id: current.id,
      expectedVersion: current.version,
      nextRecord: next,
      audit: {
        caseId: current.id,
        eventType: "CONTEST_SUBMITTED",
        actor: "demo-citizen",
        correlationId: request.id,
        payload: { version: next.version, receiptId: next.contest.receiptId, ground: next.contest.ground },
      },
    });
    const response = { case: next, receipt: { id: next.contest.receiptId, submittedAt: next.contest.submittedAt } };
    repository.rememberIdempotent(operationKey, current.id, response);
    return reply.code(201).send(response);
  });

  app.get("/api/review/tasks", async () => ({ tasks: repository.listReviewTasks() }));

  app.post("/api/review/tasks/:caseId/decisions", async (request, reply) => {
    const idempotencyKey = requireIdempotencyKey(request);
    const operationKey = `decision:${request.params.caseId}:${idempotencyKey}`;
    const replay = repository.getIdempotent(operationKey);
    if (replay) return reply.code(200).send({ ...replay, idempotentReplay: true });

    const current = repository.getCase(request.params.caseId);
    if (!current) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    const next = decideCase(current, request.body || {});
    repository.updateCase({
      id: current.id,
      expectedVersion: current.version,
      nextRecord: next,
      audit: {
        caseId: current.id,
        eventType: `CASE_${next.state}`,
        actor: "demo-authority-reviewer",
        correlationId: request.id,
        payload: {
          version: next.version,
          outcome: next.decision.outcome,
          reasonCode: next.decision.reasonCode,
          orderReference: next.decision.orderReference,
        },
      },
    });
    const response = { case: next, decision: next.decision };
    repository.rememberIdempotent(operationKey, current.id, response);
    return reply.code(201).send(response);
  });

  app.post("/api/cases/:caseId/payment-attempts", async (request, reply) => {
    const idempotencyKey = requireIdempotencyKey(request);
    const operationKey = `payment:${request.params.caseId}:${idempotencyKey}`;
    const replay = repository.getIdempotent(operationKey);
    if (replay) return reply.code(200).send({ ...replay, idempotentReplay: true });

    const current = repository.getCase(request.params.caseId);
    if (!current) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    const next = payCase(current, request.body || {});
    repository.updateCase({
      id: current.id,
      expectedVersion: current.version,
      nextRecord: next,
      audit: {
        caseId: current.id,
        eventType: "PAYMENT_POSTED",
        actor: "mock-payment-adapter",
        correlationId: request.id,
        payload: { version: next.version, attemptId: next.payment.attemptId, providerStatus: next.payment.providerStatus, ledgerStatus: next.payment.ledgerStatus },
      },
    });
    const response = { case: next, payment: next.payment };
    repository.rememberIdempotent(operationKey, current.id, response);
    return reply.code(201).send(response);
  });

  app.post("/api/demo/reset", async () => ({ case: repository.reset() }));

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, code: error.code }, "request failed");
    const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    reply.code(statusCode).send({
      code: error.code || "INTERNAL_ERROR",
      message: statusCode === 500 ? "The demo service could not complete this request." : error.message,
      correlationId: request.id,
    });
  });

  app.addHook("onClose", async () => repository.close());
  return app;
}
