"""
Ardhnarishwar SaaS - Real-Time Job Openings & Job-Specific Questions API
Full database CRUD for job positions, interview rounds, and job-specific benchmark questions.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import desc, or_
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

from ..core.database import get_db
from ..core.security import (
    get_current_user,
    require_recruiter_or_admin,
    require_company_admin,
    AuthenticatedIdentity,
    verify_tenant_isolation
)
from ..core.rate_limiter import enforce_api_rate_limit
from ..models import Job, InterviewRound, QuestionBank, round_questions, Company

router = APIRouter(prefix="/api/v1/jobs", tags=["Job Openings & Questions"])

class JobCreateRequest(BaseModel):
    title: str
    department: str
    location: str
    job_type: Optional[str] = "FULL_TIME"
    experience_level: Optional[str] = "SENIOR"
    skill_category: Optional[str] = "SKILLED" # 'SKILLED', 'UNSKILLED', 'SEMI_SKILLED'
    description: str
    requirements: Optional[str] = None
    ctc: Optional[str] = "$120k - $160k / ₹18 - 25 LPA"
    deadline: Optional[str] = None
    required_skills: List[str] = []
    company_id: Optional[str] = None
    status: Optional[str] = "OPEN"

class JobUpdateRequest(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    skill_category: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    ctc: Optional[str] = None
    deadline: Optional[str] = None
    required_skills: Optional[List[str]] = None
    status: Optional[str] = None

class QuestionCreateRequest(BaseModel):
    title: str
    prompt: str
    category: Optional[str] = "TECHNICAL"
    role_category: Optional[str] = "Robotics & Software"
    target_skill_level: Optional[str] = "ALL"
    difficulty: Optional[str] = "MEDIUM"
    ideal_benchmark_answer: str
    key_concepts: List[str] = []
    anti_patterns: Optional[List[str]] = []
    expected_duration_sec: Optional[int] = 120
    rubric_weights: Optional[Dict[str, float]] = None


@router.get("", dependencies=[Depends(enforce_api_rate_limit)])
async def list_jobs_endpoint(
    company_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    skill_category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Lists jobs from the database with multi-tenant filtering.
    """
    query = db.query(Job).options(joinedload(Job.company), selectinload(Job.rounds))
    if company_id and company_id != "ALL":
        query = query.filter(Job.company_id == company_id)
    if status_filter and status_filter != "ALL":
        query = query.filter(Job.status == status_filter)
    if skill_category:
        query = query.filter(Job.skill_category == skill_category)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Job.title.ilike(s), Job.department.ilike(s), Job.description.ilike(s)))

    total_count = query.count()
    jobs = query.order_by(desc(Job.created_at)).limit(limit).offset(offset).all()

    results = []
    for j in jobs:
        results.append({
            "id": j.id,
            "company_id": j.company_id,
            "company_name": j.company.name if j.company else "Unknown Company",
            "title": j.title,
            "department": j.department,
            "location": j.location,
            "job_type": j.job_type,
            "experience_level": j.experience_level,
            "skill_category": j.skill_category or "SKILLED",
            "description": j.description,
            "requirements": getattr(j, "requirements", None),
            "ctc": getattr(j, "ctc", "$120k - $160k / ₹18 - 25 LPA"),
            "deadline": getattr(j, "deadline", None),
            "required_skills": j.required_skills or [],
            "status": j.status,
            "total_applicants": j.total_applicants or 0,
            "rounds_count": len(j.rounds) if j.rounds else 0,
            "created_at": j.created_at.isoformat()
        })

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "jobs": results
    }


@router.post("", dependencies=[Depends(enforce_api_rate_limit)])
async def create_job_endpoint(
    req: JobCreateRequest,
    current_user: AuthenticatedIdentity = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    """
    Creates a new real database job opening and auto-provisions its initial interview round.
    Broadcasts real-time JOB_POSTED event across the platform.
    """
    company_id = req.company_id if current_user.role == "SUPER_ADMIN" and req.company_id else current_user.company_id
    if not company_id:
        # Fallback to first active company or raise
        comp = db.query(Company).first()
        if comp:
            company_id = comp.id
        else:
            raise HTTPException(status_code=400, detail="Cannot create job without an active company.")

    job_id = f"job_{uuid.uuid4().hex[:10]}"
    new_job = Job(
        id=job_id,
        company_id=company_id,
        title=req.title.strip(),
        department=req.department.strip(),
        location=req.location.strip(),
        job_type=req.job_type or "FULL_TIME",
        experience_level=req.experience_level or "SENIOR",
        skill_category=(req.skill_category or "SKILLED").upper(),
        description=req.description.strip(),
        requirements=req.requirements or req.description.strip(),
        ctc=req.ctc or "$120k - $160k / ₹18 - 25 LPA",
        deadline=req.deadline or "Open Until Filled",
        required_skills=req.required_skills or [],
        status=req.status or "OPEN",
        total_applicants=0,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_job)
    db.flush()

    # Automatically create the primary AI Interview Round for this job
    round_id = f"round_{uuid.uuid4().hex[:10]}"
    primary_round = InterviewRound(
        id=round_id,
        company_id=company_id,
        job_id=job_id,
        name=f"Round 1: {req.title} Technical & Behavioral AI Screening",
        round_number=1,
        round_type="TECHNICAL_ROBOTICS" if "robot" in req.title.lower() else "AI_SCREENING",
        time_limit_minutes=25,
        passing_score=70.0,
        proctoring_strictness="MILITARY_GRADE",
        created_at=datetime.now(timezone.utc)
    )
    db.add(primary_round)
    db.commit()
    db.refresh(new_job)

    # Real-Time WebSocket Broadcast to all candidate explorer sessions
    try:
        import time
        from .realtime import manager
        comp = db.query(Company).filter(Company.id == new_job.company_id).first()
        await manager.broadcast_all({
            "type": "JOB_POSTED",
            "timestamp": time.time(),
            "payload": {
                "id": new_job.id,
                "company_id": new_job.company_id,
                "company_name": comp.name if comp else "Enterprise Partner",
                "title": new_job.title,
                "department": new_job.department,
                "location": new_job.location,
                "job_type": new_job.job_type,
                "experience_level": new_job.experience_level,
                "skill_category": new_job.skill_category or "SKILLED",
                "description": new_job.description,
                "requirements": new_job.requirements,
                "ctc": new_job.ctc,
                "deadline": new_job.deadline,
                "required_skills": new_job.required_skills or [],
                "status": new_job.status,
                "created_at": new_job.created_at.isoformat()
            }
        })
    except Exception:
        pass

    return {
        "success": True,
        "id": new_job.id,
        "company_id": new_job.company_id,
        "title": new_job.title,
        "round_id": primary_round.id,
        "ctc": new_job.ctc,
        "deadline": new_job.deadline,
        "status": new_job.status
    }


@router.get("/{job_id}")
async def get_job_details_endpoint(job_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full details of a specific job, including its interview rounds and assigned questions.
    """
    job = db.query(Job).options(
        joinedload(Job.company),
        selectinload(Job.rounds).selectinload(InterviewRound.questions)
    ).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job position not found.")

    rounds_data = []
    for r in (job.rounds or []):
        rounds_data.append({
            "id": r.id,
            "name": r.name,
            "round_type": r.round_type,
            "time_limit_minutes": r.time_limit_minutes,
            "passing_score": float(r.passing_score),
            "questions": [
                {
                    "id": q.id,
                    "title": q.title,
                    "prompt": q.prompt,
                    "category": q.category,
                    "difficulty": q.difficulty,
                    "ideal_benchmark_answer": q.ideal_benchmark_answer,
                    "key_concepts": q.key_concepts or [],
                    "anti_patterns": q.anti_patterns or [],
                    "expected_duration_sec": q.expected_duration_sec
                } for q in (r.questions or [])
            ]
        })

    return {
        "id": job.id,
        "company_id": job.company_id,
        "company_name": job.company.name if job.company else "",
        "title": job.title,
        "department": job.department,
        "location": job.location,
        "job_type": job.job_type,
        "experience_level": job.experience_level,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "status": job.status,
        "total_applicants": job.total_applicants,
        "rounds": rounds_data,
        "created_at": job.created_at.isoformat()
    }


@router.put("/{job_id}")
async def update_job_endpoint(
    job_id: str,
    req: JobUpdateRequest,
    current_user: AuthenticatedIdentity = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    """
    Updates job opening details.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    verify_tenant_isolation(current_user, job.company_id)

    if req.title is not None:
        job.title = req.title.strip()
    if req.department is not None:
        job.department = req.department.strip()
    if req.location is not None:
        job.location = req.location.strip()
    if req.job_type is not None:
        job.job_type = req.job_type
    if req.experience_level is not None:
        job.experience_level = req.experience_level
    if req.description is not None:
        job.description = req.description.strip()
    if req.required_skills is not None:
        job.required_skills = req.required_skills
    if req.status is not None:
        job.status = req.status

    db.commit()
    db.refresh(job)
    return {"success": True, "id": job.id, "title": job.title, "status": job.status}


@router.delete("/{job_id}")
async def delete_job_endpoint(
    job_id: str,
    current_user: AuthenticatedIdentity = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    """
    Deletes job opening and cleanly cascades to its rounds and sessions.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    verify_tenant_isolation(current_user, job.company_id)

    db.delete(job)
    db.commit()
    return {"success": True, "message": f"Job {job_id} deleted successfully."}


# ==============================================================================
# Job-Specific Question Management Endpoints
# ==============================================================================

@router.get("/{job_id}/questions")
async def get_job_questions_endpoint(job_id: str, db: Session = Depends(get_db)):
    """
    Returns all assigned questions for a specific job's interview rounds.
    Used by the Candidate Chamber to present the exact questions configured by the Admin.
    """
    job = db.query(Job).options(
        selectinload(Job.rounds).selectinload(InterviewRound.questions)
    ).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    questions = []
    seen_ids = set()
    for r in (job.rounds or []):
        for q in (r.questions or []):
            if q.id not in seen_ids:
                seen_ids.add(q.id)
                questions.append({
                    "id": q.id,
                    "title": q.title,
                    "prompt": q.prompt,
                    "category": q.category,
                    "difficulty": q.difficulty,
                    "ideal_benchmark_answer": q.ideal_benchmark_answer,
                    "key_concepts": q.key_concepts or [],
                    "anti_patterns": q.anti_patterns or [],
                    "expected_duration_sec": q.expected_duration_sec,
                    "rubric_weights": q.rubric_weights or {}
                })

    return {"job_id": job_id, "questions": questions}


@router.post("/{job_id}/questions")
async def add_job_question_endpoint(
    job_id: str,
    req: QuestionCreateRequest,
    current_user: AuthenticatedIdentity = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    """
    Creates a new question in the database and binds it specifically to this job's primary round.
    """
    job = db.query(Job).options(selectinload(Job.rounds)).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    verify_tenant_isolation(current_user, job.company_id)

    # Ensure round exists
    if not job.rounds:
        primary_round = InterviewRound(
            id=f"round_{uuid.uuid4().hex[:10]}",
            company_id=job.company_id,
            job_id=job.id,
            name=f"Round 1: {job.title} AI Assessment",
            round_number=1,
            round_type="TECHNICAL_ROBOTICS",
            time_limit_minutes=20,
            passing_score=70.0,
            proctoring_strictness="MILITARY_GRADE",
            created_at=datetime.now(timezone.utc)
        )
        db.add(primary_round)
        db.flush()
        round_target = primary_round
    else:
        round_target = job.rounds[0]

    q_id = f"q_{uuid.uuid4().hex[:10]}"
    new_q = QuestionBank(
        id=q_id,
        company_id=job.company_id,
        category=req.category or "TECHNICAL",
        role_category=req.role_category or job.department,
        difficulty=req.difficulty or "MEDIUM",
        title=req.title.strip(),
        prompt=req.prompt.strip(),
        expected_duration_sec=req.expected_duration_sec or 120,
        ideal_benchmark_answer=req.ideal_benchmark_answer.strip(),
        key_concepts=req.key_concepts or [],
        anti_patterns=req.anti_patterns or [],
        rubric_weights=req.rubric_weights or {"technical": 0.45, "relevance": 0.3, "communication": 0.25},
        is_global=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_q)
    db.flush()

    # Link question to round
    db.execute(
        round_questions.insert().values(
            round_id=round_target.id,
            question_id=new_q.id,
            sequence_order=len(round_target.questions or []) + 1
        )
    )
    db.commit()
    db.refresh(new_q)

    return {
        "success": True,
        "question_id": new_q.id,
        "job_id": job_id,
        "round_id": round_target.id,
        "title": new_q.title
    }


@router.delete("/{job_id}/questions/{question_id}")
async def remove_job_question_endpoint(
    job_id: str,
    question_id: str,
    current_user: AuthenticatedIdentity = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    """
    Unbinds and deletes a question from a job.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    verify_tenant_isolation(current_user, job.company_id)

    q = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
    if q:
        db.delete(q)
        db.commit()

    return {"success": True, "message": f"Question {question_id} deleted."}
