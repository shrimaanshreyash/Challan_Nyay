export function createCaseVersionConflict() {
  const error = new Error("The case changed while you were working. Refresh and try again.");
  error.code = "CASE_VERSION_CONFLICT";
  error.statusCode = 409;
  return error;
}

export function assertVersionAdvance(expectedVersion, nextRecord) {
  if (!nextRecord || !Number.isInteger(nextRecord.version) || nextRecord.version <= expectedVersion) {
    const error = new Error("A case mutation must advance the aggregate version.");
    error.code = "INVALID_CASE_VERSION_ADVANCE";
    error.statusCode = 409;
    throw error;
  }
}
