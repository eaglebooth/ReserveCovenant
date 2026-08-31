# Deterministic-precedence Studionet verification — final release

Contract: [`0x174D129D3970d2C27B2d56BB7753A7DeA0A6cFbf`](https://explorer-studio.genlayer.com/address/0x174D129D3970d2C27B2d56BB7753A7DeA0A6cFbf)  
Deployed source commit: [`193e54a`](https://github.com/eaglebooth/ReserveCovenant/commit/193e54afaeb31c81d055a32ce7edc873538bc155)  
Local/deployed source SHA-256: `a70101fec2519097b453dfbf0fe64b00d6c669a6b0296e8b1c8c590021f649a0`  
Exact deployed-source parity: verified `true` through `gen_getContractCode`.

This record reports finalized Studionet results only. The contract authenticates
each approved evidence document by exact URL, SHA-256 digest and byte length. It
does **not** claim that those documents authenticate a complete Git repository
tree or software snapshot.

## Approved evidence

All lifecycle evidence is pinned to commit `193e54afaeb31c81d055a32ce7edc873538bc155`.

| Evidence | Authority | SHA-256 | Bytes |
| --- | --- | --- | ---: |
| `issuer-attestation.json` | `CANONICAL` | `d9a8701cbbb2ede21bb694901cb8de99838dd10ffeea65f1a8f92b93b2ee9a2e` | 200 |
| `challenger-observation.json` | `INDEPENDENT` | `f74a8eb5c2e4cbbcf58fb4e425b964c73874fa2b853e1e12ba6f841d4041296b` | 164 |
| `challenger-conflict.json` | `INDEPENDENT` | `b2231456dc6bcdc2ba613ac08c9f347f0a06009055c735d15b06c45719f9557c` | 358 |

## Happy path and failure guards

| Action | Finalized result | Transaction |
| --- | --- | --- |
| Unapproved issuer guard | rollback `ISSUER_NOT_APPROVED` | [`0x49da…3d1c`](https://explorer-studio.genlayer.com/transactions/0x49da3b021b06f5b6aa60b4da276e178a74dc97bde9641cd5b996988e37c73d1c) |
| Open assessment | returned assessment ID `0` | [`0xd7a6…9dfa`](https://explorer-studio.genlayer.com/transactions/0xd7a62c72dcf48eee45e875428a60146ef29bf62e2b1c03c9cce7ae49f1739dfa) |
| Issuer self-challenge guard | rollback `ISSUER_CANNOT_CHALLENGE` | [`0x75af…cb02`](https://explorer-studio.genlayer.com/transactions/0x75af4491ca1177d4442aa08d1158243e208a1c326059aadf4db288c69e0bcb02) |
| Challenge | `CHALLENGED` | [`0x07e9…5f5f`](https://explorer-studio.genlayer.com/transactions/0x07e952990b700da73dc057774ff02d47a750e0a84324eef5fb48eff3691c5f5f) |
| Early settlement guard | rollback `NOT_SETTLEABLE` | [`0x3f91…04ee`](https://explorer-studio.genlayer.com/transactions/0x3f91120736b1bedd4e4ba1bb5e7c97a8b1bcb796be605ebed330f781bd9304ee) |
| AI assessment | `HEALTHY`, integrity `VERIFIED` | [`0x0050…d748`](https://explorer-studio.genlayer.com/transactions/0x0050e631cdc0fbd1e94c1cc65fa70ab387ec25fb2c58f9c2ade9eb006e8ad748) |
| Settlement | `HEALTHY`, `SETTLED` | [`0x04f4…d87f`](https://explorer-studio.genlayer.com/transactions/0x04f4874f21787d8d1d46495b0c625b744ec095fcdad003e3096e901d6189d87f) |
| Issue capability | returned capability ID `0` | [`0xf37d…53e0`](https://explorer-studio.genlayer.com/transactions/0xf37dd42c056cdd0d1e86b95dbb4c27c842981212c8a977b09943384f9ce453e0) |
| Consume capability | `ALLOW_NEW_DEPOSITS` | [`0x858d…43a8`](https://explorer-studio.genlayer.com/transactions/0x858d94522c4522255841103af2b6ee6d4b0316f4d949082104a69e44211643a8) |
| Capability replay guard | rollback `CAPABILITY_NOT_ACTIVE` | [`0x0f98…70b1`](https://explorer-studio.genlayer.com/transactions/0x0f985ab41619e46c3038a275794915dfb1478265fa41c58c6cf1e66b3cd970b1) |

Final assessment `0` readback: `evidence_integrity=VERIFIED`, issuer
`CANONICAL`, challenger `INDEPENDENT`, `reserve=SUFFICIENT`, `scope=MATCH`,
`risk=HEALTHY`, `status=SETTLED`. The capability was `CONSUMED` and replay was
rejected. Totals after this path were one assessment, one capability, `0.02 GEN`
deposited/paid and `0 GEN` held.

## Live conflict path

The contradictory challenger document was accepted because it was pre-approved
with its exact digest and length. The model classified the evidence; the contract
then applied the deterministic registry order `CANONICAL > REGULATED >
INDEPENDENT`.

| Action | Finalized result | Transaction |
| --- | --- | --- |
| Open conflict assessment | returned assessment ID `1` | [`0x5b31…1d29`](https://explorer-studio.genlayer.com/transactions/0x5b312e0c6996f38f01f5cbf672c5b650225094b260abe014abb6480662141d29) |
| Challenge with contradictory evidence | `CHALLENGED` | [`0x3a16…b9ab`](https://explorer-studio.genlayer.com/transactions/0x3a1606869ceb6b491803dc94b6d16e890c95efec083e5d6edfac6ebab67ab9ab) |
| AI assessment + deterministic precedence | `HEALTHY`, integrity `VERIFIED`, resolution `ISSUER` | [`0x3035…b6b7`](https://explorer-studio.genlayer.com/transactions/0x3035050ec3989ea6fc9ae0b516220892fee2c625f853c057b0e4e3667fa0b6b7) |
| Settlement | `HEALTHY`, `SETTLED` | [`0x1e4e…94e4`](https://explorer-studio.genlayer.com/transactions/0x1e4ea48af29abf57686436a213a333939adc23eb0218b942331a50f033c594e4) |

Final assessment `1` readback: `evidence_integrity=VERIFIED`, issuer authority
`CANONICAL`, challenger authority `INDEPENDENT`,
`conflict_resolution=ISSUER`, `reserve=SUFFICIENT`, `scope=MATCH`,
`exception=NO`, `risk=HEALTHY`, `status=SETTLED`.

Final contract totals after both paths: two assessments, one capability,
`0.04 GEN` deposited, `0.04 GEN` paid, `0 GEN` held and `0 GEN` refunded.

## Reproduction

The exact runners are `scripts/run-remediation-lifecycle.mjs` and
`scripts/run-conflict-lifecycle.mjs`. They decode returned IDs from finalized
transaction results and verify final contract readback; they do not default IDs
to zero. Local contract, receipt-decoding, frontend lint/build and GenVM lint
commands are documented in `Genlayer contract.md`.
