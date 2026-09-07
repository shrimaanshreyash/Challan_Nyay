import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DISPUTE_GROUND_CONTRACTS,
  listDisputeGroundContracts,
  validateDisputeGroundDetails,
} from "../src/dispute-contracts.js";

test("all six round-two dispute grounds expose complete citizen and reviewer contracts", () => {
  const contracts = listDisputeGroundContracts();
  assert.equal(contracts.length, 6);
  for (const contract of contracts) {
    assert.ok(contract.label);
    assert.ok(contract.citizenPrompt);
    assert.ok(contract.routingTag);
    assert.ok(contract.fields.length >= 1);
    assert.ok(contract.requiredEvidence.length >= 1);
    assert.ok(contract.reviewerChecks.length >= 1);
    assert.ok(contract.allowedOutcomes.length >= 1);
  }
});

test("wrong-vehicle submission records only supported mismatch fields", () => {
  const result = validateDisputeGroundDetails("WRONG_VEHICLE", {
    mismatchFields: ["plate", "vehicle_type", "PLATE", "UNSUPPORTED"],
  });
  assert.deepEqual(result.details.mismatchFields, ["PLATE", "VEHICLE_TYPE"]);
  assert.equal(result.routingTag, "EVIDENCE_VEHICLE_MISMATCH");
  assert.ok(result.reviewerChecks.includes("ORIGINAL_FRAME"));
});

test("already-paid path requires reconciliation details instead of a generic statement", () => {
  assert.throws(
    () => validateDisputeGroundDetails("ALREADY_PAID", { paymentReference: "DEMO-PAY-10" }),
    (error) => error.code === "DISPUTE_DETAILS_REQUIRED" && error.field === "paymentDate",
  );
  const result = validateDisputeGroundDetails("ALREADY_PAID", {
    paymentReference: "DEMO-PAY-10",
    paymentDate: "2026-08-18",
    amountPaise: 100000,
  });
  assert.equal(result.details.amountPaise, 100000);
  assert.ok(result.allowedOutcomes.includes("RECONCILIATION"));
});

test("each non-payment path rejects an empty issue-specific payload", () => {
  for (const ground of Object.keys(DISPUTE_GROUND_CONTRACTS).filter((code) => code !== "ALREADY_PAID")) {
    assert.throws(
      () => validateDisputeGroundDetails(ground, {}),
      (error) => error.code === "DISPUTE_DETAILS_REQUIRED",
    );
  }
});
