import pytest
import hashlib

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

def resolve_conflict(issuer_authority, challenger_authority, conflict):
    issuer_rank = AUTHORITY_RANK[issuer_authority]
    challenger_rank = AUTHORITY_RANK[challenger_authority]
    if conflict == "NO": return "NOT_APPLICABLE"
    if issuer_rank > challenger_rank: return "ISSUER"
    if challenger_rank > issuer_rank: return "CHALLENGER"
    return "UNRESOLVED"

@pytest.mark.parametrize("issuer,challenger,resolution", [
    ("CANONICAL", "INDEPENDENT", "ISSUER"),
    ("INDEPENDENT", "REGULATED", "CHALLENGER"),
    ("REGULATED", "REGULATED", "UNRESOLVED"),
])
def test_conflict_resolution_accepts_only_registry_precedence(issuer, challenger, resolution):
    assert resolve_conflict(issuer, challenger, "YES") == resolution

def test_no_conflict_is_not_applicable_regardless_of_rank():
    assert resolve_conflict("CANONICAL", "INDEPENDENT", "NO") == "NOT_APPLICABLE"

def test_incomplete_selected_facts_fail_closed_to_unverifiable():
    assert derive("UNKNOWN", "MATCH", "CURRENT", "NO", "YES", "ISSUER") == "UNVERIFIABLE"

def verify_commitment(body: bytes, digest: str, byte_length: int):
    if len(body) != byte_length:
        return "BYTE_LENGTH_MISMATCH"
    actual = "sha256:" + hashlib.sha256(body).hexdigest()
    return "VERIFIED" if actual == digest.lower() else "DIGEST_MISMATCH"

def test_exact_fetched_bytes_match_digest_and_length():
    body = b'{"asset":"DEMOUSD","reserve":"sufficient"}'
    digest = "sha256:" + hashlib.sha256(body).hexdigest()
    assert verify_commitment(body, digest, len(body)) == "VERIFIED"

def test_changed_fetched_bytes_fail_digest_binding():
    committed = b'{"asset":"DEMOUSD","reserve":"sufficient"}'
    changed = b'{"asset":"DEMOUSD","reserve":"insufficient"}'
    digest = "sha256:" + hashlib.sha256(committed).hexdigest()
    assert verify_commitment(changed, digest, len(changed)) == "DIGEST_MISMATCH"

def test_truncated_fetched_bytes_fail_length_binding():
    body = b'{"asset":"DEMOUSD","reserve":"sufficient"}'
    digest = "sha256:" + hashlib.sha256(body).hexdigest()
    assert verify_commitment(body[:-1], digest, len(body)) == "BYTE_LENGTH_MISMATCH"

def derive_with_integrity(integrity, reserve, scope, freshness, exception, conflict, resolution):
    if integrity == "FAILED":
        if (reserve, scope, freshness, exception, conflict, resolution) != (
            "UNKNOWN", "UNKNOWN", "UNKNOWN", "UNKNOWN", "YES", "UNRESOLVED"
        ):
            raise ValueError("INVALID_FAILED_EVIDENCE_RESULT")
        return "UNVERIFIABLE"
    return derive(reserve, scope, freshness, exception, conflict, resolution)

def test_digest_failure_enters_recovery_even_when_authority_ranks_differ():
    assert derive_with_integrity(
        "FAILED", "UNKNOWN", "UNKNOWN", "UNKNOWN", "UNKNOWN", "YES", "UNRESOLVED"
    ) == "UNVERIFIABLE"

def test_failed_integrity_cannot_carry_favorable_facts():
    with pytest.raises(ValueError, match="INVALID_FAILED_EVIDENCE_RESULT"):
        derive_with_integrity("FAILED", "SUFFICIENT", "MATCH", "CURRENT", "NO", "NO", "NOT_APPLICABLE")
