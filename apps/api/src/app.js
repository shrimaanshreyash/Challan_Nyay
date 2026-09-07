import Fastify from "fastify";
import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { ChallanRepository } from "./database.js";
import {
  buildEvidencePassport,
  decideCase,
  DEMO_ACCOUNTS,
  DEMO_GUEST_LOOKUPS,
  payCase,
  requestInformation,
  respondToInformationRequest,
  submitContest,
} from "./domain.js";
import { listDisputeGroundContracts } from "./dispute-contracts.js";
import { projectCitizenTracking } from "./citizen-tracking.js";
import {
  accountParamsSchema,
  authoritySessionSchema,
  authorityWorklistSchema,
  caseParamsSchema,
  claimCaseSchema,
  contestDraftSchema,
  contestSubmissionSchema,
  decisionSchema,
  informationRequestSchema,
  informationResponseSchema,
  lookupSchema,
  noBodySchema,
  paymentSchema,
  paymentBatchSchema,
} from "./http-schemas.js";
import { assertRepositoryContract } from "./repository-contract.js";
import {
  createWhatsAppChannel,
  extractWhatsAppDeliveryStatuses,
  extractWhatsAppMessages,
  verifyWhatsAppSignature,
} from "./whatsapp-channel.js";
import {
  createMetaWhatsAppTransport,
  dispatchMetaOutbox,
} from "./whatsapp-meta-adapter.js";

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
const DEMO_SESSION_SECRET = "challan-nyay-synthetic-demo-session-v1";
const DEMO_REVIEWER_ACCESS_CODE = "NYAY-REVIEW-2026";
const DEMO_WHATSAPP_APP_SECRET = "challan-nyay-synthetic-whatsapp-app-secret-v1";
const DEMO_WHATSAPP_IDENTITY_SECRET = "challan-nyay-synthetic-whatsapp-identity-v1";
const DEMO_WHATSAPP_HANDOFF_SECRET = "challan-nyay-synthetic-whatsapp-handoff-v1";
const DEMO_WHATSAPP_VERIFY_TOKEN = "challan-nyay-synthetic-whatsapp-verify-v1";
const DEMO_PUBLIC_ASSET_ROOT = resolve(fileURLToPath(new URL("../../web/public/assets/", import.meta.url)));
const ASSET_CONTENT_TYPES = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
]);

function configuredSecret(name, developmentFallback) {
  const configured = process.env[name];
  const strictRuntime = process.env.NODE_ENV === "production"
    || process.env.VERCEL === "1"
    || process.env.CHALLAN_NYAY_REQUIRE_POSTGRES === "true";
  if (strictRuntime && (!configured || configured.length < 32)) {
    const error = new Error(`${name} must be configured with at least 32 characters in production.`);
    error.code = "PRODUCTION_SECRET_REQUIRED";
    throw error;
  }
  return configured || developmentFallback;
}

function timingSafeText(received, expected) {
  const receivedBuffer = Buffer.from(String(received || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));
  return receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function signSession(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifySession(token, secret) {
  const [encoded, signature, extra] = String(token || "").split(".");
  if (!encoded || !signature || extra) return null;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return Number(payload.expiresAt) >= Date.now() ? payload : null;
  } catch {
    return null;
  }
}

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
  challengeSecret = configuredSecret("CHALLAN_NYAY_CHALLENGE_SECRET", DEMO_CHALLENGE_SECRET),
  sessionSecret = configuredSecret("CHALLAN_NYAY_SESSION_SECRET", DEMO_SESSION_SECRET),
  whatsappAppSecret = configuredSecret("CHALLAN_NYAY_WHATSAPP_APP_SECRET", DEMO_WHATSAPP_APP_SECRET),
  whatsappIdentitySecret = configuredSecret("CHALLAN_NYAY_WHATSAPP_IDENTITY_SECRET", DEMO_WHATSAPP_IDENTITY_SECRET),
  whatsappHandoffSecret = configuredSecret("CHALLAN_NYAY_WHATSAPP_HANDOFF_SECRET", DEMO_WHATSAPP_HANDOFF_SECRET),
  whatsappVerifyToken = configuredSecret("CHALLAN_NYAY_WHATSAPP_VERIFY_TOKEN", DEMO_WHATSAPP_VERIFY_TOKEN),
  whatsappPublicWebUrl = process.env.CHALLAN_NYAY_PUBLIC_WEB_URL || "http://127.0.0.1:4173/",
  whatsappPublicAssetUrl = process.env.CHALLAN_NYAY_PUBLIC_ASSET_URL || whatsappPublicWebUrl,
  whatsappAccessToken = process.env.CHALLAN_NYAY_WHATSAPP_ACCESS_TOKEN,
  whatsappPhoneNumberId = process.env.CHALLAN_NYAY_WHATSAPP_PHONE_NUMBER_ID,
  whatsappGraphApiVersion = process.env.CHALLAN_NYAY_WHATSAPP_GRAPH_API_VERSION || "v23.0",
  whatsappFetch = globalThis.fetch,
  whatsappTransport,
} = {}) {
  assertRepositoryContract(repository);
  const app = Fastify({
    logger,
    requestIdHeader: "x-correlation-id",
    genReqId: () => randomUUID(),
    ajv: { customOptions: { removeAdditional: false } },
  });
  app.decorate("repository", repository);
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser("application/json", { parseAs: "string" }, (request, body, done) => {
    request.rawBody = body;
    try {
      done(null, body ? JSON.parse(body) : {});
    } catch (error) {
      error.statusCode = 400;
      done(error);
    }
  });
  const whatsappChannel = createWhatsAppChannel({
    repository,
    identitySecret: whatsappIdentitySecret,
    handoffSecret: whatsappHandoffSecret,
    publicWebBaseUrl: whatsappPublicWebUrl,
    publicAssetBaseUrl: whatsappPublicAssetUrl,
  });
  const metaWhatsApp = whatsappTransport || createMetaWhatsAppTransport({
    accessToken: whatsappAccessToken,
    phoneNumberId: whatsappPhoneNumberId,
    apiVersion: whatsappGraphApiVersion,
    fetchImpl: whatsappFetch,
  });

  app.addHook("onReady", async () => {
    await repository.initialize?.();
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-correlation-id", request.id);
    reply.header("cache-control", "no-store");
    return payload;
  });

  const health = async () => ({
    status: "ok",
    service: "challan-nyay-api",
    persistence: repository.provider,
    syntheticOnly: true,
    whatsappTransport: metaWhatsApp.mode,
  });
  app.get("/health", health);
  app.get("/api/health", health);

  app.get("/assets/*", async (request, reply) => {
    const relativePath = String(request.params?.["*"] || "").replaceAll("\\", "/");
    const assetPath = resolve(DEMO_PUBLIC_ASSET_ROOT, relativePath);
    if (!assetPath.startsWith(`${DEMO_PUBLIC_ASSET_ROOT}${sep}`)
      || !existsSync(assetPath)
      || !statSync(assetPath).isFile()) {
      return reply.code(404).send({ code: "ASSET_NOT_FOUND", message: "Synthetic demo asset not found." });
    }
    const contentType = ASSET_CONTENT_TYPES.get(extname(assetPath).toLowerCase());
    if (!contentType) {
      return reply.code(415).send({ code: "ASSET_TYPE_UNSUPPORTED", message: "Synthetic demo asset type is unsupported." });
    }
    return reply.type(contentType).send(createReadStream(assetPath));
  });

  app.get("/api/channels/whatsapp/webhook", async (request, reply) => {
    const mode = request.query?.["hub.mode"];
    const suppliedToken = String(request.query?.["hub.verify_token"] || "");
    const challenge = String(request.query?.["hub.challenge"] || "");
    if (mode !== "subscribe" || !challenge || !timingSafeText(suppliedToken, whatsappVerifyToken)) {
      return reply.code(403).send({ code: "WEBHOOK_VERIFICATION_FAILED", message: "Webhook verification failed." });
    }
    return reply.type("text/plain").send(challenge);
  });

  app.post("/api/channels/whatsapp/webhook", async (request, reply) => {
    const signature = String(request.headers["x-hub-signature-256"] || "");
    if (!verifyWhatsAppSignature(request.rawBody || "", signature, whatsappAppSecret)) {
      return reply.code(401).send({ code: "INVALID_WEBHOOK_SIGNATURE", message: "Webhook signature is invalid." });
    }
    const deliveryStatuses = extractWhatsAppDeliveryStatuses(request.body);
    let appliedStatusUpdates = 0;
    for (const status of deliveryStatuses) {
      if (await repository.applyChannelDeliveryReceipt(status)) appliedStatusUpdates += 1;
    }
    const inboundMessages = extractWhatsAppMessages(request.body);
    if (!inboundMessages.length) {
      return {
        accepted: true,
        ignored: deliveryStatuses.length === 0,
        transport: metaWhatsApp.mode,
        statusUpdates: appliedStatusUpdates,
      };
    }
    const exchanges = [];
    for (const inbound of inboundMessages) {
      const result = await whatsappChannel.handle(inbound, request.id);
      const delivery = await dispatchMetaOutbox({
        repository,
        transport: metaWhatsApp,
        providerEventId: inbound.providerEventId,
        recipient: inbound.sender,
      });
      exchanges.push({
        providerEventId: inbound.providerEventId,
        idempotentReplay: result.idempotentReplay,
        responses: result.responses,
        delivery,
      });
    }
    const primary = exchanges[0];
    return {
      accepted: true,
      transport: metaWhatsApp.mode,
      idempotentReplay: primary.idempotentReplay,
      responses: primary.responses,
      delivery: primary.delivery,
      statusUpdates: appliedStatusUpdates,
      events: exchanges.length > 1 ? exchanges : undefined,
    };
  });

  app.post("/api/channels/whatsapp/handoffs/exchange", {
    schema: {
      body: {
        type: "object",
        additionalProperties: false,
        required: ["token"],
        properties: { token: { type: "string", minLength: 40, maxLength: 256 } },
      },
    },
  }, async (request, reply) => {
    const handoff = await whatsappChannel.consumeHandoff(request.body.token);
    if (!handoff) {
      return reply.code(410).send({ code: "HANDOFF_INVALID", message: "This channel handoff is invalid, expired, or already used." });
    }
    const session = await repository.getSession(handoff.workspaceSessionId);
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      return reply.code(410).send({ code: "HANDOFF_SESSION_EXPIRED", message: "The synthetic channel session has expired." });
    }
    const expiresAtMs = new Date(session.expiresAt).getTime();
    const caseId = handoff.scope.caseIds?.[0];
    return {
      token: signSession({ sessionId: session.id, role: "CITIZEN", expiresAt: expiresAtMs, schemaVersion: 1 }, sessionSecret),
      purpose: handoff.purpose,
      scope: handoff.scope,
      destination: caseId ? `/challans/${encodeURIComponent(caseId)}` : "/challans",
      synthetic: true,
    };
  });

  async function requireRole(request, requiredRole) {
    const token = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const payload = verifySession(token, sessionSecret);
    const session = payload ? await repository.getSession(payload.sessionId) : null;
    if (!payload || !session || session.role !== payload.role || new Date(session.expiresAt).getTime() < Date.now()) {
      const error = new Error("Your synthetic demo session has expired. Start a new session and try again.");
      error.code = "SESSION_REQUIRED";
      error.statusCode = 401;
      throw error;
    }
    if (session.role !== requiredRole) {
      const error = new Error("This demo session is not permitted to use that service.");
      error.code = "ROLE_FORBIDDEN";
      error.statusCode = 403;
      throw error;
    }
    return session;
  }

  async function commitCaseMutation(reply, {
    sessionId,
    operationKey,
    current,
    next,
    audit,
    response,
    clearContestDraft = false,
  }) {
    const committed = await repository.commitSessionMutation(sessionId, {
      operationKey,
      caseId: current.id,
      expectedVersion: current.version,
      nextRecord: next,
      audit,
      response,
      clearContestDraft,
    });
    if (committed.missing) {
      return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    }
    return reply
      .code(committed.idempotentReplay ? 200 : 201)
      .send(committed.idempotentReplay
        ? { ...committed.response, idempotentReplay: true }
        : committed.response);
  }

  function assertExpectedVersion(request, current) {
    const supplied = request.body?.expectedVersion;
    if (supplied === undefined) return;
    if (supplied !== current.version) {
      const error = new Error("This case changed after the screen was loaded. Refresh it before trying again.");
      error.code = "CASE_VERSION_CONFLICT";
      error.statusCode = 409;
      throw error;
    }
  }

  function presentCase(caseRecord) {
    return {
      ...caseRecord,
      evidencePassport: buildEvidencePassport(caseRecord),
    };
  }

  app.post("/api/demo/sessions", { schema: noBodySchema }, async () => {
    const sessionId = randomUUID();
    const expiresAtMs = Date.now() + 4 * 60 * 60 * 1000;
    const session = await repository.createSession({
      id: sessionId,
      role: "CITIZEN",
      accountId: "DEMO-CITIZEN-01",
      expiresAt: new Date(expiresAtMs).toISOString(),
    });
    return {
      token: signSession({ sessionId, role: "CITIZEN", expiresAt: expiresAtMs, schemaVersion: 1 }, sessionSecret),
      session: { role: session.role, expiresAt: session.expiresAt, synthetic: true },
    };
  });

  app.post("/api/authority/sessions", { schema: authoritySessionSchema }, async (request, reply) => {
    const citizenSession = await requireRole(request, "CITIZEN");
    if (String(request.body?.accessCode || "").trim().toUpperCase() !== DEMO_REVIEWER_ACCESS_CODE) {
      return reply.code(401).send({ code: "INVALID_REVIEWER_ACCESS", message: "The synthetic reviewer access code is incorrect." });
    }
    const sessionId = randomUUID();
    const expiresAtMs = Date.now() + 60 * 60 * 1000;
    const session = await repository.createSession({
      id: sessionId,
      role: "DEMO_REVIEWER",
      workspaceSessionId: citizenSession.id,
      jurisdiction: "DEMO-NATIONWIDE",
      expiresAt: new Date(expiresAtMs).toISOString(),
    });
    const batchId = `DEMO-BATCH-${sessionId}`;
    await repository.createWorkBatch({
      id: batchId,
      workspaceSessionId: citizenSession.id,
      jurisdiction: "DEMO-NATIONWIDE",
      routingTag: "CITIZEN_GRIEVANCE_REVIEW",
      priority: "NORMAL",
      assignedReviewerSessionId: sessionId,
      caseLimit: 3,
      createdBySessionId: sessionId,
    });
    for (const caseId of ["CN-DEMO-UNDER-REVIEW", "CN-FLEET-PARKING", "CN-SINGLE-UNDER-REVIEW"]) {
      await repository.assignCase({
        workspaceSessionId: citizenSession.id,
        caseId,
        batchId,
        reviewerSessionId: sessionId,
        leaseExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
    }
    return {
      token: signSession({ sessionId, role: "DEMO_REVIEWER", expiresAt: expiresAtMs, schemaVersion: 1 }, sessionSecret),
      session: { role: session.role, expiresAt: session.expiresAt, synthetic: true },
    };
  });

  app.get("/api/lookup/challenge", async (request) => {
    await requireRole(request, "CITIZEN");
    const left = randomInt(2, 10);
    const right = randomInt(2, 10);
    const expiresAtMs = Date.now() + 5 * 60 * 1000;
    const expiresAt = new Date(expiresAtMs).toISOString();
    const id = signChallenge({ answer: left + right, expiresAt: expiresAtMs, nonce: randomUUID() }, challengeSecret);
    return { challenge: { id, prompt: `${left} + ${right}`, expiresAt, accessibilityLabel: `What is ${left} plus ${right}?` } };
  });

  app.get("/api/demo/accounts", async (request) => {
    await requireRole(request, "CITIZEN");
    return { accounts: DEMO_ACCOUNTS.map(({ caseIds, ...account }) => ({
      ...account,
      challanCount: caseIds.length,
    })) };
  });

  app.get("/api/dispute-ground-contracts", async () => ({
    contracts: listDisputeGroundContracts(),
  }));

  app.get("/api/demo/accounts/:accountId", { schema: { params: accountParamsSchema } }, async (request, reply) => {
    const session = await requireRole(request, "CITIZEN");
    const account = DEMO_ACCOUNTS.find((item) => item.id === request.params.accountId);
    if (!account) return reply.code(404).send({ code: "ACCOUNT_NOT_FOUND", message: "Demo account not found." });
    const cases = await repository.listSessionCases(session.id, account.caseIds);
    return {
      account,
      cases: await Promise.all(cases.map(async (caseRecord) => ({
        ...presentCase(caseRecord),
        tracking: projectCitizenTracking(
          caseRecord,
          await repository.listSessionWorkflowEvents(session.id, caseRecord.id),
        ),
      }))),
    };
  });

  app.post("/api/cases/lookup", { schema: lookupSchema }, async (request, reply) => {
    const session = await requireRole(request, "CITIZEN");
    const input = request.body || {};
    const lookupType = String(input.lookupType || "").toUpperCase();
    const query = String(input.query || "").toUpperCase().replace(/\s+/g, "");
    if (!["CHALLAN", "VEHICLE", "DL"].includes(lookupType) || !query) {
      return reply.code(422).send({ code: "LOOKUP_INPUT_REQUIRED", message: "Choose a lookup type and enter the synthetic identifier." });
    }
    if (!verifyChallenge(input.challengeId, input.challengeAnswer, challengeSecret)) {
      return reply.code(422).send({ code: "HUMAN_CHECK_FAILED", message: "The human-check answer is incorrect or expired. Refresh it and try again." });
    }
    const allCases = await repository.listSessionCases(session.id);
    const guestLookup = DEMO_GUEST_LOOKUPS[lookupType];
    const account = DEMO_ACCOUNTS.find((item) => item.dlNumber === query);
    const caseRecord = guestLookup?.query === query
      ? allCases.find((item) => item.id === guestLookup.caseId)
      : lookupType === "CHALLAN"
        ? allCases.find((item) => item.id === query)
        : lookupType === "VEHICLE"
          ? allCases.find((item) => item.id === "CN-DEMO-WRONG-VEHICLE" && item.registeredVehicle.registration === query)
            || allCases.find((item) => item.registeredVehicle.registration === query)
          : account
            ? await repository.getSessionCase(session.id, account.caseIds[0])
            : null;
    if (!caseRecord) return reply.code(404).send({ code: "NO_SYNTHETIC_MATCH", message: "No synthetic challan matched those demo details." });
    return { match: { caseId: caseRecord.id, jurisdiction: caseRecord.jurisdiction.name, state: caseRecord.state, synthetic: true } };
  });

  app.get("/api/cases/:caseId", { schema: { params: caseParamsSchema } }, async (request, reply) => {
    const session = await requireRole(request, "CITIZEN");
    const caseRecord = await repository.getSessionCase(session.id, request.params.caseId);
    if (!caseRecord) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    const [audit, workflowEvents] = await Promise.all([
      repository.listSessionAudit(session.id, caseRecord.id),
      repository.listSessionWorkflowEvents(session.id, caseRecord.id),
    ]);
    return {
      case: presentCase(caseRecord),
      audit,
      tracking: projectCitizenTracking(caseRecord, workflowEvents),
    };
  });

  app.get("/api/cases/:caseId/contest-draft", { schema: { params: caseParamsSchema } }, async (request, reply) => {
    const session = await requireRole(request, "CITIZEN");
    const caseRecord = await repository.getSessionCase(session.id, request.params.caseId);
    if (!caseRecord) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    return { draft: await repository.getContestDraft(session.id, request.params.caseId) };
  });

  app.put("/api/cases/:caseId/contest-draft", { schema: contestDraftSchema }, async (request, reply) => {
    const session = await requireRole(request, "CITIZEN");
    const caseRecord = await repository.getSessionCase(session.id, request.params.caseId);
    if (!caseRecord) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    if (caseRecord.state !== "VIEWED") {
      return reply.code(409).send({ code: "DRAFT_NOT_EDITABLE", message: "This grievance has already moved beyond the draft stage." });
    }
    const { expectedDraftVersion, ...payload } = request.body;
    const draft = await repository.saveContestDraft(
      session.id,
      request.params.caseId,
      expectedDraftVersion,
      payload,
    );
    return reply.code(200).send({ draft });
  });

  app.post("/api/cases/:caseId/contest-submissions", { schema: contestSubmissionSchema }, async (request, reply) => {
    const session = await requireRole(request, "CITIZEN");
    const idempotencyKey = requireIdempotencyKey(request);
    const operationKey = `contest:${request.params.caseId}:${idempotencyKey}`;
    const replay = await repository.getSessionIdempotent(session.id, operationKey);
    if (replay) return reply.code(200).send({ ...replay, idempotentReplay: true });

    const current = await repository.getSessionCase(session.id, request.params.caseId);
    if (!current) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    assertExpectedVersion(request, current);
    const next = submitContest(current, request.body || {});
    const response = { case: presentCase(next), receipt: { id: next.contest.receiptId, submittedAt: next.contest.submittedAt } };
    return commitCaseMutation(reply, {
      sessionId: session.id,
      operationKey,
      current,
      next,
      response,
      audit: {
        caseId: current.id,
        eventType: "CONTEST_SUBMITTED",
        actor: "demo-citizen",
        correlationId: request.id,
        payload: {
          version: next.version,
          receiptId: next.contest.receiptId,
          ground: next.contest.ground,
          routingTag: next.contest.issuePacket.routingTag,
        },
      },
      clearContestDraft: true,
    });
  });

  app.get("/api/authority/tasks", async (request) => {
    const reviewerSession = await requireRole(request, "DEMO_REVIEWER");
    return { tasks: await repository.listSessionReviewTasks(reviewerSession.workspaceSessionId) };
  });

  app.get("/api/authority/queue-summary", async (request) => {
    const reviewerSession = await requireRole(request, "DEMO_REVIEWER");
    return {
      summary: await repository.getAuthorityQueueSummary(
        reviewerSession.workspaceSessionId,
        reviewerSession.id,
      ),
      demonstrationScale: {
        synthetic: true,
        historicalCases: 184250,
        receivedToday: 3842,
        activeOfficers: 18,
        standardBatchSize: 25,
      },
    };
  });

  app.get("/api/authority/work-items", { schema: authorityWorklistSchema }, async (request) => {
    const reviewerSession = await requireRole(request, "DEMO_REVIEWER");
    const page = await repository.listAuthorityWorkItems(reviewerSession.workspaceSessionId, {
      view: request.query.view || "OPEN",
      reviewerSessionId: reviewerSession.id,
      limit: request.query.limit,
      cursor: request.query.cursor || null,
    });
    return {
      ...page,
      items: page.items.map((item) => ({
        ...item,
        assignment: item.assignment ? {
          ...item.assignment,
          reviewerSessionId: undefined,
          ownedByCurrentReviewer: item.assignment.reviewerSessionId === reviewerSession.id,
        } : null,
      })),
    };
  });

  app.get("/api/authority/tasks/:caseId", { schema: { params: caseParamsSchema } }, async (request, reply) => {
    const reviewerSession = await requireRole(request, "DEMO_REVIEWER");
    const caseRecord = await repository.getSessionCase(
      reviewerSession.workspaceSessionId,
      request.params.caseId,
    );
    if (!caseRecord) {
      return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    }
    return { task: presentCase(caseRecord) };
  });

  app.post("/api/authority/tasks/:caseId/claim", { schema: claimCaseSchema }, async (request, reply) => {
    const reviewerSession = await requireRole(request, "DEMO_REVIEWER");
    const idempotencyKey = requireIdempotencyKey(request);
    const result = await repository.claimAuthorityCase({
      workspaceSessionId: reviewerSession.workspaceSessionId,
      caseId: request.params.caseId,
      reviewerSessionId: reviewerSession.id,
      operationKey: `claim:${request.params.caseId}:${idempotencyKey}`,
      correlationId: request.id,
      leaseExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
    return reply.code(result.idempotentReplay ? 200 : 201).send(result);
  });

  app.post("/api/authority/tasks/:caseId/decisions", { schema: decisionSchema }, async (request, reply) => {
    const reviewerSession = await requireRole(request, "DEMO_REVIEWER");
    const workspaceSessionId = reviewerSession.workspaceSessionId;
    const idempotencyKey = requireIdempotencyKey(request);
    const operationKey = `decision:${request.params.caseId}:${idempotencyKey}`;
    const replay = await repository.getSessionIdempotent(workspaceSessionId, operationKey);
    if (replay) return reply.code(200).send({ ...replay, idempotentReplay: true });

    const current = await repository.getSessionCase(workspaceSessionId, request.params.caseId);
    if (!current) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    assertExpectedVersion(request, current);
    const next = decideCase(current, request.body || {});
    const response = { case: presentCase(next), decision: next.decision };
    return commitCaseMutation(reply, {
      sessionId: workspaceSessionId,
      operationKey,
      current,
      next,
      response,
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
  });

  app.post("/api/authority/tasks/:caseId/information-requests", { schema: informationRequestSchema }, async (request, reply) => {
    const reviewerSession = await requireRole(request, "DEMO_REVIEWER");
    const workspaceSessionId = reviewerSession.workspaceSessionId;
    const idempotencyKey = requireIdempotencyKey(request);
    const operationKey = `information-request:${request.params.caseId}:${idempotencyKey}`;
    const replay = await repository.getSessionIdempotent(workspaceSessionId, operationKey);
    if (replay) return reply.code(200).send({ ...replay, idempotentReplay: true });
    const current = await repository.getSessionCase(workspaceSessionId, request.params.caseId);
    if (!current) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    assertExpectedVersion(request, current);
    const next = requestInformation(current, request.body || {});
    const response = { case: presentCase(next), informationRequest: next.informationRequest };
    return commitCaseMutation(reply, {
      sessionId: workspaceSessionId,
      operationKey,
      current,
      next,
      response,
      audit: {
        caseId: current.id,
        eventType: "INFORMATION_REQUESTED",
        actor: "demo-authority-reviewer",
        correlationId: request.id,
        payload: { version: next.version, requestId: next.informationRequest.id, itemCode: next.informationRequest.itemCode },
      },
    });
  });

  app.post("/api/cases/:caseId/information-responses", { schema: informationResponseSchema }, async (request, reply) => {
    const session = await requireRole(request, "CITIZEN");
    const idempotencyKey = requireIdempotencyKey(request);
    const operationKey = `information-response:${request.params.caseId}:${idempotencyKey}`;
    const replay = await repository.getSessionIdempotent(session.id, operationKey);
    if (replay) return reply.code(200).send({ ...replay, idempotentReplay: true });
    const current = await repository.getSessionCase(session.id, request.params.caseId);
    if (!current) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    assertExpectedVersion(request, current);
    const next = respondToInformationRequest(current, request.body || {});
    const response = { case: presentCase(next), supplement: next.supplements.at(-1) };
    return commitCaseMutation(reply, {
      sessionId: session.id,
      operationKey,
      current,
      next,
      response,
      audit: {
        caseId: current.id,
        eventType: "CITIZEN_SUPPLEMENTED",
        actor: "demo-citizen",
        correlationId: request.id,
        payload: { version: next.version, requestId: next.informationRequest.id, packetVersion: next.supplements.at(-1).packetVersion },
      },
    });
  });

  app.post("/api/cases/:caseId/payment-attempts", { schema: paymentSchema }, async (request, reply) => {
    const session = await requireRole(request, "CITIZEN");
    const idempotencyKey = requireIdempotencyKey(request);
    const operationKey = `payment:${request.params.caseId}:${idempotencyKey}`;
    const replay = await repository.getSessionIdempotent(session.id, operationKey);
    if (replay) return reply.code(200).send({ ...replay, idempotentReplay: true });

    const current = await repository.getSessionCase(session.id, request.params.caseId);
    if (!current) return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "Demo case not found." });
    assertExpectedVersion(request, current);
    const next = payCase(current, request.body || {});
    const response = { case: presentCase(next), payment: next.payment };
    return commitCaseMutation(reply, {
      sessionId: session.id,
      operationKey,
      current,
      next,
      response,
      audit: {
        caseId: current.id,
        eventType: "PAYMENT_POSTED",
        actor: "mock-payment-adapter",
        correlationId: request.id,
        payload: { version: next.version, attemptId: next.payment.attemptId, providerStatus: next.payment.providerStatus, ledgerStatus: next.payment.ledgerStatus },
      },
    });
  });

  app.post("/api/payment-batches", { schema: paymentBatchSchema }, async (request, reply) => {
    const session = await requireRole(request, "CITIZEN");
    const idempotencyKey = requireIdempotencyKey(request);
    const operationKey = `payment-batch:${idempotencyKey}`;
    const replay = await repository.getSessionIdempotent(session.id, operationKey);
    if (replay) return reply.code(200).send({ ...replay, idempotentReplay: true });
    const items = request.body.items || [];
    if (new Set(items.map((item) => item.caseId)).size !== items.length) {
      return reply.code(422).send({ code: "DUPLICATE_CASE_SELECTION", message: "Each challan may appear only once in a payment batch." });
    }
    const currentCases = await Promise.all(items.map((item) => repository.getSessionCase(session.id, item.caseId)));
    if (currentCases.some((item) => !item)) {
      return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "A selected demo case was not found." });
    }
    for (const [index, current] of currentCases.entries()) {
      if (current.version !== items[index].expectedVersion) {
        const error = new Error("A selected case changed after the payment review opened. Refresh before trying again.");
        error.code = "CASE_VERSION_CONFLICT";
        error.statusCode = 409;
        throw error;
      }
    }
    const now = new Date();
    const nextCases = currentCases.map((current) => payCase(current, request.body, now));
    const response = {
      cases: nextCases.map(presentCase),
      paymentBatch: {
        id: `CN-PAY-BATCH-${randomUUID()}`,
        receiptId: `CN-PAY-BATCH-RCPT-${randomUUID()}`,
        caseIds: nextCases.map((item) => item.id),
        totalPaise: nextCases.reduce((sum, item) => sum + item.allegation.amountPaise, 0),
        paidAt: now.toISOString(),
        synthetic: true,
      },
    };
    const mutations = currentCases.map((current, index) => ({
      caseId: current.id,
      expectedVersion: current.version,
      nextRecord: nextCases[index],
      audit: {
        caseId: current.id,
        eventType: "PAYMENT_POSTED",
        actor: "mock-payment-adapter",
        correlationId: request.id,
        payload: {
          version: nextCases[index].version,
          batchId: response.paymentBatch.id,
          attemptId: nextCases[index].payment.attemptId,
          providerStatus: nextCases[index].payment.providerStatus,
          ledgerStatus: nextCases[index].payment.ledgerStatus,
        },
      },
    }));
    const committed = await repository.commitSessionBatchMutation(session.id, { operationKey, mutations, response });
    if (committed.missing) {
      return reply.code(404).send({ code: "CASE_NOT_FOUND", message: "A selected demo case was not found." });
    }
    return reply.code(committed.idempotentReplay ? 200 : 201).send(
      committed.idempotentReplay ? { ...committed.response, idempotentReplay: true } : committed.response,
    );
  });

  app.post("/api/demo/reset", { schema: noBodySchema }, async (request) => {
    const session = await requireRole(request, "CITIZEN");
    return { case: await repository.resetSession(session.id) };
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, code: error.code }, "request failed");
    const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    reply.code(statusCode).send({
      code: error.validation ? "INVALID_REQUEST" : error.code || "INTERNAL_ERROR",
      message: statusCode === 500
        ? "The demo service could not complete this request."
        : error.validation
          ? "Check the submitted fields and try again."
          : error.message,
      correlationId: request.id,
    });
  });

  app.addHook("onClose", async () => repository.close?.());
  return app;
}
