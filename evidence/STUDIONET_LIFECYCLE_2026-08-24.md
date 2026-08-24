# ReserveCovenant Studionet lifecycle evidence

Date: 2026-08-24  
Contract: `0xc9d2EbEcAc66eCe11f5BF7F7e97A1E0925982312`  
Explorer: https://explorer-studio.genlayer.com/address/0xc9d2EbEcAc66eCe11f5BF7F7e97A1E0925982312

This record covers real GEN custody, semantic consensus, deterministic settlement, capability consumption, contract-level failures and bounded recovery. Explorer is the canonical transaction source.

## Immutable public evidence

Issuer attestation:

- CID `QmNQCnm19DHWTzwT3MiRvRV154PSxWM5GasmSWvsS9sCmK`
- https://ipfs.io/ipfs/QmNQCnm19DHWTzwT3MiRvRV154PSxWM5GasmSWvsS9sCmK
- https://gateway.pinata.cloud/ipfs/QmNQCnm19DHWTzwT3MiRvRV154PSxWM5GasmSWvsS9sCmK
- [`samples/issuer-attestation.json`](../samples/issuer-attestation.json)

Independent challenger observation:

- CID `QmWpBd3Spmb6ee7scevRWJQBUvRQfsueTcMD4KVKCLTJvz`
- https://ipfs.io/ipfs/QmWpBd3Spmb6ee7scevRWJQBUvRQfsueTcMD4KVKCLTJvz
- https://gateway.pinata.cloud/ipfs/QmWpBd3Spmb6ee7scevRWJQBUvRQfsueTcMD4KVKCLTJvz
- [`samples/challenger-observation.json`](../samples/challenger-observation.json)

Each packet is bound to its CID and two independent gateway hosts. Validators normalize evidence facts; deterministic contract code maps them to risk and settlement.

## Assessment 0 — consensus and payout

| Stage | Transaction | Verified result |
|---|---|---|
| Open with `0.01 GEN` | `0x55e1a6d415503aa0231d0f625f16b9be8939a8ffd38d734b555ea3a97131d2fa` | Assessment `0`; issuer CID locked |
| Challenge with `0.01 GEN` | `0x32cfffa817972411f4735a0bc5318d8f58c17a37c0a6588c9794ed9673b884ab` | Counter-CID locked; custody `0.02 GEN` |
| Semantic assessment | Assessment `0` in Explorer | `SUFFICIENT`, `MATCH`, `CURRENT`, `NO` -> `HEALTHY` |
| Settle | `0x9a45878a2c22ee726d916df7bbcc8710cfb6ffcb66daf8a37e709694b5680141` | Issuer receives `0.02 GEN`; `SETTLED` |

```json
{"asset":"DEMOUSD","challenger":"0x2da5393d7bbb9a037dc3abb56dbbc5c150fc843f","challenger_paid":0,"epoch":1,"exception":"NO","freshness":"CURRENT","issuer":"0xeb57bc7125fa60d7482ce12058397369ab3581f8","issuer_paid":20000000000000000,"reserve":"SUFFICIENT","risk":"HEALTHY","scope":"MATCH","status":"SETTLED"}
```

## Capability and replay protection

| Check | Transaction | Contract result |
|---|---|---|
| Non-issuer issues | `0xd7e0de3b5954ca5cf8b7e7f6c9bf5ec4f2aae5f2319174bbe7f61254b410164d` | Rollback `ISSUER_ONLY` |
| Issuer issues | `0x2f5c130b9ab4ba4056501df292d2c6c7e25316686a64fc7e1ba630ab19d2a508` | Capability `0`, `ALLOW_NEW_DEPOSITS` |
| Adapter consumes | `0x437e819f9bb0a69d18991e431691b765a8009176f8af4f0b017b501fc8a160f7` | `ACTIVE` -> `CONSUMED` |
| Adapter replays | `0x6e77dfbe56ad6e2f853a6844c428ce836a933ff7759b6e5995cd234e6c5f8fc0` | Rollback `CAPABILITY_NOT_ACTIVE` |

```json
{"action":"ALLOW_NEW_DEPOSITS","assessment_id":0,"consumer":"0x2da5393d7bbb9a037dc3abb56dbbc5c150fc843f","status":"CONSUMED"}
```

The installed CLI inferred a bare `0x...` string as an address. The successful test preserved the ABI parameter as `str`; the browser SDK passes this field as a string directly.

## Assessment 1 — bounded recovery

| Stage | Transaction | Verified result |
|---|---|---|
| Open with `0.005 GEN` | `0xcd0bc91c721cc5f494659a8680e6acfaf1f12b3b4c912a022b1984de1fb27b15` | State `OPEN`; held `0.005 GEN` |
| Recover too early | `0x42e44e69924e9882da90daf2d7363a7fd8a29918a13ad1ce7f9771dd61cb1095` | Rollback `RECOVERY_NOT_DUE`; state/funds unchanged |
| Recover after deadline | `0x8cfc3d89706368cdc0cc07d2f9cc5c80d3bd155b3abd2c42d90746cf422727d9` | `NO_CHALLENGE_REFUND`; issuer receives `0.005 GEN` |

Final state: `RECOVERED`, risk `NO_CHALLENGE`, `issuer_paid = 5000000000000000`.

## Conservation accounting

```json
{"assessments":2,"capabilities":1,"deposited":25000000000000000,"held":0,"paid":20000000000000000,"refunded":5000000000000000}
```

```text
deposited = held + paid + refunded
0.025 GEN = 0 GEN + 0.020 GEN + 0.005 GEN
```

No GEN remains stranded.

## Local release verification

- Python AST parse succeeds.
- `18` contract/static decision tests pass.
- ESLint passes.
- Next.js production build succeeds for `/` and `/terminal`.
- The frontend recursively detects `rollback` / `contract_error` payloads instead of treating acceptance/finalization alone as business success.
