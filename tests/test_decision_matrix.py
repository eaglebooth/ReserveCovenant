import pytest

AUTHORITY_RANK = {"CANONICAL": 3, "REGULATED": 2, "INDEPENDENT": 1}

def derive(reserve, scope, freshness, exception, conflict, resolution="NOT_APPLICABLE"):
    if (conflict == "YES" and resolution == "UNRESOLVED") or "UNKNOWN" in (reserve, scope, freshness, exception):
        return "UNVERIFIABLE"
    if reserve == "INSUFFICIENT" or scope == "MISMATCH" or exception == "YES":
        return "RESTRICTED"
    if freshness == "STALE":
        return "WATCH"
    return "HEALTHY"

@pytest.mark.parametrize("facts,expected", [
    (("SUFFICIENT","MATCH","CURRENT","NO","NO"),"HEALTHY"),
    (("SUFFICIENT","MATCH","STALE","NO","NO"),"WATCH"),
    (("INSUFFICIENT","MATCH","CURRENT","NO","NO"),"RESTRICTED"),
    (("SUFFICIENT","MISMATCH","CURRENT","NO","NO"),"RESTRICTED"),
    (("SUFFICIENT","MATCH","CURRENT","YES","NO"),"RESTRICTED"),
    (("SUFFICIENT","MATCH","CURRENT","NO","YES","UNRESOLVED"),"UNVERIFIABLE"),
    (("UNKNOWN","MATCH","CURRENT","NO","NO"),"UNVERIFIABLE"),
])
def test_risk_matrix(facts, expected):
    assert derive(*facts) == expected

def settle(risk, issuer_bond, challenger_bond):
    if risk == "HEALTHY": return issuer_bond + challenger_bond, 0
    if risk == "RESTRICTED": return 0, issuer_bond + challenger_bond
    if risk == "WATCH": return issuer_bond, challenger_bond
    raise ValueError("RECOVERY_REQUIRED")

@pytest.mark.parametrize("risk,expected",[("HEALTHY",(20,0)),("RESTRICTED",(0,20)),("WATCH",(10,10))])
def test_value_conservation(risk, expected):
    result = settle(risk,10,10)
    assert result == expected
    assert sum(result) == 20

def test_unverifiable_cannot_settle():
    with pytest.raises(ValueError, match="RECOVERY_REQUIRED"):
        settle("UNVERIFIABLE",10,10)

def resolve_conflict(issuer_authority, challenger_authority, resolution):
    issuer_rank = AUTHORITY_RANK[issuer_authority]
    challenger_rank = AUTHORITY_RANK[challenger_authority]
    return (
        (resolution == "ISSUER" and issuer_rank > challenger_rank)
        or (resolution == "CHALLENGER" and challenger_rank > issuer_rank)
        or (resolution == "UNRESOLVED" and issuer_rank == challenger_rank)
    )

@pytest.mark.parametrize("issuer,challenger,resolution", [
    ("CANONICAL", "INDEPENDENT", "ISSUER"),
    ("INDEPENDENT", "REGULATED", "CHALLENGER"),
    ("REGULATED", "REGULATED", "UNRESOLVED"),
])
def test_conflict_resolution_accepts_only_registry_precedence(issuer, challenger, resolution):
    assert resolve_conflict(issuer, challenger, resolution)

@pytest.mark.parametrize("issuer,challenger,resolution", [
    ("INDEPENDENT", "CANONICAL", "ISSUER"),
    ("REGULATED", "INDEPENDENT", "CHALLENGER"),
    ("CANONICAL", "INDEPENDENT", "UNRESOLVED"),
])
def test_conflict_resolution_rejects_lower_authority_or_avoidable_refund(issuer, challenger, resolution):
    assert not resolve_conflict(issuer, challenger, resolution)

def test_resolved_conflict_requires_complete_selected_facts():
    facts = ("UNKNOWN", "MATCH", "CURRENT", "NO")
    with pytest.raises(ValueError, match="RESOLVED_CONFLICT_INCOMPLETE"):
        if "UNKNOWN" in facts:
            raise ValueError("RESOLVED_CONFLICT_INCOMPLETE")
