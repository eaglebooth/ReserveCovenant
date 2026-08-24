# ReserveCovenant architecture

## Product primitive

ReserveCovenant is a persistent, GEN-backed reserve assessment market. An issuer bonds a versioned reserve claim; an independent challenger bonds counter-evidence. GenLayer validators extract a closed set of reserve facts and the contract deterministically derives the economic state.

This is not a renamed escrow or a one-shot artifact verdict. The persistent object is an assessment epoch linked to evidence provenance, facts, risk state, settlement and a downstream single-use capability.

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

## Deterministic economic mapping

| Risk state | Issuer | Challenger | Capability |
| --- | ---: | ---: | --- |
| HEALTHY | both bonds | 0 | ALLOW_NEW_DEPOSITS |
| WATCH | own bond | own bond | LIMIT_EXPOSURE |
| RESTRICTED | 0 | both bonds | PAUSE_NEW_EXPOSURE |
| UNVERIFIABLE | own bond after recovery | own bond after recovery | none |

No LLM chooses an amount. Consensus only normalizes bounded facts; the contract maps them to fixed value bands.

## Provenance boundary

Evidence packets must use an immutable identifier present in two independent HTTPS gateway URLs. This proves content-address binding and gateway independence. It does not prove that an issuer is legally entitled to a brand or asset. Production integrations should additionally require issuer-signed statements or canonical registry binding.

## Accounting invariant

```text
total_deposited = total_held + total_paid + total_refunded
```

Terminal methods update accounting and state before emitting value transfers. Settlement and capability consumption are single-use.
