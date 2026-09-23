"""
Ardhnarishwar SaaS - Real-Time Candidate Pipeline & Job Application API
Endpoints for candidate self-service application, resume linkage, pipeline tracking,
token generation, and status management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import desc, or_
from typing import List, Optional, Dict, Any
import uuid
import time
from datetime import datetime, timezone

from ..core.database import get_db
from ..core.security import (
    get_current_user,
    require_recruiter_or_admin,
    AuthenticatedIdentity,
    verify_tenant_isolation,
    hash_password
)
from ..core.rate_limiter import enforce_api_rate_limit
from ..models import Candidate, Job, Company, Resume, User, InterviewSession, AIEvaluationReport

router = APIRouter(prefix="/api/v1/candidates", tags=["Candidate Applications & Pipeline"])

class CandidateApplyRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    job_id: str
    skill_category: Optional[str] = "SKILLED" # 'SKILLED', 'UNSKILLED', 'SEMI_SKILLED'
    years_of_experience: Optional[int] = 0
    skills: Optional[List[str]] = []
    resume_id: Optional[str] = None
    password: Optional[str] = None

class CandidateStatusUpdateRequest(BaseModel):
    status: str # INVITED, IN_PROGRESS, EVALUATED, SHORTLISTED, REJECTED, HIRED


@router.post("/apply", dependencies=[Depends(enforce_api_rate_limit)])
async def apply_for_job_endpoint(req: CandidateApplyRequest, db: Session = Depends(get_db)):
    """
    Submits a real candidate application for a specific job:
    1. Validates job exists.
    2. Persists candidate in database with specified skill classification.
    3. Links resume to candidate and company.
    4. Generates unique interview token.
    5. Creates Candidate user account if password provided.
    6. Increments job total_applicants.
    """
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="The specified Job opening does not exist.")

    email_clean = req.email.strip().lower()

    # Prevent duplicate applications: Check unique combination of job_id and email
    existing_application = db.query(Candidate).filter(
        Candidate.job_id == job.id,
        Candidate.email == email_clean
    ).first()

    if existing_application:
        return {
            "success": True,
            "already_applied": True,
            "candidate_id": existing_application.id,
            "job_id": job.id,
            "job_title": job.title,
            "company_id": job.company_id,
            "interview_token": existing_application.interview_token,
            "status": existing_application.status,
            "applied_at": existing_application.applied_at.isoformat(),
            "message": "You have already submitted an application for this position."
        }

    cand_id = f"cand_{uuid.uuid4().hex[:10]}"
    token_seed = req.first_name.upper().replace(' ', '')
    token = f"TOKEN_{int(time.time()) % 100000}_{token_seed}"

    # Check if candidate user exists or create
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if not existing_user and req.password:
        new_user = User(
            id=f"usr_{cand_id}",
            company_id=job.company_id,
            email=email_clean,
            password_hash=hash_password(req.password),
            name=f"{req.first_name.strip()} {req.last_name.strip()}",
            role="CANDIDATE",
            status="ACTIVE"
        )
        db.add(new_user)

    # Link resume URL if resume_id provided
    resume_url = None
    if req.resume_id:
        resume_record = db.query(Resume).filter(Resume.id == req.resume_id).first()
        if resume_record:
            resume_record.candidate_id = cand_id
            resume_record.company_id = job.company_id
            resume_url = f"/api/v1/resumes/{resume_record.id}/download"

    new_cand = Candidate(
        id=cand_id,
        company_id=job.company_id,
        job_id=job.id,
        first_name=req.first_name.strip(),
        last_name=req.last_name.strip(),
        email=email_clean,
        phone=req.phone.strip() if req.phone else None,
        skill_category=(req.skill_category or "SKILLED").upper(),
        years_of_experience=req.years_of_experience or 0,
        status="SHORTLISTED",
        interview_token=token,
        resume_file_url=resume_url,
        applied_at=datetime.now(timezone.utc)
    )
    db.add(new_cand)

    # Increment applicant count
    job.total_applicants = (job.total_applicants or 0) + 1

    db.commit()
    db.refresh(new_cand)

    return {
        "success": True,
        "already_applied": False,
        "candidate_id": new_cand.id,
        "job_id": job.id,
        "job_title": job.title,
        "company_id": job.company_id,
        "interview_token": new_cand.interview_token,
        "status": new_cand.status,
        "applied_at": new_cand.applied_at.isoformat()
    }


@router.get("", dependencies=[Depends(enforce_api_rate_limit)])
async def list_candidates_endpoint(
    company_id: Optional[str] = None,
    job_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists candidate applications with tenant scoping.
    Super Admin can view across companies; Company Admin sees their company only.
    """
    query = db.query(Candidate).options(
        joinedload(Candidate.job),
        joinedload(Candidate.company),
        selectinload(Candidate.sessions).joinedload(InterviewSession.ai_report),
        selectinload(Candidate.resumes)
    )

    if current_user.role != "SUPER_ADMIN":
        query = query.filter(Candidate.company_id == current_user.company_id)
    elif company_id and company_id != "ALL":
        query = query.filter(Candidate.company_id == company_id)

    if job_id and job_id != "ALL":
        query = query.filter(Candidate.job_id == job_id)

    if status_filter and status_filter != "ALL":
        query = query.filter(Candidate.status == status_filter)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Candidate.first_name.ilike(search_pattern),
                Candidate.last_name.ilike(search_pattern),
                Candidate.email.ilike(search_pattern),
                Candidate.interview_token.ilike(search_pattern)
            )
        )

    total_count = query.count()
    candidates = query.order_by(desc(Candidate.applied_at)).limit(limit).offset(offset).all()

    results = []
    for c in candidates:
        latest_session = c.sessions[-1] if c.sessions else None
        ai_score = float(latest_session.overall_score) if latest_session and latest_session.overall_score else None

        results.append({
            "id": c.id,
            "company_id": c.company_id,
            "company_name": c.company.name if c.company else "",
            "job_id": c.job_id,
            "job_title": c.job.title if c.job else "",
            "first_name": c.first_name,
            "last_name": c.last_name,
            "email": c.email,
            "phone": c.phone,
            "years_of_experience": c.years_of_experience,
            "status": c.status,
            "interview_token": c.interview_token,
            "resume_url": c.resume_file_url,
            "resumes_count": len(c.resumes) if c.resumes else 0,
            "latest_score": ai_score,
            "latest_recommendation": latest_session.recommendation if latest_session else None,
            "latest_session_id": latest_session.id if latest_session else None,
            "applied_at": c.applied_at.isoformat()
        })

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "candidates": results
    }


@router.get("/{candidate_id}")
async def get_candidate_details_endpoint(
    candidate_id: str,
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full profile, linked job, attached resumes, and interview evaluations.
    """
    cand = db.query(Candidate).options(
        joinedload(Candidate.job),
        joinedload(Candidate.company),
        selectinload(Candidate.resumes),
        selectinload(Candidate.sessions).joinedload(InterviewSession.ai_report)
    ).filter(Candidate.id == candidate_id).first()

    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    if current_user.role not in ("SUPER_ADMIN", "CANDIDATE") and cand.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return {
        "id": cand.id,
        "company_id": cand.company_id,
        "company_name": cand.company.name if cand.company else "",
        "job_id": cand.job_id,
        "job_title": cand.job.title if cand.job else "",
        "first_name": cand.first_name,
        "last_name": cand.last_name,
        "email": cand.email,
        "phone": cand.phone,
        "years_of_experience": cand.years_of_experience,
        "status": cand.status,
        "interview_token": cand.interview_token,
        "resume_url": cand.resume_file_url,
        "resumes": [
            {
                "id": r.id,
                "file_name": r.file_name,
                "file_size_bytes": r.file_size_bytes,
                "file_type": r.file_type,
                "status": r.status,
                "download_url": f"/api/v1/resumes/{r.id}/download",
                "uploaded_at": r.uploaded_at.isoformat()
            } for r in (cand.resumes or [])
        ],
        "applied_at": cand.applied_at.isoformat()
    }


@router.put("/{candidate_id}/status")
async def update_candidate_status_endpoint(
    candidate_id: str,
    req: CandidateStatusUpdateRequest,
    current_user: AuthenticatedIdentity = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    """
    Updates candidate recruitment pipeline status (e.g. SHORTLISTED -> HIRED / REJECTED).
    """
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    verify_tenant_isolation(current_user, cand.company_id)

    cand.status = req.status
    db.commit()
    db.refresh(cand)

    return {"success": True, "id": cand.id, "status": cand.status}


@router.delete("/{candidate_id}")
async def delete_candidate_endpoint(
    candidate_id: str,
    current_user: AuthenticatedIdentity = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    """
    Removes candidate record with cascade to sessions and answers.
    """
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    verify_tenant_isolation(current_user, cand.company_id)

    db.delete(cand)
    db.commit()

    return {"success": True, "message": f"Candidate {candidate_id} deleted."}


@router.get("/applications/{application_id}/timeline")
async def get_application_timeline_endpoint(
    application_id: str,
    db: Session = Depends(get_db)
):
    """
    Renders the live multi-step recruitment progress timeline:
    Applied ➔ Under Review ➔ AI Assessment Complete ➔ Selected for Live Interview ➔ Offer / Feedback
    """
    app_id = application_id.strip()
    cand = db.query(Candidate).options(
        joinedload(Candidate.job),
        joinedload(Candidate.company),
        selectinload(Candidate.sessions).joinedload(InterviewSession.ai_report)
    ).filter(
        (Candidate.id == app_id) |
        (Candidate.interview_token == app_id) |
        (Candidate.email == app_id)
    ).first()

    if not cand:
        raise HTTPException(status_code=404, detail="Application record not found.")

    latest_session = cand.sessions[-1] if cand.sessions else None
    has_completed_assessment = bool(latest_session and latest_session.status == "COMPLETED")
    score = float(latest_session.overall_score) if latest_session and latest_session.overall_score else None

    # Check for live Zoom meeting
    from ..models.zoom_meeting import InterviewMeeting
    meeting = db.query(InterviewMeeting).filter(
        InterviewMeeting.application_id == cand.id
    ).order_by(InterviewMeeting.created_at.desc()).first()

    # Build 5-step timeline
    stages = [
        {
            "step": 1,
            "title": "Application Submitted",
            "key": "APPLIED",
            "status": "COMPLETED",
            "date": cand.applied_at.isoformat() if cand.applied_at else None,
            "description": f"Applied for {cand.job.title if cand.job else 'Position'}. Resume profile linked."
        },
        {
            "step": 2,
            "title": "HR Profile Review",
            "key": "UNDER_REVIEW",
            "status": "COMPLETED" if cand.status in ("SHORTLISTED", "EVALUATED", "HIRED", "REJECTED") else "CURRENT",
            "date": cand.applied_at.isoformat() if cand.applied_at else None,
            "description": f"Profile evaluated for {cand.skill_category} track requirements."
        },
        {
            "step": 3,
            "title": "Autonomous AI Assessment",
            "key": "AI_ASSESSMENT",
            "status": "COMPLETED" if has_completed_assessment else ("CURRENT" if latest_session else "PENDING"),
            "date": latest_session.completed_at.isoformat() if latest_session and latest_session.completed_at else None,
            "score": score,
            "description": f"Overall Score: {score}/100" if score else "Interview chamber invitation active."
        },
        {
            "step": 4,
            "title": "Live 1-on-1 Interview",
            "key": "LIVE_INTERVIEW",
            "status": "COMPLETED" if (meeting and meeting.status == "COMPLETED") else ("CURRENT" if meeting else "PENDING"),
            "meeting_id": meeting.zoom_meeting_id if meeting else None,
            "join_url": meeting.join_url if meeting else None,
            "description": f"Zoom meeting scheduled ({meeting.zoom_meeting_id})" if meeting else "Pending HR live session schedule."
        },
        {
            "step": 5,
            "title": "Final Decision & Offer",
            "key": "FINAL_OFFER",
            "status": "COMPLETED" if cand.status in ("HIRED", "REJECTED") else "PENDING",
            "outcome": cand.status,
            "description": f"Candidate status: {cand.status}"
        }
    ]

    return {
        "success": True,
        "application_id": cand.id,
        "candidate_name": f"{cand.first_name} {cand.last_name}",
        "email": cand.email,
        "job_title": cand.job.title if cand.job else "Position",
        "company_name": cand.company.name if cand.company else "Enterprise",
        "current_status": cand.status,
        "interview_token": cand.interview_token,
        "stages": stages
    }

