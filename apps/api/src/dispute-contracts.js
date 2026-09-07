const asTrimmedString = (value) => String(value || "").trim();

const field = (code, label, type, options = {}) => ({ code, label, type, ...options });

export const DISPUTE_GROUND_CONTRACTS = Object.freeze({
  WRONG_VEHICLE: Object.freeze({
    code: "WRONG_VEHICLE",
    label: "Vehicle in enforcement evidence is not mine",
    citizenPrompt: "Tell us exactly what does not match.",
    routingTag: "EVIDENCE_VEHICLE_MISMATCH",
    fields: Object.freeze([
      field("mismatchFields", "What does not match?", "MULTI_SELECT", {
        required: true,
        choices: ["PLATE", "VEHICLE_TYPE", "COLOUR"],
      }),
    ]),
    requiredEvidence: Object.freeze(["SYNTHETIC_REGISTRATION_PROFILE"]),
    recommendedEvidence: Object.freeze(["CLEAR_VEHICLE_PHOTO"]),
    reviewerChecks: Object.freeze(["ORIGINAL_FRAME", "PLATE_CROP", "CAPTURE_METADATA", "REGISTRATION_PROFILE"]),
    allowedOutcomes: Object.freeze(["QUASHED", "INFORMATION_REQUESTED", "REJECTED"]),
  }),
  ALREADY_PAID: Object.freeze({
    code: "ALREADY_PAID",
    label: "Payment was already completed",
    citizenPrompt: "Give us the payment details needed for reconciliation.",
    routingTag: "PAYMENT_RECONCILIATION",
    fields: Object.freeze([
      field("paymentReference", "Synthetic payment reference", "TEXT", { required: true }),
      field("paymentDate", "Payment date", "DATE", { required: true }),
      field("amountPaise", "Amount paid", "MONEY_PAISE", { required: true }),
    ]),
    requiredEvidence: Object.freeze(["SYNTHETIC_PAYMENT_RECEIPT_OR_REFERENCE"]),
    recommendedEvidence: Object.freeze(["SYNTHETIC_PROVIDER_ACKNOWLEDGEMENT"]),
    reviewerChecks: Object.freeze(["PROVIDER_ATTEMPT", "AMOUNT_AND_DATE", "CHALLAN_LEDGER_STATE", "DUPLICATE_PAYMENT_RISK"]),
    allowedOutcomes: Object.freeze(["PAID", "RECONCILIATION", "INFORMATION_REQUESTED", "REJECTED"]),
  }),
  DUPLICATE_CHALLAN: Object.freeze({
    code: "DUPLICATE_CHALLAN",
    label: "Duplicate challan for the same event",
    citizenPrompt: "Choose the other challan that appears to describe the same event.",
    routingTag: "DUPLICATE_EVENT_REVIEW",
    fields: Object.freeze([
      field("relatedCaseId", "Related synthetic challan", "CASE_REFERENCE", { required: true }),
    ]),
    requiredEvidence: Object.freeze(["RELATED_CASE_REFERENCE"]),
    recommendedEvidence: Object.freeze([]),
    reviewerChecks: Object.freeze(["EVENT_TIME", "LOCATION", "OFFENCE", "VEHICLE", "CAPTURE_SOURCE", "PRIOR_PAYMENT_OR_DECISION"]),
    allowedOutcomes: Object.freeze(["QUASHED", "INFORMATION_REQUESTED", "REJECTED"]),
  }),
  VEHICLE_SOLD: Object.freeze({
    code: "VEHICLE_SOLD",
    label: "Vehicle was sold before the event",
    citizenPrompt: "Confirm when the ownership transfer became effective.",
    routingTag: "OWNERSHIP_TRANSFER_REVIEW",
    fields: Object.freeze([
      field("transferDate", "Transfer effective date", "DATE", { required: true }),
    ]),
    requiredEvidence: Object.freeze(["SYNTHETIC_TRANSFER_ACKNOWLEDGEMENT"]),
    recommendedEvidence: Object.freeze(["SYNTHETIC_DELIVERY_NOTE"]),
    reviewerChecks: Object.freeze(["TRANSFER_EFFECTIVE_DATE", "EVENT_TIME", "REGISTRY_REFERENCE", "JURISDICTION_CAPABILITY"]),
    allowedOutcomes: Object.freeze(["QUASHED", "REROUTED", "INFORMATION_REQUESTED", "REJECTED"]),
  }),
  WRONG_DRIVER: Object.freeze({
    code: "WRONG_DRIVER",
    label: "Registered owner was not the driver",
    citizenPrompt: "Confirm the nomination route supported by this jurisdiction.",
    routingTag: "DRIVER_NOMINATION_REVIEW",
    fields: Object.freeze([
      field("nominationDeclarationAccepted", "Synthetic nomination declaration", "BOOLEAN", { required: true }),
    ]),
    requiredEvidence: Object.freeze(["SYNTHETIC_NOMINATION_DECLARATION"]),
    recommendedEvidence: Object.freeze(["SYNTHETIC_DRIVER_ACKNOWLEDGEMENT"]),
    reviewerChecks: Object.freeze(["JURISDICTION_CAPABILITY", "DECLARATION_COMPLETENESS", "CONSENT", "SUBMISSION_WINDOW"]),
    allowedOutcomes: Object.freeze(["REROUTED", "INFORMATION_REQUESTED", "REJECTED"]),
  }),
  EVIDENCE_UNCLEAR: Object.freeze({
    code: "EVIDENCE_UNCLEAR",
    label: "Enforcement evidence is unclear",
    citizenPrompt: "Tell us which part of the evidence cannot be understood.",
    routingTag: "SOURCE_EVIDENCE_REVIEW",
    fields: Object.freeze([
      field("unclearFields", "What is unclear?", "MULTI_SELECT", {
        required: true,
        choices: ["PLATE", "VEHICLE", "OFFENCE", "TIME", "LOCATION"],
      }),
    ]),
    requiredEvidence: Object.freeze(["UNCLEAR_ELEMENT_SELECTION"]),
    recommendedEvidence: Object.freeze([]),
    reviewerChecks: Object.freeze(["ORIGINAL_MEDIA", "SOURCE_METADATA", "DERIVED_ASSET_LABELS", "ALLEGATION_SUPPORT"]),
    allowedOutcomes: Object.freeze(["QUASHED", "INFORMATION_REQUESTED", "REJECTED"]),
  }),
});

export function listDisputeGroundContracts() {
  return Object.values(DISPUTE_GROUND_CONTRACTS).map((contract) => ({ ...contract }));
}

function validationError(message, fieldCode) {
  const error = new Error(message);
  error.code = "DISPUTE_DETAILS_REQUIRED";
  error.field = fieldCode;
  error.statusCode = 422;
  return error;
}

function validDate(value) {
  const normalized = asTrimmedString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) && !Number.isNaN(Date.parse(`${normalized}T00:00:00.000Z`));
}

export function validateDisputeGroundDetails(ground, rawDetails = {}) {
  const contract = DISPUTE_GROUND_CONTRACTS[asTrimmedString(ground).toUpperCase()];
  if (!contract) {
    const error = new Error("Choose one of the supported synthetic grievance reasons.");
    error.code = "UNSUPPORTED_CONTEST_GROUND";
    error.statusCode = 422;
    throw error;
  }

  const details = {};
  for (const definition of contract.fields) {
    const rawValue = rawDetails?.[definition.code];
    if (definition.type === "MULTI_SELECT") {
      const values = Array.isArray(rawValue)
        ? [...new Set(rawValue.map((value) => asTrimmedString(value).toUpperCase()))]
            .filter((value) => definition.choices.includes(value))
        : [];
      if (definition.required && values.length === 0) {
        throw validationError(`Complete “${definition.label}” before submitting.`, definition.code);
      }
      details[definition.code] = values;
      continue;
    }

    if (definition.type === "BOOLEAN") {
      if (definition.required && rawValue !== true) {
        throw validationError(`Confirm “${definition.label}” before submitting.`, definition.code);
      }
      details[definition.code] = rawValue === true;
      continue;
    }

    if (definition.type === "MONEY_PAISE") {
      const amount = Number(rawValue);
      if (definition.required && (!Number.isInteger(amount) || amount <= 0)) {
        throw validationError(`Enter a valid value for “${definition.label}”.`, definition.code);
      }
      details[definition.code] = amount;
      continue;
    }

    if (definition.type === "DATE") {
      if (definition.required && !validDate(rawValue)) {
        throw validationError(`Enter a valid date for “${definition.label}”.`, definition.code);
      }
      details[definition.code] = asTrimmedString(rawValue);
      continue;
    }

    const value = asTrimmedString(rawValue);
    if (definition.required && value.length < 6) {
      throw validationError(`Complete “${definition.label}” before submitting.`, definition.code);
    }
    details[definition.code] = value;
  }

  return {
    issueCode: contract.code,
    issueLabel: contract.label,
    routingTag: contract.routingTag,
    details,
    requiredEvidence: [...contract.requiredEvidence],
    recommendedEvidence: [...contract.recommendedEvidence],
    reviewerChecks: [...contract.reviewerChecks],
    allowedOutcomes: [...contract.allowedOutcomes],
    contractVersion: "DISPUTE-CONTRACT-2026-09-03",
  };
}
