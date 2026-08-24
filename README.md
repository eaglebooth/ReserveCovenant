# ReserveCovenant

ReserveCovenant is a GenLayer dApp that turns public reserve attestations into GEN-backed, protocol-consumable risk states.

## Studionet deployment

- Contract: `0xc9d2EbEcAc66eCe11f5BF7F7e97A1E0925982312`
- Explorer: https://explorer-studio.genlayer.com/address/0xc9d2EbEcAc66eCe11f5BF7F7e97A1E0925982312

## Why GenLayer

Reserve documents mix numbers with audit scope, custody qualifications, freshness language and material exceptions. Validators independently retrieve issuer and challenger evidence and agree on five bounded semantic facts. The contract—not the model—derives `HEALTHY`, `WATCH`, `RESTRICTED`, or `UNVERIFIABLE`, settles real GEN and issues a single-use protocol capability.

## Full product flow

```text
Fund epoch -> challenge evidence -> GenLayer consensus -> settle GEN -> consume capability
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

- `open_assessment(...)` — payable issuer bond and immutable evidence lock
- `challenge(...)` — payable matching bond and counter-evidence lock
- `assess(id)` — multi-source semantic consensus
- `settle(id)` — deterministic real GEN settlement
- `recover(id)` — deadline-bounded, non-vetoable refund path
- `issue_capability(id, consumer)` / `consume_capability(...)` — downstream protocol effect
- `get_assessment`, `get_capability`, `get_totals` — frontend-readable state

See [SPEC.md](SPEC.md) for state-machine, provenance and economic invariants.
