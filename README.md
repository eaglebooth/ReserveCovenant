# ReserveCovenant

ReserveCovenant is a GenLayer dApp that turns public reserve attestations into GEN-backed, protocol-consumable risk states.

## Studionet deployment

- Remediation contract: `0x22C9977940A6dB689Ed6e10F613805376eD7030e`
- Explorer: https://explorer-studio.genlayer.com/address/0x22C9977940A6dB689Ed6e10F613805376eD7030e
- Live app: https://reserve-covenant.vercel.app

The remediation address has completed happy-path and failure-path Studionet
verification. See [`STUDIONET_REMEDIATION_2026-08-31.md`](STUDIONET_REMEDIATION_2026-08-31.md)
for transaction links, immutable sources, GEN accounting and rollback guards.

## Why GenLayer

Reserve documents mix numbers with audit scope, custody qualifications, freshness language and material exceptions. Validators independently retrieve issuer and challenger evidence and agree on five bounded semantic facts. The contract—not the model—derives `HEALTHY`, `WATCH`, `RESTRICTED`, or `UNVERIFIABLE`, settles real GEN and issues a single-use protocol capability.

## Full product flow

```text
registry owner approves issuer + versioned evidence
-> issuer funds epoch
-> challenger locks approved counter-evidence
-> GenLayer consensus applies authority precedence
-> settle GEN -> consume capability
```

The Next.js frontend performs real `genlayer-js` reads and writes, connects an injected wallet, displays the active contract and provides a direct Explorer link. Every write waits for acceptance and the UI can re-read the ledger instead of treating transaction submission as business success.

## Local development

```bash
npm install
npm run dev
python -m pytest -q
```

Copy `.env.example` to `.env.local` after a contract is deployed. Until then the application runs locally in an honest pre-deployment state and does not simulate contract writes.

## Contract methods

- `approve_issuer(...)` — registry owner binds one wallet to an asset
- `approve_evidence(...)` — registry owner binds an immutable ID and exact gateway URLs to asset, epoch and authority class
- `open_assessment(...)` — payable issuer bond and immutable evidence lock
- `challenge(...)` — payable matching bond and counter-evidence lock
- `assess(id)` — multi-source semantic consensus
- `settle(id)` — deterministic real GEN settlement
- `recover(id)` — deadline-bounded, non-vetoable refund path
- `issue_capability(id, consumer)` / `consume_capability(...)` — downstream protocol effect
- `get_assessment`, `get_capability`, `get_totals` — frontend-readable state

See [SPEC.md](SPEC.md) for state-machine, provenance and economic invariants.

## Authority and conflict safety

- Only a registry-approved issuer can open an assessment for an asset.
- Issuer and challenger evidence IDs must be approved for the exact asset and
  epoch as `CANONICAL`, `REGULATED`, or `INDEPENDENT`; runtime URLs must exactly
  match the approved primary and fallback sources.
- Conflicting attestations do not automatically enter refund recovery. Validators
  must select the strictly higher approved authority. Only an equal-authority tie
  remains `UNVERIFIABLE` and reaches bounded recovery.
- The frontend decodes the `assessment_id` returned by `open_assessment`, selects
  it, and verifies that exact record before any subsequent challenge action. If
  decoding/readback fails, all lifecycle writes remain disabled.

## Historical runtime evidence

The previous contract's Studionet lifecycle—including public IPFS evidence,
semantic outcome, `0.02 GEN` payout, capability replay rejection,
early-recovery rejection, bounded `0.005 GEN` refund and final conservation
accounting—is recorded in
[evidence/STUDIONET_LIFECYCLE_2026-08-24.md](evidence/STUDIONET_LIFECYCLE_2026-08-24.md).
It is not release evidence for the remediation address.
