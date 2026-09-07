export const ACTIVE_AUTHORITY_STATES = [
  "CONTEST_SUBMITTED",
  "UNDER_REVIEW",
  "INFORMATION_REQUESTED",
  "CITIZEN_SUPPLEMENTED",
];

export const RESOLVED_AUTHORITY_STATES = ["QUASHED", "REJECTED", "PAID", "RECONCILIATION", "REROUTED"];

function assignmentValue(assignment, camel, snake) {
  return assignment?.[camel] ?? assignment?.[snake] ?? null;
}

export function authorityWorkItem(caseRecord, assignment = null, updatedAt = null) {
  const receivedAt = caseRecord.contest?.submittedAt || updatedAt || caseRecord.allegation?.issuedAt || null;
  const reviewerSessionId = assignmentValue(assignment, "reviewerSessionId", "reviewer_session_id");
  return {
    id: caseRecord.id,
    version: caseRecord.version,
    state: caseRecord.state,
    stateLabel: caseRecord.stateLabel,
    receivedAt,
    updatedAt: updatedAt || receivedAt,
    reviewDeadline: caseRecord.reviewDeadline || null,
    issueCode: caseRecord.contest?.ground || null,
    routingTag: caseRecord.contest?.issuePacket?.routingTag || null,
    completeness: caseRecord.contest?.issuePacket ? "COMPLETE" : caseRecord.contest ? "PARTIAL" : "NOT_SUBMITTED",
    priority: assignmentValue(assignment, "priority", "priority") || "NORMAL",
    vehicleRegistration: caseRecord.registeredVehicle?.registration || null,
    amountPaise: caseRecord.allegation?.amountPaise || 0,
    jurisdiction: caseRecord.jurisdiction,
    assignment: normalizeAuthorityAssignment(assignment),
  };
}

export function normalizeAuthorityAssignment(assignment) {
  if (!assignment) return null;
  return {
    batchId: assignmentValue(assignment, "batchId", "batch_id"),
    reviewerSessionId: assignmentValue(assignment, "reviewerSessionId", "reviewer_session_id"),
    status: assignment.status,
    assignedAt: assignmentValue(assignment, "assignedAt", "assigned_at"),
    claimedAt: assignmentValue(assignment, "claimedAt", "claimed_at"),
    leaseExpiresAt: assignmentValue(assignment, "leaseExpiresAt", "lease_expires_at"),
    updatedAt: assignmentValue(assignment, "updatedAt", "updated_at"),
    version: Number(assignment.version || 1),
  };
}

export function matchesAuthorityView(item, view, reviewerSessionId = null, now = new Date()) {
  const active = ACTIVE_AUTHORITY_STATES.includes(item.state);
  const deadline = item.reviewDeadline ? new Date(item.reviewDeadline) : null;
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setHours(24, 0, 0, 0);
  switch (view) {
    case "NEW": return item.state === "CONTEST_SUBMITTED";
    case "UNASSIGNED": return active && !item.assignment?.reviewerSessionId;
    case "MY_BATCH": return active && item.assignment?.reviewerSessionId === reviewerSessionId;
    case "WAITING_FOR_CITIZEN": return item.state === "INFORMATION_REQUESTED";
    case "UNDER_REVIEW": return ["UNDER_REVIEW", "CITIZEN_SUPPLEMENTED"].includes(item.state);
    case "DUE_TODAY": return active && deadline && deadline >= now && deadline < startOfTomorrow;
    case "ESCALATED": return active && deadline && deadline < now;
    case "RESOLVED": return RESOLVED_AUTHORITY_STATES.includes(item.state);
    default: return active;
  }
}

export function summarizeAuthorityItems(items, reviewerSessionId = null, now = new Date()) {
  const count = (view) => items.filter((item) => matchesAuthorityView(item, view, reviewerSessionId, now)).length;
  return {
    total: items.length,
    open: count("OPEN"),
    new: count("NEW"),
    unassigned: count("UNASSIGNED"),
    myBatch: count("MY_BATCH"),
    waitingForCitizen: count("WAITING_FOR_CITIZEN"),
    underReview: count("UNDER_REVIEW"),
    dueToday: count("DUE_TODAY"),
    escalated: count("ESCALATED"),
    resolved: count("RESOLVED"),
  };
}

export function encodeWorklistCursor(item) {
  return Buffer.from(JSON.stringify({ updatedAt: item.updatedAt, id: item.id })).toString("base64url");
}

export function decodeWorklistCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!parsed.updatedAt || !parsed.id) return null;
    return { updatedAt: String(parsed.updatedAt), id: String(parsed.id) };
  } catch {
    return null;
  }
}
