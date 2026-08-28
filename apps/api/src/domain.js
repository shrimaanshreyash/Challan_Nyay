const allowedTransitions = new Map([
  ["VIEWED", new Set(["CONTEST_SUBMITTED", "PAID"])],
  ["CONTEST_SUBMITTED", new Set(["UNDER_REVIEW"])],
  ["UNDER_REVIEW", new Set(["QUASHED", "REJECTED"])],
]);

export const DEMO_CASE_ID = "CN-DEMO-WRONG-VEHICLE";

export const DEMO_ACCOUNTS = [
  {
    id: "DEMO-CITIZEN-01",
    name: "Amit Rao",
    initials: "AR",
    email: "amit.rao@example.invalid",
    phone: "+91 ••••• ••210",
    dlNumber: "DL-DEMO-2026",
    vehicles: [
      { registration: "TS09CD5678", type: "Motorcycle", colour: "Red", label: "Honda CB350", primary: true },
      { registration: "KA00ZZ0002", type: "Hatchback", colour: "Silver", label: "Hyundai i20" },
      { registration: "MH00YY0003", type: "Sedan", colour: "Blue", label: "Honda City" },
    ],
    caseIds: [
      DEMO_CASE_ID,
      "CN-DEMO-PAID-SPEEDING",
      "CN-DEMO-UNDER-REVIEW",
      "CN-DEMO-QUASHED",
      "CN-DEMO-REJECTED",
      "CN-DEMO-SIGNAL-DUE",
    ],
  },
  {
    id: "DEMO-FLEET-02",
    name: "Neha Logistics",
    initials: "NL",
    email: "operations@example.invalid",
    phone: "+91 ••••• ••804",
    dlNumber: "DL-FLEET-2026",
    vehicles: [
      { registration: "DL01AB1234", type: "Sedan", colour: "White", label: "Fleet sedan", primary: true },
      { registration: "RJ14TR8801", type: "Light commercial vehicle", colour: "White", label: "Delivery vehicle" },
    ],
    caseIds: ["CN-FLEET-BUS-LANE", "CN-FLEET-PARKING", "CN-FLEET-PAID"],
  },
];

export function createSeedCase() {
  return {
    id: DEMO_CASE_ID,
    synthetic: true,
    version: 1,
    state: "VIEWED",
    stateLabel: "Action required",
    nextActionOwner: "You",
    issuedAt: "2026-08-18T05:30:00.000Z",
    contestDeadline: "2026-10-02T18:29:59.000Z",
    reviewDeadline: null,
    allegation: {
      offence: "Riding without a helmet",
      amountPaise: 100000,
      location: "Dilsukhnagar Check Post, Hyderabad",
      eventAt: "2026-08-18T05:28:00.000Z",
    },
    jurisdiction: {
      code: "TG-DEMO",
      name: "Telangana",
      authority: "Demo reviewing authority",
      adapterMode: "MOCK",
      ruleVersion: "CMVR-167-2026-DEMO",
    },
    detectedVehicle: {
      registration: "TS09AB1234",
      type: "Scooter",
      colour: "Black",
      rider: "No helmet detected",
    },
    registeredVehicle: {
      registration: "TS09CD5678",
      type: "Motorcycle",
      colour: "Red",
      rider: "Helmet shown in profile evidence",
    },
    evidence: [
      {
        id: "EVIDENCE-001",
        type: "ENFORCEMENT_IMAGE",
        label: "Frame from synthetic enforcement camera",
        assetPath: "/assets/synthetic-enforcement-frame.png",
        plateAssetPath: "/assets/synthetic-number-plate-v1.png",
        plateRegistration: "TS09AB1234",
        captureSource: "FIXED_CAMERA",
        capturedAt: "2026-08-18T05:28:00.000Z",
        location: {
          label: "Dilsukhnagar Check Post, Hyderabad",
          latitude: 17.36887,
          longitude: 78.52562,
          accuracyMetres: 25,
          synthetic: true,
        },
        integrity: {
          originalRetained: true,
          derivedPlateCrop: true,
          demoHash: "sha256:synthetic-evidence-001",
        },
        synthetic: true,
      },
    ],
    contest: null,
    decision: null,
    payment: null,
    timeline: [
      {
        id: "EVENT-ISSUED",
        type: "CHALLAN_ISSUED",
        label: "Challan issued",
        at: "2026-08-18T05:30:00.000Z",
        actor: "Mock enforcement adapter",
      },
      {
        id: "EVENT-NOTICE",
        type: "NOTICE_SENT",
        label: "Notice sent",
        at: "2026-08-19T04:30:00.000Z",
        actor: "Mock notification adapter",
      },
      {
        id: "EVENT-VIEWED",
        type: "CASE_VIEWED",
        label: "Case viewed",
        at: "2026-08-22T05:15:00.000Z",
        actor: "Demo citizen",
      },
    ],
  };
}

function historicalCase({
  id,
  registration,
  vehicleType,
  vehicleColour,
  offence,
  amountPaise,
  location,
  state,
  stateLabel,
  issuedAt,
  jurisdiction = "Telangana",
  payment = null,
  contest = null,
  decision = null,
  captureSource = "OFFICER_MOBILE",
  coordinates,
}) {
  const capturedAt = issuedAt;
  const hasVehicleMismatch = Boolean(contest);
  const detectedVehicle = hasVehicleMismatch
    ? { registration: "TS09AB1234", type: "Scooter", colour: "Black", rider: "Synthetic mismatch for reviewer training" }
    : { registration, type: vehicleType, colour: vehicleColour, rider: "Synthetic enforcement observation" };
  const timeline = [
    { id: `${id}-ISSUED`, type: "CHALLAN_ISSUED", label: "Challan issued", at: issuedAt, actor: "Mock enforcement adapter" },
    { id: `${id}-NOTICE`, type: "NOTICE_SENT", label: "Notice delivered", at: issuedAt, actor: "Mock notification adapter" },
  ];
  if (contest) {
    timeline.push(
      { id: `${id}-SUBMITTED`, type: "CONTEST_SUBMITTED", label: "Grievance submitted", at: contest.submittedAt, actor: "Demo citizen" },
      { id: `${id}-EVIDENCE`, type: "EVIDENCE_RECEIVED", label: "Evidence received", at: contest.evidenceReceivedAt, actor: "Demo reviewing authority" },
    );
    if (["UNDER_REVIEW", "QUASHED", "REJECTED"].includes(state)) {
      timeline.push({ id: `${id}-REVIEW`, type: "REVIEW_STARTED", label: "Review started", at: contest.reviewStartedAt, actor: "Demo authority reviewer" });
    }
  }
  if (decision) timeline.push({ id: `${id}-DECISION`, type: `CASE_${state}`, label: state === "QUASHED" ? "Challan quashed with reasons" : "Contest rejected with reasons", at: decision.decidedAt, actor: "Demo authority reviewer" });
  if (payment) timeline.push({ id: `${id}-PAID`, type: "PAYMENT_POSTED", label: "Synthetic payment posted", at: payment.paidAt, actor: "Mock payment adapter" });
  return {
    id,
    synthetic: true,
    version: 1,
    state,
    stateLabel,
    nextActionOwner: ["PAID", "QUASHED"].includes(state) ? "None — case closed" : state === "REJECTED" ? "You" : ["CONTEST_SUBMITTED", "UNDER_REVIEW"].includes(state) ? "Demo reviewing authority" : "You",
    issuedAt,
    contestDeadline: "2026-10-30T18:29:59.000Z",
    reviewDeadline: contest ? "2026-09-24T18:29:59.000Z" : null,
    allegation: { offence, amountPaise, location, eventAt: capturedAt },
    jurisdiction: { code: `${jurisdiction.slice(0, 2).toUpperCase()}-DEMO`, name: jurisdiction, authority: "Demo reviewing authority", adapterMode: "MOCK", ruleVersion: "MVA-DEMO-CONFIG" },
    detectedVehicle,
    registeredVehicle: { registration, type: vehicleType, colour: vehicleColour, rider: "Authorized demo vehicle" },
    evidence: [{
      id: `${id}-EVIDENCE-001`, type: "ENFORCEMENT_IMAGE", label: captureSource === "OFFICER_MOBILE" ? "Synthetic officer mobile upload" : "Synthetic fixed-camera frame",
      assetPath: hasVehicleMismatch ? "/assets/synthetic-enforcement-frame.png" : null,
      plateAssetPath: hasVehicleMismatch ? "/assets/synthetic-number-plate-v1.png" : null,
      plateRegistration: hasVehicleMismatch ? detectedVehicle.registration : null,
      captureSource,
      capturedAt,
      location: { label: location, ...coordinates, accuracyMetres: captureSource === "OFFICER_MOBILE" ? 12 : 25, synthetic: true },
      integrity: { originalRetained: hasVehicleMismatch, derivedPlateCrop: hasVehicleMismatch, demoHash: `sha256:${id.toLowerCase()}` }, synthetic: true,
    }],
    contest,
    decision,
    payment,
    timeline,
  };
}

export function createSeedCases() {
  const paidAt = "2026-08-12T09:20:00.000Z";
  const submittedAt = "2026-08-15T06:30:00.000Z";
  const evidenceReceivedAt = "2026-08-15T08:10:00.000Z";
  const reviewStartedAt = "2026-08-16T04:45:00.000Z";
  const contest = (suffix) => ({ ground: "WRONG_VEHICLE", groundLabel: "Vehicle in enforcement evidence is not mine", statement: "The enforcement evidence does not match the authorized vehicle profile.", evidenceIds: ["SYNTHETIC-EVIDENCE"], submittedAt, evidenceReceivedAt, reviewStartedAt, receiptId: `CN-GRV-${suffix}`, declarationVersion: "DEMO-DECLARATION-1" });
  const payment = (suffix, amountPaise) => ({ method: "DEMO_UPI", attemptId: `CN-PAY-${suffix}`, providerReference: `DEMO-PGI-${suffix}`, receiptId: `CN-PAY-RCPT-${suffix}`, providerStatus: "SUCCEEDED", ledgerStatus: "POSTED", amountPaise, paidAt, synthetic: true });
  const decision = (suffix, outcome) => ({ outcome, reasonCode: outcome === "QUASHED" ? "VEHICLE_MISMATCH_CONFIRMED" : "MISMATCH_NOT_ESTABLISHED", explanation: outcome === "QUASHED" ? "The evidence and registration profile show different vehicles, so the challan was quashed." : "The supplied evidence did not establish a mismatch. The applicable official remedy remains available.", evidenceConsidered: ["SYNTHETIC-EVIDENCE"], reviewerId: "DEMO-REVIEWER-01", decidedAt: "2026-08-20T08:00:00.000Z", orderReference: `CN-ORDER-${suffix}` });
  return [
    createSeedCase(),
    historicalCase({ id: "CN-DEMO-PAID-SPEEDING", registration: "KA00ZZ0002", vehicleType: "Hatchback", vehicleColour: "Silver", offence: "Speed above notified limit", amountPaise: 150000, location: "Outer Ring Road, Bengaluru", state: "PAID", stateLabel: "Paid", issuedAt: "2026-08-08T05:15:00.000Z", jurisdiction: "Karnataka", payment: payment("PAID-102", 150000), captureSource: "FIXED_CAMERA", coordinates: { latitude: 12.9166, longitude: 77.6101 } }),
    historicalCase({ id: "CN-DEMO-UNDER-REVIEW", registration: "MH00YY0003", vehicleType: "Sedan", vehicleColour: "Blue", offence: "No parking", amountPaise: 50000, location: "Bandra Kurla Complex, Mumbai", state: "UNDER_REVIEW", stateLabel: "Under review", issuedAt: "2026-08-14T07:20:00.000Z", jurisdiction: "Maharashtra", contest: contest("REVIEW-221"), coordinates: { latitude: 19.0678, longitude: 72.869 } }),
    historicalCase({ id: "CN-DEMO-QUASHED", registration: "TS09CD5678", vehicleType: "Motorcycle", vehicleColour: "Red", offence: "Duplicate notice", amountPaise: 100000, location: "Secunderabad, Hyderabad", state: "QUASHED", stateLabel: "Quashed", issuedAt: "2026-08-03T05:20:00.000Z", contest: contest("CLOSED-410"), decision: decision("CLOSED-410", "QUASHED"), coordinates: { latitude: 17.4399, longitude: 78.4983 } }),
    historicalCase({ id: "CN-DEMO-REJECTED", registration: "MH00YY0003", vehicleType: "Sedan", vehicleColour: "Blue", offence: "Seat belt not worn", amountPaise: 100000, location: "Worli Sea Face, Mumbai", state: "REJECTED", stateLabel: "Decision issued", issuedAt: "2026-07-30T11:00:00.000Z", jurisdiction: "Maharashtra", contest: contest("DECISION-303"), decision: decision("DECISION-303", "REJECTED"), coordinates: { latitude: 19.0178, longitude: 72.8176 } }),
    historicalCase({ id: "CN-DEMO-SIGNAL-DUE", registration: "KA00ZZ0002", vehicleType: "Hatchback", vehicleColour: "Silver", offence: "Signal violation", amountPaise: 100000, location: "MG Road, Bengaluru", state: "VIEWED", stateLabel: "Due soon", issuedAt: "2026-08-24T13:10:00.000Z", jurisdiction: "Karnataka", coordinates: { latitude: 12.9756, longitude: 77.6097 } }),
    historicalCase({ id: "CN-FLEET-BUS-LANE", registration: "DL01AB1234", vehicleType: "Sedan", vehicleColour: "White", offence: "Bus lane violation", amountPaise: 200000, location: "Ring Road, New Delhi", state: "VIEWED", stateLabel: "Action required", issuedAt: "2026-08-22T08:10:00.000Z", jurisdiction: "Delhi", coordinates: { latitude: 28.5672, longitude: 77.21 } }),
    historicalCase({ id: "CN-FLEET-PARKING", registration: "RJ14TR8801", vehicleType: "Light commercial vehicle", vehicleColour: "White", offence: "Restricted parking", amountPaise: 50000, location: "MI Road, Jaipur", state: "UNDER_REVIEW", stateLabel: "Under review", issuedAt: "2026-08-17T09:40:00.000Z", jurisdiction: "Rajasthan", contest: contest("FLEET-520"), coordinates: { latitude: 26.9157, longitude: 75.812 } }),
    historicalCase({ id: "CN-FLEET-PAID", registration: "DL01AB1234", vehicleType: "Sedan", vehicleColour: "White", offence: "No seat belt", amountPaise: 100000, location: "ITO, New Delhi", state: "PAID", stateLabel: "Paid", issuedAt: "2026-08-06T06:00:00.000Z", jurisdiction: "Delhi", payment: payment("FLEET-118", 100000), coordinates: { latitude: 28.6289, longitude: 77.2414 } }),
  ];
}

export function assertTransition(currentState, nextState) {
  if (!allowedTransitions.get(currentState)?.has(nextState)) {
    const error = new Error(`Invalid case transition: ${currentState} -> ${nextState}`);
    error.code = "INVALID_CASE_TRANSITION";
    error.statusCode = 409;
    throw error;
  }
}

export function submitContest(caseRecord, input, now = new Date()) {
  assertTransition(caseRecord.state, "CONTEST_SUBMITTED");

  const groundLabels = {
    WRONG_VEHICLE: "Vehicle in enforcement evidence is not mine",
    ALREADY_PAID: "Payment was already completed",
    DUPLICATE_CHALLAN: "Duplicate challan for the same event",
    VEHICLE_SOLD: "Vehicle was sold before the event",
    WRONG_DRIVER: "Registered owner was not the driver",
    EVIDENCE_UNCLEAR: "Enforcement evidence is unclear",
  };
  if (!groundLabels[input.ground]) {
    const error = new Error("Choose one of the supported synthetic grievance reasons.");
    error.code = "UNSUPPORTED_CONTEST_GROUND";
    error.statusCode = 422;
    throw error;
  }

  if (!input.declarationAccepted) {
    const error = new Error("Confirm the synthetic-data declaration before submitting.");
    error.code = "DECLARATION_REQUIRED";
    error.statusCode = 422;
    throw error;
  }

  const submittedAt = now.toISOString();
  const caseSlug = caseRecord.id.split("-").at(-1);
  const receiptId = `CN-RCPT-${caseSlug}-${caseRecord.version + 1}`;

  return {
    ...caseRecord,
    version: caseRecord.version + 1,
    state: "CONTEST_SUBMITTED",
    stateLabel: "Submitted for review",
    nextActionOwner: caseRecord.jurisdiction.authority,
    reviewDeadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    contest: {
      ground: input.ground,
      groundLabel: groundLabels[input.ground],
      statement: String(input.statement || "").trim(),
      evidenceIds: ["EVIDENCE-001", "SYNTHETIC-REGISTRATION-PROFILE"],
      submittedAt,
      receiptId,
      declarationVersion: "DEMO-DECLARATION-1",
    },
    timeline: [
      ...caseRecord.timeline,
      {
        id: `EVENT-SUBMITTED-${caseRecord.version + 1}`,
        type: "CONTEST_SUBMITTED",
        label: "Contest submitted",
        at: submittedAt,
        actor: "Demo citizen",
      },
    ],
  };
}

export function beginReview(caseRecord, now = new Date()) {
  assertTransition(caseRecord.state, "UNDER_REVIEW");
  return {
    ...caseRecord,
    version: caseRecord.version + 1,
    state: "UNDER_REVIEW",
    stateLabel: "Under review",
    nextActionOwner: "Demo authority reviewer",
    timeline: [
      ...caseRecord.timeline,
      {
        id: `EVENT-REVIEW-${caseRecord.version + 1}`,
        type: "REVIEW_STARTED",
        label: "Review started",
        at: now.toISOString(),
        actor: "Demo authority reviewer",
      },
    ],
  };
}

export function decideCase(caseRecord, input, now = new Date()) {
  const normalizedOutcome = String(input.outcome || "").toUpperCase();
  if (!["QUASHED", "REJECTED"].includes(normalizedOutcome)) {
    const error = new Error("Outcome must be QUASHED or REJECTED.");
    error.code = "INVALID_DECISION_OUTCOME";
    error.statusCode = 422;
    throw error;
  }

  const reviewRecord = caseRecord.state === "CONTEST_SUBMITTED" ? beginReview(caseRecord, now) : caseRecord;
  assertTransition(reviewRecord.state, normalizedOutcome);

  if (!input.reasonCode || !String(input.explanation || "").trim()) {
    const error = new Error("A structured reason and plain-language explanation are required.");
    error.code = "REASON_REQUIRED";
    error.statusCode = 422;
    throw error;
  }

  const decidedAt = now.toISOString();
  return {
    ...reviewRecord,
    version: reviewRecord.version + 1,
    state: normalizedOutcome,
    stateLabel: normalizedOutcome === "QUASHED" ? "Challan quashed" : "Contest rejected",
    nextActionOwner: normalizedOutcome === "QUASHED" ? "None — case closed" : "You",
    decision: {
      outcome: normalizedOutcome,
      reasonCode: input.reasonCode,
      explanation: String(input.explanation).trim(),
      evidenceConsidered: ["EVIDENCE-001", "SYNTHETIC-REGISTRATION-PROFILE"],
      reviewerId: "DEMO-REVIEWER-01",
      decidedAt,
      orderReference: `CN-ORDER-${caseRecord.id.split("-").at(-1)}-${reviewRecord.version + 1}`,
    },
    timeline: [
      ...reviewRecord.timeline,
      {
        id: `EVENT-DECISION-${reviewRecord.version + 1}`,
        type: `CASE_${normalizedOutcome}`,
        label: normalizedOutcome === "QUASHED" ? "Challan quashed with reasons" : "Contest rejected with reasons",
        at: decidedAt,
        actor: "Demo authority reviewer",
      },
    ],
  };
}

export function payCase(caseRecord, input, now = new Date()) {
  assertTransition(caseRecord.state, "PAID");
  const paymentMethod = String(input.paymentMethod || "").toUpperCase();
  if (!["DEMO_UPI", "DEMO_NET_BANKING"].includes(paymentMethod)) {
    const error = new Error("Choose one of the synthetic payment methods.");
    error.code = "INVALID_PAYMENT_METHOD";
    error.statusCode = 422;
    throw error;
  }
  if (!input.confirmationAccepted) {
    const error = new Error("Confirm that no real payment or personal financial data is being used.");
    error.code = "PAYMENT_CONFIRMATION_REQUIRED";
    error.statusCode = 422;
    throw error;
  }

  const paidAt = now.toISOString();
  const caseSlug = caseRecord.id.split("-").at(-1);
  return {
    ...caseRecord,
    version: caseRecord.version + 1,
    state: "PAID",
    stateLabel: "Paid in demo",
    nextActionOwner: "None — case closed",
    payment: {
      method: paymentMethod,
      attemptId: `CN-PAY-${caseSlug}-${caseRecord.version + 1}`,
      providerReference: `DEMO-PGI-${caseRecord.version + 1}`,
      receiptId: `CN-PAY-RCPT-${caseSlug}-${caseRecord.version + 1}`,
      providerStatus: "SUCCEEDED",
      ledgerStatus: "POSTED",
      amountPaise: caseRecord.allegation.amountPaise,
      paidAt,
      synthetic: true,
    },
    timeline: [
      ...caseRecord.timeline,
      {
        id: `EVENT-PAID-${caseRecord.version + 1}`,
        type: "PAYMENT_POSTED",
        label: "Synthetic payment posted",
        at: paidAt,
        actor: "Mock payment adapter",
      },
    ],
  };
}
