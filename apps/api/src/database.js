import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createSeedCases, DEMO_CASE_ID } from "./domain.js";

export class ChallanRepository {
  constructor(databasePath = resolve("data", "challan-nyay.db")) {
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
    `);
    this.seed();
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
