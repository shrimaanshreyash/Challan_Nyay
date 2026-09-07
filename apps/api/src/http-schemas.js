const identifier = { type: "string", minLength: 1, maxLength: 128 };
const expectedVersion = { type: "integer", minimum: 1 };

export const noBodySchema = {
  body: { type: "object", additionalProperties: false },
};

export const caseParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["caseId"],
  properties: { caseId: identifier },
};

export const accountParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["accountId"],
  properties: { accountId: identifier },
};

export const mutationHeadersSchema = {
  type: "object",
  required: ["idempotency-key"],
  properties: {
    "idempotency-key": { type: "string", minLength: 8, maxLength: 160 },
  },
};

export const authoritySessionSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["accessCode"],
    properties: { accessCode: { type: "string", minLength: 8, maxLength: 80 } },
  },
};

export const lookupSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["lookupType", "query", "challengeId", "challengeAnswer"],
    properties: {
      lookupType: { type: "string", enum: ["CHALLAN", "VEHICLE", "DL"] },
      query: identifier,
      challengeId: { type: "string", minLength: 16, maxLength: 2048 },
      challengeAnswer: { type: "integer", minimum: 0, maximum: 100 },
    },
  },
};

export const contestSubmissionSchema = {
  params: caseParamsSchema,
  headers: mutationHeadersSchema,
  body: {
    type: "object",
    additionalProperties: false,
    required: ["ground", "statement", "issueDetails", "declarationAccepted"],
    properties: {
      expectedVersion,
      ground: {
        type: "string",
        enum: ["WRONG_VEHICLE", "ALREADY_PAID", "DUPLICATE_CHALLAN", "VEHICLE_SOLD", "WRONG_DRIVER", "EVIDENCE_UNCLEAR"],
      },
      statement: { type: "string", minLength: 1, maxLength: 2000 },
      issueDetails: { type: "object", additionalProperties: true, maxProperties: 20 },
      declarationAccepted: { type: "boolean" },
    },
  },
};

export const contestDraftSchema = {
  params: caseParamsSchema,
  body: {
    type: "object",
    additionalProperties: false,
    required: ["expectedDraftVersion", "ground", "statement", "issueDetails", "declarationAccepted"],
    properties: {
      expectedDraftVersion: { type: "integer", minimum: 0 },
      ground: {
        type: "string",
        enum: ["WRONG_VEHICLE", "ALREADY_PAID", "DUPLICATE_CHALLAN", "VEHICLE_SOLD", "WRONG_DRIVER", "EVIDENCE_UNCLEAR"],
      },
      statement: { type: "string", maxLength: 2000 },
      issueDetails: { type: "object", additionalProperties: true, maxProperties: 20 },
      declarationAccepted: { type: "boolean" },
    },
  },
};

export const decisionSchema = {
  params: caseParamsSchema,
  headers: mutationHeadersSchema,
  body: {
    type: "object",
    additionalProperties: false,
    required: ["outcome", "reasonCode", "explanation"],
    properties: {
      expectedVersion,
      outcome: { type: "string", enum: ["QUASHED", "REJECTED", "PAID", "RECONCILIATION", "REROUTED"] },
      reasonCode: { type: "string", minLength: 3, maxLength: 100 },
      explanation: { type: "string", minLength: 12, maxLength: 2000 },
    },
  },
};

export const informationRequestSchema = {
  params: caseParamsSchema,
  headers: mutationHeadersSchema,
  body: {
    type: "object",
    additionalProperties: false,
    required: ["itemCode", "reason"],
    properties: {
      expectedVersion,
      itemCode: { type: "string", minLength: 3, maxLength: 100 },
      reason: { type: "string", minLength: 12, maxLength: 1000 },
    },
  },
};

export const informationResponseSchema = {
  params: caseParamsSchema,
  headers: mutationHeadersSchema,
  body: {
    type: "object",
    additionalProperties: false,
    required: ["evidenceCode", "responseNote"],
    properties: {
      expectedVersion,
      evidenceCode: { type: "string", minLength: 3, maxLength: 100 },
      responseNote: { type: "string", minLength: 3, maxLength: 2000 },
    },
  },
};

export const paymentSchema = {
  params: caseParamsSchema,
  headers: mutationHeadersSchema,
  body: {
    type: "object",
    additionalProperties: false,
    required: ["paymentMethod", "confirmationAccepted"],
    properties: {
      expectedVersion,
      paymentMethod: { type: "string", enum: ["DEMO_UPI", "DEMO_NET_BANKING"] },
      confirmationAccepted: { type: "boolean" },
    },
  },
};

export const paymentBatchSchema = {
  headers: mutationHeadersSchema,
  body: {
    type: "object",
    additionalProperties: false,
    required: ["items", "paymentMethod", "confirmationAccepted"],
    properties: {
      items: {
        type: "array",
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["caseId", "expectedVersion"],
          properties: { caseId: identifier, expectedVersion },
        },
      },
      paymentMethod: { type: "string", enum: ["DEMO_UPI", "DEMO_NET_BANKING"] },
      confirmationAccepted: { type: "boolean" },
    },
  },
};

export const authorityWorklistSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      view: {
        type: "string",
        enum: ["OPEN", "NEW", "UNASSIGNED", "MY_BATCH", "WAITING_FOR_CITIZEN", "UNDER_REVIEW", "DUE_TODAY", "ESCALATED", "RESOLVED"],
      },
      limit: { type: "integer", minimum: 1, maximum: 50, default: 25 },
      cursor: { type: "string", minLength: 8, maxLength: 512 },
    },
  },
};

export const claimCaseSchema = {
  params: caseParamsSchema,
  headers: mutationHeadersSchema,
  body: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
};
