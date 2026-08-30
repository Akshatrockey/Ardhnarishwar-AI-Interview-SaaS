"""
Ardhnarishwar SaaS - AI Model Versioning & Historical Reproducibility Verification Suite
Verifies:
1. AI Model Version Registration (version ID, dataset ref, checksum, scoring config, feature config, rule config, metrics)
2. Evaluation Report snapshotting with frozen hyperparameters and reproducibility hash
3. Historical evaluation reproducibility: An evaluation scored under v1.0.0 remains 100% reproducible even after upgrading active version to v3.4.0
"""

import os
import sys
import hashlib
import json
from datetime import datetime

# Enable unbuffered stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import (
    Company,
    Job,
    InterviewRound,
    QuestionBank,
    Candidate,
    InterviewSession,
    CandidateAnswer,
    AIEvaluationReport,
    AIModelVersion
)

def compute_reproducibility_hash(transcript: str, question_benchmark: str, scoring_config: dict) -> str:
    payload = f"{transcript}::{question_benchmark}::{json.dumps(scoring_config, sort_keys=True)}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def evaluate_with_model_version(transcript: str, question: QuestionBank, version: AIModelVersion) -> dict:
    """
    Deterministic scoring algorithm using the specified AIModelVersion hyperparameters.
    """
    from app.core.vectorizer import calculate_text_similarity

    # 1. Cosine similarity
    ngram_range = tuple(version.feature_config.get("ngram_range", [1, 2]))
    cosine_sim = calculate_text_similarity(question.ideal_benchmark_answer, transcript, ngram_range=ngram_range)

    # 2. Concept extraction
    lower = transcript.lower()
    identified = [c for c in question.key_concepts if c.lower() in lower]
    missing = [c for c in question.key_concepts if c.lower() not in lower]
    concept_ratio = len(identified) / max(1, len(question.key_concepts))
    concept_score = min(100.0, concept_ratio * 100.0)

    # 3. Technical Depth
    technical_depth = concept_score * 0.85 + (len(identified) * 5)
    
    # Apply version-specific anti-pattern penalty
    anti_patterns_detected = [ap for ap in question.anti_patterns if ap.lower() in lower]
    if anti_patterns_detected:
        penalty = version.rule_config.get("anti_pattern_penalty", 15.0)
        technical_depth = max(10.0, technical_depth - (len(anti_patterns_detected) * penalty))

    relevance = min(100.0, (cosine_sim * 130 * 0.4) + (concept_score * 0.6))
    communication = 90.0

    # 4. Dimension weights from version config
    w = version.scoring_config.get("weights", {"technical": 0.45, "relevance": 0.30, "communication": 0.25})
    overall_score = round(
        technical_depth * w.get("technical", 0.45) +
        relevance * w.get("relevance", 0.30) +
        communication * w.get("communication", 0.25),
        2
    )

    repro_hash = compute_reproducibility_hash(transcript, question.ideal_benchmark_answer, version.scoring_config)

    return {
        "overall_score": overall_score,
        "technical_score": round(technical_depth, 2),
        "relevance_score": round(relevance, 2),
        "communication_score": communication,
        "reproducibility_hash": repro_hash,
        "version_tag": version.version_tag
    }

def run_ai_versioning_audit():
    print("=" * 80)
    print("   AI MODEL VERSIONING, DATASET REGISTRY & HISTORICAL REPRODUCIBILITY AUDIT")
    print("=" * 80)

    # 1. Setup In-Memory DB
    engine = create_engine("sqlite:///:memory:", echo=False)
    Session = sessionmaker(bind=engine)
    db = Session()
    Base.metadata.create_all(engine)

    # 2. Register Official AI Model Versions in Database
    v1 = AIModelVersion(
        id="aiv_v1_0_0_baseline",
        version_tag="v1.0.0-legacy-baseline",
        name="Ardhnarishwar Baseline Semantic Matcher",
        description="Initial TF-IDF semantic matcher with basic keyword counting.",
        dataset_ref="ds_robotics_kinematics_v1_legacy",
        dataset_version="1.0.0",
        dataset_checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        scoring_config={"weights": {"technical": 0.40, "relevance": 0.30, "communication": 0.30}, "passing_threshold": 65.0},
        feature_config={"ngram_range": [1, 1], "min_wpm": 100, "max_wpm": 180},
        rule_config={"anti_pattern_penalty": 5.0, "confidence_baseline": 80.0},
        evaluation_metrics={"validation_accuracy": 0.884, "f1_score": 0.862, "rmse": 3.42},
        is_active=False
    )

    v3 = AIModelVersion(
        id="aiv_v3_4_0_robotics_core",
        version_tag="v3.4.0-robotics-core-evaluator",
        name="Ardhnarishwar Multi-Vector Robotics Core (Production)",
        description="Current release with enhanced n-grams (1,2) and strict anti-pattern penalties.",
        dataset_ref="ds_robotics_kinematics_v3_4_golden",
        dataset_version="3.4.0",
        dataset_checksum="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        scoring_config={"weights": {"technical": 0.50, "relevance": 0.30, "communication": 0.20}, "passing_threshold": 72.0},
        feature_config={"ngram_range": [1, 2], "min_wpm": 115, "max_wpm": 165},
        rule_config={"anti_pattern_penalty": 20.0, "confidence_baseline": 88.0},
        evaluation_metrics={"validation_accuracy": 0.958, "f1_score": 0.949, "rmse": 1.82},
        is_active=True
    )

    db.add_all([v1, v3])
    db.commit()

    print("\n[STEP 1] Model Versions Registered in Database:")
    for v in [v1, v3]:
        print(f"  • ID: {v.id}")
        print(f"    - Tag: {v.version_tag} (Active: {v.is_active})")
        print(f"    - Dataset Ref: {v.dataset_ref} (v{v.dataset_version}, SHA-256: {v.dataset_checksum[:16]}...)")
        print(f"    - Benchmark Metrics: Accuracy={v.evaluation_metrics['validation_accuracy']}, F1={v.evaluation_metrics['f1_score']}")

    # 3. Create Question Bank item
    q_kinematics = QuestionBank(
        id="q_kinematics_test",
        category="TECHNICAL",
        role_category="Robotics & Controls",
        title="Kinematics & Singularity Avoidance",
        prompt="Explain Forward vs Inverse Kinematics...",
        expected_duration_sec=120,
        ideal_benchmark_answer="Forward kinematics computes Cartesian pose from joint angles using DH parameters. Inverse kinematics computes joint angles. Singularities occur when Jacobian loses rank.",
        key_concepts=["Forward Kinematics", "Inverse Kinematics", "Denavit-Hartenberg", "Jacobian Matrix"],
        anti_patterns=["Ignoring singularities", "Gimbal lock"],
        rubric_weights={"relevance": 0.30, "technical": 0.50, "communication": 0.20},
        is_global=True
    )
    db.add(q_kinematics)
    db.commit()

    # Candidate Transcript with Anti-pattern ("Gimbal lock")
    candidate_transcript = (
        "Forward kinematics uses DH parameters to calculate pose. Inverse kinematics finds joint angles. "
        "Singularities cause issues. Sometimes gimbal lock happens."
    )

    # ==============================================================================
    # TEST 1: Evaluate Candidate under Historical Version v1.0.0
    # ==============================================================================
    print("\n[TEST 1] Evaluating Candidate Session under Version v1.0.0 (Legacy Baseline):")
    eval_v1 = evaluate_with_model_version(candidate_transcript, q_kinematics, v1)
    print(f"- Version Tag: {eval_v1['version_tag']}")
    print(f"- Overall Score: {eval_v1['overall_score']}/100 (Technical: {eval_v1['technical_score']})")
    print(f"- Reproducibility Hash: {eval_v1['reproducibility_hash']}")

    # Save to Report in Database
    report_v1 = AIEvaluationReport(
        id="rep_hist_01",
        session_id="sess_hist_01",
        candidate_id="cand_hist_01",
        ai_model_version_id=v1.id,
        overall_score=eval_v1['overall_score'],
        recommendation="HIRE",
        relevance_avg=eval_v1['relevance_score'],
        technical_avg=eval_v1['technical_score'],
        communication_avg=eval_v1['communication_score'],
        problem_solving_avg=85.0,
        confidence_avg=88.0,
        role_competency_avg=eval_v1['overall_score'],
        strengths=["Basic kinematics"],
        weaknesses=[],
        red_flags=[],
        executive_summary="Candidate evaluated under v1.0.0.",
        model_version_snapshot={
            "version_id": v1.id,
            "version_tag": v1.version_tag,
            "scoring_config": v1.scoring_config,
            "feature_config": v1.feature_config,
            "rule_config": v1.rule_config
        },
        reproducibility_hash=eval_v1['reproducibility_hash']
    )
    db.add(report_v1)
    db.commit()
    print("[PASS] Historical Evaluation Report committed with frozen version snapshot & hash.")

    # ==============================================================================
    # TEST 2: Evaluate Candidate under Production Version v3.4.0 (Stricter Anti-Patterns)
    # ==============================================================================
    print("\n[TEST 2] Evaluating Candidate Session under Version v3.4.0 (Production Stricter):")
    eval_v3 = evaluate_with_model_version(candidate_transcript, q_kinematics, v3)
    print(f"- Version Tag: {eval_v3['version_tag']}")
    print(f"- Overall Score: {eval_v3['overall_score']}/100 (Technical: {eval_v3['technical_score']})")
    print(f"- Reproducibility Hash: {eval_v3['reproducibility_hash']}")

    # v3 has penalty = 20 vs v1 penalty = 5, so score MUST differ
    assert eval_v3['overall_score'] != eval_v1['overall_score'], "Scores should differ between model versions!"
    print(f"[PASS] Model Evolution Verified: v3.4.0 stricter penalty reflected in score ({eval_v1['overall_score']} -> {eval_v3['overall_score']}).")

    # ==============================================================================
    # TEST 3: HISTORICAL REPRODUCIBILITY AUDIT
    # Re-evaluate Candidate 1 using their original stored v1.0.0 snapshot
    # ==============================================================================
    print("\n[TEST 3] Historical Reproducibility Verification (Audit Requirement):")
    print("Action: Re-running evaluation on Candidate 1 using the historical v1.0.0 snapshot from database...")
    
    saved_report = db.query(AIEvaluationReport).filter(AIEvaluationReport.id == "rep_hist_01").first()
    historical_snapshot = saved_report.model_version_snapshot
    historical_version_id = saved_report.ai_model_version_id
    
    # Instantiate ephemeral model config from snapshot
    ephemeral_v1 = AIModelVersion(
        id=historical_version_id,
        version_tag=historical_snapshot["version_tag"],
        scoring_config=historical_snapshot["scoring_config"],
        feature_config=historical_snapshot["feature_config"],
        rule_config=historical_snapshot["rule_config"]
    )

    reproduced_eval = evaluate_with_model_version(candidate_transcript, q_kinematics, ephemeral_v1)
    print(f"- Original Score: {saved_report.overall_score}")
    print(f"- Reproduced Score: {reproduced_eval['overall_score']}")
    print(f"- Original Hash:   {saved_report.reproducibility_hash}")
    print(f"- Reproduced Hash: {reproduced_eval['reproducibility_hash']}")

    assert float(saved_report.overall_score) == float(reproduced_eval['overall_score']), "Reproducibility Failure: Scores do not match!"
    assert saved_report.reproducibility_hash == reproduced_eval['reproducibility_hash'], "Reproducibility Failure: Hashes do not match!"

    print("\n" + "=" * 80)
    print("  [SUCCESS] 100% DETERMINISTIC REPRODUCIBILITY VERIFIED ACROSS AI VERSIONS!")
    print("=" * 80 + "\n")
    db.close()

if __name__ == "__main__":
    run_ai_versioning_audit()
