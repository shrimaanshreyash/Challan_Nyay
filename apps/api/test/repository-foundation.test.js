import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { ChallanRepository } from "../src/database.js";
import { DEMO_CASE_ID } from "../src/domain.js";
import { POSTGRES_MIGRATIONS } from "../src/postgres-migrations.js";
import { PostgresChallanRepository } from "../src/postgres-repository.js";
import { configuredPostgresUrl, createConfiguredRepository } from "../src/repository-factory.js";
import { assertRepositoryContract, REQUIRED_METHODS } from "../src/repository-contract.js";

function futureExpiry() {
  return new Date(Date.now() + 60_000).toISOString();
}

test("repository factory keeps SQLite local and requires PostgreSQL when configured", () => {
  const sqlite = createConfiguredRepository({ environment: {}, sqlitePath: ":memory:" });
  assert.equal(sqlite.provider, "sqlite");
  sqlite.close();

  assert.equal(configuredPostgresUrl({ DATABASE_URL: "postgresql://database" }), "postgresql://database");
  assert.throws(
    () => createConfiguredRepository({ environment: {}, sqlitePath: ":memory:", requirePostgres: true }),
    (error) => error.code === "POSTGRES_CONFIGURATION_REQUIRED",
  );

  const fakePool = { end() { throw new Error("injected pools must not be closed"); } };
  const postgres = createConfiguredRepository({ environment: {}, postgresPool: fakePool });
  assert.equal(postgres.provider, "postgres");
  return postgres.close();
});

test("both persistence providers expose the application repository contract", () => {
  const sqlite = new ChallanRepository(":memory:");
  assert.equal(assertRepositoryContract(sqlite), sqlite);
  sqlite.close();

  const fakePool = {};
  const postgres = new PostgresChallanRepository({ pool: fakePool });
  assert.equal(assertRepositoryContract(postgres), postgres);
  assert.ok(REQUIRED_METHODS.every((method) => typeof postgres[method] === "function"));
});

test("PostgreSQL migration contains the production isolation and operations foundation", () => {
  const sql = POSTGRES_MIGRATIONS.map((migration) => migration.sql).join("\n");
  for (const table of [
    "demo_sessions",
    "session_cases",
    "session_audit_events",
    "session_idempotency_records",
    "workflow_events",
    "work_batches",
    "case_assignments",
    "channel_conversations",
    "channel_inbox",
    "channel_outbox",
    "channel_handoffs",
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  assert.match(sql, /PRIMARY KEY \(session_id, case_id\)/);
  assert.match(sql, /FOREIGN KEY \(workspace_session_id, case_id\)/);
  assert.match(sql, /case_assignments_reviewer_idx/);
});

test("PostgreSQL authority worklists bind only parameters used by each view", async () => {
  const calls = [];
  const fakePool = {
    async query(sql, parameters) {
      calls.push({ sql, parameters });
      return { rows: [] };
    },
  };
  const repository = new PostgresChallanRepository({ pool: fakePool });
  repository.initialization = Promise.resolve();
  const workspaceSessionId = randomUUID();
  const reviewerSessionId = randomUUID();

  await repository.listAuthorityWorkItems(workspaceSessionId, {
    view: "OPEN",
    reviewerSessionId,
    limit: 12,
  });
  assert.deepEqual(calls[0].parameters, [workspaceSessionId, 13]);
  assert.match(calls[0].sql, /LIMIT \$2/);
  assert.doesNotMatch(calls[0].sql, /\$3/);

  await repository.listAuthorityWorkItems(workspaceSessionId, {
    view: "MY_BATCH",
    reviewerSessionId,
    limit: 12,
  });
  assert.deepEqual(calls[1].parameters, [workspaceSessionId, reviewerSessionId, 13]);
  assert.match(calls[1].sql, /reviewer_session_id = \$2::uuid/);
  assert.match(calls[1].sql, /LIMIT \$3/);
});

test("SQLite contract commits case, workflow event and idempotency response atomically", () => {
  const repository = new ChallanRepository(":memory:");
  const sessionId = randomUUID();
  repository.createSession({ id: sessionId, role: "CITIZEN", expiresAt: futureExpiry() });
  const current = repository.getSessionCase(sessionId, DEMO_CASE_ID);
  const next = { ...current, version: current.version + 1, state: "CONTEST_SUBMITTED", stateLabel: "Submitted" };
  const response = { case: next, receipt: { id: "ATOMIC-DEMO" } };
  const mutation = {
    operationKey: "contest:atomic-demo",
    caseId: current.id,
    expectedVersion: current.version,
    nextRecord: next,
    response,
    audit: {
      caseId: current.id,
      eventType: "CONTEST_SUBMITTED",
      actor: "demo-citizen",
      correlationId: "atomic-demo",
      payload: { version: next.version },
    },
  };

  const committed = repository.commitSessionMutation(sessionId, mutation);
  const replayed = repository.commitSessionMutation(sessionId, mutation);
  assert.equal(committed.idempotentReplay, false);
  assert.equal(replayed.idempotentReplay, true);
  assert.deepEqual(replayed.response, response);
  assert.equal(repository.getSessionCase(sessionId, DEMO_CASE_ID).version, next.version);
  assert.equal(repository.listSessionAudit(sessionId, DEMO_CASE_ID).filter((event) => event.eventType === "CONTEST_SUBMITTED").length, 1);
  assert.equal(repository.listSessionWorkflowEvents(sessionId, DEMO_CASE_ID).filter((event) => event.eventType === "CONTEST_SUBMITTED").length, 1);
  repository.close();
});

test("SQLite contract rejects a stale aggregate version without adding an audit event", () => {
  const repository = new ChallanRepository(":memory:");
  const sessionId = randomUUID();
  repository.createSession({ id: sessionId, role: "CITIZEN", expiresAt: futureExpiry() });
  const stale = repository.getSessionCase(sessionId, DEMO_CASE_ID);
  const first = { ...stale, version: stale.version + 1, stateLabel: "First writer" };
  repository.updateSessionCase(sessionId, {
    id: stale.id,
    expectedVersion: stale.version,
    nextRecord: first,
    audit: { caseId: stale.id, eventType: "FIRST_WRITE", actor: "test", correlationId: "first", payload: { version: first.version } },
  });

  assert.throws(
    () => repository.updateSessionCase(sessionId, {
      id: stale.id,
      expectedVersion: stale.version,
      nextRecord: { ...stale, version: stale.version + 1, stateLabel: "Stale writer" },
      audit: { caseId: stale.id, eventType: "STALE_WRITE", actor: "test", correlationId: "stale", payload: { version: stale.version + 1 } },
    }),
    (error) => error.code === "CASE_VERSION_CONFLICT",
  );
  assert.equal(repository.getSessionCase(sessionId, DEMO_CASE_ID).stateLabel, "First writer");
  assert.equal(repository.listSessionAudit(sessionId, DEMO_CASE_ID).some((event) => event.eventType === "STALE_WRITE"), false);
  repository.close();
});

test("SQLite assignment foundation keeps one active case assignment and versions reassignment", () => {
  const repository = new ChallanRepository(":memory:");
  const workspaceSessionId = randomUUID();
  const reviewerA = randomUUID();
  const reviewerB = randomUUID();
  repository.createSession({ id: workspaceSessionId, role: "CITIZEN", expiresAt: futureExpiry() });
  repository.createSession({ id: reviewerA, role: "DEMO_REVIEWER", workspaceSessionId, expiresAt: futureExpiry() });
  repository.createSession({ id: reviewerB, role: "DEMO_REVIEWER", workspaceSessionId, expiresAt: futureExpiry() });
  const seededCase = repository.getSessionCase(workspaceSessionId, DEMO_CASE_ID);
  repository.saveSessionCase(workspaceSessionId, {
    ...seededCase,
    version: seededCase.version + 1,
    state: "CONTEST_SUBMITTED",
    stateLabel: "Submitted",
  });
  const batchId = randomUUID();
  repository.createWorkBatch({
    id: batchId,
    workspaceSessionId,
    jurisdiction: "DEMO-NATIONWIDE",
    caseLimit: 25,
    createdBySessionId: reviewerA,
  });
  const first = repository.assignCase({ workspaceSessionId, caseId: DEMO_CASE_ID, batchId, reviewerSessionId: reviewerA });
  const reassigned = repository.assignCase({ workspaceSessionId, caseId: DEMO_CASE_ID, batchId, reviewerSessionId: reviewerB });
  assert.equal(first.version, 1);
  assert.equal(reassigned.version, 2);
  assert.equal(reassigned.reviewer_session_id, reviewerB);
  const summary = repository.getAuthorityQueueSummary(workspaceSessionId, reviewerB);
  assert.ok(summary.myBatch >= 1);
  const worklist = repository.listAuthorityWorkItems(workspaceSessionId, {
    view: "MY_BATCH",
    reviewerSessionId: reviewerB,
    limit: 1,
  });
  assert.equal(worklist.items[0].id, DEMO_CASE_ID);
  assert.equal(worklist.items[0].assignment.version, 2);
  repository.close();
});

test("SQLite channel outbox stops retrying after five failed delivery attempts", () => {
  const repository = new ChallanRepository(":memory:");
  const workspaceSessionId = randomUUID();
  const senderKey = "synthetic-sender-key";
  const providerEventId = "wamid.retry-cap";
  const conversation = repository.ensureChannelConversation({
    provider: "WHATSAPP",
    senderKey,
    workspaceSession: {
      id: workspaceSessionId,
      accountId: "DEMO-CITIZEN-01",
      expiresAt: futureExpiry(),
    },
    expiresAt: futureExpiry(),
  });
  repository.commitChannelExchange({
    provider: "WHATSAPP",
    senderKey,
    providerEventId,
    correlationId: "retry-cap",
    payloadClass: "text",
    expectedVersion: conversation.version,
    nextConversation: { ...conversation, expiresAt: futureExpiry() },
    responses: [{ type: "text", body: "Synthetic retry fixture" }],
  });

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const claimed = repository.claimChannelOutbox(providerEventId);
    assert.equal(claimed.length, 1);
    assert.equal(repository.markChannelOutboxFailed({
      id: claimed[0].id,
      errorCode: "META_4",
      retryable: true,
    }), true);
  }
  assert.deepEqual(repository.claimChannelOutbox(providerEventId), []);
  repository.close();
});

const postgresTestUrl = process.env.CHALLAN_NYAY_TEST_DATABASE_URL;

test("PostgreSQL repository migrates and isolates a synthetic session", { skip: !postgresTestUrl }, async () => {
  const repository = new PostgresChallanRepository({ connectionString: postgresTestUrl, ssl: false });
  const sessionId = randomUUID();
  try {
    await repository.initialize();
    await repository.createSession({ id: sessionId, role: "CITIZEN", expiresAt: futureExpiry() });
    const seeded = await repository.getSessionCase(sessionId, DEMO_CASE_ID);
    assert.equal(seeded.synthetic, true);
    assert.equal(seeded.version, 1);
  } finally {
    await repository.pool.query("DELETE FROM demo_sessions WHERE id = $1", [sessionId]);
    await repository.close();
  }
});
