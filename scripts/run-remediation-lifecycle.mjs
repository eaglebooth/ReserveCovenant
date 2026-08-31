import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT = "0x22C9977940A6dB689Ed6e10F613805376eD7030e";
const ASSET = "DEMOUSD";
const EPOCH = 14;
const BOND = 10_000_000_000_000_000n;
const COMMIT = "fb7514d1961defa92187304026b7a3fc2fb2d30d";
const ISSUER_ID = "issuer-attestation.json";
const COUNTER_ID = "challenger-observation.json";
const ISSUER_PRIMARY = `https://raw.githubusercontent.com/eaglebooth/ReserveCovenant/${COMMIT}/samples/${ISSUER_ID}`;
const ISSUER_FALLBACK = `https://github.com/eaglebooth/ReserveCovenant/blob/${COMMIT}/samples/${ISSUER_ID}`;
const COUNTER_PRIMARY = `https://raw.githubusercontent.com/eaglebooth/ReserveCovenant/${COMMIT}/samples/${COUNTER_ID}`;
const COUNTER_FALLBACK = `https://github.com/eaglebooth/ReserveCovenant/blob/${COMMIT}/samples/${COUNTER_ID}`;
const SKIP_APPROVALS = process.argv.includes("--skip-approvals");

async function readSecretLines(count) {
  if (process.stdin.isTTY && process.stdin.setRawMode) process.stdin.setRawMode(true);
  process.stdin.resume();
  const values = [];
  let value = "";
  for await (const chunk of process.stdin) {
    for (const character of String(chunk)) {
      if (character === "\r" || character === "\n") {
        if (value) {
          values.push(value.trim());
          value = "";
          if (values.length === count) {
            if (process.stdin.isTTY && process.stdin.setRawMode) process.stdin.setRawMode(false);
            return values;
          }
        }
      } else value += character;
    }
  }
  if (process.stdin.isTTY && process.stdin.setRawMode) process.stdin.setRawMode(false);
  return values;
}

const keys = await readSecretLines(2);
if (keys.length !== 2) throw new Error("Pass two test private keys as stdin lines");
const accounts = keys.map((key) => createAccount(key.startsWith("0x") ? key : `0x${key}`));
keys.fill("");
const clients = accounts.map((account) => createClient({ chain: studionet, account }));

const parseRead = async (client, functionName, args = []) => {
  const value = await client.readContract({ address: CONTRACT, functionName, args });
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
};

const registryOwner = String(await parseRead(clients[0], "get_registry_owner")).toLowerCase();
const ownerIndex = accounts.findIndex((account) => account.address.toLowerCase() === registryOwner);
if (ownerIndex < 0 && !SKIP_APPROVALS) throw new Error(`Neither supplied wallet is registry owner ${registryOwner}`);
const issuerIndex = ownerIndex >= 0 ? ownerIndex : 0;
const challengerIndex = issuerIndex === 0 ? 1 : 0;
const owner = accounts[issuerIndex];
const challenger = accounts[challengerIndex];
const ownerClient = clients[issuerIndex];
const challengerClient = clients[challengerIndex];

const txFacts = (label, hash, tx) => {
  const leader = tx.consensus_data?.leader_receipt?.[0] ?? {};
  return {
    label,
    hash,
    status: tx.statusName ?? "UNKNOWN",
    consensus: tx.result_name ?? tx.resultName ?? "",
    execution: leader.execution_result ?? tx.txExecutionResultName ?? "UNKNOWN",
    result_status: leader.result?.status ?? "",
    result: leader.result?.payload ?? "",
    rotations: tx.rotation_count ?? null,
  };
};

async function submit(client, label, functionName, args = [], value = 0n, expectedError = "") {
  const hash = await client.writeContract({ address: CONTRACT, functionName, args, value });
  process.stdout.write(`${label}: submitted ${hash}\n`);
  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    interval: 2000,
    retries: 300,
  });
  const facts = txFacts(label, hash, await client.getTransaction({ hash }));
  if (expectedError) {
    if (facts.status !== "FINALIZED" || facts.execution !== "ERROR" || facts.result_status !== "rollback" || facts.result !== expectedError) {
      throw new Error(`${label} did not fail as expected: ${JSON.stringify(facts)}`);
    }
  } else if (facts.status !== "FINALIZED" || facts.execution !== "SUCCESS" || facts.result_status !== "return") {
    throw new Error(`${label} failed: ${JSON.stringify(facts)}`);
  }
  process.stdout.write(`${label}: verified ${JSON.stringify(facts)}\n`);
  return facts;
}

const initial = await parseRead(ownerClient, "get_totals");
if (Number(initial.assessments) !== 0) throw new Error(`Fresh remediation contract required: ${JSON.stringify(initial)}`);
const evidence = {
  network: "studionet",
  contract: CONTRACT,
  owner: owner.address,
  challenger: challenger.address,
  evidence_urls: [ISSUER_PRIMARY, ISSUER_FALLBACK, COUNTER_PRIMARY, COUNTER_FALLBACK],
  initial,
  failure_paths: [],
  happy_path: [],
};

if (!SKIP_APPROVALS) {
  evidence.happy_path.push(await submit(ownerClient, "approve_issuer", "approve_issuer", [owner.address, ASSET]));
  evidence.happy_path.push(await submit(ownerClient, "approve_issuer_evidence", "approve_evidence", [ASSET, EPOCH, ISSUER_ID, "CANONICAL", ISSUER_PRIMARY, ISSUER_FALLBACK]));
  evidence.happy_path.push(await submit(ownerClient, "approve_counter_evidence", "approve_evidence", [ASSET, EPOCH, COUNTER_ID, "INDEPENDENT", COUNTER_PRIMARY, COUNTER_FALLBACK]));
} else {
  evidence.approvals = "owner-submitted and verified by first dependent writes";
}

const now = Math.floor(Date.now() / 1000);
evidence.failure_paths.push(await submit(
  challengerClient,
  "unapproved_issuer_rejected",
  "open_assessment",
  [ASSET, EPOCH, ISSUER_PRIMARY, ISSUER_FALLBACK, ISSUER_ID, now + 3600],
  BOND,
  "ISSUER_NOT_APPROVED",
));

const beforeOpen = await parseRead(ownerClient, "get_totals");
const assessmentId = Number(beforeOpen.assessments);
evidence.happy_path.push(await submit(ownerClient, "open_assessment", "open_assessment", [
  ASSET, EPOCH, ISSUER_PRIMARY, ISSUER_FALLBACK, ISSUER_ID, now + 3600,
], BOND));
let assessment = await parseRead(ownerClient, "get_assessment", [assessmentId]);
if (assessment.status !== "OPEN" || assessment.issuer.toLowerCase() !== owner.address.toLowerCase()) {
  throw new Error(`Open readback mismatch: ${JSON.stringify(assessment)}`);
}

evidence.failure_paths.push(await submit(
  ownerClient,
  "issuer_self_challenge_rejected",
  "challenge",
  [assessmentId, COUNTER_PRIMARY, COUNTER_FALLBACK, COUNTER_ID, now + 7200],
  BOND,
  "ISSUER_CANNOT_CHALLENGE",
));
evidence.happy_path.push(await submit(challengerClient, "challenge", "challenge", [
  assessmentId, COUNTER_PRIMARY, COUNTER_FALLBACK, COUNTER_ID, now + 7200,
], BOND));
evidence.failure_paths.push(await submit(
  ownerClient,
  "early_settlement_rejected",
  "settle",
  [assessmentId],
  0n,
  "NOT_SETTLEABLE",
));
evidence.happy_path.push(await submit(ownerClient, "assess", "assess", [assessmentId]));
assessment = await parseRead(ownerClient, "get_assessment", [assessmentId]);
if (assessment.status !== "ASSESSED") throw new Error(`Assessment did not become settleable: ${JSON.stringify(assessment)}`);
evidence.happy_path.push(await submit(ownerClient, "settle", "settle", [assessmentId]));
const capabilityId = Number((await parseRead(ownerClient, "get_totals")).capabilities);
evidence.happy_path.push(await submit(ownerClient, "issue_capability", "issue_capability", [assessmentId, challenger.address]));
evidence.happy_path.push(await submit(challengerClient, "consume_capability", "consume_capability", [capabilityId, assessmentId]));
evidence.failure_paths.push(await submit(
  challengerClient,
  "capability_replay_rejected",
  "consume_capability",
  [capabilityId, assessmentId],
  0n,
  "CAPABILITY_NOT_ACTIVE",
));

evidence.assessment_id = assessmentId;
evidence.final_assessment = await parseRead(ownerClient, "get_assessment", [assessmentId]);
evidence.capability_id = capabilityId;
evidence.final_capability = await parseRead(ownerClient, "get_capability", [capabilityId]);
evidence.final_totals = await parseRead(ownerClient, "get_totals");
process.stdout.write(`LIFECYCLE_COMPLETE ${JSON.stringify(evidence, null, 2)}\n`);
