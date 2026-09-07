import pg from "pg";
import { createSeedCases, DEMO_CASE_ID } from "./domain.js";
import { POSTGRES_MIGRATIONS } from "./postgres-migrations.js";
import { assertVersionAdvance, createCaseVersionConflict } from "./repository-errors.js";
import {
  authorityWorkItem,
  decodeWorklistCursor,
  encodeWorklistCursor,
  normalizeAuthorityAssignment,
} from "./authority-read-model.js";

const { Pool } = pg;
const REVIEW_STATES = ["CONTEST_SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED", "CITIZEN_SUPPLEMENTED"];

function iso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function sessionFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    workspaceSessionId: row.workspace_session_id,
    accountId: row.account_id,
    jurisdiction: row.jurisdiction,
    expiresAt: iso(row.expires_at),
    createdAt: iso(row.created_at),
  };
}

function auditFromRow(row) {
  return {
    id: Number(row.id),
    eventType: row.event_type,
    actor: row.actor,
    correlationId: row.correlation_id,
    payload: row.payload,
    createdAt: iso(row.created_at),
  };
}

function taskFromCase(item) {
  return {
    id: item.id,
    version: item.version,
    state: item.state,
    stateLabel: item.stateLabel,
    jurisdiction: item.jurisdiction,
    contest: item.contest,
    informationRequest: item.informationRequest || null,
    supplements: item.supplements || [],
    reviewDeadline: item.reviewDeadline,
    allegation: item.allegation,
    evidence: item.evidence,
    detectedVehicle: item.detectedVehicle,
    registeredVehicle: item.registeredVehicle,
  };
}

export class PostgresChallanRepository {
  constructor({ connectionString, pool, ssl } = {}) {
    if (!pool && !connectionString) throw new Error("A PostgreSQL connection string or pool is required.");
    this.provider = "postgres";
    this.ownsPool = !pool;
    this.pool = pool || new Pool({
      connectionString,
      ssl,
      max: Number(process.env.CHALLAN_NYAY_DB_POOL_MAX || 5),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    this.initialization = null;
  }

  initialize() {
    if (!this.initialization) this.initialization = this.runMigrations();
    return this.initialization;
  }

  async runMigrations() {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext('challan-nyay-migrations'))");
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      for (const migration of POSTGRES_MIGRATIONS) {
        const existing = await client.query("SELECT id FROM schema_migrations WHERE id = $1", [migration.id]);
        if (existing.rowCount) continue;
        await client.query(migration.sql);
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration.id]);
      }
      await this.backfillSessionWorkflowEvents(client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      this.initialization = null;
      throw error;
    } finally {
      client.release();
    }
  }

  async withTransaction(operation) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createSession({ id, role, workspaceSessionId = null, accountId = null, jurisdiction = null, expiresAt }) {
    await this.initialize();
    await this.withTransaction(async (client) => {
      await client.query(`
        INSERT INTO demo_sessions (id, role, workspace_session_id, account_id, jurisdiction, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, role, workspaceSessionId, accountId, jurisdiction, expiresAt]);
      if (role === "CITIZEN") await this.seedSession(id, client);
    });
    return this.getSession(id);
  }

  async getSession(id, client = this.pool) {
    await this.initialize();
    const result = await client.query(`
      SELECT id, role, workspace_session_id, account_id, jurisdiction, expires_at, created_at
      FROM demo_sessions WHERE id = $1
    `, [id]);
    return sessionFromRow(result.rows[0]);
  }

  async seedSession(sessionId, client = this.pool) {
    for (const seedCase of createSeedCases()) {
      await client.query(`
        INSERT INTO session_cases (session_id, case_id, version, state, payload)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        ON CONFLICT (session_id, case_id) DO NOTHING
      `, [sessionId, seedCase.id, seedCase.version, seedCase.state, JSON.stringify(seedCase)]);
      await this.persistTimelineEvents(sessionId, seedCase, seedCase.timeline || [], { synthetic: true }, client);
      await this.appendSessionAudit(sessionId, {
        caseId: seedCase.id,
        eventType: "DEMO_CASE_SEEDED",
        actor: "system",
        correlationId: "seed",
        payload: { synthetic: true, version: seedCase.version },
      }, client);
    }
  }

  async persistTimelineEvents(sessionId, caseRecord, events, metadata = {}, client = this.pool) {
    for (const event of events) {
      await client.query(`
        INSERT INTO workflow_events
          (session_id, case_id, case_version, event_type, actor_role, correlation_id, metadata, occurred_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
        ON CONFLICT (session_id, case_id, case_version, event_type, correlation_id) DO NOTHING
      `, [
        sessionId,
        caseRecord.id,
        Number(event.caseVersion || caseRecord.version || 1),
        event.type,
        event.actor,
        event.id,
        JSON.stringify({ label: event.label, ...metadata }),
        event.at,
      ]);
    }
  }

  async backfillSessionWorkflowEvents(client = this.pool) {
    const result = await client.query(`
      SELECT sc.session_id, sc.payload
      FROM session_cases sc
      WHERE NOT EXISTS (
        SELECT 1 FROM workflow_events we
        WHERE we.session_id = sc.session_id AND we.case_id = sc.case_id
      )
    `);
    for (const row of result.rows) {
      await this.persistTimelineEvents(
        row.session_id,
        row.payload,
        row.payload.timeline || [],
        { synthetic: true, backfilled: true },
        client,
      );
    }
  }

  async resetSession(sessionId) {
    return this.withTransaction(async (client) => {
      await client.query("DELETE FROM session_idempotency_records WHERE session_id = $1", [sessionId]);
      await client.query("DELETE FROM case_assignments WHERE workspace_session_id = $1", [sessionId]);
      await client.query("DELETE FROM work_batches WHERE workspace_session_id = $1", [sessionId]);
      await client.query("DELETE FROM workflow_events WHERE session_id = $1", [sessionId]);
      await client.query("DELETE FROM session_audit_events WHERE session_id = $1", [sessionId]);
      await client.query("DELETE FROM session_cases WHERE session_id = $1", [sessionId]);
      await this.seedSession(sessionId, client);
      return this.getSessionCase(sessionId, DEMO_CASE_ID, client);
    });
  }

  async getSessionCase(sessionId, caseId, client = this.pool) {
    await this.initialize();
    const result = await client.query(
      "SELECT payload FROM session_cases WHERE session_id = $1 AND case_id = $2",
      [sessionId, caseId],
    );
    return result.rows[0]?.payload || null;
  }

  async listSessionCases(sessionId, ids = null) {
    await this.initialize();
    const result = await this.pool.query(
      "SELECT payload FROM session_cases WHERE session_id = $1 ORDER BY updated_at DESC, case_id",
      [sessionId],
    );
    const cases = result.rows.map((row) => row.payload);
    return ids ? ids.map((id) => cases.find((item) => item.id === id)).filter(Boolean) : cases;
  }

  async saveSessionCase(sessionId, caseRecord, client = this.pool) {
    await this.initialize();
    await client.query(`
      INSERT INTO session_cases (session_id, case_id, version, state, payload, updated_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
      ON CONFLICT (session_id, case_id) DO UPDATE SET
        version = EXCLUDED.version,
        state = EXCLUDED.state,
        payload = EXCLUDED.payload,
        updated_at = NOW()
    `, [sessionId, caseRecord.id, caseRecord.version, caseRecord.state, JSON.stringify(caseRecord)]);
    return caseRecord;
  }

  async updateSessionCase(sessionId, { id, expectedVersion, nextRecord, audit }) {
    assertVersionAdvance(expectedVersion, nextRecord);
    return this.withTransaction(async (client) => {
      const updated = await client.query(`
        UPDATE session_cases
        SET version = $3, state = $4, payload = $5::jsonb, updated_at = NOW()
        WHERE session_id = $1 AND case_id = $2 AND version = $6
        RETURNING case_id
      `, [sessionId, id, nextRecord.version, nextRecord.state, JSON.stringify(nextRecord), expectedVersion]);
      if (!updated.rowCount) {
        const exists = await client.query(
          "SELECT 1 FROM session_cases WHERE session_id = $1 AND case_id = $2",
          [sessionId, id],
        );
        if (!exists.rowCount) return null;
        throw createCaseVersionConflict();
      }
      await this.appendSessionAudit(sessionId, audit, client);
      return nextRecord;
    });
  }

  async commitSessionMutation(sessionId, { operationKey, caseId, expectedVersion, nextRecord, audit, response, clearContestDraft = false }) {
    assertVersionAdvance(expectedVersion, nextRecord);
    return this.withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${sessionId}:${operationKey}`]);
      const replay = await this.getSessionIdempotent(sessionId, operationKey, client);
      if (replay) return { response: replay, idempotentReplay: true };
      const currentResult = await client.query(
        "SELECT payload FROM session_cases WHERE session_id = $1 AND case_id = $2",
        [sessionId, caseId],
      );
      const currentRecord = currentResult.rows[0]?.payload || null;
      const updated = await client.query(`
        UPDATE session_cases
        SET version = $3, state = $4, payload = $5::jsonb, updated_at = NOW()
        WHERE session_id = $1 AND case_id = $2 AND version = $6
        RETURNING case_id
      `, [sessionId, caseId, nextRecord.version, nextRecord.state, JSON.stringify(nextRecord), expectedVersion]);
      if (!updated.rowCount) {
        const exists = await client.query(
          "SELECT 1 FROM session_cases WHERE session_id = $1 AND case_id = $2",
          [sessionId, caseId],
        );
        if (!exists.rowCount) return { response: null, idempotentReplay: false, missing: true };
        throw createCaseVersionConflict();
      }
      await this.appendSessionAudit(sessionId, audit, client);
      const existingTimelineIds = new Set((currentRecord?.timeline || []).map((event) => event.id));
      await this.persistTimelineEvents(
        sessionId,
        nextRecord,
        (nextRecord.timeline || []).filter((entry) => !existingTimelineIds.has(entry.id) && entry.type !== audit.eventType),
        { version: nextRecord.version },
        client,
      );
      if (clearContestDraft) {
        await client.query("DELETE FROM contest_drafts WHERE session_id = $1 AND case_id = $2", [sessionId, caseId]);
      }
      await this.rememberSessionIdempotent(sessionId, operationKey, caseId, response, client);
      return { response, idempotentReplay: false };
    });
  }

  async commitSessionBatchMutation(sessionId, { operationKey, mutations, response }) {
    for (const mutation of mutations) assertVersionAdvance(mutation.expectedVersion, mutation.nextRecord);
    await this.initialize();
    return this.withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${sessionId}:${operationKey}`]);
      const replay = await this.getSessionIdempotent(sessionId, operationKey, client);
      if (replay) return { response: replay, idempotentReplay: true };
      const currentRecords = new Map();
      for (const mutation of mutations) {
        const currentResult = await client.query(
          "SELECT payload FROM session_cases WHERE session_id = $1 AND case_id = $2 FOR UPDATE",
          [sessionId, mutation.caseId],
        );
        const current = currentResult.rows[0]?.payload || null;
        if (!current) return { response: null, idempotentReplay: false, missing: true };
        if (current.version !== mutation.expectedVersion) throw createCaseVersionConflict();
        currentRecords.set(mutation.caseId, current);
      }
      for (const mutation of mutations) {
        const currentRecord = currentRecords.get(mutation.caseId);
        const updated = await client.query(`
          UPDATE session_cases
          SET version = $3, state = $4, payload = $5::jsonb, updated_at = NOW()
          WHERE session_id = $1 AND case_id = $2 AND version = $6
          RETURNING case_id
        `, [
          sessionId,
          mutation.caseId,
          mutation.nextRecord.version,
          mutation.nextRecord.state,
          JSON.stringify(mutation.nextRecord),
          mutation.expectedVersion,
        ]);
        if (!updated.rowCount) {
          throw createCaseVersionConflict();
        }
        await this.appendSessionAudit(sessionId, mutation.audit, client);
        const existingTimelineIds = new Set((currentRecord?.timeline || []).map((event) => event.id));
        await this.persistTimelineEvents(
          sessionId,
          mutation.nextRecord,
          (mutation.nextRecord.timeline || []).filter((entry) => !existingTimelineIds.has(entry.id) && entry.type !== mutation.audit.eventType),
          { version: mutation.nextRecord.version, batch: true },
          client,
        );
      }
      await this.rememberSessionIdempotent(sessionId, operationKey, mutations[0].caseId, response, client);
      return { response, idempotentReplay: false };
    });
  }

  async listSessionReviewTasks(sessionId) {
    const cases = await this.listSessionCases(sessionId);
    return cases.filter((item) => REVIEW_STATES.includes(item.state)).map(taskFromCase);
  }

  async getAuthorityQueueSummary(sessionId, reviewerSessionId = null) {
    await this.initialize();
    const result = await this.pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE sc.state IN ('CONTEST_SUBMITTED','UNDER_REVIEW','INFORMATION_REQUESTED','CITIZEN_SUPPLEMENTED'))::int AS open,
        COUNT(*) FILTER (WHERE sc.state = 'CONTEST_SUBMITTED')::int AS new,
        COUNT(*) FILTER (
          WHERE sc.state IN ('CONTEST_SUBMITTED','UNDER_REVIEW','INFORMATION_REQUESTED','CITIZEN_SUPPLEMENTED')
            AND ca.reviewer_session_id IS NULL
        )::int AS unassigned,
        COUNT(*) FILTER (
          WHERE sc.state IN ('CONTEST_SUBMITTED','UNDER_REVIEW','INFORMATION_REQUESTED','CITIZEN_SUPPLEMENTED')
            AND ca.reviewer_session_id = $2
        )::int AS my_batch,
        COUNT(*) FILTER (WHERE sc.state = 'INFORMATION_REQUESTED')::int AS waiting_for_citizen,
        COUNT(*) FILTER (WHERE sc.state IN ('UNDER_REVIEW','CITIZEN_SUPPLEMENTED'))::int AS under_review,
        COUNT(*) FILTER (
          WHERE sc.state IN ('CONTEST_SUBMITTED','UNDER_REVIEW','INFORMATION_REQUESTED','CITIZEN_SUPPLEMENTED')
            AND NULLIF(sc.payload->>'reviewDeadline','')::timestamptz >= NOW()
            AND NULLIF(sc.payload->>'reviewDeadline','')::timestamptz < date_trunc('day', NOW()) + INTERVAL '1 day'
        )::int AS due_today,
        COUNT(*) FILTER (
          WHERE sc.state IN ('CONTEST_SUBMITTED','UNDER_REVIEW','INFORMATION_REQUESTED','CITIZEN_SUPPLEMENTED')
            AND NULLIF(sc.payload->>'reviewDeadline','')::timestamptz < NOW()
        )::int AS escalated,
        COUNT(*) FILTER (WHERE sc.state IN ('QUASHED','REJECTED','PAID'))::int AS resolved
      FROM session_cases sc
      LEFT JOIN case_assignments ca
        ON ca.workspace_session_id = sc.session_id AND ca.case_id = sc.case_id
      WHERE sc.session_id = $1
    `, [sessionId, reviewerSessionId]);
    const row = result.rows[0];
    return {
      total: row.total,
      open: row.open,
      new: row.new,
      unassigned: row.unassigned,
      myBatch: row.my_batch,
      waitingForCitizen: row.waiting_for_citizen,
      underReview: row.under_review,
      dueToday: row.due_today,
      escalated: row.escalated,
      resolved: row.resolved,
    };
  }

  async listAuthorityWorkItems(sessionId, { view = "OPEN", reviewerSessionId = null, limit = 25, cursor = null } = {}) {
    await this.initialize();
    const boundedLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const parameters = [sessionId, reviewerSessionId];
    const conditions = ["sc.session_id = $1"];
    const active = "sc.state IN ('CONTEST_SUBMITTED','UNDER_REVIEW','INFORMATION_REQUESTED','CITIZEN_SUPPLEMENTED')";
    const viewConditions = {
      OPEN: active,
      NEW: "sc.state = 'CONTEST_SUBMITTED'",
      UNASSIGNED: `${active} AND ca.reviewer_session_id IS NULL`,
      MY_BATCH: `${active} AND ca.reviewer_session_id = $2`,
      WAITING_FOR_CITIZEN: "sc.state = 'INFORMATION_REQUESTED'",
      UNDER_REVIEW: "sc.state IN ('UNDER_REVIEW','CITIZEN_SUPPLEMENTED')",
      DUE_TODAY: `${active} AND NULLIF(sc.payload->>'reviewDeadline','')::timestamptz >= NOW() AND NULLIF(sc.payload->>'reviewDeadline','')::timestamptz < date_trunc('day', NOW()) + INTERVAL '1 day'`,
      ESCALATED: `${active} AND NULLIF(sc.payload->>'reviewDeadline','')::timestamptz < NOW()`,
      RESOLVED: "sc.state IN ('QUASHED','REJECTED','PAID')",
    };
    conditions.push(viewConditions[view] || viewConditions.OPEN);
    const decodedCursor = decodeWorklistCursor(cursor);
    if (decodedCursor) {
      parameters.push(decodedCursor.updatedAt, decodedCursor.id);
      conditions.push(`(sc.updated_at < $${parameters.length - 1}::timestamptz OR (sc.updated_at = $${parameters.length - 1}::timestamptz AND sc.case_id < $${parameters.length}))`);
    }
    parameters.push(boundedLimit + 1);
    const result = await this.pool.query(`
      SELECT sc.case_id, sc.payload, sc.updated_at,
             ca.batch_id, ca.reviewer_session_id, ca.status AS assignment_status,
             ca.lease_expires_at, ca.version AS assignment_version
      FROM session_cases sc
      LEFT JOIN case_assignments ca
        ON ca.workspace_session_id = sc.session_id AND ca.case_id = sc.case_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY sc.updated_at DESC, sc.case_id DESC
      LIMIT $${parameters.length}
    `, parameters);
    const items = result.rows.map((row) => authorityWorkItem(row.payload, row.assignment_status ? {
      batchId: row.batch_id,
      reviewerSessionId: row.reviewer_session_id,
      status: row.assignment_status,
      leaseExpiresAt: row.lease_expires_at,
      version: row.assignment_version,
    } : null, iso(row.updated_at)));
    const page = items.slice(0, boundedLimit);
    return {
      items: page,
      nextCursor: items.length > boundedLimit ? encodeWorklistCursor(page.at(-1)) : null,
    };
  }

  async claimAuthorityCase({ workspaceSessionId, caseId, reviewerSessionId, operationKey, correlationId, leaseExpiresAt }) {
    await this.initialize();
    return this.withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))", [workspaceSessionId, caseId]);
      const replay = await this.getSessionIdempotent(workspaceSessionId, operationKey, client);
      if (replay) return { ...replay, idempotentReplay: true };
      const caseResult = await client.query(`
        SELECT version, state FROM session_cases
        WHERE session_id = $1 AND case_id = $2
        FOR UPDATE
      `, [workspaceSessionId, caseId]);
      const caseRow = caseResult.rows[0];
      if (!caseRow || !["CONTEST_SUBMITTED", "UNDER_REVIEW", "CITIZEN_SUPPLEMENTED"].includes(caseRow.state)) {
        const error = new Error("This case is not available to claim.");
        error.code = "CASE_NOT_CLAIMABLE";
        error.statusCode = 409;
        throw error;
      }
      const existingResult = await client.query(`
        SELECT * FROM case_assignments
        WHERE workspace_session_id = $1 AND case_id = $2
        FOR UPDATE
      `, [workspaceSessionId, caseId]);
      const existing = existingResult.rows[0];
      const activeOtherClaim = existing
        && existing.status === "CLAIMED"
        && existing.reviewer_session_id !== reviewerSessionId
        && (!existing.lease_expires_at || new Date(existing.lease_expires_at).getTime() > Date.now());
      if (activeOtherClaim) {
        const error = new Error("Another reviewer currently owns this case.");
        error.code = "ASSIGNMENT_CONFLICT";
        error.statusCode = 409;
        throw error;
      }
      const assignmentResult = await client.query(`
        INSERT INTO case_assignments
          (workspace_session_id, case_id, reviewer_session_id, status, claimed_at, lease_expires_at)
        VALUES ($1, $2, $3, 'CLAIMED', NOW(), $4)
        ON CONFLICT (workspace_session_id, case_id) DO UPDATE SET
          reviewer_session_id = EXCLUDED.reviewer_session_id,
          status = 'CLAIMED',
          claimed_at = EXCLUDED.claimed_at,
          lease_expires_at = EXCLUDED.lease_expires_at,
          updated_at = NOW(),
          version = case_assignments.version + 1
        RETURNING *
      `, [workspaceSessionId, caseId, reviewerSessionId, leaseExpiresAt]);
      const assignment = normalizeAuthorityAssignment(assignmentResult.rows[0]);
      await this.appendSessionAudit(workspaceSessionId, {
        caseId,
        eventType: "CASE_CLAIMED",
        actor: "demo-authority-reviewer",
        correlationId,
        payload: { version: Number(caseRow.version), assignmentVersion: assignment.version, reviewerSessionId },
      }, client);
      const response = { assignment };
      await this.rememberSessionIdempotent(workspaceSessionId, operationKey, caseId, response, client);
      return { ...response, idempotentReplay: false };
    });
  }

  async appendSessionAudit(sessionId, { caseId, eventType, actor, correlationId, payload }, client = this.pool) {
    const createdAt = new Date().toISOString();
    await client.query(`
      INSERT INTO session_audit_events
        (session_id, case_id, event_type, actor, correlation_id, payload, created_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
    `, [sessionId, caseId, eventType, actor, correlationId, JSON.stringify(payload), createdAt]);
    await client.query(`
      INSERT INTO workflow_events
        (session_id, case_id, case_version, event_type, actor_role, correlation_id, metadata, occurred_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      ON CONFLICT (session_id, case_id, case_version, event_type, correlation_id) DO NOTHING
    `, [sessionId, caseId, Number(payload?.version || 1), eventType, actor, correlationId, JSON.stringify(payload), createdAt]);
  }

  async listSessionAudit(sessionId, caseId) {
    await this.initialize();
    const result = await this.pool.query(`
      SELECT id, event_type, actor, correlation_id, payload, created_at
      FROM session_audit_events
      WHERE session_id = $1 AND case_id = $2
      ORDER BY id ASC
    `, [sessionId, caseId]);
    return result.rows.map(auditFromRow);
  }

  async listSessionWorkflowEvents(sessionId, caseId) {
    await this.initialize();
    const result = await this.pool.query(`
      SELECT id, case_version AS "caseVersion", event_type AS "eventType",
             actor_role AS "actorRole", correlation_id AS "correlationId",
             metadata, occurred_at AS "occurredAt"
      FROM workflow_events
      WHERE session_id = $1 AND case_id = $2
      ORDER BY id ASC
    `, [sessionId, caseId]);
    return result.rows.map((row) => ({ ...row, id: Number(row.id), occurredAt: iso(row.occurredAt) }));
  }

  async getContestDraft(sessionId, caseId) {
    await this.initialize();
    const result = await this.pool.query(`
      SELECT version, payload, updated_at AS "updatedAt"
      FROM contest_drafts WHERE session_id = $1 AND case_id = $2
    `, [sessionId, caseId]);
    const row = result.rows[0];
    return row ? { version: Number(row.version), updatedAt: iso(row.updatedAt), ...row.payload } : null;
  }

  async saveContestDraft(sessionId, caseId, expectedVersion, payload) {
    await this.initialize();
    return this.withTransaction(async (client) => {
      const caseResult = await client.query(
        "SELECT 1 FROM session_cases WHERE session_id = $1 AND case_id = $2",
        [sessionId, caseId],
      );
      if (!caseResult.rowCount) return null;
      const currentResult = await client.query(`
        SELECT version FROM contest_drafts
        WHERE session_id = $1 AND case_id = $2 FOR UPDATE
      `, [sessionId, caseId]);
      const currentVersion = Number(currentResult.rows[0]?.version || 0);
      if (currentVersion !== expectedVersion) {
        const error = new Error("This draft changed after it was opened. Reload the saved version before continuing.");
        error.code = "DRAFT_VERSION_CONFLICT";
        error.statusCode = 409;
        throw error;
      }
      const version = currentVersion + 1;
      const result = await client.query(`
        INSERT INTO contest_drafts (session_id, case_id, version, payload, updated_at)
        VALUES ($1, $2, $3, $4::jsonb, NOW())
        ON CONFLICT (session_id, case_id) DO UPDATE SET
          version = EXCLUDED.version,
          payload = EXCLUDED.payload,
          updated_at = EXCLUDED.updated_at
        RETURNING version, updated_at AS "updatedAt"
      `, [sessionId, caseId, version, JSON.stringify(payload)]);
      return { version, updatedAt: iso(result.rows[0].updatedAt), ...payload };
    });
  }

  async ensureChannelConversation({ provider, senderKey, workspaceSession, expiresAt }) {
    await this.initialize();
    return this.withTransaction(async (client) => {
      const existing = await this.getChannelConversation(provider, senderKey, client);
      if (existing && new Date(existing.expiresAt).getTime() >= Date.now()) return existing;
      if (existing) {
        await client.query(
          "DELETE FROM channel_conversations WHERE provider = $1 AND sender_key = $2",
          [provider, senderKey],
        );
      }
      await client.query(`
        INSERT INTO demo_sessions
          (id, role, workspace_session_id, account_id, jurisdiction, expires_at)
        VALUES ($1, 'CITIZEN', NULL, $2, NULL, $3)
        ON CONFLICT (id) DO NOTHING
      `, [workspaceSession.id, workspaceSession.accountId, workspaceSession.expiresAt]);
      const hasCases = await client.query(
        "SELECT 1 FROM session_cases WHERE session_id = $1 LIMIT 1",
        [workspaceSession.id],
      );
      if (!hasCases.rowCount) await this.seedSession(workspaceSession.id, client);
      await client.query(`
        INSERT INTO channel_conversations
          (provider, sender_key, workspace_session_id, locale, step, selected_case_id,
           context, version, expires_at)
        VALUES ($1, $2, $3, NULL, 'CHOOSE_LANGUAGE', NULL, '{}'::jsonb, 1, $4)
        ON CONFLICT (provider, sender_key) DO NOTHING
      `, [provider, senderKey, workspaceSession.id, expiresAt]);
      return this.getChannelConversation(provider, senderKey, client);
    });
  }

  async getChannelConversation(provider, senderKey, client = this.pool) {
    await this.initialize();
    const result = await client.query(`
      SELECT provider, sender_key AS "senderKey", workspace_session_id AS "workspaceSessionId",
             locale, step, selected_case_id AS "selectedCaseId", context, version,
             expires_at AS "expiresAt", updated_at AS "updatedAt"
      FROM channel_conversations WHERE provider = $1 AND sender_key = $2
    `, [provider, senderKey]);
    const row = result.rows[0];
    return row ? {
      ...row,
      version: Number(row.version),
      expiresAt: iso(row.expiresAt),
      updatedAt: iso(row.updatedAt),
    } : null;
  }

  async getChannelInboxOutcome(providerEventId, client = this.pool) {
    await this.initialize();
    const result = await client.query(`
      SELECT response_payload AS "responsePayload"
      FROM channel_inbox WHERE provider_event_id = $1
    `, [providerEventId]);
    return result.rows[0]?.responsePayload || null;
  }

  async commitChannelExchange({
    provider,
    senderKey,
    providerEventId,
    correlationId,
    payloadClass,
    expectedVersion,
    nextConversation,
    responses,
  }) {
    await this.initialize();
    return this.withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`channel:${providerEventId}`]);
      const replay = await this.getChannelInboxOutcome(providerEventId, client);
      if (replay) return { responses: replay, idempotentReplay: true };
      const updated = await client.query(`
        UPDATE channel_conversations
        SET locale = $3, step = $4, selected_case_id = $5, context = $6::jsonb,
            version = $7, expires_at = $8, updated_at = NOW()
        WHERE provider = $1 AND sender_key = $2 AND version = $9
        RETURNING version
      `, [
        provider,
        senderKey,
        nextConversation.locale,
        nextConversation.step,
        nextConversation.selectedCaseId || null,
        JSON.stringify(nextConversation.context || {}),
        expectedVersion + 1,
        nextConversation.expiresAt,
        expectedVersion,
      ]);
      if (!updated.rowCount) {
        const error = new Error("This channel conversation changed. Refresh the menu and try again.");
        error.code = "CHANNEL_VERSION_CONFLICT";
        error.statusCode = 409;
        throw error;
      }
      await client.query(`
        INSERT INTO channel_inbox
          (provider_event_id, provider, sender_key, correlation_id, payload_class, response_payload)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `, [providerEventId, provider, senderKey, correlationId, payloadClass, JSON.stringify(responses)]);
      for (const [index, message] of responses.entries()) {
        await client.query(`
          INSERT INTO channel_outbox
            (provider_event_id, message_index, payload_class, payload, delivery_status)
          VALUES ($1, $2, $3, $4::jsonb, 'PENDING')
        `, [providerEventId, index, message.type || "text", JSON.stringify(message)]);
      }
      return {
        responses,
        idempotentReplay: false,
        conversation: await this.getChannelConversation(provider, senderKey, client),
      };
    });
  }

  async claimChannelOutbox(providerEventId) {
    await this.initialize();
    const result = await this.pool.query(`
      WITH candidates AS (
        SELECT id
        FROM channel_outbox
        WHERE provider_event_id = $1 AND delivery_status IN ('PENDING', 'RETRY_PENDING')
          AND attempt_count < 5
        ORDER BY message_index ASC
        FOR UPDATE SKIP LOCKED
      )
      UPDATE channel_outbox AS outbox
      SET delivery_status = 'SENDING', attempt_count = outbox.attempt_count + 1,
          last_attempt_at = NOW(), last_error_code = NULL
      FROM candidates
      WHERE outbox.id = candidates.id
      RETURNING outbox.id, outbox.message_index AS "messageIndex", outbox.payload
    `, [providerEventId]);
    return result.rows.sort((left, right) => left.messageIndex - right.messageIndex);
  }

  async markChannelOutboxSent({ id, providerMessageId }) {
    await this.initialize();
    const result = await this.pool.query(`
      UPDATE channel_outbox
      SET delivery_status = 'SENT', provider_message_id = $2,
          provider_status_at = NOW(), last_error_code = NULL
      WHERE id = $1 AND delivery_status = 'SENDING'
    `, [id, providerMessageId]);
    return result.rowCount === 1;
  }

  async markChannelOutboxFailed({ id, errorCode, retryable }) {
    await this.initialize();
    const result = await this.pool.query(`
      UPDATE channel_outbox
      SET delivery_status = CASE WHEN $2 AND attempt_count < 5 THEN 'RETRY_PENDING' ELSE 'FAILED' END,
          last_error_code = $3
      WHERE id = $1 AND delivery_status = 'SENDING'
    `, [id, Boolean(retryable), errorCode]);
    return result.rowCount === 1;
  }

  async applyChannelDeliveryReceipt({ providerMessageId, status, providerTimestamp, errorCode = null }) {
    await this.initialize();
    return this.withTransaction(async (client) => {
      const currentResult = await client.query(`
        SELECT delivery_status AS "deliveryStatus"
        FROM channel_outbox WHERE provider_message_id = $1 FOR UPDATE
      `, [providerMessageId]);
      const current = currentResult.rows[0];
      if (!current) return false;
      const rank = { SENDING: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4 };
      if ((rank[current.deliveryStatus] ?? -1) > (rank[status] ?? -1)) return false;
      const updated = await client.query(`
        UPDATE channel_outbox
        SET delivery_status = $2, provider_status_at = $3, last_error_code = $4
        WHERE provider_message_id = $1
      `, [providerMessageId, status, providerTimestamp, errorCode]);
      return updated.rowCount === 1;
    });
  }

  async createChannelHandoff({ tokenHash, provider, senderKey, workspaceSessionId, purpose, scope, expiresAt }) {
    await this.initialize();
    await this.pool.query(`
      INSERT INTO channel_handoffs
        (token_hash, provider, sender_key, workspace_session_id, purpose, scope, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
    `, [tokenHash, provider, senderKey, workspaceSessionId, purpose, JSON.stringify(scope), expiresAt]);
    return { purpose, scope, expiresAt };
  }

  async consumeChannelHandoff(tokenHash) {
    await this.initialize();
    return this.withTransaction(async (client) => {
      const result = await client.query(`
        SELECT workspace_session_id AS "workspaceSessionId", purpose, scope,
               expires_at AS "expiresAt", consumed_at AS "consumedAt"
        FROM channel_handoffs WHERE token_hash = $1 FOR UPDATE
      `, [tokenHash]);
      const row = result.rows[0];
      if (!row || row.consumedAt || new Date(row.expiresAt).getTime() < Date.now()) return null;
      const consumed = await client.query(`
        UPDATE channel_handoffs SET consumed_at = NOW()
        WHERE token_hash = $1 AND consumed_at IS NULL
        RETURNING consumed_at AS "consumedAt"
      `, [tokenHash]);
      return {
        ...row,
        expiresAt: iso(row.expiresAt),
        consumedAt: iso(consumed.rows[0].consumedAt),
      };
    });
  }

  async getSessionIdempotent(sessionId, operationKey, client = this.pool) {
    await this.initialize();
    const result = await client.query(`
      SELECT response_payload FROM session_idempotency_records
      WHERE session_id = $1 AND operation_key = $2
    `, [sessionId, operationKey]);
    return result.rows[0]?.response_payload || null;
  }

  async rememberSessionIdempotent(sessionId, operationKey, caseId, payload, client = this.pool) {
    await this.initialize();
    await client.query(`
      INSERT INTO session_idempotency_records
        (session_id, operation_key, case_id, response_payload)
      VALUES ($1, $2, $3, $4::jsonb)
      ON CONFLICT (session_id, operation_key) DO NOTHING
    `, [sessionId, operationKey, caseId, JSON.stringify(payload)]);
  }

  async createWorkBatch(batch) {
    await this.initialize();
    const result = await this.pool.query(`
      INSERT INTO work_batches
        (id, workspace_session_id, jurisdiction, routing_tag, priority, status,
         assigned_reviewer_session_id, case_limit, created_by_session_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [batch.id, batch.workspaceSessionId, batch.jurisdiction, batch.routingTag || null,
      batch.priority || "NORMAL", batch.status || "OPEN", batch.assignedReviewerSessionId || null,
      batch.caseLimit, batch.createdBySessionId]);
    return result.rows[0];
  }

  async assignCase({ workspaceSessionId, caseId, batchId = null, reviewerSessionId = null, leaseExpiresAt = null }) {
    await this.initialize();
    const result = await this.pool.query(`
      INSERT INTO case_assignments
        (workspace_session_id, case_id, batch_id, reviewer_session_id, status, lease_expires_at)
      VALUES ($1, $2, $3, $4, 'ASSIGNED', $5)
      ON CONFLICT (workspace_session_id, case_id) DO UPDATE SET
        batch_id = EXCLUDED.batch_id,
        reviewer_session_id = EXCLUDED.reviewer_session_id,
        status = 'ASSIGNED',
        lease_expires_at = EXCLUDED.lease_expires_at,
        updated_at = NOW(),
        version = case_assignments.version + 1
      RETURNING *
    `, [workspaceSessionId, caseId, batchId, reviewerSessionId, leaseExpiresAt]);
    return result.rows[0];
  }

  async close() {
    if (this.ownsPool) await this.pool.end();
  }
}
