import pytest

def derive(reserve, scope, freshness, exception, conflict):
    if conflict == "YES" or "UNKNOWN" in (reserve, scope, freshness, exception):
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
    (("SUFFICIENT","MATCH","CURRENT","NO","YES"),"UNVERIFIABLE"),
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
