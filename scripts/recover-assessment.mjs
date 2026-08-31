import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT = process.argv[2];
const assessmentId = Number(process.argv[3]);
if (!/^0x[0-9a-fA-F]{40}$/.test(CONTRACT ?? "") || !Number.isSafeInteger(assessmentId) || assessmentId < 0) {
  throw new Error("Usage: node scripts/recover-assessment.mjs <contract> <assessment-id>");
}
process.stdin.setRawMode?.(true);
process.stdin.resume();
let privateKey = "";
for await (const chunk of process.stdin) {
  for (const character of String(chunk)) {
    if (character === "\r" || character === "\n") {
      if (privateKey) break;
    } else privateKey += character;
  }
  if (privateKey && /[\r\n]/.test(String(chunk))) break;
}
process.stdin.setRawMode?.(false);
const account = createAccount(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
privateKey = "";
const client = createClient({ chain: studionet, account });
const hash = await client.writeContract({ address: CONTRACT, functionName: "recover", args: [assessmentId], value: 0n });
process.stdout.write(`recover: submitted ${hash}\n`);
await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 2000, retries: 300 });
const transaction = await client.getTransaction({ hash });
const assessment = await client.readContract({ address: CONTRACT, functionName: "get_assessment", args: [assessmentId] });
const totals = await client.readContract({ address: CONTRACT, functionName: "get_totals", args: [] });
process.stdout.write(`RECOVERY_RESULT ${JSON.stringify({ hash, transaction, assessment, totals }, null, 2)}\n`);
