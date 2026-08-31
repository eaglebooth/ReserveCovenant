# ReserveCovenant remediation lifecycle — Studionet

Run date: 2026-08-31  
Contract: [`0x22C9977940A6dB689Ed6e10F613805376eD7030e`](https://explorer-studio.genlayer.com/address/0x22C9977940A6dB689Ed6e10F613805376eD7030e)

Assessment `0` finalized as `HEALTHY` and `SETTLED`. Final accounting was
`0.02 GEN` deposited, `0 GEN` held, `0.02 GEN` paid, and `0 GEN` refunded.
Capability `0` returned `ALLOW_NEW_DEPOSITS`, became `CONSUMED`, and rejected a
replay with `CAPABILITY_NOT_ACTIVE`.

## Happy path

| Action | Result | Transaction |
| --- | --- | --- |
| Open assessment | ID `0`; `0.01 GEN` locked | [`0xae30…33f6`](https://explorer-studio.genlayer.com/transactions/0xae30c028bf999222beed3d55e20ce8ad4baab60b317596976940da7afa0133f6) |
| Challenge | `CHALLENGED`; matching `0.01 GEN` locked | [`0x48b8…88b5`](https://explorer-studio.genlayer.com/transactions/0x48b84ce7c2487cc0c99b9010b297fb550e00f366b5c8f2af8c0cb2b34da288b5) |
| Consensus | `HEALTHY`, `MAJORITY_AGREE` | [`0x392a…32e0`](https://explorer-studio.genlayer.com/transactions/0x392a12bfc5d53968f191dc8a4d6f49eecd82b90a935583ca74c8029042f732e0) |
| Settle | `0.02 GEN` paid | [`0x07b1…1ed1`](https://explorer-studio.genlayer.com/transactions/0x07b10a32db1f3dda31dfca4ecc606c646bd7800159282532e129b84a3d741ed1) |
| Issue capability | ID `0` | [`0xbb7f…eda6`](https://explorer-studio.genlayer.com/transactions/0xbb7f7bb6bd343aea2fd032df34d302929e923caafda7027131c3259d1045eda6) |
| Consume capability | `ALLOW_NEW_DEPOSITS` | [`0x7288…1e4a`](https://explorer-studio.genlayer.com/transactions/0x7288c94339b956f1ce5a92ff6da3d21847a8863d57893b59395bb565f5311e4a) |

## Failure paths

All finalized with `MAJORITY_AGREE` and rolled back with the expected error.

| Guard | Rollback | Transaction |
| --- | --- | --- |
| Unapproved opener | `ISSUER_NOT_APPROVED` | [`0xa567…c4c5`](https://explorer-studio.genlayer.com/transactions/0xa5671b7482274771f9c8d04020b2829c20b242739e2e97857fa8deefcf12c4c5) |
| Issuer self-challenge | `ISSUER_CANNOT_CHALLENGE` | [`0xa93f…c670`](https://explorer-studio.genlayer.com/transactions/0xa93faca86f268a53cc24113738389ecd95ab188f84598a8d1c4684694869c670) |
| Early settlement | `NOT_SETTLEABLE` | [`0xb4fe…ae33`](https://explorer-studio.genlayer.com/transactions/0xb4febeab6d092026c399f15cb4c0586d9dd2500510fb00675c0a53490705ae33) |
| Capability replay | `CAPABILITY_NOT_ACTIVE` | [`0x495b…3d76`](https://explorer-studio.genlayer.com/transactions/0x495b1830cbf203cb98db25a53d245f5761a8a5e383621c135cb96d9517423d76) |

## Immutable test resources

- [Issuer primary](https://raw.githubusercontent.com/eaglebooth/ReserveCovenant/fb7514d1961defa92187304026b7a3fc2fb2d30d/samples/issuer-attestation.json)
- [Issuer fallback](https://github.com/eaglebooth/ReserveCovenant/blob/fb7514d1961defa92187304026b7a3fc2fb2d30d/samples/issuer-attestation.json)
- [Challenger primary](https://raw.githubusercontent.com/eaglebooth/ReserveCovenant/fb7514d1961defa92187304026b7a3fc2fb2d30d/samples/challenger-observation.json)
- [Challenger fallback](https://github.com/eaglebooth/ReserveCovenant/blob/fb7514d1961defa92187304026b7a3fc2fb2d30d/samples/challenger-observation.json)

## Live authority-conflict path

Assessment `1` compared the approved `CANONICAL` issuer attestation with an
approved contradictory `INDEPENDENT` observation. The first assessment attempt
ended `MAJORITY_DISAGREE` after three rotations and left the assessment
`CHALLENGED`, demonstrating fail-closed consensus. A safe retry reached
`MAJORITY_AGREE`; authoritative readback then showed
`conflict_resolution: ISSUER`, the issuer facts, and `HEALTHY`.

| Action | Result | Transaction |
| --- | --- | --- |
| Open conflict assessment | ID `1`; `0.01 GEN` locked | [`0x0ac0…976a`](https://explorer-studio.genlayer.com/transactions/0x0ac098892e3981005c2526f3d7a787c8ed39dca8c212f50d4acf8047f87c976a) |
| Submit contradictory counter-evidence | `CHALLENGED`; matching `0.01 GEN` locked | [`0x6312…40a8`](https://explorer-studio.genlayer.com/transactions/0x6312e006653700951286d90aa61d70238f94e1cbb5ff9115de4ed6904f4140a8) |
| First consensus attempt | `MAJORITY_DISAGREE`; no state transition | [`0x200b…a124`](https://explorer-studio.genlayer.com/transactions/0x200b25f9afc2a2a8dd94f5cf1fad9dfa0dc015be2d010481de41b2b0ab5ca124) |
| Consensus retry | `MAJORITY_AGREE`; `ISSUER` precedence | [`0xaf13…7291`](https://explorer-studio.genlayer.com/transactions/0xaf1368b38ad1f2311400911122b32b45a2412b92f2d4e3d7e24372321bcf7291) |
| Settle conflict | `HEALTHY`; `0.02 GEN` paid | [`0xe1f9…bb19`](https://explorer-studio.genlayer.com/transactions/0xe1f926dcca580bf3e1759b488aedc572cfe9124d2056aa28f47f892376b9bb19) |

Final conflict assessment readback:

```json
{"asset":"DEMOUSD","challenger_authority":"INDEPENDENT","conflict_resolution":"ISSUER","epoch":14,"exception":"NO","freshness":"CURRENT","issuer_authority":"CANONICAL","issuer_paid":20000000000000000,"reserve":"SUFFICIENT","risk":"HEALTHY","scope":"MATCH","status":"SETTLED"}
```

Final contract accounting after both lifecycles: `2` assessments, `0.04 GEN`
deposited, `0 GEN` held, `0.04 GEN` paid, and `0 GEN` refunded.

Conflict fixture:

- [Contradictory independent observation](https://raw.githubusercontent.com/eaglebooth/ReserveCovenant/ef3aace45d475526bbb62bc6e63ae040c368367e/samples/challenger-conflict.json)
