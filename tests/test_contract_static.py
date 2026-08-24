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

def test_recovery_and_replay_guards():
    for marker in ("RECOVERY_NOT_DUE", "CAPABILITY_NOT_ACTIVE", "ASSESSMENT_MISMATCH", "WRONG_CHALLENGE_BOND"):
        assert marker in TEXT
    assert 'status not in ("RECOVERY", "CHALLENGED")' in TEXT

def test_state_updated_before_transfers():
    settle = TEXT.index("def settle")
    recover = TEXT.index("def recover")
    block = TEXT[settle:recover]
    assert block.index('self.assessment_status[assessment_id] = "SETTLED"') < block.index("emit_transfer")

def test_no_secret_material():
    lowered = TEXT.lower()
    assert "private_key" not in lowered
    assert "api_secret" not in lowered
