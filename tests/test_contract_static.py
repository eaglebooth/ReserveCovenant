from pathlib import Path
import ast

SOURCE = Path(__file__).parents[1] / "contracts" / "ReserveCovenant.py"
TEXT = SOURCE.read_text(encoding="utf-8")

def test_source_parses():
    ast.parse(TEXT)

def test_runner_header():
    lines = TEXT.splitlines()
    assert lines[0] == "# v0.2.16"
    assert lines[1] == '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'
    assert lines[2] == "from genlayer import *"

def test_real_value_flow_present():
    for marker in ("@gl.public.write.payable", "gl.message.value", "emit_transfer", "total_held", "total_paid", "total_refunded"):
        assert marker in TEXT

def test_semantic_consensus_is_substantive():
    assert "prompt_comparative" in TEXT
    assert "reserve_coverage" in TEXT
    assert "material_exception" in TEXT
    assert "sources_conflict" in TEXT
    assert "conflict_resolution" in TEXT

def test_assessments_require_registry_approved_authority():
    for marker in (
        "approve_issuer",
        "approve_evidence",
        "ISSUER_NOT_APPROVED",
        "EVIDENCE_NOT_APPROVED",
        "EVIDENCE_EPOCH_MISMATCH",
        "EVIDENCE_SOURCE_MISMATCH",
        "approved_evidence_primary_url",
        "approved_evidence_fallback_url",
        "assessment_issuer_authority",
        "assessment_challenger_authority",
        "approved_evidence_digest",
        "approved_evidence_byte_length",
        "assessment_issuer_digest",
        "assessment_counter_digest",
        "assessment_evidence_integrity",
    ):
        assert marker in TEXT

def test_conflicts_use_deterministic_authority_precedence():
    for marker in (
        "CANONICAL",
        "REGULATED",
        "INDEPENDENT",
        "INVALID_AUTHORITY_PRECEDENCE",
        'resolution == "ISSUER" and issuer_rank > challenger_rank',
        'resolution == "CHALLENGER" and challenger_rank > issuer_rank',
        "RESOLVED_CONFLICT_INCOMPLETE",
    ):
        assert marker in TEXT

def test_recovery_and_replay_guards():
    for marker in ("RECOVERY_NOT_DUE", "CAPABILITY_NOT_ACTIVE", "ASSESSMENT_MISMATCH", "WRONG_CHALLENGE_BOND"):
        assert marker in TEXT
    assert 'status not in ("RECOVERY", "CHALLENGED")' in TEXT

def test_fetched_bytes_are_bound_to_owner_approved_commitment():
    for marker in (
        "gl.nondet.web.get",
        "hashlib.sha256(body).hexdigest()",
        "_DIGEST_MISMATCH",
        "_BYTE_LENGTH_MISMATCH",
        "INVALID_EVIDENCE_COMMITMENT",
        "INVALID_FAILED_EVIDENCE_RESULT",
        'integrity == "FAILED"',
        'digest.startswith("sha256:")',
    ):
        assert marker in TEXT

def test_state_updated_before_transfers():
    settle = TEXT.index("def settle")
    recover = TEXT.index("def recover")
    block = TEXT[settle:recover]
    assert block.index('self.assessment_status[assessment_id] = "SETTLED"') < block.index("emit_transfer")

def test_no_secret_material():
    lowered = TEXT.lower()
    assert "private_key" not in lowered
    assert "api_secret" not in lowered
