const REQUIRED_METHODS = [
  "createSession",
  "getSession",
  "resetSession",
  "getSessionCase",
  "listSessionCases",
  "listSessionReviewTasks",
  "getAuthorityQueueSummary",
  "listAuthorityWorkItems",
  "claimAuthorityCase",
  "listSessionAudit",
  "listSessionWorkflowEvents",
  "getContestDraft",
  "saveContestDraft",
  "ensureChannelConversation",
  "getChannelConversation",
  "getChannelInboxOutcome",
  "commitChannelExchange",
  "claimChannelOutbox",
  "markChannelOutboxSent",
  "markChannelOutboxFailed",
  "applyChannelDeliveryReceipt",
  "createChannelHandoff",
  "consumeChannelHandoff",
  "getSessionIdempotent",
  "commitSessionMutation",
  "commitSessionBatchMutation",
  "close",
];

export function assertRepositoryContract(repository) {
  if (!repository || !repository.provider) {
    throw new TypeError("A configured Challan Nyay repository is required.");
  }
  const missing = REQUIRED_METHODS.filter((method) => typeof repository[method] !== "function");
  if (missing.length) {
    throw new TypeError(`Repository '${repository.provider}' is missing: ${missing.join(", ")}.`);
  }
  return repository;
}

export { REQUIRED_METHODS };
