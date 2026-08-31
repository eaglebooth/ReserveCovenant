import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT = "0x22C9977940A6dB689Ed6e10F613805376eD7030e";
const BOND = 10_000_000_000_000_000n;
const ISSUER_COMMIT = "fb7514d1961defa92187304026b7a3fc2fb2d30d";
const CONFLICT_COMMIT = "ef3aace45d475526bbb62bc6e63ae040c368367e";
const issuerId = "issuer-attestation.json";
const conflictId = "challenger-conflict.json";
const issuerPrimary = `https://raw.githubusercontent.com/eaglebooth/ReserveCovenant/${ISSUER_COMMIT}/samples/${issuerId}`;
const issuerFallback = `https://github.com/eaglebooth/ReserveCovenant/blob/${ISSUER_COMMIT}/samples/${issuerId}`;
const conflictPrimary = `https://raw.githubusercontent.com/eaglebooth/ReserveCovenant/${CONFLICT_COMMIT}/samples/${conflictId}`;
const conflictFallback = `https://github.com/eaglebooth/ReserveCovenant/blob/${CONFLICT_COMMIT}/samples/${conflictId}`;
const RESUME = process.argv.includes("--resume");

async function secrets(count) {
  process.stdin.setRawMode?.(true);
  process.stdin.resume();
  const values = [];
  let value = "";
  for await (const chunk of process.stdin) {
    for (const char of String(chunk)) {
      if (char === "\r" || char === "\n") {
        if (value) { values.push(value.trim()); value = ""; }
        if (values.length === count) {
          process.stdin.setRawMode?.(false);
          return values;
        }
      } else value += char;
    }
  }
  process.stdin.setRawMode?.(false);
  return values;
}

const keys = await secrets(2);
if (keys.length !== 2) throw new Error("Pass issuer and challenger keys through stdin");
const issuer = createAccount(keys[0].startsWith("0x") ? keys[0] : `0x${keys[0]}`);
const challenger = createAccount(keys[1].startsWith("0x") ? keys[1] : `0x${keys[1]}`);
keys.fill("");
const issuerClient = createClient({ chain: studionet, account: issuer });
const challengerClient = createClient({ chain: studionet, account: challenger });

async function read(functionName, args = []) {
  const value = await issuerClient.readContract({ address: CONTRACT, functionName, args });
  try { return JSON.parse(value); } catch { return value; }
}

async function write(client, label, functionName, args, value = 0n) {
  const hash = await client.writeContract({ address: CONTRACT, functionName, args, value });
  process.stdout.write(`${label}: submitted ${hash}\n`);
  await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 2000, retries: 300 });
  const tx = await client.getTransaction({ hash });
  const leader = tx.consensus_data?.leader_receipt?.[0] ?? {};
  const facts = {
    label, hash,
    status: tx.statusName ?? "UNKNOWN",
    consensus: tx.result_name ?? tx.resultName ?? "",
    execution: leader.execution_result ?? tx.txExecutionResultName ?? "UNKNOWN",
    result_status: leader.result?.status ?? "",
    result: leader.result?.payload ?? "",
    rotations: tx.rotation_count ?? null,
  };
  if (
    facts.status !== "FINALIZED" ||
    facts.execution !== "SUCCESS" ||
    facts.result_status !== "return" ||
    !["MAJORITY_AGREE", "ACCEPTED"].includes(facts.consensus)
  ) {
    throw new Error(`${label} failed: ${JSON.stringify(facts)}`);
  }
  process.stdout.write(`${label}: verified ${JSON.stringify(facts)}\n`);
  return facts;
}

const initial = await read("get_totals");
const assessmentId = RESUME ? Number(initial.assessments) - 1 : Number(initial.assessments);
if (assessmentId < 1) throw new Error(`Unexpected initial accounting: ${JSON.stringify(initial)}`);
const now = Math.floor(Date.now() / 1000);
const transactions = [];
let assessment = await read("get_assessment", [assessmentId]);
if (!RESUME) {
  if (Number(initial.held) !== 0) throw new Error(`Unexpected initial accounting: ${JSON.stringify(initial)}`);
  transactions.push(await write(issuerClient, "open_conflict_assessment", "open_assessment", [
    "DEMOUSD", 14, issuerPrimary, issuerFallback, issuerId, now + 3600,
  ], BOND));
  assessment = await read("get_assessment", [assessmentId]);
  if (assessment.status !== "OPEN") throw new Error(`Open readback failed: ${JSON.stringify(assessment)}`);
  transactions.push(await write(challengerClient, "challenge_with_conflict", "challenge", [
    assessmentId, conflictPrimary, conflictFallback, conflictId, now + 7200,
  ], BOND));
} else if (assessment.status !== "CHALLENGED" || Number(initial.held) !== Number(BOND * 2n)) {
  throw new Error(`Conflict assessment is not safely resumable: ${JSON.stringify({ assessment, initial })}`);
}
transactions.push(await write(issuerClient, "assess_conflict", "assess", [assessmentId]));
assessment = await read("get_assessment", [assessmentId]);
if (
  assessment.status !== "ASSESSED" ||
  assessment.conflict_resolution !== "ISSUER" ||
  assessment.issuer_authority !== "CANONICAL" ||
  assessment.challenger_authority !== "INDEPENDENT" ||
  assessment.reserve !== "SUFFICIENT" ||
  assessment.scope !== "MATCH" ||
  assessment.exception !== "NO"
) throw new Error(`Authority precedence readback failed: ${JSON.stringify(assessment)}`);
transactions.push(await write(issuerClient, "settle_conflict", "settle", [assessmentId]));
const finalAssessment = await read("get_assessment", [assessmentId]);
const finalTotals = await read("get_totals");
if (finalAssessment.status !== "SETTLED" || Number(finalTotals.held) !== 0) {
  throw new Error(`Final settlement readback failed: ${JSON.stringify({ finalAssessment, finalTotals })}`);
}
process.stdout.write(`CONFLICT_COMPLETE ${JSON.stringify({
  contract: CONTRACT,
  assessment_id: assessmentId,
  issuer: issuer.address,
  challenger: challenger.address,
  transactions,
  final_assessment: finalAssessment,
  final_totals: finalTotals,
}, null, 2)}\n`);
