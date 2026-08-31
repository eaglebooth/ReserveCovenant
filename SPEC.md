# ReserveCovenant architecture

## Product primitive

ReserveCovenant is a persistent, GEN-backed reserve assessment market. A registry-approved issuer bonds a versioned reserve claim; an independent challenger bonds pre-approved counter-evidence. GenLayer validators extract a closed set of reserve facts and the contract deterministically derives the economic state.

This is not a renamed escrow or a one-shot artifact verdict. The persistent object is an assessment epoch linked to evidence provenance, facts, risk state, settlement and a downstream single-use capability.

## Authority registry

The deployment owner records two bindings before an assessment can hold funds:

```text
issuer wallet + asset
immutable evidence ID + exact primary/fallback URLs + asset + epoch + authority class
```

Authority precedence is deterministic:

```text
CANONICAL > REGULATED > INDEPENDENT
```

Gateway independence remains an availability control. A gateway hostname is never
treated as evidence authority.

## Lifecycle

```text
OPEN (issuer GEN held)
  -> CHALLENGED (matching challenger GEN held)
  -> ASSESSED (HEALTHY | WATCH | RESTRICTED)
  -> SETTLED (real GEN transfers)
  -> capability ACTIVE -> CONSUMED

OPEN after challenge deadline -> RECOVERED
CHALLENGED -> UNVERIFIABLE -> RECOVERY after deadline -> RECOVERED
```

When documents conflict, validators select `ISSUER` or `CHALLENGER` only when
that side has strictly higher registry-approved authority. Final facts must be
grounded in the selected evidence. Equal-rank conflicts produce `UNRESOLVED`;
only this tie reaches bounded recovery. Contradictory precedence output rolls
back without changing assessment state.

## Deterministic economic mapping

| Risk state | Issuer | Challenger | Capability |
| --- | ---: | ---: | --- |
| HEALTHY | both bonds | 0 | ALLOW_NEW_DEPOSITS |
| WATCH | own bond | own bond | LIMIT_EXPOSURE |
| RESTRICTED | 0 | both bonds | PAUSE_NEW_EXPOSURE |
| UNVERIFIABLE | own bond after recovery | own bond after recovery | none |

No LLM chooses an amount. Consensus only normalizes bounded facts; the contract maps them to fixed value bands.

## Provenance boundary

Evidence packets must use a registry-approved immutable identifier present in two
independent HTTPS gateway URLs. Approval binds the ID and both exact URLs to an
asset, epoch and authority class; issuer approval separately binds the opening
wallet to the asset. A caller cannot embed an approved ID inside a different
attacker-controlled URL and inherit its authority.
This creates an explicit on-chain trust root but does not prove that the registry
owner has off-chain legal authority. Production governance must document how that
owner verifies canonical issuers and reserve publications.

## Frontend transaction identity

`open_assessment` returns its transaction-specific `assessment_id`. The client
decodes that value from the successful leader receipt, selects it and reads back
that exact record. It never infers identity from `assessment_count` or silently
continues with the initial UI value `0`. Missing return data blocks continuation
and retains the transaction hash for reconciliation. All challenge/assessment/
settlement actions stay disabled until that transaction-specific ID, or a manually
loaded ID, passes authoritative readback.

## Accounting invariant

```text
total_deposited = total_held + total_paid + total_refunded
```

Terminal methods update accounting and state before emitting value transfers. Settlement and capability consumption are single-use.
