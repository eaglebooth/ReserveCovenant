# Digest-bound v1 Studionet record — superseded

Contract: [`0x20CE3EDE40B03625ca27c01052a8EE28829399fC`](https://explorer-studio.genlayer.com/address/0x20CE3EDE40B03625ca27c01052a8EE28829399fC)  
Deployed source commit: [`9a7d32a`](https://github.com/eaglebooth/ReserveCovenant/commit/9a7d32a4dd4940f5fa60627f54bbfd96d4ef96de)  
Local/deployed source SHA-256: `b1e4da99bdea3c29ff9d0823adab6244586c2ca518d96e8393a993d36a41ce5e`  
Exact deployed-source parity: verified `true` through `gen_getContractCode`.

This deployment proved fetched-byte SHA-256/length verification on its normal
lifecycle, but its live conflict path exposed unstable model-selected authority
resolution. It is therefore superseded and must not be submitted as the final
release.

## Verified digest-bound happy path

| Action | Result | Transaction |
| --- | --- | --- |
| Unapproved opener guard | rollback `ISSUER_NOT_APPROVED` | [`0x127f…1e90`](https://explorer-studio.genlayer.com/transactions/0x127f6e68b5d741d6a65cce3745c5e93e6a6446f10d7dea9c82151f870e531e90) |
| Open assessment | ID `0`, `0.01 GEN` | [`0xea41…7bbc`](https://explorer-studio.genlayer.com/transactions/0xea41b956a747bfcb8747ab31a85831f658ec2a72b8d74d3753d8a47153217bbc) |
| Self-challenge guard | rollback `ISSUER_CANNOT_CHALLENGE` | [`0xf420…c7a1`](https://explorer-studio.genlayer.com/transactions/0xf42006f2cfab50ee012a695dadd418f37dc3eb59a4d86d4611b281a51326c7a1) |
| Challenge | `CHALLENGED`, matching `0.01 GEN` | [`0x7ae1…3448`](https://explorer-studio.genlayer.com/transactions/0x7ae14196a3d9f2b18f07858274297e699a06fcb845288fd9e16c39ba5f313448) |
| Early settlement guard | rollback `NOT_SETTLEABLE` | [`0x4fea…c75c`](https://explorer-studio.genlayer.com/transactions/0x4fea1957ca70745451e7d88b7b22fc9c1340782c8827c7f518c177e120c4c75c) |
| Digest-bound consensus | `HEALTHY`, `evidence_integrity=VERIFIED` | [`0x17fc…355b`](https://explorer-studio.genlayer.com/transactions/0x17fccb10d6add451ee0d346e2023fbb55ed96eacd31cb7ccd6c4902e15d5355b) |
| Settlement | `0.02 GEN` paid | [`0xcb0d…ddb2`](https://explorer-studio.genlayer.com/transactions/0xcb0d1f6bcd81b5d37ddfd4ac29e5601a9e8d92be837c51cf5059117b828addb2) |
| Issue capability | ID `0` | [`0xba9e…abed`](https://explorer-studio.genlayer.com/transactions/0xba9ecb9722665a3b295ea1a803b759131a1953d7c96c4271559eea1fc0d6abed) |
| Consume capability | `ALLOW_NEW_DEPOSITS` | [`0xdd37…28cf`](https://explorer-studio.genlayer.com/transactions/0xdd375c9c881c3b93ad023cafbda78e7da8c7f041b8750340d22d80a644df28cf) |
| Replay guard | rollback `CAPABILITY_NOT_ACTIVE` | [`0x0f43…3dd2`](https://explorer-studio.genlayer.com/transactions/0x0f436ecd78f8efb6d0d2a4f4d623405352d25b7559d425d4d4c22ac2f7af3dd2) |

Final assessment `0` readback included issuer digest
`sha256:d9a870…e9a2e`/`200` bytes and challenger digest
`sha256:f74a8e…1296b`/`164` bytes, `evidence_integrity=VERIFIED`, `HEALTHY`,
`SETTLED`.

## Conflict-path finding

Assessment `1` opened and accepted contradictory evidence, but three assess
attempts failed closed before settlement:

| Action | Result | Transaction |
| --- | --- | --- |
| Open conflict assessment | ID `1` | [`0x5999…de6f`](https://explorer-studio.genlayer.com/transactions/0x59992e1990367bbf71cca150287fe07a3c22ef6e2b2f6caa01d991954b1bde6f) |
| Challenge with conflict | `CHALLENGED` | [`0x293d…d802`](https://explorer-studio.genlayer.com/transactions/0x293dfb3d6e5b168d75bab79463aaf4c372994e03d6e13fad2281739a45c6d802) |
| Assess attempt 1 | rollback `INVALID_AUTHORITY_PRECEDENCE` | [`0x98b9…e14c`](https://explorer-studio.genlayer.com/transactions/0x98b9677b636e51251d5a53887f707c59544d84e82fd6696cd138c974cc9ce14c) |
| Assess attempt 2 | `MAJORITY_DISAGREE`, rollback `INVALID_AUTHORITY_PRECEDENCE` | [`0xeeb7…bc2b`](https://explorer-studio.genlayer.com/transactions/0xeeb76607e6d9c5ddd50269fdd4df1bf44524cae16a5a14920cf7e68f93cfbc2b) |
| Assess attempt 3 | rollback `RESOLVED_CONFLICT_INCOMPLETE` | [`0x68b9…f2cf`](https://explorer-studio.genlayer.com/transactions/0x68b93c90f525af17b1d8c0fc2a107e535c0ec5d2728988c3303f817c58b1f2cf) |

Protected state remained `CHALLENGED`; no conflict settlement occurred. `0.02
GEN` remains held until the recorded recovery deadline. The successor source
removes authority-winner selection from the LLM and derives it deterministically
from registry ranks.
