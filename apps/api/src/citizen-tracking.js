const TRACKED_STATES = {
  VIEWED: { currentStage: "Review and choose", currentOwner: "You", nextAction: "Review the evidence, then pay or raise the right grievance." },
  CONTEST_SUBMITTED: { currentStage: "Submitted", currentOwner: "Jurisdiction intake queue", nextAction: "No action is needed while the submission is acknowledged and assigned." },
  UNDER_REVIEW: { currentStage: "Under review", currentOwner: "Assigned reviewing authority", nextAction: "No action is needed unless the reviewer requests one specific item." },
  INFORMATION_REQUESTED: { currentStage: "Information requested", currentOwner: "You", nextAction: "Supply the requested item to return the case to the reviewer." },
  CITIZEN_SUPPLEMENTED: { currentStage: "Response received", currentOwner: "Assigned reviewing authority", nextAction: "Your response is saved; the reviewer now owns the next decision." },
  QUASHED: { currentStage: "Resolved", currentOwner: "Complete", nextAction: "Keep the reasoned order with your case records." },
  REJECTED: { currentStage: "Decision issued", currentOwner: "You", nextAction: "Read the reasoned order and use the applicable official remedy if needed." },
  PAID: { currentStage: "Resolved", currentOwner: "Complete", nextAction: "Keep the synthetic payment receipt with your case records." },
  RECONCILIATION: { currentStage: "Payment reconciliation", currentOwner: "Payment reconciliation team", nextAction: "The supplied payment reference is being compared with the challan ledger." },
  REROUTED: { currentStage: "Rerouted", currentOwner: "Responsible jurisdiction authority", nextAction: "The case is now with the authority configured to handle this issue." },
};

const EVENT_COPY = {
  CHALLAN_ISSUED: ["Notice issued", "The enforcement adapter created the challan record."],
  NOTICE_SENT: ["Notice delivered", "The notice became available to the citizen."],
  CASE_VIEWED: ["Case viewed", "The citizen opened the facts and evidence."],
  CONTEST_SUBMITTED: ["Grievance submitted", "The evidence packet and declaration were received."],
  EVIDENCE_RECEIVED: ["Evidence acknowledged", "The jurisdiction queue acknowledged the submitted packet."],
  CASE_CLAIMED: ["Reviewer assigned", "One reviewer claimed a time-bounded lease for this case."],
  REVIEW_STARTED: ["Review started", "A human reviewer began assessing the submitted evidence."],
  INFORMATION_REQUESTED: ["Information requested", "The reviewer requested one bounded missing item."],
  CITIZEN_SUPPLEMENTED: ["Response received", "The citizen response was saved as a new packet version."],
  CASE_QUASHED: ["Decision issued", "The challan was quashed with a recorded reason."],
  CASE_REJECTED: ["Decision issued", "The grievance was rejected with a recorded reason."],
  PAYMENT_POSTED: ["Payment reconciled", "The synthetic provider and challan ledgers both recorded the payment."],
  CASE_PAID: ["Prior payment confirmed", "The reviewer confirmed that the prior payment already satisfied the challan."],
  CASE_RECONCILIATION: ["Reconciliation opened", "The case was routed to payment reconciliation with the supplied reference."],
  CASE_REROUTED: ["Case rerouted", "The reviewer transferred the case to the configured responsible authority."],
};

const STAGE_ORDER = [
  { id: "SUBMITTED", label: "Submitted", events: ["CONTEST_SUBMITTED"] },
  { id: "ACKNOWLEDGED", label: "Acknowledged", events: ["EVIDENCE_RECEIVED"] },
  { id: "REVIEW", label: "Under review", events: ["CASE_CLAIMED", "REVIEW_STARTED", "INFORMATION_REQUESTED", "CITIZEN_SUPPLEMENTED"] },
  { id: "DECISION", label: "Decision", events: ["CASE_QUASHED", "CASE_REJECTED", "CASE_PAID", "CASE_RECONCILIATION", "CASE_REROUTED"] },
  { id: "RESOLVED", label: "Resolved", events: ["CASE_QUASHED", "CASE_PAID", "PAYMENT_POSTED"] },
];

function actorLabel(actor) {
  const normalized = String(actor || "system").toLowerCase();
  if (normalized.includes("citizen")) return "Citizen";
  if (normalized.includes("review")) return "Reviewing authority";
  if (normalized.includes("payment")) return "Payment adapter";
  if (normalized.includes("notification")) return "Notification adapter";
  if (normalized.includes("enforcement")) return "Enforcement adapter";
  return "Service system";
}

export function projectCitizenTracking(caseRecord, workflowEvents = []) {
  const state = TRACKED_STATES[caseRecord.state] || TRACKED_STATES.VIEWED;
  const events = workflowEvents
    .filter((event) => event.eventType !== "DEMO_CASE_SEEDED")
    .map((event) => {
      const copy = EVENT_COPY[event.eventType] || [
        String(event.eventType || "Case updated").toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()),
        "The shared case record was updated.",
      ];
      return {
        id: `workflow-${event.id}`,
        type: event.eventType,
        label: event.metadata?.label || copy[0],
        summary: copy[1],
        at: event.occurredAt,
        actor: actorLabel(event.actorRole),
        caseVersion: Number(event.caseVersion || event.metadata?.version || 1),
        correlationId: event.correlationId,
      };
    })
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  const reachedEventTypes = new Set(events.map((event) => event.type));
  const assignmentVisible = reachedEventTypes.has("CASE_CLAIMED")
    && ["CONTEST_SUBMITTED", "UNDER_REVIEW", "CITIZEN_SUPPLEMENTED"].includes(caseRecord.state);
  const current = assignmentVisible && caseRecord.state === "CONTEST_SUBMITTED"
    ? {
      currentStage: "Assigned",
      currentOwner: "Assigned reviewing authority",
      nextAction: "No action is needed while the assigned reviewer assesses the packet.",
    }
    : state;
  const decisionReached = ["QUASHED", "REJECTED", "PAID", "RECONCILIATION", "REROUTED"].includes(caseRecord.state);
  const resolvedReached = ["QUASHED", "PAID"].includes(caseRecord.state);
  const submittedReached = Boolean(caseRecord.contest);
  const stageStatuses = STAGE_ORDER.map((stage, index) => {
    const reached = stage.events.some((eventType) => reachedEventTypes.has(eventType))
      || (stage.id === "SUBMITTED" && submittedReached)
      || (stage.id === "ACKNOWLEDGED" && submittedReached)
      || (stage.id === "REVIEW" && ["UNDER_REVIEW", "INFORMATION_REQUESTED", "CITIZEN_SUPPLEMENTED", "QUASHED", "REJECTED"].includes(caseRecord.state))
      || (stage.id === "DECISION" && decisionReached)
      || (stage.id === "RESOLVED" && resolvedReached);
    return { ...stage, reached, index };
  });
  const lastReached = stageStatuses.reduce((latest, stage) => stage.reached ? stage.index : latest, -1);

  return {
    ...current,
    targetAt: ["VIEWED"].includes(caseRecord.state)
      ? caseRecord.contestDeadline
      : ["CONTEST_SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED", "CITIZEN_SUPPLEMENTED", "RECONCILIATION", "REROUTED"].includes(caseRecord.state)
        ? caseRecord.reviewDeadline
        : null,
    targetSource: caseRecord.state === "VIEWED"
      ? `${caseRecord.jurisdiction.ruleVersion} configured contest window`
      : caseRecord.reviewDeadline
        ? routedTargetSource(caseRecord.state)
        : "Terminal case record",
    stages: stageStatuses.map((stage) => ({
      id: stage.id,
      label: stage.label,
      status: stage.reached ? (stage.index === lastReached && !resolvedReached ? "CURRENT" : "COMPLETE") : "PENDING",
    })),
    events,
  };
}

function routedTargetSource(state) {
  return ["RECONCILIATION", "REROUTED"].includes(state)
    ? "Configured demo downstream service target"
    : "Configured demo review service target";
}
