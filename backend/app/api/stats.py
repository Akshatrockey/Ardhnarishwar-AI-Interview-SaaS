"""
Ardhnarishwar SaaS - Dynamic Real-Time Dashboard Statistics API
Calculates genuine database aggregations across entities with zero hardcoded fake metrics.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Dict, Any, Optional

from ..core.database import get_db
from ..core.security import get_current_user, AuthenticatedIdentity
from ..models import Company, Candidate, Job, InterviewSession, Resume, User, AuditLog

router = APIRouter(prefix="/api/v1/stats", tags=["Dashboard Statistics"])

@router.get("/super-admin")
async def get_super_admin_stats_endpoint(
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes global platform KPIs directly from database tables.
    Returns 0 if tables are empty.
    """
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super Admin privileges required.")

    total_companies = db.query(func.count(Company.id)).scalar() or 0
    active_companies = db.query(func.count(Company.id)).filter(Company.status == 'ACTIVE').scalar() or 0
    total_candidates = db.query(func.count(Candidate.id)).scalar() or 0
    total_jobs = db.query(func.count(Job.id)).scalar() or 0
    open_jobs = db.query(func.count(Job.id)).filter(Job.status == 'OPEN').scalar() or 0
    total_resumes = db.query(func.count(Resume.id)).scalar() or 0
    total_sessions = db.query(func.count(InterviewSession.id)).scalar() or 0
    completed_sessions = db.query(func.count(InterviewSession.id)).filter(InterviewSession.status == 'COMPLETED').scalar() or 0

    avg_score_raw = db.query(func.avg(InterviewSession.overall_score)).filter(InterviewSession.status == 'COMPLETED').scalar()
    avg_score = round(float(avg_score_raw), 1) if avg_score_raw else 0.0

    recent_logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(10).all()

    stats_data = {
        "total_companies": total_companies,
        "active_companies": active_companies,
        "total_candidates": total_candidates,
        "total_jobs": total_jobs,
        "open_jobs": open_jobs,
        "total_resumes": total_resumes,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "platform_average_score": avg_score,
        "recent_activity_count": len(recent_logs)
    }

    return {
        "success": True,
        "data": stats_data,
        **stats_data
    }


@router.get("/company")
async def get_company_stats_endpoint(
    company_id: Optional[str] = None,
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes tenant-specific metrics for Company Admin & Recruiter dashboards.
    Candidates are strictly forbidden.
    """
    if current_user.role == "CANDIDATE":
        raise HTTPException(status_code=403, detail="Candidates cannot access enterprise company statistics.")

    target_comp_id = company_id if current_user.role == "SUPER_ADMIN" and company_id else current_user.company_id
    if not target_comp_id:
        empty_stats = {
            "total_jobs": 0,
            "open_jobs": 0,
            "total_candidates": 0,
            "shortlisted_candidates": 0,
            "total_resumes": 0,
            "total_sessions": 0,
            "completed_sessions": 0,
            "average_score": 0.0
        }
        return {"success": True, "data": empty_stats, **empty_stats}

    total_jobs = db.query(func.count(Job.id)).filter(Job.company_id == target_comp_id).scalar() or 0
    open_jobs = db.query(func.count(Job.id)).filter(Job.company_id == target_comp_id, Job.status == 'OPEN').scalar() or 0
    total_candidates = db.query(func.count(Candidate.id)).filter(Candidate.company_id == target_comp_id).scalar() or 0
    shortlisted = db.query(func.count(Candidate.id)).filter(Candidate.company_id == target_comp_id, Candidate.status == 'SHORTLISTED').scalar() or 0
    total_resumes = db.query(func.count(Resume.id)).filter(Resume.company_id == target_comp_id).scalar() or 0
    total_sessions = db.query(func.count(InterviewSession.id)).filter(InterviewSession.company_id == target_comp_id).scalar() or 0
    completed_sessions = db.query(func.count(InterviewSession.id)).filter(InterviewSession.company_id == target_comp_id, InterviewSession.status == 'COMPLETED').scalar() or 0

    avg_score_raw = db.query(func.avg(InterviewSession.overall_score)).filter(
        InterviewSession.company_id == target_comp_id,
        InterviewSession.status == 'COMPLETED'
    ).scalar()
    avg_score = round(float(avg_score_raw), 1) if avg_score_raw else 0.0

    comp_stats = {
        "total_jobs": total_jobs,
        "open_jobs": open_jobs,
        "total_candidates": total_candidates,
        "shortlisted_candidates": shortlisted,
        "total_resumes": total_resumes,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "average_score": avg_score
    }

    return {
        "success": True,
        "data": comp_stats,
        **comp_stats
    }


@router.get("/candidate")
async def get_candidate_stats_endpoint(
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes candidate-specific live metrics for their personal career portal.
    """
    cand_records = db.query(Candidate).filter(
        (Candidate.id == current_user.id) | (Candidate.email == current_user.email.lower())
    ).all()

    cand_ids = [c.id for c in cand_records]
    total_applied = len(cand_records)
    shortlisted = sum(1 for c in cand_records if c.status in ('SHORTLISTED', 'HIRED'))
    
    sessions = db.query(InterviewSession).filter(InterviewSession.candidate_id.in_(cand_ids)).all() if cand_ids else []
    completed = [s for s in sessions if s.status == 'COMPLETED']
    scores = [float(s.overall_score) for s in completed if s.overall_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    cand_data = {
        "total_applications": total_applied,
        "shortlisted_count": shortlisted,
        "completed_interviews": len(completed),
        "average_score": avg_score,
        "latest_recommendation": completed[-1].recommendation if completed else None
    }

    return {
        "success": True,
        "data": cand_data,
        **cand_data
    }
