"""
Ardhnarishwar SaaS - Concrete SQLAlchemy ORM Runtime Queries & Multi-Tenant CRUD
Demonstrates production queries with strict tenant isolation, joins, eager loading, aggregations, and transaction commits.
"""
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, func, and_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from ..models import (
    Company,
    Subscription,
    User,
    AuditLog,
    Job,
    InterviewRound,
    QuestionBank,
    Candidate,
    InterviewSession,
    CandidateAnswer,
    AIEvaluationReport,
    round_questions
)

# ==============================================================================
# 1. Multi-Tenant Candidate Pipeline Queries
# ==============================================================================

def get_candidates_by_tenant(
    db: Session,
    company_id: str,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Candidate]:
    """
    Retrieves candidates strictly scoped to authenticated tenant with eager-loaded Job details.
    Generates SQL:
      SELECT candidates.*, jobs.* FROM candidates 
      LEFT OUTER JOIN jobs ON jobs.id = candidates.job_id 
      WHERE candidates.company_id = :company_id [AND candidates.status = :status]
      ORDER BY candidates.applied_at DESC LIMIT :limit OFFSET :offset;
    """
    stmt = (
        select(Candidate)
        .options(joinedload(Candidate.job))
        .where(Candidate.company_id == company_id)
    )
    
    if status_filter and status_filter != 'ALL':
        stmt = stmt.where(Candidate.status == status_filter)
        
    stmt = stmt.order_by(desc(Candidate.applied_at)).limit(limit).offset(offset)
    return db.scalars(stmt).unique().all()


def get_candidate_by_token(db: Session, token: str) -> Optional[Candidate]:
    """
    Token-gated candidate lookup for candidate interview entry.
    Generates SQL:
      SELECT candidates.*, jobs.*, interview_rounds.* FROM candidates 
      LEFT JOIN jobs ON jobs.id = candidates.job_id
      WHERE candidates.interview_token = :token;
    """
    stmt = (
        select(Candidate)
        .options(
            joinedload(Candidate.job).joinedload(Job.rounds)
        )
        .where(Candidate.interview_token == token)
    )
    return db.scalars(stmt).unique().first()


# ==============================================================================
# 2. Comprehensive Scorecard & Synchronized Video Queries
# ==============================================================================

def get_session_evaluation_dossier(
    db: Session,
    company_id: str,
    candidate_id: str
) -> Optional[Dict[str, Any]]:
    """
    Fetches full interview session evaluation, question answers with timestamps, and AI report.
    Enforces tenant context to prevent cross-company dossier inspection.
    """
    stmt = (
        select(InterviewSession)
        .options(
            joinedload(InterviewSession.candidate),
            joinedload(InterviewSession.job),
            joinedload(InterviewSession.round),
            selectinload(InterviewSession.answers).joinedload(CandidateAnswer.question),
            joinedload(InterviewSession.ai_report)
        )
        .where(
            and_(
                InterviewSession.company_id == company_id,
                InterviewSession.candidate_id == candidate_id
            )
        )
        .order_by(desc(InterviewSession.created_at))
    )
    session = db.scalars(stmt).unique().first()
    return session


# ==============================================================================
# 3. Job Opening & Interview Round Creation Queries
# ==============================================================================

def create_job_position(
    db: Session,
    company_id: str,
    title: str,
    department: str,
    location: str,
    experience_level: str,
    description: str,
    required_skills: List[str]
) -> Job:
    """
    Inserts a new job opening for the tenant.
    """
    job = Job(
        id=f"job_{uuid.uuid4().hex[:12]}",
        company_id=company_id,
        title=title,
        department=department,
        location=location,
        experience_level=experience_level,
        description=description,
        required_skills=required_skills,
        status='OPEN',
        total_applicants=0,
        created_at=datetime.utcnow()
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def create_interview_round_with_questions(
    db: Session,
    company_id: str,
    job_id: str,
    name: str,
    round_type: str,
    time_limit_minutes: int,
    passing_score: float,
    question_ids: List[str]
) -> InterviewRound:
    """
    Creates interview stage and links curated questions via M:N association table.
    """
    round_obj = InterviewRound(
        id=f"round_{uuid.uuid4().hex[:12]}",
        company_id=company_id,
        job_id=job_id,
        name=name,
        round_type=round_type,
        time_limit_minutes=time_limit_minutes,
        passing_score=passing_score,
        proctoring_strictness='MILITARY_GRADE',
        created_at=datetime.utcnow()
    )
    db.add(round_obj)
    db.flush()

    # Link questions
    for seq, q_id in enumerate(question_ids, start=1):
        db.execute(
            round_questions.insert().values(
                round_id=round_obj.id,
                question_id=q_id,
                sequence_order=seq
            )
        )

    db.commit()
    db.refresh(round_obj)
    return round_obj


# ==============================================================================
# 4. Super Admin Global Telemetry & Aggregation Queries
# ==============================================================================

def get_platform_telemetry(db: Session) -> Dict[str, Any]:
    """
    Executes high-performance SQL aggregations across all tenants for Super Admin Dashboard.
    """
    total_companies = db.query(func.count(Company.id)).scalar() or 0
    active_companies = db.query(func.count(Company.id)).filter(Company.status == 'ACTIVE').scalar() or 0
    total_candidates = db.query(func.count(Candidate.id)).scalar() or 0
    total_sessions = db.query(func.count(InterviewSession.id)).scalar() or 0
    avg_score = db.query(func.avg(InterviewSession.overall_score)).scalar() or 0.0

    # Top hiring companies
    hiring_breakdown = (
        db.query(
            Company.name,
            func.count(Candidate.id).label('candidate_count')
        )
        .join(Candidate, Candidate.company_id == Company.id)
        .group_by(Company.id, Company.name)
        .order_by(desc('candidate_count'))
        .limit(5)
        .all()
    )

    return {
        "total_companies": total_companies,
        "active_companies": active_companies,
        "total_candidates": total_candidates,
        "total_sessions": total_sessions,
        "platform_average_score": round(float(avg_score), 1) if avg_score else 0.0,
        "hiring_breakdown": [{"company": row[0], "candidates": row[1]} for row in hiring_breakdown]
    }
