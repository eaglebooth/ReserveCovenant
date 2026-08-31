import assert from "node:assert/strict";
import test from "node:test";
import { decodeReturnedAssessmentId, decodeReturnedAssessmentIdFromCandidates } from "./receipt.ts";

test("decodes the Studio readable return payload", () => {
  const transaction = {
    consensus_data: {
      leader_receipt: [
        { execution_result: "SUCCESS", result: { status: "return", payload: { raw: [17], readable: "6" } } },
      ],
    },
  };
  assert.equal(decodeReturnedAssessmentId(transaction), 6);
});

test("decodes numeric and hexadecimal leader return payloads", () => {
  assert.equal(decodeReturnedAssessmentId({ consensus_data: { leader_receipt: [{ result: { payload: 4 } }] } }), 4);
  assert.equal(decodeReturnedAssessmentId({ consensus_data: { leader_receipt: [{ result: { payload: "0x2a" } }] } }), 42);
});

test("fails closed instead of defaulting to assessment zero", () => {
  assert.throws(
    () => decodeReturnedAssessmentId({ consensus_data: { leader_receipt: [{ result: { payload: "invalid" } }] } }),
    /did not contain a decodable assessment_id/,
  );
});

test("falls back from getTransaction to the accepted receipt payload", () => {
  const transactionWithoutLeaderReturn = { statusName: "ACCEPTED" };
  const acceptedReceipt = {
    consensus_data: { leader_receipt: [{ execution_result: "SUCCESS", result: { payload: { readable: "9" } } }] },
  };
  assert.equal(decodeReturnedAssessmentIdFromCandidates(transactionWithoutLeaderReturn, acceptedReceipt), 9);
});
