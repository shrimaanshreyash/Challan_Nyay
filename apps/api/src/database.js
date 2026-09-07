import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createSeedCases, DEMO_CASE_ID } from "./domain.js";
import { assertVersionAdvance, createCaseVersionConflict } from "./repository-errors.js";
import {
  authorityWorkItem,
  decodeWorklistCursor,
  encodeWorklistCursor,
  matchesAuthorityView,
  normalizeAuthorityAssignment,
  summarizeAuthorityItems,
} from "./authority-read-model.js";

const DEMO_DATASET_VERSION = "2";

export class ChallanRepository {
  constructor(databasePath = resolve("data", "challan-nyay.db")) {
    this.provider = "sqlite";
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }
    this.db = new DatabaseSync(databasePath);
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        state TEXT NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(case_id) REFERENCES cases(id)
      );
      CREATE TABLE IF NOT EXISTS idempotency_records (
        operation_key TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        response_payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS demo_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS demo_sessions (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        workspace_session_id TEXT,
        account_id TEXT,
        jurisdiction TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS session_cases (
        session_id TEXT NOT NULL,
        case_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        state TEXT NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (session_id, case_id),
        FOREIGN KEY(session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS session_audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        case_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS session_idempotency_records (
        session_id TEXT NOT NULL,
        operation_key TEXT NOT NULL,
        case_id TEXT NOT NULL,
        response_payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (session_id, operation_key),
        FOREIGN KEY(session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS workflow_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        case_id TEXT NOT NULL,
        case_version INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        metadata TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        UNIQUE (session_id, case_id, case_version, event_type, correlation_id),
        FOREIGN KEY(session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS contest_drafts (
        session_id TEXT NOT NULL,
        case_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (session_id, case_id),
        FOREIGN KEY(session_id, case_id) REFERENCES session_cases(session_id, case_id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS channel_conversations (
        provider TEXT NOT NULL,
        sender_key TEXT NOT NULL,
        workspace_session_id TEXT NOT NULL,
        locale TEXT,
        step TEXT NOT NULL,
        selected_case_id TEXT,
        context TEXT NOT NULL,
        version INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (provider, sender_key),
        FOREIGN KEY(workspace_session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS channel_inbox (
        provider_event_id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        sender_key TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        payload_class TEXT NOT NULL,
        response_payload TEXT NOT NULL,
        received_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS channel_outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_event_id TEXT NOT NULL,
        message_index INTEGER NOT NULL,
        payload_class TEXT NOT NULL,
        payload TEXT NOT NULL,
        delivery_status TEXT NOT NULL,
        provider_message_id TEXT,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        last_error_code TEXT,
        last_attempt_at TEXT,
        provider_status_at TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(provider_event_id, message_index),
        FOREIGN KEY(provider_event_id) REFERENCES channel_inbox(provider_event_id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS channel_handoffs (
        token_hash TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        sender_key TEXT NOT NULL,
        workspace_session_id TEXT NOT NULL,
        purpose TEXT NOT NULL,
        scope TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        consumed_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(workspace_session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS work_batches (
        id TEXT PRIMARY KEY,
        workspace_session_id TEXT NOT NULL,
        jurisdiction TEXT NOT NULL,
        routing_tag TEXT,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_reviewer_session_id TEXT,
        case_limit INTEGER NOT NULL,
        created_by_session_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(workspace_session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY(assigned_reviewer_session_id) REFERENCES demo_sessions(id) ON DELETE SET NULL,
        FOREIGN KEY(created_by_session_id) REFERENCES demo_sessions(id)
      );
      CREATE TABLE IF NOT EXISTS case_assignments (
        workspace_session_id TEXT NOT NULL,
        case_id TEXT NOT NULL,
        batch_id TEXT,
        reviewer_session_id TEXT,
        status TEXT NOT NULL,
        assigned_at TEXT NOT NULL,
        claimed_at TEXT,
        lease_expires_at TEXT,
        updated_at TEXT NOT NULL,
        version INTEGER NOT NULL,
        PRIMARY KEY (workspace_session_id, case_id),
        FOREIGN KEY(workspace_session_id, case_id) REFERENCES session_cases(session_id, case_id) ON DELETE CASCADE,
        FOREIGN KEY(batch_id) REFERENCES work_batches(id) ON DELETE SET NULL,
        FOREIGN KEY(reviewer_session_id) REFERENCES demo_sessions(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS session_cases_queue_idx
        ON session_cases (session_id, state, updated_at DESC, case_id);
      CREATE INDEX IF NOT EXISTS workflow_events_projection_idx
        ON workflow_events (session_id, case_id, id);
      CREATE INDEX IF NOT EXISTS case_assignments_reviewer_idx
        ON case_assignments (reviewer_session_id, status, updated_at DESC);
      CREATE INDEX IF NOT EXISTS channel_conversations_expiry_idx
        ON channel_conversations (expires_at);
      CREATE INDEX IF NOT EXISTS channel_outbox_delivery_idx
        ON channel_outbox (delivery_status, created_at);
    `);
    const outboxColumns = new Set(this.db.prepare("PRAGMA table_info(channel_outbox)").all().map((column) => column.name));
    for (const [name, definition] of [
      ["provider_message_id", "TEXT"],
      ["attempt_count", "INTEGER NOT NULL DEFAULT 0"],
      ["last_error_code", "TEXT"],
      ["last_attempt_at", "TEXT"],
      ["provider_status_at", "TEXT"],
    ]) {
      if (!outboxColumns.has(name)) this.db.exec(`ALTER TABLE channel_outbox ADD COLUMN ${name} ${definition}`);
    }
    this.db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS channel_outbox_provider_message_idx
        ON channel_outbox (provider_message_id) WHERE provider_message_id IS NOT NULL;
    `);
    this.synchronizeSeedDataset();
    this.backfillSessionWorkflowEvents();
  }

  initialize() {
    return undefined;
  }

  synchronizeSeedDataset() {
    const storedVersion = this.db
      .prepare("SELECT value FROM demo_metadata WHERE key = 'dataset_version'")
      .get()?.value;

    if (storedVersion === DEMO_DATASET_VERSION) {
      this.seed();
      return;
    }

    this.withTransaction(() => {
      this.db.exec("DELETE FROM idempotency_records; DELETE FROM audit_events; DELETE FROM cases;");
      this.seed();
      this.db.prepare(`
        INSERT INTO demo_metadata (key, value) VALUES ('dataset_version', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(DEMO_DATASET_VERSION);
    });
  }

  seed() {
    for (const seedCase of createSeedCases()) {
      const existing = this.db.prepare("SELECT id FROM cases WHERE id = ?").get(seedCase.id);
      if (existing) continue;
      this.save(seedCase);
      this.appendAudit({
        caseId: seedCase.id,
        eventType: "DEMO_CASE_SEEDED",
        actor: "system",
        correlationId: "seed",
        payload: { synthetic: true, version: seedCase.version },
      });
    }
  }

  reset() {
    return this.withTransaction(() => {
      this.db.exec("DELETE FROM idempotency_records; DELETE FROM audit_events; DELETE FROM cases;");
      this.seed();
      return this.getCase(DEMO_CASE_ID);
    });
  }

  createSession({ id, role, workspaceSessionId = null, accountId = null, jurisdiction = null, expiresAt }) {
    return this.withTransaction(() => {
      const createdAt = new Date().toISOString();
      this.db.prepare(`
        INSERT INTO demo_sessions (id, role, workspace_session_id, account_id, jurisdiction, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, role, workspaceSessionId, accountId, jurisdiction, expiresAt, createdAt);
      if (role === "CITIZEN") this.seedSession(id);
      return this.getSession(id);
    });
  }

  getSession(id) {
    const row = this.db.prepare(`
      SELECT id, role, workspace_session_id AS workspaceSessionId, account_id AS accountId,
             jurisdiction, expires_at AS expiresAt, created_at AS createdAt
      FROM demo_sessions WHERE id = ?
    `).get(id);
    return row || null;
  }

  seedSession(sessionId) {
    for (const seedCase of createSeedCases()) {
      this.saveSessionCase(sessionId, seedCase);
      this.persistTimelineEvents(sessionId, seedCase, seedCase.timeline || [], { synthetic: true });
      this.appendSessionAudit(sessionId, {
        caseId: seedCase.id,
        eventType: "DEMO_CASE_SEEDED",
        actor: "system",
        correlationId: "seed",
        payload: { synthetic: true, version: seedCase.version },
      });
    }
  }

  persistTimelineEvents(sessionId, caseRecord, events, metadata = {}) {
    const statement = this.db.prepare(`
      INSERT OR IGNORE INTO workflow_events
        (session_id, case_id, case_version, event_type, actor_role, correlation_id, metadata, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const event of events) {
      statement.run(
        sessionId,
        caseRecord.id,
        Number(event.caseVersion || caseRecord.version || 1),
        event.type,
        event.actor,
        event.id,
        JSON.stringify({ label: event.label, ...metadata }),
        event.at,
      );
    }
  }

  backfillSessionWorkflowEvents() {
    const rows = this.db.prepare(`
      SELECT sc.session_id, sc.payload
      FROM session_cases sc
      WHERE NOT EXISTS (
        SELECT 1 FROM workflow_events we
        WHERE we.session_id = sc.session_id AND we.case_id = sc.case_id
      )
    `).all();
    for (const row of rows) {
      const caseRecord = JSON.parse(row.payload);
      this.persistTimelineEvents(row.session_id, caseRecord, caseRecord.timeline || [], { synthetic: true, backfilled: true });
    }
  }

  resetSession(sessionId) {
    return this.withTransaction(() => {
      this.db.prepare("DELETE FROM session_idempotency_records WHERE session_id = ?").run(sessionId);
      this.db.prepare("DELETE FROM case_assignments WHERE workspace_session_id = ?").run(sessionId);
      this.db.prepare("DELETE FROM work_batches WHERE workspace_session_id = ?").run(sessionId);
      this.db.prepare("DELETE FROM workflow_events WHERE session_id = ?").run(sessionId);
      this.db.prepare("DELETE FROM session_audit_events WHERE session_id = ?").run(sessionId);
      this.db.prepare("DELETE FROM session_cases WHERE session_id = ?").run(sessionId);
      this.seedSession(sessionId);
      return this.getSessionCase(sessionId, DEMO_CASE_ID);
    });
  }

  getSessionCase(sessionId, caseId) {
    const row = this.db.prepare("SELECT payload FROM session_cases WHERE session_id = ? AND case_id = ?").get(sessionId, caseId);
    return row ? JSON.parse(row.payload) : null;
  }

  listSessionCases(sessionId, ids = null) {
    const rows = this.db.prepare("SELECT payload FROM session_cases WHERE session_id = ? ORDER BY updated_at DESC").all(sessionId);
    const cases = rows.map((row) => JSON.parse(row.payload));
    return ids ? ids.map((id) => cases.find((item) => item.id === id)).filter(Boolean) : cases;
  }

  saveSessionCase(sessionId, caseRecord) {
    const updatedAt = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO session_cases (session_id, case_id, version, state, payload, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id, case_id) DO UPDATE SET
        version = excluded.version,
        state = excluded.state,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `).run(sessionId, caseRecord.id, caseRecord.version, caseRecord.state, JSON.stringify(caseRecord), updatedAt);
    return caseRecord;
  }

  updateSessionCase(sessionId, { id, expectedVersion, nextRecord, audit }) {
    assertVersionAdvance(expectedVersion, nextRecord);
    return this.withTransaction(() => {
      const updatedAt = new Date().toISOString();
      const result = this.db.prepare(`
        UPDATE session_cases
        SET version = ?, state = ?, payload = ?, updated_at = ?
        WHERE session_id = ? AND case_id = ? AND version = ?
      `).run(nextRecord.version, nextRecord.state, JSON.stringify(nextRecord), updatedAt, sessionId, id, expectedVersion);
      if (!result.changes) {
        const exists = this.db.prepare(
          "SELECT 1 FROM session_cases WHERE session_id = ? AND case_id = ?",
        ).get(sessionId, id);
        if (!exists) return null;
        throw createCaseVersionConflict();
      }
      this.appendSessionAudit(sessionId, audit);
      return nextRecord;
    });
  }

  commitSessionMutation(sessionId, { operationKey, caseId, expectedVersion, nextRecord, audit, response, clearContestDraft = false }) {
    assertVersionAdvance(expectedVersion, nextRecord);
    return this.withTransaction(() => {
      const replay = this.getSessionIdempotent(sessionId, operationKey);
      if (replay) return { response: replay, idempotentReplay: true };
      const currentRecord = this.getSessionCase(sessionId, caseId);
      const updatedAt = new Date().toISOString();
      const result = this.db.prepare(`
        UPDATE session_cases
        SET version = ?, state = ?, payload = ?, updated_at = ?
        WHERE session_id = ? AND case_id = ? AND version = ?
      `).run(nextRecord.version, nextRecord.state, JSON.stringify(nextRecord), updatedAt, sessionId, caseId, expectedVersion);
      if (!result.changes) {
        const exists = this.db.prepare(
          "SELECT 1 FROM session_cases WHERE session_id = ? AND case_id = ?",
        ).get(sessionId, caseId);
        if (!exists) return { response: null, idempotentReplay: false, missing: true };
        throw createCaseVersionConflict();
      }
      this.appendSessionAudit(sessionId, audit);
      const existingTimelineIds = new Set((currentRecord?.timeline || []).map((event) => event.id));
      this.persistTimelineEvents(
        sessionId,
        nextRecord,
        (nextRecord.timeline || []).filter((entry) => !existingTimelineIds.has(entry.id) && entry.type !== audit.eventType),
        { version: nextRecord.version },
      );
      if (clearContestDraft) {
        this.db.prepare("DELETE FROM contest_drafts WHERE session_id = ? AND case_id = ?").run(sessionId, caseId);
      }
      this.rememberSessionIdempotent(sessionId, operationKey, caseId, response);
      return { response, idempotentReplay: false };
    });
  }

  commitSessionBatchMutation(sessionId, { operationKey, mutations, response }) {
    for (const mutation of mutations) assertVersionAdvance(mutation.expectedVersion, mutation.nextRecord);
    return this.withTransaction(() => {
      const replay = this.getSessionIdempotent(sessionId, operationKey);
      if (replay) return { response: replay, idempotentReplay: true };
      const currentRecords = new Map();
      for (const mutation of mutations) {
        const current = this.getSessionCase(sessionId, mutation.caseId);
        if (!current) return { response: null, idempotentReplay: false, missing: true };
        if (current.version !== mutation.expectedVersion) throw createCaseVersionConflict();
        currentRecords.set(mutation.caseId, current);
      }
      for (const mutation of mutations) {
        const currentRecord = currentRecords.get(mutation.caseId);
        const updatedAt = new Date().toISOString();
        const result = this.db.prepare(`
          UPDATE session_cases
          SET version = ?, state = ?, payload = ?, updated_at = ?
          WHERE session_id = ? AND case_id = ? AND version = ?
        `).run(
          mutation.nextRecord.version,
          mutation.nextRecord.state,
          JSON.stringify(mutation.nextRecord),
          updatedAt,
          sessionId,
          mutation.caseId,
          mutation.expectedVersion,
        );
        if (!result.changes) {
          throw createCaseVersionConflict();
        }
        this.appendSessionAudit(sessionId, mutation.audit);
        const existingTimelineIds = new Set((currentRecord?.timeline || []).map((event) => event.id));
        this.persistTimelineEvents(
          sessionId,
          mutation.nextRecord,
          (mutation.nextRecord.timeline || []).filter((entry) => !existingTimelineIds.has(entry.id) && entry.type !== mutation.audit.eventType),
          { version: mutation.nextRecord.version, batch: true },
        );
      }
      this.rememberSessionIdempotent(sessionId, operationKey, mutations[0].caseId, response);
      return { response, idempotentReplay: false };
    });
  }

  listSessionReviewTasks(sessionId) {
    return this.listSessionCases(sessionId)
      .filter((item) => ["CONTEST_SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED", "CITIZEN_SUPPLEMENTED"].includes(item.state))
      .map((item) => ({
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
      }));
  }

  listAuthorityAssignments(sessionId) {
    return this.db.prepare(`
      SELECT * FROM case_assignments
      WHERE workspace_session_id = ?
    `).all(sessionId);
  }

  getAuthorityQueueSummary(sessionId, reviewerSessionId = null) {
    const assignments = new Map(this.listAuthorityAssignments(sessionId).map((row) => [row.case_id, row]));
    const rows = this.db.prepare(`
      SELECT case_id, payload, updated_at FROM session_cases
      WHERE session_id = ?
    `).all(sessionId);
    const items = rows.map((row) => authorityWorkItem(
      JSON.parse(row.payload),
      assignments.get(row.case_id),
      row.updated_at,
    ));
    return summarizeAuthorityItems(items, reviewerSessionId);
  }

  listAuthorityWorkItems(sessionId, { view = "OPEN", reviewerSessionId = null, limit = 25, cursor = null } = {}) {
    const assignments = new Map(this.listAuthorityAssignments(sessionId).map((row) => [row.case_id, row]));
    const decodedCursor = decodeWorklistCursor(cursor);
    const rows = this.db.prepare(`
      SELECT case_id, payload, updated_at FROM session_cases
      WHERE session_id = ?
      ORDER BY updated_at DESC, case_id DESC
    `).all(sessionId);
    let items = rows.map((row) => authorityWorkItem(
      JSON.parse(row.payload),
      assignments.get(row.case_id),
      row.updated_at,
    )).filter((item) => matchesAuthorityView(item, view, reviewerSessionId));
    if (decodedCursor) {
      items = items.filter((item) => item.updatedAt < decodedCursor.updatedAt
        || (item.updatedAt === decodedCursor.updatedAt && item.id < decodedCursor.id));
    }
    const boundedLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const page = items.slice(0, boundedLimit);
    return {
      items: page,
      nextCursor: items.length > boundedLimit ? encodeWorklistCursor(page.at(-1)) : null,
    };
  }

  claimAuthorityCase({ workspaceSessionId, caseId, reviewerSessionId, operationKey, correlationId, leaseExpiresAt }) {
    return this.withTransaction(() => {
      const replay = this.getSessionIdempotent(workspaceSessionId, operationKey);
      if (replay) return { ...replay, idempotentReplay: true };
      const caseRecord = this.getSessionCase(workspaceSessionId, caseId);
      if (!caseRecord || !["CONTEST_SUBMITTED", "UNDER_REVIEW", "CITIZEN_SUPPLEMENTED"].includes(caseRecord.state)) {
        const error = new Error("This case is not available to claim.");
        error.code = "CASE_NOT_CLAIMABLE";
        error.statusCode = 409;
        throw error;
      }
      const existing = this.db.prepare(`
        SELECT * FROM case_assignments WHERE workspace_session_id = ? AND case_id = ?
      `).get(workspaceSessionId, caseId);
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
      const now = new Date().toISOString();
      this.db.prepare(`
        INSERT INTO case_assignments
          (workspace_session_id, case_id, reviewer_session_id, status, assigned_at,
           claimed_at, lease_expires_at, updated_at, version)
        VALUES (?, ?, ?, 'CLAIMED', ?, ?, ?, ?, 1)
        ON CONFLICT(workspace_session_id, case_id) DO UPDATE SET
          reviewer_session_id = excluded.reviewer_session_id,
          status = 'CLAIMED',
          claimed_at = excluded.claimed_at,
          lease_expires_at = excluded.lease_expires_at,
          updated_at = excluded.updated_at,
          version = case_assignments.version + 1
      `).run(workspaceSessionId, caseId, reviewerSessionId, now, now, leaseExpiresAt, now);
      const assignment = normalizeAuthorityAssignment(this.db.prepare(`
        SELECT * FROM case_assignments WHERE workspace_session_id = ? AND case_id = ?
      `).get(workspaceSessionId, caseId));
      this.appendSessionAudit(workspaceSessionId, {
        caseId,
        eventType: "CASE_CLAIMED",
        actor: "demo-authority-reviewer",
        correlationId,
        payload: { version: caseRecord.version, assignmentVersion: assignment.version, reviewerSessionId },
      });
      const response = { assignment };
      this.rememberSessionIdempotent(workspaceSessionId, operationKey, caseId, response);
      return { ...response, idempotentReplay: false };
    });
  }

  appendSessionAudit(sessionId, { caseId, eventType, actor, correlationId, payload }) {
    const createdAt = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO session_audit_events (session_id, case_id, event_type, actor, correlation_id, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, caseId, eventType, actor, correlationId, JSON.stringify(payload), createdAt);
    this.db.prepare(`
      INSERT OR IGNORE INTO workflow_events
        (session_id, case_id, case_version, event_type, actor_role, correlation_id, metadata, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, caseId, Number(payload?.version || 1), eventType, actor, correlationId, JSON.stringify(payload), createdAt);
  }

  listSessionAudit(sessionId, caseId) {
    return this.db.prepare(`
      SELECT id, event_type AS eventType, actor, correlation_id AS correlationId,
             payload, created_at AS createdAt
      FROM session_audit_events WHERE session_id = ? AND case_id = ? ORDER BY id ASC
    `).all(sessionId, caseId).map((event) => ({ ...event, payload: JSON.parse(event.payload) }));
  }

  listSessionWorkflowEvents(sessionId, caseId) {
    return this.db.prepare(`
      SELECT id, case_version AS caseVersion, event_type AS eventType,
             actor_role AS actorRole, correlation_id AS correlationId,
             metadata, occurred_at AS occurredAt
      FROM workflow_events WHERE session_id = ? AND case_id = ? ORDER BY id ASC
    `).all(sessionId, caseId).map((event) => ({ ...event, metadata: JSON.parse(event.metadata) }));
  }

  getContestDraft(sessionId, caseId) {
    const row = this.db.prepare(`
      SELECT version, payload, updated_at AS updatedAt
      FROM contest_drafts WHERE session_id = ? AND case_id = ?
    `).get(sessionId, caseId);
    return row ? { version: row.version, updatedAt: row.updatedAt, ...JSON.parse(row.payload) } : null;
  }

  saveContestDraft(sessionId, caseId, expectedVersion, payload) {
    return this.withTransaction(() => {
      const caseExists = this.db.prepare(
        "SELECT 1 FROM session_cases WHERE session_id = ? AND case_id = ?",
      ).get(sessionId, caseId);
      if (!caseExists) return null;
      const current = this.db.prepare(
        "SELECT version FROM contest_drafts WHERE session_id = ? AND case_id = ?",
      ).get(sessionId, caseId);
      const currentVersion = Number(current?.version || 0);
      if (currentVersion !== expectedVersion) {
        const error = new Error("This draft changed after it was opened. Reload the saved version before continuing.");
        error.code = "DRAFT_VERSION_CONFLICT";
        error.statusCode = 409;
        throw error;
      }
      const version = currentVersion + 1;
      const updatedAt = new Date().toISOString();
      this.db.prepare(`
        INSERT INTO contest_drafts (session_id, case_id, version, payload, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(session_id, case_id) DO UPDATE SET
          version = excluded.version,
          payload = excluded.payload,
          updated_at = excluded.updated_at
      `).run(sessionId, caseId, version, JSON.stringify(payload), updatedAt);
      return { version, updatedAt, ...payload };
    });
  }

  ensureChannelConversation({ provider, senderKey, workspaceSession, expiresAt }) {
    return this.withTransaction(() => {
      const existing = this.getChannelConversation(provider, senderKey);
      if (existing && new Date(existing.expiresAt).getTime() >= Date.now()) return existing;
      if (existing) {
        this.db.prepare(
          "DELETE FROM channel_conversations WHERE provider = ? AND sender_key = ?",
        ).run(provider, senderKey);
      }
      const createdAt = new Date().toISOString();
      this.db.prepare(`
        INSERT OR IGNORE INTO demo_sessions
          (id, role, workspace_session_id, account_id, jurisdiction, expires_at, created_at)
        VALUES (?, 'CITIZEN', NULL, ?, NULL, ?, ?)
      `).run(workspaceSession.id, workspaceSession.accountId, workspaceSession.expiresAt, createdAt);
      const hasCases = this.db.prepare(
        "SELECT 1 FROM session_cases WHERE session_id = ? LIMIT 1",
      ).get(workspaceSession.id);
      if (!hasCases) this.seedSession(workspaceSession.id);
      this.db.prepare(`
        INSERT OR IGNORE INTO channel_conversations
          (provider, sender_key, workspace_session_id, locale, step, selected_case_id,
           context, version, expires_at, updated_at)
        VALUES (?, ?, ?, NULL, 'CHOOSE_LANGUAGE', NULL, '{}', 1, ?, ?)
      `).run(provider, senderKey, workspaceSession.id, expiresAt, createdAt);
      return this.getChannelConversation(provider, senderKey);
    });
  }

  getChannelConversation(provider, senderKey) {
    const row = this.db.prepare(`
      SELECT provider, sender_key AS senderKey, workspace_session_id AS workspaceSessionId,
             locale, step, selected_case_id AS selectedCaseId, context, version,
             expires_at AS expiresAt, updated_at AS updatedAt
      FROM channel_conversations WHERE provider = ? AND sender_key = ?
    `).get(provider, senderKey);
    return row ? { ...row, context: JSON.parse(row.context) } : null;
  }

  getChannelInboxOutcome(providerEventId) {
    const row = this.db.prepare(`
      SELECT response_payload AS responsePayload FROM channel_inbox WHERE provider_event_id = ?
    `).get(providerEventId);
    return row ? JSON.parse(row.responsePayload) : null;
  }

  commitChannelExchange({
    provider,
    senderKey,
    providerEventId,
    correlationId,
    payloadClass,
    expectedVersion,
    nextConversation,
    responses,
  }) {
    return this.withTransaction(() => {
      const replay = this.getChannelInboxOutcome(providerEventId);
      if (replay) return { responses: replay, idempotentReplay: true };
      const now = new Date().toISOString();
      const updated = this.db.prepare(`
        UPDATE channel_conversations
        SET locale = ?, step = ?, selected_case_id = ?, context = ?, version = ?,
            expires_at = ?, updated_at = ?
        WHERE provider = ? AND sender_key = ? AND version = ?
      `).run(
        nextConversation.locale,
        nextConversation.step,
        nextConversation.selectedCaseId || null,
        JSON.stringify(nextConversation.context || {}),
        expectedVersion + 1,
        nextConversation.expiresAt,
        now,
        provider,
        senderKey,
        expectedVersion,
      );
      if (!updated.changes) {
        const error = new Error("This channel conversation changed. Refresh the menu and try again.");
        error.code = "CHANNEL_VERSION_CONFLICT";
        error.statusCode = 409;
        throw error;
      }
      this.db.prepare(`
        INSERT INTO channel_inbox
          (provider_event_id, provider, sender_key, correlation_id, payload_class,
           response_payload, received_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(providerEventId, provider, senderKey, correlationId, payloadClass, JSON.stringify(responses), now);
      const outbox = this.db.prepare(`
        INSERT INTO channel_outbox
          (provider_event_id, message_index, payload_class, payload, delivery_status, created_at)
        VALUES (?, ?, ?, ?, 'PENDING', ?)
      `);
      responses.forEach((message, index) => {
        outbox.run(providerEventId, index, message.type || "text", JSON.stringify(message), now);
      });
      return {
        responses,
        idempotentReplay: false,
        conversation: this.getChannelConversation(provider, senderKey),
      };
    });
  }

  claimChannelOutbox(providerEventId) {
    return this.withTransaction(() => {
      const rows = this.db.prepare(`
        SELECT id, message_index AS messageIndex, payload
        FROM channel_outbox
        WHERE provider_event_id = ? AND delivery_status IN ('PENDING', 'RETRY_PENDING')
          AND attempt_count < 5
        ORDER BY message_index ASC
      `).all(providerEventId);
      const attemptedAt = new Date().toISOString();
      const claim = this.db.prepare(`
        UPDATE channel_outbox
        SET delivery_status = 'SENDING', attempt_count = attempt_count + 1,
            last_attempt_at = ?, last_error_code = NULL
        WHERE id = ? AND delivery_status IN ('PENDING', 'RETRY_PENDING')
      `);
      return rows
        .filter((row) => claim.run(attemptedAt, row.id).changes === 1)
        .map((row) => ({ ...row, payload: JSON.parse(row.payload) }));
    });
  }

  markChannelOutboxSent({ id, providerMessageId }) {
    const now = new Date().toISOString();
    return this.db.prepare(`
      UPDATE channel_outbox
      SET delivery_status = 'SENT', provider_message_id = ?, provider_status_at = ?,
          last_error_code = NULL
      WHERE id = ? AND delivery_status = 'SENDING'
    `).run(providerMessageId, now, id).changes === 1;
  }

  markChannelOutboxFailed({ id, errorCode, retryable }) {
    return this.db.prepare(`
      UPDATE channel_outbox
      SET delivery_status = CASE WHEN ? = 1 AND attempt_count < 5 THEN 'RETRY_PENDING' ELSE 'FAILED' END,
          last_error_code = ?
      WHERE id = ? AND delivery_status = 'SENDING'
    `).run(retryable ? 1 : 0, errorCode, id).changes === 1;
  }

  applyChannelDeliveryReceipt({ providerMessageId, status, providerTimestamp, errorCode = null }) {
    const current = this.db.prepare(`
      SELECT delivery_status AS deliveryStatus
      FROM channel_outbox WHERE provider_message_id = ?
    `).get(providerMessageId);
    if (!current) return false;
    const rank = { SENDING: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4 };
    if ((rank[current.deliveryStatus] ?? -1) > (rank[status] ?? -1)) return false;
    return this.db.prepare(`
      UPDATE channel_outbox
      SET delivery_status = ?, provider_status_at = ?, last_error_code = ?
      WHERE provider_message_id = ?
    `).run(status, providerTimestamp, errorCode, providerMessageId).changes === 1;
  }

  createChannelHandoff({ tokenHash, provider, senderKey, workspaceSessionId, purpose, scope, expiresAt }) {
    const createdAt = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO channel_handoffs
        (token_hash, provider, sender_key, workspace_session_id, purpose, scope,
         expires_at, consumed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
    `).run(tokenHash, provider, senderKey, workspaceSessionId, purpose, JSON.stringify(scope), expiresAt, createdAt);
    return { purpose, scope, expiresAt };
  }

  consumeChannelHandoff(tokenHash) {
    return this.withTransaction(() => {
      const row = this.db.prepare(`
        SELECT workspace_session_id AS workspaceSessionId, purpose, scope,
               expires_at AS expiresAt, consumed_at AS consumedAt
        FROM channel_handoffs WHERE token_hash = ?
      `).get(tokenHash);
      if (!row || row.consumedAt || new Date(row.expiresAt).getTime() < Date.now()) return null;
      const consumedAt = new Date().toISOString();
      this.db.prepare(`
        UPDATE channel_handoffs SET consumed_at = ?
        WHERE token_hash = ? AND consumed_at IS NULL
      `).run(consumedAt, tokenHash);
      return { ...row, scope: JSON.parse(row.scope), consumedAt };
    });
  }

  getSessionIdempotent(sessionId, operationKey) {
    const row = this.db.prepare(`
      SELECT response_payload FROM session_idempotency_records
      WHERE session_id = ? AND operation_key = ?
    `).get(sessionId, operationKey);
    return row ? JSON.parse(row.response_payload) : null;
  }

  rememberSessionIdempotent(sessionId, operationKey, caseId, payload) {
    this.db.prepare(`
      INSERT OR IGNORE INTO session_idempotency_records
        (session_id, operation_key, case_id, response_payload, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, operationKey, caseId, JSON.stringify(payload), new Date().toISOString());
  }

  createWorkBatch({
    id,
    workspaceSessionId,
    jurisdiction,
    routingTag = null,
    priority = "NORMAL",
    status = "OPEN",
    assignedReviewerSessionId = null,
    caseLimit,
    createdBySessionId,
  }) {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO work_batches
        (id, workspace_session_id, jurisdiction, routing_tag, priority, status,
         assigned_reviewer_session_id, case_limit, created_by_session_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, workspaceSessionId, jurisdiction, routingTag, priority, status,
      assignedReviewerSessionId, caseLimit, createdBySessionId, now, now);
    return this.db.prepare("SELECT * FROM work_batches WHERE id = ?").get(id);
  }

  assignCase({ workspaceSessionId, caseId, batchId = null, reviewerSessionId = null, leaseExpiresAt = null }) {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO case_assignments
        (workspace_session_id, case_id, batch_id, reviewer_session_id, status,
         assigned_at, lease_expires_at, updated_at, version)
      VALUES (?, ?, ?, ?, 'ASSIGNED', ?, ?, ?, 1)
      ON CONFLICT(workspace_session_id, case_id) DO UPDATE SET
        batch_id = excluded.batch_id,
        reviewer_session_id = excluded.reviewer_session_id,
        status = 'ASSIGNED',
        lease_expires_at = excluded.lease_expires_at,
        updated_at = excluded.updated_at,
        version = case_assignments.version + 1
    `).run(workspaceSessionId, caseId, batchId, reviewerSessionId, now, leaseExpiresAt, now);
    return this.db.prepare(`
      SELECT * FROM case_assignments WHERE workspace_session_id = ? AND case_id = ?
    `).get(workspaceSessionId, caseId);
  }

  getCase(id) {
    const row = this.db.prepare("SELECT payload FROM cases WHERE id = ?").get(id);
    return row ? JSON.parse(row.payload) : null;
  }

  listCases(ids = null) {
    const rows = this.db.prepare("SELECT payload FROM cases ORDER BY updated_at DESC").all();
    const cases = rows.map((row) => JSON.parse(row.payload));
    return ids ? ids.map((id) => cases.find((item) => item.id === id)).filter(Boolean) : cases;
  }

  save(caseRecord) {
    const updatedAt = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO cases (id, version, state, payload, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        version = excluded.version,
        state = excluded.state,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `).run(caseRecord.id, caseRecord.version, caseRecord.state, JSON.stringify(caseRecord), updatedAt);
    return caseRecord;
  }

  updateCase({ id, expectedVersion, nextRecord, audit }) {
    return this.withTransaction(() => {
      const current = this.getCase(id);
      if (!current) return null;
      if (current.version !== expectedVersion) {
        const error = new Error("The case changed while you were working. Refresh and try again.");
        error.code = "CASE_VERSION_CONFLICT";
        error.statusCode = 409;
        throw error;
      }
      this.save(nextRecord);
      this.appendAudit(audit);
      return nextRecord;
    });
  }

  withTransaction(operation) {
    this.db.exec("BEGIN IMMEDIATE;");
    try {
      const result = operation();
      this.db.exec("COMMIT;");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK;");
      throw error;
    }
  }

  listReviewTasks() {
    const rows = this.db.prepare(`
      SELECT payload FROM cases
      WHERE state IN ('CONTEST_SUBMITTED', 'UNDER_REVIEW')
      ORDER BY updated_at DESC
    `).all();
    return rows.map((row) => {
      const item = JSON.parse(row.payload);
      return {
        id: item.id,
        version: item.version,
        state: item.state,
        stateLabel: item.stateLabel,
        jurisdiction: item.jurisdiction,
        contest: item.contest,
        reviewDeadline: item.reviewDeadline,
        allegation: item.allegation,
        evidence: item.evidence,
        detectedVehicle: item.detectedVehicle,
        registeredVehicle: item.registeredVehicle,
      };
    });
  }

  appendAudit({ caseId, eventType, actor, correlationId, payload }) {
    this.db.prepare(`
      INSERT INTO audit_events (case_id, event_type, actor, correlation_id, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(caseId, eventType, actor, correlationId, JSON.stringify(payload), new Date().toISOString());
  }

  listAudit(caseId) {
    return this.db.prepare(`
      SELECT id, event_type AS eventType, actor, correlation_id AS correlationId,
             payload, created_at AS createdAt
      FROM audit_events WHERE case_id = ? ORDER BY id ASC
    `).all(caseId).map((event) => ({ ...event, payload: JSON.parse(event.payload) }));
  }

  getIdempotent(operationKey) {
    const row = this.db.prepare("SELECT response_payload FROM idempotency_records WHERE operation_key = ?").get(operationKey);
    return row ? JSON.parse(row.response_payload) : null;
  }

  rememberIdempotent(operationKey, caseId, payload) {
    this.db.prepare(`
      INSERT OR IGNORE INTO idempotency_records (operation_key, case_id, response_payload, created_at)
      VALUES (?, ?, ?, ?)
    `).run(operationKey, caseId, JSON.stringify(payload), new Date().toISOString());
  }

  close() {
    this.db.close();
  }
}
