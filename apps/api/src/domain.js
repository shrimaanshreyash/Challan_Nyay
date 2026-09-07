import { validateDisputeGroundDetails } from "./dispute-contracts.js";

const allowedTransitions = new Map([
  ["VIEWED", new Set(["CONTEST_SUBMITTED", "PAID"])],
  ["CONTEST_SUBMITTED", new Set(["UNDER_REVIEW", "INFORMATION_REQUESTED"])],
  ["UNDER_REVIEW", new Set(["INFORMATION_REQUESTED", "QUASHED", "REJECTED", "PAID", "RECONCILIATION", "REROUTED"])],
  ["INFORMATION_REQUESTED", new Set(["CITIZEN_SUPPLEMENTED"])],
  ["CITIZEN_SUPPLEMENTED", new Set(["UNDER_REVIEW"])],
]);

export const DEMO_CASE_ID = "CN-DEMO-WRONG-VEHICLE";

export const DEMO_VEHICLE_PROFILES = Object.freeze({
  TS09CD5678: Object.freeze({
    registration: "TS09CD5678",
    make: "Honda",
    model: "CB350",
    label: "Honda CB350",
    type: "Motorcycle",
    colour: "Red",
    imageAssetPath: "/assets/vehicles/registered-motorcycle-red.png",
  }),
  KA00ZZ0002: Object.freeze({
    registration: "KA00ZZ0002",
    make: "Hyundai",
    model: "i20",
    label: "Hyundai i20",
    type: "Hatchback",
    colour: "Silver",
    imageAssetPath: "/assets/vehicles/registered-hatchback-silver.png",
  }),
  MH00YY0003: Object.freeze({
    registration: "MH00YY0003",
    make: "Honda",
    model: "City",
    label: "Honda City",
    type: "Sedan",
    colour: "Blue",
    imageAssetPath: "/assets/vehicles/registered-sedan-blue.png",
  }),
  DL01AB1234: Object.freeze({
    registration: "DL01AB1234",
    make: "Demo Motors",
    model: "Fleet S1",
    label: "Fleet sedan",
    type: "Sedan",
    colour: "White",
    imageAssetPath: "/assets/vehicles/registered-fleet-sedan-white.png",
  }),
  RJ14TR8801: Object.freeze({
    registration: "RJ14TR8801",
    make: "Demo Motors",
    model: "Cargo Mini",
    label: "Delivery vehicle",
    type: "Light commercial vehicle",
    colour: "White",
    imageAssetPath: "/assets/vehicles/registered-delivery-van-white.png",
  }),
  KL07MX4312: Object.freeze({
    registration: "KL07MX4312",
    make: "Tata",
    model: "Nexon",
    label: "Tata Nexon",
    type: "Compact SUV",
    colour: "Blue",
    imageAssetPath: "/assets/vehicles/registered-sedan-blue.png",
  }),
  UP16NX2041: Object.freeze({
    registration: "UP16NX2041",
    make: "Maruti Suzuki",
    model: "Baleno",
    label: "Maruti Suzuki Baleno",
    type: "Hatchback",
    colour: "Silver",
    imageAssetPath: "/assets/vehicles/registered-hatchback-silver.png",
  }),
});

function registeredVehicleProfile(registration, fallback) {
  return {
    ...fallback,
    ...(DEMO_VEHICLE_PROFILES[registration] || {}),
    registration,
    registry: {
      profileId: `REGISTRY-DEMO-${registration}`,
      source: "SYNTHETIC_VEHICLE_REGISTRY_ADAPTER",
      snapshotVersion: "2026-08-DEMO",
      verifiedAt: "2026-08-17T12:00:00.000Z",
      synthetic: true,
    },
  };
}

function createEvidenceEnvelope({
  id,
  label,
  assetPath,
  previewAssetPath,
  plateAssetPath,
  plateRegistration,
  captureSource,
  capturedAt,
  location,
  originalRetained,
  hash,
  sourceId,
}) {
  const originalAssetId = `${id}-ORIGINAL`;
  const previewAssetId = previewAssetPath ? `${id}-WEB-PREVIEW` : null;
  const plateAssetId = plateAssetPath ? `${id}-PLATE-CROP` : null;
  return {
    id,
    type: "ENFORCEMENT_IMAGE",
    label,
    assetPath,
    previewAssetPath,
    plateAssetPath,
    plateRegistration,
    captureSource,
    capturedAt,
    location: {
      ...location,
      coordinateSource: captureSource === "OFFICER_MOBILE" ? "SIGNED_DEVICE_EVENT" : "SIGNED_CAMERA_EVENT",
      displayPolicy: "APPROXIMATE_PUBLIC_MAP",
    },
    source: {
      kind: captureSource,
      sourceId,
      agency: "Demo reviewing authority",
      ingestActor: "MOCK_ENFORCEMENT_ADAPTER",
      adapterVersion: "DEMO-EVIDENCE-ENVELOPE-1",
      capturedAt,
      synthetic: true,
    },
    original: {
      assetId: originalAssetId,
      assetPath,
      mediaType: assetPath?.endsWith(".png") ? "image/png" : "image/jpeg",
      retained: originalRetained,
      sha256: hash,
      immutable: true,
    },
    derivedAssets: [
      ...(previewAssetId ? [{
        assetId: previewAssetId,
        kind: "WEB_PREVIEW",
        assetPath: previewAssetPath,
        derivedFrom: originalAssetId,
        transformation: { operation: "RESIZE_AND_COMPRESS", version: "DEMO-WEBP-1", humanReviewRequired: false },
        synthetic: true,
      }] : []),
      ...(plateAssetId ? [{
        assetId: plateAssetId,
        kind: "PLATE_CROP",
        assetPath: plateAssetPath,
        derivedFrom: originalAssetId,
        transformation: {
          operation: "CROP",
          version: "DEMO-CROP-1",
          humanReviewRequired: true,
        },
        synthetic: true,
      }] : []),
    ],
    integrity: {
      originalRetained,
      derivedPlateCrop: Boolean(plateAssetId),
      lineageComplete: Boolean(originalRetained && (!plateAssetId || plateAssetPath)),
      demoHash: hash,
    },
    synthetic: true,
  };
}

export function buildEvidencePassport(caseRecord) {
  const evidence = caseRecord.evidence?.[0];
  const registered = caseRecord.registeredVehicle;
  const detected = caseRecord.detectedVehicle;
  if (!evidence || !registered || !detected) return null;
  const mismatches = [
    registered.type !== detected.type ? "VEHICLE_TYPE" : null,
    registered.colour !== detected.colour ? "COLOUR" : null,
  ].filter(Boolean);
  return {
    evidenceId: evidence.id,
    source: evidence.source || {
      kind: evidence.captureSource,
      sourceId: "LEGACY-DEMO-SOURCE",
      agency: caseRecord.jurisdiction?.authority,
      capturedAt: evidence.capturedAt,
      synthetic: true,
    },
    original: evidence.original || {
      assetId: `${evidence.id}-ORIGINAL`,
      retained: Boolean(evidence.integrity?.originalRetained),
      sha256: evidence.integrity?.demoHash,
      immutable: true,
    },
    derivedPlate: evidence.derivedAssets?.find((asset) => asset.kind === "PLATE_CROP") || null,
    plateComparison: {
      observed: evidence.plateRegistration || detected.registration,
      registered: registered.registration,
      matches: (evidence.plateRegistration || detected.registration) === registered.registration,
    },
    vehicleComparison: {
      observedType: detected.type,
      registeredType: registered.type,
      observedColour: detected.colour,
      registeredColour: registered.colour,
      mismatches,
      assessment: mismatches.length ? "BODY_MISMATCH" : "MATCHED",
    },
    registry: registered.registry || null,
    location: evidence.location,
    lineageStatus: evidence.integrity?.lineageComplete ? "COMPLETE" : "SOURCE_METADATA_ONLY",
  };
}

export const DEMO_GUEST_LOOKUPS = Object.freeze({
  VEHICLE: Object.freeze({ query: "UP16NX2041", caseId: "CN-GUEST-VEHICLE" }),
  CHALLAN: Object.freeze({ query: "CN-GUEST-CHALLAN", caseId: "CN-GUEST-CHALLAN" }),
  DL: Object.freeze({ query: "DL-GUEST-2026", caseId: "CN-GUEST-LICENCE" }),
});

export const DEMO_ACCOUNTS = [
  {
    id: "DEMO-CITIZEN-01",
    name: "Amit Rao",
    initials: "AR",
    email: "amit.rao@example.invalid",
    phone: "+91 ••••• ••210",
    dlNumber: "DL-DEMO-2026",
    vehicles: [
      { ...registeredVehicleProfile("TS09CD5678"), primary: true },
      registeredVehicleProfile("KA00ZZ0002"),
      registeredVehicleProfile("MH00YY0003"),
    ],
    caseIds: [
      DEMO_CASE_ID,
      "CN-DEMO-PAID-SPEEDING",
      "CN-DEMO-UNDER-REVIEW",
      "CN-DEMO-QUASHED",
      "CN-DEMO-REJECTED",
      "CN-DEMO-SIGNAL-DUE",
      "CN-DEMO-PAID-PARKING",
      "CN-DEMO-PAID-LANE",
      "CN-DEMO-PAID-SIGNAL",
      "CN-DEMO-INFORMATION-REQUESTED",
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
      { ...registeredVehicleProfile("DL01AB1234"), primary: true },
      registeredVehicleProfile("RJ14TR8801"),
    ],
    caseIds: [
      "CN-FLEET-BUS-LANE",
      "CN-FLEET-PARKING",
      "CN-FLEET-PAID",
      "CN-FLEET-SUBMITTED",
      "CN-FLEET-INFORMATION-REQUESTED",
      "CN-FLEET-QUASHED",
    ],
  },
  {
    id: "DEMO-CITIZEN-03",
    name: "Farah Nair",
    initials: "FN",
    email: "farah.nair@example.invalid",
    phone: "+91 ••••• ••671",
    dlNumber: "DL-SINGLE-2026",
    vehicles: [
      { ...registeredVehicleProfile("KL07MX4312"), primary: true },
    ],
    caseIds: [
      "CN-SINGLE-ACTION",
      "CN-SINGLE-PAID",
      "CN-SINGLE-UNDER-REVIEW",
      "CN-SINGLE-RECONCILIATION",
    ],
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
      registration: "TS09CD5678",
      make: "Unverified",
      model: "City scooter",
      label: "Black city scooter detected",
      type: "Scooter",
      colour: "Black",
      rider: "No helmet detected",
      imageAssetPath: "/assets/vehicles/detected-scooter-black.png",
      registryComparison: "BODY_MISMATCH",
      sourceEvidenceId: "EVIDENCE-001",
    },
    registeredVehicle: registeredVehicleProfile("TS09CD5678", {
      rider: "Helmet shown in profile evidence",
      registryComparison: "AUTHORIZED_PROFILE",
    }),
    evidence: [createEvidenceEnvelope({
      id: "EVIDENCE-001",
      label: "Frame from synthetic enforcement camera",
      assetPath: "/assets/synthetic-enforcement-frame.png",
      previewAssetPath: "/assets/synthetic-enforcement-frame-preview.webp",
      plateAssetPath: "/assets/synthetic-number-plate-v2.jpg",
      plateRegistration: "TS09CD5678",
      captureSource: "FIXED_CAMERA",
      capturedAt: "2026-08-18T05:28:00.000Z",
      location: {
        label: "Dilsukhnagar Check Post, Hyderabad",
        latitude: 17.36887,
        longitude: 78.52562,
        accuracyMetres: 25,
        synthetic: true,
      },
      originalRetained: true,
      hash: "sha256:synthetic-evidence-001",
      sourceId: "TG-DEMO-CAMERA-044",
    })],
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
  evidenceAssetPath = null,
  evidencePreviewAssetPath = null,
  plateAssetPath = null,
  plateRegistration = null,
  detectedVehicleOverride = null,
}) {
  const capturedAt = issuedAt;
  const hasVehicleMismatch = Boolean(contest);
  const evidenceId = `${id}-EVIDENCE-001`;
  const detectedVehicle = detectedVehicleOverride || (hasVehicleMismatch
    ? { registration, make: "Unverified", model: "City scooter", label: "Black city scooter detected", type: "Scooter", colour: "Black", rider: "Synthetic mismatch for reviewer training", imageAssetPath: "/assets/vehicles/detected-scooter-black.png", registryComparison: "BODY_MISMATCH", sourceEvidenceId: evidenceId }
    : registeredVehicleProfile(registration, { type: vehicleType, colour: vehicleColour, rider: "Synthetic enforcement observation", registryComparison: "MATCHED" }));
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
    if (state === "INFORMATION_REQUESTED") {
      timeline.push({ id: `${id}-INFO`, type: "INFORMATION_REQUESTED", label: "Additional information requested", at: contest.reviewStartedAt, actor: "Demo authority reviewer" });
    }
  }
  if (decision) {
    const decisionLabel = state === "QUASHED"
      ? "Challan quashed with reasons"
      : state === "RECONCILIATION"
        ? "Payment reconciliation opened"
        : state === "REROUTED"
          ? "Case rerouted with reasons"
          : "Contest rejected with reasons";
    timeline.push({ id: `${id}-DECISION`, type: `CASE_${state}`, label: decisionLabel, at: decision.decidedAt, actor: "Demo authority reviewer" });
  }
  if (payment) timeline.push({ id: `${id}-PAID`, type: "PAYMENT_POSTED", label: "Synthetic payment posted", at: payment.paidAt, actor: "Mock payment adapter" });
  return {
    id,
    synthetic: true,
    version: 1,
    state,
    stateLabel,
    nextActionOwner: ["PAID", "QUASHED"].includes(state) ? "None - case closed" : state === "REJECTED" ? "You" : ["CONTEST_SUBMITTED", "UNDER_REVIEW"].includes(state) ? "Demo reviewing authority" : state === "INFORMATION_REQUESTED" ? "You" : "You",
    issuedAt,
    contestDeadline: "2026-10-30T18:29:59.000Z",
    reviewDeadline: contest ? "2026-09-24T18:29:59.000Z" : null,
    allegation: { offence, amountPaise, location, eventAt: capturedAt },
    jurisdiction: { code: `${jurisdiction.slice(0, 2).toUpperCase()}-DEMO`, name: jurisdiction, authority: "Demo reviewing authority", adapterMode: "MOCK", ruleVersion: "MVA-DEMO-CONFIG" },
    detectedVehicle,
    registeredVehicle: registeredVehicleProfile(registration, { type: vehicleType, colour: vehicleColour, rider: "Authorized demo vehicle", registryComparison: "AUTHORIZED_PROFILE" }),
    evidence: [createEvidenceEnvelope({
      id: evidenceId,
      label: captureSource === "OFFICER_MOBILE" ? "Synthetic officer mobile upload" : "Synthetic fixed-camera frame",
      assetPath: evidenceAssetPath || detectedVehicle.imageAssetPath || "/assets/synthetic-enforcement-frame.png",
      previewAssetPath: evidencePreviewAssetPath || evidenceAssetPath || detectedVehicle.imageAssetPath || "/assets/synthetic-enforcement-frame-preview.webp",
      // Historical demo records must not display an unrelated plate photograph.
      // When no matching crop is retained, the UI renders the recorded plate as
      // an explicit metadata fallback instead.
      plateAssetPath: plateAssetPath || null,
      plateRegistration: plateRegistration || registration,
      captureSource,
      capturedAt,
      location: { label: location, ...coordinates, accuracyMetres: captureSource === "OFFICER_MOBILE" ? 12 : 25, synthetic: true },
      originalRetained: true,
      hash: `sha256:${id.toLowerCase()}`,
      sourceId: captureSource === "OFFICER_MOBILE" ? `DEMO-OFFICER-EVENT-${id}` : `DEMO-CAMERA-EVENT-${id}`,
    })],
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
  const contest = (suffix, ground = "WRONG_VEHICLE", groundLabel = "Vehicle in enforcement evidence is not mine") => ({
    ground,
    groundLabel,
    statement: ground === "ALREADY_PAID"
      ? "The payment reference was completed, but the challan ledger still shows an amount due."
      : ground === "DUPLICATE_CHALLAN"
        ? "This notice appears to duplicate another challan for the same event."
        : "The enforcement evidence does not match the authorized vehicle profile.",
    evidenceIds: ["SYNTHETIC-EVIDENCE"],
    submittedAt,
    evidenceReceivedAt,
    reviewStartedAt,
    receiptId: `CN-GRV-${suffix}`,
    declarationVersion: "DEMO-DECLARATION-1",
  });
  const payment = (suffix, amountPaise) => ({ method: "DEMO_UPI", attemptId: `CN-PAY-${suffix}`, providerReference: `DEMO-PGI-${suffix}`, receiptId: `CN-PAY-RCPT-${suffix}`, providerStatus: "SUCCEEDED", ledgerStatus: "POSTED", amountPaise, paidAt, synthetic: true });
  const decision = (suffix, outcome) => ({ outcome, reasonCode: outcome === "QUASHED" ? "VEHICLE_MISMATCH_CONFIRMED" : "MISMATCH_NOT_ESTABLISHED", explanation: outcome === "QUASHED" ? "The evidence and registration profile show different vehicles, so the challan was quashed." : "The supplied evidence did not establish a mismatch. The applicable official remedy remains available.", evidenceConsidered: ["SYNTHETIC-EVIDENCE"], reviewerId: "DEMO-REVIEWER-01", decidedAt: "2026-08-20T08:00:00.000Z", orderReference: `CN-ORDER-${suffix}` });
  return [
    createSeedCase(),
    historicalCase({ id: "CN-DEMO-PAID-SPEEDING", registration: "KA00ZZ0002", vehicleType: "Hatchback", vehicleColour: "Silver", offence: "Speed above notified limit", amountPaise: 150000, location: "Outer Ring Road, Bengaluru", state: "PAID", stateLabel: "Paid", issuedAt: "2026-08-08T05:15:00.000Z", jurisdiction: "Karnataka", payment: payment("PAID-102", 150000), captureSource: "FIXED_CAMERA", coordinates: { latitude: 12.9166, longitude: 77.6101 } }),
    historicalCase({ id: "CN-DEMO-UNDER-REVIEW", registration: "MH00YY0003", vehicleType: "Sedan", vehicleColour: "Blue", offence: "No parking", amountPaise: 50000, location: "Bandra Kurla Complex, Mumbai", state: "UNDER_REVIEW", stateLabel: "Under review", issuedAt: "2026-08-14T07:20:00.000Z", jurisdiction: "Maharashtra", contest: contest("REVIEW-221"), coordinates: { latitude: 19.0678, longitude: 72.869 } }),
    historicalCase({ id: "CN-DEMO-QUASHED", registration: "TS09CD5678", vehicleType: "Motorcycle", vehicleColour: "Red", offence: "Duplicate notice", amountPaise: 100000, location: "Secunderabad, Hyderabad", state: "QUASHED", stateLabel: "Quashed", issuedAt: "2026-08-03T05:20:00.000Z", contest: contest("CLOSED-410"), decision: decision("CLOSED-410", "QUASHED"), coordinates: { latitude: 17.4399, longitude: 78.4983 } }),
    historicalCase({ id: "CN-DEMO-REJECTED", registration: "MH00YY0003", vehicleType: "Sedan", vehicleColour: "Blue", offence: "Seat belt not worn", amountPaise: 100000, location: "Worli Sea Face, Mumbai", state: "REJECTED", stateLabel: "Decision issued", issuedAt: "2026-07-30T11:00:00.000Z", jurisdiction: "Maharashtra", contest: contest("DECISION-303"), decision: decision("DECISION-303", "REJECTED"), coordinates: { latitude: 19.0178, longitude: 72.8176 } }),
    historicalCase({ id: "CN-DEMO-SIGNAL-DUE", registration: "TS09CD5678", vehicleType: "Motorcycle", vehicleColour: "Red", offence: "Signal violation", amountPaise: 100000, location: "Khairatabad Junction, Hyderabad", state: "VIEWED", stateLabel: "Due soon", issuedAt: "2026-08-24T13:10:00.000Z", jurisdiction: "Telangana", coordinates: { latitude: 17.4126, longitude: 78.4612 } }),
    historicalCase({ id: "CN-DEMO-PAID-PARKING", registration: "MH00YY0003", vehicleType: "Sedan", vehicleColour: "Blue", offence: "Parking in a restricted zone", amountPaise: 50000, location: "Fort, Mumbai", state: "PAID", stateLabel: "Paid", issuedAt: "2026-07-18T09:35:00.000Z", jurisdiction: "Maharashtra", payment: payment("PAID-214", 50000), coordinates: { latitude: 18.9338, longitude: 72.8354 } }),
    historicalCase({ id: "CN-DEMO-PAID-LANE", registration: "TS09CD5678", vehicleType: "Motorcycle", vehicleColour: "Red", offence: "Lane discipline violation", amountPaise: 50000, location: "Jubilee Hills Check Post, Hyderabad", state: "PAID", stateLabel: "Paid", issuedAt: "2026-07-09T06:10:00.000Z", payment: payment("PAID-318", 50000), coordinates: { latitude: 17.4326, longitude: 78.4071 } }),
    historicalCase({ id: "CN-DEMO-PAID-SIGNAL", registration: "KA00ZZ0002", vehicleType: "Hatchback", vehicleColour: "Silver", offence: "Stop-line crossing", amountPaise: 50000, location: "Cubbon Road, Bengaluru", state: "PAID", stateLabel: "Paid", issuedAt: "2026-06-28T12:25:00.000Z", jurisdiction: "Karnataka", payment: payment("PAID-421", 50000), coordinates: { latitude: 12.9814, longitude: 77.5991 } }),
    historicalCase({ id: "CN-DEMO-INFORMATION-REQUESTED", registration: "MH00YY0003", vehicleType: "Sedan", vehicleColour: "Blue", offence: "No parking", amountPaise: 100000, location: "Lower Parel, Mumbai", state: "INFORMATION_REQUESTED", stateLabel: "Information needed", issuedAt: "2026-08-20T10:15:00.000Z", jurisdiction: "Maharashtra", contest: contest("INFO-109", "EVIDENCE_UNCLEAR", "Evidence is unclear"), coordinates: { latitude: 18.9987, longitude: 72.8258 } }),
    historicalCase({ id: "CN-FLEET-BUS-LANE", registration: "DL01AB1234", vehicleType: "Sedan", vehicleColour: "White", offence: "Bus lane violation", amountPaise: 200000, location: "Ring Road, New Delhi", state: "VIEWED", stateLabel: "Action required", issuedAt: "2026-08-22T08:10:00.000Z", jurisdiction: "Delhi", coordinates: { latitude: 28.5672, longitude: 77.21 } }),
    historicalCase({ id: "CN-FLEET-PARKING", registration: "RJ14TR8801", vehicleType: "Light commercial vehicle", vehicleColour: "White", offence: "Restricted parking", amountPaise: 50000, location: "MI Road, Jaipur", state: "UNDER_REVIEW", stateLabel: "Under review", issuedAt: "2026-08-17T09:40:00.000Z", jurisdiction: "Rajasthan", contest: contest("FLEET-520"), coordinates: { latitude: 26.9157, longitude: 75.812 } }),
    historicalCase({ id: "CN-FLEET-PAID", registration: "DL01AB1234", vehicleType: "Sedan", vehicleColour: "White", offence: "No seat belt", amountPaise: 100000, location: "ITO, New Delhi", state: "PAID", stateLabel: "Paid", issuedAt: "2026-08-06T06:00:00.000Z", jurisdiction: "Delhi", payment: payment("FLEET-118", 100000), coordinates: { latitude: 28.6289, longitude: 77.2414 } }),
    historicalCase({ id: "CN-FLEET-SUBMITTED", registration: "RJ14TR8801", vehicleType: "Light commercial vehicle", vehicleColour: "White", offence: "Commercial loading-zone violation", amountPaise: 150000, location: "Tonk Road, Jaipur", state: "CONTEST_SUBMITTED", stateLabel: "Submitted for review", issuedAt: "2026-08-21T07:40:00.000Z", jurisdiction: "Rajasthan", contest: contest("FLEET-611", "VEHICLE_SOLD", "Vehicle ownership changed before the event"), coordinates: { latitude: 26.8543, longitude: 75.7932 } }),
    historicalCase({ id: "CN-FLEET-INFORMATION-REQUESTED", registration: "DL01AB1234", vehicleType: "Sedan", vehicleColour: "White", offence: "No seat belt", amountPaise: 100000, location: "Lodhi Road, New Delhi", state: "INFORMATION_REQUESTED", stateLabel: "Information needed", issuedAt: "2026-08-19T05:50:00.000Z", jurisdiction: "Delhi", contest: contest("FLEET-704", "WRONG_DRIVER", "A different driver was operating the vehicle"), coordinates: { latitude: 28.5917, longitude: 77.2273 } }),
    historicalCase({ id: "CN-FLEET-QUASHED", registration: "RJ14TR8801", vehicleType: "Light commercial vehicle", vehicleColour: "White", offence: "Duplicate parking notice", amountPaise: 50000, location: "Ajmeri Gate, Jaipur", state: "QUASHED", stateLabel: "Quashed", issuedAt: "2026-07-24T08:45:00.000Z", jurisdiction: "Rajasthan", contest: contest("FLEET-809", "DUPLICATE_CHALLAN", "Duplicate challan"), decision: decision("FLEET-809", "QUASHED"), coordinates: { latitude: 26.9168, longitude: 75.8187 } }),
    historicalCase({ id: "CN-SINGLE-ACTION", registration: "KL07MX4312", vehicleType: "Compact SUV", vehicleColour: "Blue", offence: "Signal violation", amountPaise: 100000, location: "Vyttila Junction, Kochi", state: "VIEWED", stateLabel: "Action required", issuedAt: "2026-08-25T06:25:00.000Z", jurisdiction: "Kerala", coordinates: { latitude: 9.9676, longitude: 76.3184 } }),
    historicalCase({ id: "CN-SINGLE-PAID", registration: "KL07MX4312", vehicleType: "Compact SUV", vehicleColour: "Blue", offence: "Speed above notified limit", amountPaise: 150000, location: "Edappally, Kochi", state: "PAID", stateLabel: "Paid", issuedAt: "2026-08-02T11:05:00.000Z", jurisdiction: "Kerala", payment: payment("SINGLE-202", 150000), captureSource: "FIXED_CAMERA", coordinates: { latitude: 10.0261, longitude: 76.3125 } }),
    historicalCase({ id: "CN-SINGLE-UNDER-REVIEW", registration: "KL07MX4312", vehicleType: "Compact SUV", vehicleColour: "Blue", offence: "Parking near a pedestrian crossing", amountPaise: 50000, location: "Marine Drive, Kochi", state: "UNDER_REVIEW", stateLabel: "Under review", issuedAt: "2026-08-18T14:30:00.000Z", jurisdiction: "Kerala", contest: contest("SINGLE-317", "EVIDENCE_UNCLEAR", "Evidence is unclear"), coordinates: { latitude: 9.9816, longitude: 76.2756 } }),
    historicalCase({ id: "CN-SINGLE-RECONCILIATION", registration: "KL07MX4312", vehicleType: "Compact SUV", vehicleColour: "Blue", offence: "Lane discipline violation", amountPaise: 50000, location: "Palarivattom, Kochi", state: "RECONCILIATION", stateLabel: "Payment reconciliation", issuedAt: "2026-07-29T04:55:00.000Z", jurisdiction: "Kerala", contest: contest("SINGLE-408", "ALREADY_PAID", "Payment already completed"), decision: { ...decision("SINGLE-408", "RECONCILIATION"), outcome: "RECONCILIATION", reasonCode: "PAYMENT_LEDGER_RECONCILIATION", explanation: "The provider reference requires payment-ledger reconciliation. No repeat payment is requested." }, coordinates: { latitude: 10.0009, longitude: 76.3021 } }),
    historicalCase({ id: "CN-GUEST-VEHICLE", registration: "UP16NX2041", vehicleType: "Hatchback", vehicleColour: "Silver", offence: "Speed above notified limit", amountPaise: 200000, location: "Noida-Greater Noida Expressway", state: "VIEWED", stateLabel: "Action required", issuedAt: "2026-08-27T07:15:00.000Z", jurisdiction: "Uttar Pradesh", captureSource: "FIXED_CAMERA", evidenceAssetPath: "/assets/evidence/guest-vehicle-speed-camera-v1.webp", plateAssetPath: "/assets/evidence/guest-vehicle-plate-v1.webp", coordinates: { latitude: 28.5067, longitude: 77.4032 } }),
    historicalCase({ id: "CN-GUEST-CHALLAN", registration: "DL01AB1234", vehicleType: "Sedan", vehicleColour: "White", offence: "Stop-line crossing", amountPaise: 50000, location: "Connaught Place, New Delhi", state: "CONTEST_SUBMITTED", stateLabel: "Submitted for review", issuedAt: "2026-08-26T08:20:00.000Z", jurisdiction: "Delhi", contest: contest("GUEST-510", "DUPLICATE_CHALLAN", "Duplicate challan"), evidenceAssetPath: "/assets/vehicles/registered-fleet-sedan-white.png", coordinates: { latitude: 28.6315, longitude: 77.2167 } }),
    historicalCase({ id: "CN-GUEST-LICENCE", registration: "RJ14TR8801", vehicleType: "Light commercial vehicle", vehicleColour: "White", offence: "Restricted parking", amountPaise: 100000, location: "Civil Lines, Jaipur", state: "UNDER_REVIEW", stateLabel: "Under review", issuedAt: "2026-08-23T09:05:00.000Z", jurisdiction: "Rajasthan", contest: contest("GUEST-612", "WRONG_DRIVER", "A different driver was operating the vehicle"), evidenceAssetPath: "/assets/vehicles/registered-delivery-van-white.png", coordinates: { latitude: 26.9328, longitude: 75.8017 } }),
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
  const issuePacket = validateDisputeGroundDetails(input.ground, input.issueDetails);

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
      groundLabel: issuePacket.issueLabel,
      statement: String(input.statement || "").trim(),
      evidenceIds: issuePacket.requiredEvidence,
      issuePacket,
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

export function requestInformation(caseRecord, input, now = new Date()) {
  const reviewRecord = caseRecord.state === "CONTEST_SUBMITTED" ? beginReview(caseRecord, now) : caseRecord;
  assertTransition(reviewRecord.state, "INFORMATION_REQUESTED");
  const itemCode = String(input.itemCode || "").trim().toUpperCase();
  const reason = String(input.reason || "").trim();
  if (!itemCode || !reason) {
    const error = new Error("Choose one missing item and explain why it is needed.");
    error.code = "INFORMATION_REQUEST_REQUIRED";
    error.statusCode = 422;
    throw error;
  }
  const issuePacket = reviewRecord.contest?.issuePacket;
  const requestableItems = issuePacket
    ? [...issuePacket.requiredEvidence, ...issuePacket.recommendedEvidence]
    : null;
  if (requestableItems && !requestableItems.includes(itemCode)) {
    const error = new Error("The requested item is not part of this issue-specific review contract.");
    error.code = "INFORMATION_ITEM_NOT_PERMITTED";
    error.statusCode = 422;
    throw error;
  }
  const requestedAt = now.toISOString();
  return {
    ...reviewRecord,
    version: reviewRecord.version + 1,
    state: "INFORMATION_REQUESTED",
    stateLabel: "Information requested",
    nextActionOwner: "You",
    informationRequest: {
      id: `CN-INFO-${caseRecord.id.split("-").at(-1)}-${reviewRecord.version + 1}`,
      itemCode,
      reason,
      status: "OPEN",
      requestedAt,
      requester: "Demo authority reviewer",
    },
    timeline: [
      ...reviewRecord.timeline,
      {
        id: `EVENT-INFO-REQUEST-${reviewRecord.version + 1}`,
        type: "INFORMATION_REQUESTED",
        label: "Additional information requested",
        at: requestedAt,
        actor: "Demo authority reviewer",
      },
    ],
  };
}

export function respondToInformationRequest(caseRecord, input, now = new Date()) {
  assertTransition(caseRecord.state, "CITIZEN_SUPPLEMENTED");
  const responseNote = String(input.responseNote || "").trim();
  const evidenceCode = String(input.evidenceCode || "").trim().toUpperCase();
  if (!responseNote || !evidenceCode) {
    const error = new Error("Add the requested synthetic item and a short response.");
    error.code = "INFORMATION_RESPONSE_REQUIRED";
    error.statusCode = 422;
    throw error;
  }
  if (evidenceCode !== caseRecord.informationRequest?.itemCode) {
    const error = new Error("Respond with the exact synthetic item requested by the reviewer.");
    error.code = "INFORMATION_RESPONSE_MISMATCH";
    error.statusCode = 422;
    throw error;
  }
  const respondedAt = now.toISOString();
  const supplement = {
    packetVersion: (caseRecord.supplements?.length || 0) + 2,
    requestId: caseRecord.informationRequest.id,
    evidenceCode,
    responseNote,
    respondedAt,
  };
  return {
    ...caseRecord,
    version: caseRecord.version + 1,
    state: "CITIZEN_SUPPLEMENTED",
    stateLabel: "Response received",
    nextActionOwner: caseRecord.jurisdiction.authority,
    informationRequest: { ...caseRecord.informationRequest, status: "RESPONDED", respondedAt },
    supplements: [...(caseRecord.supplements || []), supplement],
    timeline: [
      ...caseRecord.timeline,
      {
        id: `EVENT-SUPPLEMENT-${caseRecord.version + 1}`,
        type: "CITIZEN_SUPPLEMENTED",
        label: "Requested information supplied",
        at: respondedAt,
        actor: "Demo citizen",
      },
    ],
  };
}

export function decideCase(caseRecord, input, now = new Date()) {
  const normalizedOutcome = String(input.outcome || "").toUpperCase();
  const decisionOutcomes = ["QUASHED", "REJECTED", "PAID", "RECONCILIATION", "REROUTED"];
  if (!decisionOutcomes.includes(normalizedOutcome)) {
    const error = new Error("Choose one supported review outcome.");
    error.code = "INVALID_DECISION_OUTCOME";
    error.statusCode = 422;
    throw error;
  }

  const permittedOutcomes = caseRecord.contest?.issuePacket?.allowedOutcomes
    ?.filter((outcome) => outcome !== "INFORMATION_REQUESTED") || ["QUASHED", "REJECTED"];
  if (!permittedOutcomes.includes(normalizedOutcome)) {
    const error = new Error("That outcome is not permitted for the selected grievance reason.");
    error.code = "OUTCOME_NOT_PERMITTED";
    error.statusCode = 422;
    throw error;
  }

  const reviewRecord = ["CONTEST_SUBMITTED", "CITIZEN_SUPPLEMENTED"].includes(caseRecord.state)
    ? beginReview(caseRecord, now)
    : caseRecord;
  assertTransition(reviewRecord.state, normalizedOutcome);

  if (!input.reasonCode || !String(input.explanation || "").trim()) {
    const error = new Error("A structured reason and plain-language explanation are required.");
    error.code = "REASON_REQUIRED";
    error.statusCode = 422;
    throw error;
  }

  const decidedAt = now.toISOString();
  const statePresentation = {
    QUASHED: { label: "Challan quashed", owner: "None — case closed", eventLabel: "Challan quashed with reasons" },
    REJECTED: { label: "Decision issued", owner: "You", eventLabel: "Contest rejected with reasons" },
    PAID: { label: "Payment reconciled", owner: "None — case closed", eventLabel: "Prior payment confirmed" },
    RECONCILIATION: { label: "Sent for reconciliation", owner: "Demo payment reconciliation team", eventLabel: "Payment reconciliation opened" },
    REROUTED: { label: "Rerouted", owner: caseRecord.jurisdiction.authority, eventLabel: "Case rerouted with reasons" },
  }[normalizedOutcome];
  return {
    ...reviewRecord,
    version: reviewRecord.version + 1,
    state: normalizedOutcome,
    stateLabel: statePresentation.label,
    nextActionOwner: statePresentation.owner,
    decision: {
      outcome: normalizedOutcome,
      reasonCode: input.reasonCode,
      explanation: String(input.explanation).trim(),
      evidenceConsidered: caseRecord.contest?.issuePacket?.reviewerChecks || ["EVIDENCE-001", "SYNTHETIC-REGISTRATION-PROFILE"],
      reviewerId: "DEMO-REVIEWER-01",
      decidedAt,
      orderReference: `CN-ORDER-${caseRecord.id.split("-").at(-1)}-${reviewRecord.version + 1}`,
    },
    timeline: [
      ...reviewRecord.timeline,
      {
        id: `EVENT-DECISION-${reviewRecord.version + 1}`,
        type: `CASE_${normalizedOutcome}`,
        label: statePresentation.eventLabel,
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
  const paymentApp = paymentMethod === "DEMO_UPI"
    ? String(input.paymentApp || "OTHER_UPI").toUpperCase()
    : null;
  if (paymentApp && !["GOOGLE_PAY", "PHONEPE", "PAYTM", "OTHER_UPI"].includes(paymentApp)) {
    const error = new Error("Choose one of the synthetic UPI app options.");
    error.code = "INVALID_PAYMENT_APP";
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
      app: paymentApp,
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
