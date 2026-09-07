export const POSTGRES_MIGRATIONS = [
  {
    id: "001_production_foundation",
    sql: `
      CREATE TABLE IF NOT EXISTS demo_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS demo_sessions (
        id UUID PRIMARY KEY,
        role TEXT NOT NULL CHECK (role IN ('CITIZEN', 'DEMO_REVIEWER', 'TRIAGE_OFFICER', 'SUPERVISOR')),
        workspace_session_id UUID REFERENCES demo_sessions(id) ON DELETE CASCADE,
        account_id TEXT,
        jurisdiction TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS demo_sessions_workspace_idx
        ON demo_sessions (workspace_session_id, role);
      CREATE INDEX IF NOT EXISTS demo_sessions_expiry_idx
        ON demo_sessions (expires_at);

      CREATE TABLE IF NOT EXISTS session_cases (
        session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
        case_id TEXT NOT NULL,
        version INTEGER NOT NULL CHECK (version > 0),
        state TEXT NOT NULL,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (session_id, case_id)
      );

      CREATE INDEX IF NOT EXISTS session_cases_queue_idx
        ON session_cases (session_id, state, updated_at DESC, case_id);

      CREATE TABLE IF NOT EXISTS session_audit_events (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
        case_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS session_audit_case_idx
        ON session_audit_events (session_id, case_id, id);

      CREATE TABLE IF NOT EXISTS workflow_events (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
        case_id TEXT NOT NULL,
        case_version INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        metadata JSONB NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (session_id, case_id, case_version, event_type, correlation_id)
      );

      CREATE INDEX IF NOT EXISTS workflow_events_projection_idx
        ON workflow_events (session_id, case_id, id);

      CREATE TABLE IF NOT EXISTS session_idempotency_records (
        session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
        operation_key TEXT NOT NULL,
        case_id TEXT NOT NULL,
        response_payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (session_id, operation_key)
      );

      CREATE TABLE IF NOT EXISTS work_batches (
        id UUID PRIMARY KEY,
        workspace_session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
        jurisdiction TEXT NOT NULL,
        routing_tag TEXT,
        priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
        status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
        assigned_reviewer_session_id UUID REFERENCES demo_sessions(id) ON DELETE SET NULL,
        case_limit INTEGER NOT NULL CHECK (case_limit BETWEEN 1 AND 100),
        created_by_session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS work_batches_queue_idx
        ON work_batches (workspace_session_id, status, priority, created_at);

      CREATE TABLE IF NOT EXISTS case_assignments (
        workspace_session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
        case_id TEXT NOT NULL,
        batch_id UUID REFERENCES work_batches(id) ON DELETE SET NULL,
        reviewer_session_id UUID REFERENCES demo_sessions(id) ON DELETE SET NULL,
        status TEXT NOT NULL CHECK (status IN ('ASSIGNED', 'CLAIMED', 'RELEASED', 'COMPLETED')),
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        claimed_at TIMESTAMPTZ,
        lease_expires_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
        PRIMARY KEY (workspace_session_id, case_id),
        FOREIGN KEY (workspace_session_id, case_id)
          REFERENCES session_cases(session_id, case_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS case_assignments_reviewer_idx
        ON case_assignments (reviewer_session_id, status, updated_at DESC);
      CREATE INDEX IF NOT EXISTS case_assignments_batch_idx
        ON case_assignments (batch_id, status);
    `,
  },
  {
    id: "002_contest_drafts",
    sql: `
      CREATE TABLE IF NOT EXISTS contest_drafts (
        session_id UUID NOT NULL,
        case_id TEXT NOT NULL,
        version INTEGER NOT NULL CHECK (version > 0),
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (session_id, case_id),
        FOREIGN KEY (session_id, case_id)
          REFERENCES session_cases(session_id, case_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS contest_drafts_updated_idx
        ON contest_drafts (session_id, updated_at DESC);
    `,
  },
  {
    id: "003_channel_adapter",
    sql: `
      CREATE TABLE IF NOT EXISTS channel_conversations (
        provider TEXT NOT NULL,
        sender_key TEXT NOT NULL,
        workspace_session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
        locale TEXT,
        step TEXT NOT NULL,
        selected_case_id TEXT,
        context JSONB NOT NULL DEFAULT '{}'::jsonb,
        version INTEGER NOT NULL CHECK (version > 0),
        expires_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (provider, sender_key)
      );

      CREATE INDEX IF NOT EXISTS channel_conversations_expiry_idx
        ON channel_conversations (expires_at);

      CREATE TABLE IF NOT EXISTS channel_inbox (
        provider_event_id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        sender_key TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        payload_class TEXT NOT NULL,
        response_payload JSONB NOT NULL,
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS channel_outbox (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        provider_event_id TEXT NOT NULL REFERENCES channel_inbox(provider_event_id) ON DELETE CASCADE,
        message_index INTEGER NOT NULL,
        payload_class TEXT NOT NULL,
        payload JSONB NOT NULL,
        delivery_status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(provider_event_id, message_index)
      );

      CREATE INDEX IF NOT EXISTS channel_outbox_delivery_idx
        ON channel_outbox (delivery_status, created_at);

      CREATE TABLE IF NOT EXISTS channel_handoffs (
        token_hash TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        sender_key TEXT NOT NULL,
        workspace_session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
        purpose TEXT NOT NULL,
        scope JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    id: "004_channel_delivery_receipts",
    sql: `
      ALTER TABLE channel_outbox ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
      ALTER TABLE channel_outbox ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE channel_outbox ADD COLUMN IF NOT EXISTS last_error_code TEXT;
      ALTER TABLE channel_outbox ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;
      ALTER TABLE channel_outbox ADD COLUMN IF NOT EXISTS provider_status_at TIMESTAMPTZ;

      CREATE UNIQUE INDEX IF NOT EXISTS channel_outbox_provider_message_idx
        ON channel_outbox (provider_message_id) WHERE provider_message_id IS NOT NULL;
    `,
  },
];
