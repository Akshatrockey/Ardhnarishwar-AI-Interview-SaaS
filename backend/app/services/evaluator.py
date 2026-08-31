"""
Ardhnarishwar Backend Core-AI Predefined Answer Evaluation Service
Strictly evaluates candidate transcripts against predefined Expected Answers + Evaluation Criteria.
"""

import math
import re
from typing import List, Dict, Any, Optional
from app.core.vectorizer import calculate_text_similarity, tokenize

def match_concepts(transcript: str, key_concepts: List[str], anti_patterns: List[str]) -> Dict[str, Any]:
    lower = transcript.lower()
    identified = []
    missing = []
    for concept in key_concepts:
        # Check either exact substring or all core words of the concept
        words = [w for w in re.sub(r'[^a-zA-Z0-9\s]', '', concept.lower()).split() if len(w) > 2]
        if concept.lower() in lower or (words and all(w in lower for w in words)):
            identified.append(concept)
        else:
            missing.append(concept)

    anti_detected = []
    for anti in anti_patterns:
        if anti.lower() in lower:
            anti_detected.append(anti)

    coverage = len(identified) / len(key_concepts) if key_concepts else 1.0
    return {
        "identified": identified,
        "missing": missing,
        "anti_patterns": anti_detected,
        "coverage_ratio": coverage,
        "coverage_score": round(coverage * 100)
    }

def evaluate_candidate_answer(
    transcript: str,
    expected_answer: str,
    evaluation_criteria: List[str],
    key_concepts: List[str],
    anti_patterns: Optional[List[str]] = None,
    max_score: float = 10.0,
    category: str = "TECHNICAL",
    duration_sec: int = 60
) -> Dict[str, Any]:
    anti_patterns = anti_patterns or []
    clean_transcript = (transcript or "").strip()

    # 1. Empty / Blank Answer check
    if not clean_transcript or len(clean_transcript) < 5 or clean_transcript.lower() in ["no answer", "..."]:
        return {
            "transcript": clean_transcript or "(No answer provided)",
            "score": 0.0,
            "obtained_score": 0.0,
            "max_score": max_score,
            "status": "EMPTY",
            "evaluation_reason": "Candidate provided no substantive answer for this question.",
            "feedback": "No answer recorded. Missing all required concepts and predefined criteria.",
            "strengths": [],
            "improvement_suggestions": ["Ensure you attempt all interview questions."],
            "identified_concepts": [],
            "missing_concepts": key_concepts,
            "dimension_scores": {
                "relevance": 0, "technical_depth": 0, "communication": 0,
                "problem_solving": 0, "confidence": 0, "role_competency": 0
            }
        }

    # 2. Vectorized Cosine Similarity against Predefined Expected Answer
    cosine_sim = calculate_text_similarity(expected_answer, clean_transcript)
    
    # 3. Concept Graph & Criteria Matching
    concept_res = match_concepts(clean_transcript, key_concepts, anti_patterns)
    
    # Criteria evaluation
    met_criteria = 0
    lower_t = clean_transcript.lower()
    for crit in evaluation_criteria:
        crit_words = [w for w in re.sub(r'[^a-zA-Z0-9\s]', '', crit.lower()).split() if len(w) > 3]
        matched = [w for w in crit_words if w in lower_t]
        if crit_words and (len(matched) / len(crit_words) >= 0.4):
            met_criteria += 1
        elif cosine_sim > 0.45:
            met_criteria += 0.8

    criteria_ratio = met_criteria / len(evaluation_criteria) if evaluation_criteria else 1.0

    # 4. Multi-Vector Dimension Scoring
    scaled_cosine = min(100.0, cosine_sim * 135.0)
    relevance = min(100.0, max(0.0, scaled_cosine * 0.35 + concept_res["coverage_score"] * 0.4 + (criteria_ratio * 100.0) * 0.25))
    
    technical_depth = min(100.0, max(0.0, concept_res["coverage_score"] * 0.85 + (len(tokenize(clean_transcript)) * 0.5)))
    if concept_res["anti_patterns"]:
        technical_depth = max(0.0, technical_depth - (len(concept_res["anti_patterns"]) * 15.0))

    # Communication & Fluency
    words = clean_transcript.split()
    wpm = (len(words) / max(1, duration_sec)) * 60.0
    communication = min(100.0, max(40.0, 85.0 if 90 <= wpm <= 180 else 65.0))
    problem_solving = min(100.0, max(20.0, relevance * 0.6 + technical_depth * 0.4))
    confidence = min(100.0, max(30.0, communication * 0.5 + relevance * 0.5))
    role_competency = round(technical_depth * 0.45 + relevance * 0.30 + problem_solving * 0.25)

    # 5. Composite Normalized Score (0-100)
    normalized_score = round(
        relevance * 0.25 +
        technical_depth * 0.40 +
        communication * 0.15 +
        problem_solving * 0.15 +
        confidence * 0.05
    )
    normalized_score = min(100.0, max(0.0, float(normalized_score)))

    # Status determination
    if normalized_score >= 80:
        status = "CORRECT"
        reason = f"Candidate demonstrated thorough comprehension matching the predefined benchmark. Covered {len(concept_res['identified'])} core concepts ({', '.join(concept_res['identified'][:3])}) and fulfilled evaluation criteria with strong technical clarity."
    elif normalized_score >= 45:
        status = "PARTIALLY_CORRECT"
        missing_str = ", ".join(concept_res["missing"][:2]) if concept_res["missing"] else "specific benchmark criteria"
        reason = f"Candidate grasped foundational aspects of the question but omitted critical technical criteria: {missing_str}. Partial marks awarded."
    else:
        status = "INCORRECT"
        missing_str = ", ".join(concept_res["missing"][:3]) if concept_res["missing"] else "core concepts"
        reason = f"Candidate response diverged significantly from the predefined expected answer. Missed key concepts ({missing_str}) required by the evaluation rubric."

    obtained_score = round((normalized_score / 100.0) * max_score, 1)

    strengths = []
    if concept_res["identified"]:
        strengths.append(f"Identified key concepts: {', '.join(concept_res['identified'][:3])}")
    if 100 <= wpm <= 170:
        strengths.append("Maintained clear pacing and fluent delivery")

    improvements = []
    if concept_res["missing"]:
        improvements.append(f"Deepen explanation on: {', '.join(concept_res['missing'][:3])}")

    return {
        "transcript": clean_transcript,
        "score": normalized_score,
        "obtained_score": obtained_score,
        "max_score": max_score,
        "status": status,
        "evaluation_reason": reason,
        "feedback": reason,
        "strengths": strengths,
        "improvement_suggestions": improvements,
        "identified_concepts": concept_res["identified"],
        "missing_concepts": concept_res["missing"],
        "wpm": round(wpm, 1),
        "dimension_scores": {
            "relevance": round(relevance),
            "technical_depth": round(technical_depth),
            "communication": round(communication),
            "problem_solving": round(problem_solving),
            "confidence": round(confidence),
            "role_competency": role_competency
        }
    }

def compile_session_evaluation(
    session_id: str,
    candidate_id: str,
    evaluated_answers: List[Dict[str, Any]],
    passing_percentage: float = 70.0
) -> Dict[str, Any]:
    if not evaluated_answers:
        return {
            "session_id": session_id,
            "candidate_id": candidate_id,
            "overall_score": 0,
            "total_obtained_marks": 0.0,
            "total_max_marks": 0.0,
            "final_percentage": 0.0,
            "passing_percentage": passing_percentage,
            "is_passed": False,
            "grade": "NEEDS_IMPROVEMENT",
            "recommendation": "STRONG_NO_HIRE",
            "executive_summary": "Candidate did not complete the interview session."
        }

    total_obtained = sum(a.get("obtained_score", 0.0) for a in evaluated_answers)
    total_max = sum(a.get("max_score", 10.0) for a in evaluated_answers)
    final_percentage = round((total_obtained / total_max) * 100.0, 1) if total_max > 0 else 0.0
    is_passed = final_percentage >= passing_percentage

    if final_percentage >= 80:
        grade = "EXCELLENT"
        recommendation = "STRONG_HIRE"
    elif final_percentage >= 70:
        grade = "VERY_GOOD"
        recommendation = "HIRE"
    elif final_percentage >= 60:
        grade = "GOOD"
        recommendation = "LEANING_HIRE"
    elif final_percentage >= 50:
        grade = "AVERAGE"
        recommendation = "LEANING_NO_HIRE"
    else:
        grade = "NEEDS_IMPROVEMENT"
        recommendation = "STRONG_NO_HIRE"

    return {
        "session_id": session_id,
        "candidate_id": candidate_id,
        "overall_score": round(final_percentage),
        "total_obtained_marks": round(total_obtained, 1),
        "total_max_marks": round(total_max, 1),
        "final_percentage": final_percentage,
        "passing_percentage": passing_percentage,
        "is_passed": is_passed,
        "grade": grade,
        "recommendation": recommendation,
        "answers": evaluated_answers,
        "executive_summary": f"Candidate achieved {total_obtained}/{total_max} marks ({final_percentage}% - Grade: {grade}). Assessment result: {'PASSED' if is_passed else 'FAILED'}."
    }
