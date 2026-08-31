import { readFile } from "node:fs/promises";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

async function readSecret() {
  process.stdin.setRawMode?.(true);
  process.stdin.resume();
  let value = "";
  for await (const chunk of process.stdin) {
    for (const character of String(chunk)) {
      if (character === "\r" || character === "\n") {
        if (value) {
          process.stdin.setRawMode?.(false);
          return value.trim();
        }
      } else value += character;
    }
  }
  process.stdin.setRawMode?.(false);
  return value.trim();
}

let privateKey = await readSecret();
if (!privateKey) throw new Error("Pass deployer test key through stdin");
const account = createAccount(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
privateKey = "";
const client = createClient({ chain: studionet, account });
const code = await readFile(new URL("../contracts/ReserveCovenant.py", import.meta.url), "utf8");
const hash = await client.deployContract({ code, args: [] });
process.stdout.write(`deploy: submitted ${hash}\n`);
const receipt = await client.waitForTransactionReceipt({
  hash,
  status: TransactionStatus.FINALIZED,
  interval: 2000,
  retries: 300,
});
const transaction = await client.getTransaction({ hash });
process.stdout.write(`DEPLOY_COMPLETE ${JSON.stringify({
  deployer: account.address,
  hash,
  receipt,
  transaction,
}, null, 2)}\n`);
