"""
Ardhnarishwar AI SaaS - 1-on-1 Live Zoom Interview API
Strict identity-gatekeeper connecting Enterprise HR and shortlisted candidates.
Zero mock/demo code: Real Zoom meeting credentials with strict 403 authorization guard.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
import uuid
import time
from typing import Optional, Dict, Any

from ..core.database import get_db
from ..core.security import get_current_user, AuthenticatedIdentity
from ..core.rate_limiter import enforce_api_rate_limit
from ..models import Candidate, Job, Company, User
from ..models.zoom_meeting import InterviewMeeting
from ..services.zoom_service import zoom_service
from .realtime import manager

router = APIRouter(tags=["Live 1-on-1 Zoom Interviews"])

class CreateZoomMeetingRequest(BaseModel):
    application_id: str
    candidate_id: Optional[str] = None
    job_id: Optional[str] = None

@router.post("/api/v1/interviews/zoom-create", dependencies=[Depends(enforce_api_rate_limit)])
@router.post("/api/interviews/zoom-create", dependencies=[Depends(enforce_api_rate_limit)])
async def create_zoom_meeting_endpoint(
    req: CreateZoomMeetingRequest,
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dynamically creates or retrieves a private 1-on-1 Zoom meeting for an interview:
    1. Validates candidate & application exist.
    2. Enforces company HR authority.
    3. Calls Zoom OAuth API to provision dedicated meeting room.
    4. Persists InterviewMeeting in DB linked to applicationId.
    5. Broadcasts real-time meeting alert to the candidate.
    """
    app_id = req.application_id.strip()
    cand = db.query(Candidate).options(
        joinedload(Candidate.job),
        joinedload(Candidate.company)
    ).filter(
        (Candidate.id == app_id) | 
        (Candidate.interview_token == app_id) |
        (Candidate.email == app_id)
    ).first()

    if not cand:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate or application record '{app_id}' not found."
        )

    # Authority check: Caller must be Company Admin, Recruiter, or Super Admin
    if current_user.role not in ("SUPER_ADMIN", "COMPANY_ADMIN", "RECRUITER", "EMPLOYEE"):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only verified Enterprise HR can launch live Zoom interviews."
        )

    if current_user.role != "SUPER_ADMIN" and current_user.company_id and current_user.company_id != cand.company_id:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized: Candidate belongs to another company workspace."
        )

    candidate_name = f"{cand.first_name} {cand.last_name}"
    job_title = cand.job.title if cand.job else "Robotics & Software Track"
    company_name = cand.company.name if cand.company else "Enterprise Workspace"

    # Check if an active meeting already exists in database
    existing_meeting = db.query(InterviewMeeting).filter(
        InterviewMeeting.application_id == cand.id,
        InterviewMeeting.status.in_(["SCHEDULED", "ACTIVE"])
    ).first()

    if existing_meeting:
        meeting_data = {
            "success": True,
            "meeting_id": existing_meeting.zoom_meeting_id,
            "passcode": existing_meeting.zoom_passcode,
            "start_url": existing_meeting.start_url,
            "join_url": existing_meeting.join_url,
            "web_client_host_url": f"https://app.zoom.us/wc/{existing_meeting.zoom_meeting_id}/start?pwd={existing_meeting.zoom_passcode}",
            "web_client_join_url": f"https://app.zoom.us/wc/{existing_meeting.zoom_meeting_id}/join?pwd={existing_meeting.zoom_passcode}",
            "host_sdk_signature": zoom_service.generate_sdk_signature(existing_meeting.zoom_meeting_id, role=1),
            "candidate_sdk_signature": zoom_service.generate_sdk_signature(existing_meeting.zoom_meeting_id, role=0),
            "topic": f"Ardhnarishwar AI 1-on-1 Live Interview: {candidate_name}"
        }
    else:
        # Dynamically create new meeting via Zoom REST API service
        meeting_data = await zoom_service.create_live_meeting(
            candidate_name=candidate_name,
            candidate_email=cand.email,
            job_title=job_title,
            company_name=company_name,
            application_id=cand.id
        )

        new_meeting = InterviewMeeting(
            id=f"meet_{uuid.uuid4().hex[:12]}",
            application_id=cand.id,
            candidate_id=cand.id,
            company_id=cand.company_id,
            job_id=cand.job_id,
            zoom_meeting_id=meeting_data["meeting_id"],
            zoom_passcode=meeting_data["passcode"],
            start_url=meeting_data["start_url"],
            join_url=meeting_data["join_url"],
            host_user_id=current_user.id,
            candidate_email=cand.email,
            status="ACTIVE",
            created_at=datetime.now(timezone.utc),
            launched_at=datetime.now(timezone.utc)
        )
        db.add(new_meeting)
        
        # Update candidate status to indicate live interview is in progress
        cand.status = "SHORTLISTED"
        db.commit()
        db.refresh(new_meeting)

    # Real-Time Broadcast: Alert Candidate in Candidate Portal immediately
    try:
        await manager.broadcast_all({
            "type": "INTERVIEW_MEETING_LAUNCHED",
            "timestamp": time.time(),
            "payload": {
                "application_id": cand.id,
                "candidate_id": cand.id,
                "candidate_email": cand.email,
                "candidate_name": candidate_name,
                "job_title": job_title,
                "company_name": company_name,
                "meeting_id": meeting_data["meeting_id"],
                "passcode": meeting_data["passcode"],
                "join_url": meeting_data["join_url"],
                "web_client_join_url": meeting_data.get("web_client_join_url"),
                "start_time": datetime.now(timezone.utc).isoformat()
            }
        })
    except Exception as exc:
        pass

    return {
        "success": True,
        "application_id": cand.id,
        "candidate_id": cand.id,
        "candidate_name": candidate_name,
        "job_title": job_title,
        "meeting_id": meeting_data["meeting_id"],
        "passcode": meeting_data["passcode"],
        "start_url": meeting_data["start_url"],
        "join_url": meeting_data["join_url"],
        "web_client_host_url": meeting_data.get("web_client_host_url"),
        "web_client_join_url": meeting_data.get("web_client_join_url"),
        "host_sdk_signature": meeting_data.get("host_sdk_signature"),
        "role": 1, # Host
        "status": "ACTIVE"
    }


@router.get("/api/v1/interviews/{application_id}/meet-credentials")
@router.get("/api/interviews/{application_id}/meet-credentials")
async def get_meet_credentials_endpoint(
    application_id: str,
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    STRICT IDENTITY & AUTHORIZATION GATEKEEPER:
    - If user is the HR/Recruiter who posted the job: returns Host credentials (role: 1, start_url).
    - If user is the shortlisted Candidate: returns Attendee credentials (role: 0, join_url).
    - If user is ANYONE ELSE: Returns 403 Forbidden.
    """
    app_id = application_id.strip()
    cand = db.query(Candidate).options(
        joinedload(Candidate.job),
        joinedload(Candidate.company)
    ).filter(
        (Candidate.id == app_id) | 
        (Candidate.interview_token == app_id) |
        (Candidate.email == app_id)
    ).first()

    if not cand:
        raise HTTPException(
            status_code=404,
            detail=f"Interview meeting for application '{app_id}' not found."
        )

    # Fetch active or latest meeting record
    meeting = db.query(InterviewMeeting).filter(
        InterviewMeeting.application_id == cand.id
    ).order_by(InterviewMeeting.created_at.desc()).first()

    if not meeting:
        # Auto-create if not yet created
        created = await zoom_service.create_live_meeting(
            candidate_name=f"{cand.first_name} {cand.last_name}",
            candidate_email=cand.email,
            job_title=cand.job.title if cand.job else "Interview Track",
            company_name=cand.company.name if cand.company else "Enterprise",
            application_id=cand.id
        )
        meeting = InterviewMeeting(
            id=f"meet_{uuid.uuid4().hex[:12]}",
            application_id=cand.id,
            candidate_id=cand.id,
            company_id=cand.company_id,
            job_id=cand.job_id,
            zoom_meeting_id=created["meeting_id"],
            zoom_passcode=created["passcode"],
            start_url=created["start_url"],
            join_url=created["join_url"],
            candidate_email=cand.email,
            status="ACTIVE",
            created_at=datetime.now(timezone.utc),
            launched_at=datetime.now(timezone.utc)
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)

    candidate_name = f"{cand.first_name} {cand.last_name}"
    job_title = cand.job.title if cand.job else "Position"

    # Authorization verification
    is_hr = (
        current_user.role in ("SUPER_ADMIN", "COMPANY_ADMIN", "RECRUITER", "EMPLOYEE") and
        (current_user.role == "SUPER_ADMIN" or current_user.company_id == cand.company_id)
    )
    is_candidate = (
        current_user.role == "CANDIDATE" and
        (current_user.id == cand.id or current_user.email.lower() == cand.email.lower())
    )

    if not is_hr and not is_candidate:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized entry: Live interview is private between company HR and selected candidate."
        )

    if is_hr:
        # Return Host credentials with Host role
        return {
            "access_granted": True,
            "role": 1, # Host
            "role_title": "Enterprise Interviewer (Host)",
            "application_id": cand.id,
            "candidate_id": cand.id,
            "candidate_name": candidate_name,
            "candidate_email": cand.email,
            "job_title": job_title,
            "meeting_id": meeting.zoom_meeting_id,
            "passcode": meeting.zoom_passcode,
            "start_url": meeting.start_url,
            "join_url": meeting.join_url,
            "web_client_url": f"https://app.zoom.us/wc/{meeting.zoom_meeting_id}/start?pwd={meeting.zoom_passcode}",
            "sdk_signature": zoom_service.generate_sdk_signature(meeting.zoom_meeting_id, role=1),
            "status": meeting.status
        }
    else:
        # Return Attendee credentials with Attendee role
        return {
            "access_granted": True,
            "role": 0, # Attendee
            "role_title": "Shortlisted Candidate (Attendee)",
            "application_id": cand.id,
            "candidate_id": cand.id,
            "candidate_name": candidate_name,
            "candidate_email": cand.email,
            "job_title": job_title,
            "meeting_id": meeting.zoom_meeting_id,
            "passcode": meeting.zoom_passcode,
            "start_url": None, # Never expose Host Start URL to candidates
            "join_url": meeting.join_url,
            "web_client_url": f"https://app.zoom.us/wc/{meeting.zoom_meeting_id}/join?pwd={meeting.zoom_passcode}",
            "sdk_signature": zoom_service.generate_sdk_signature(meeting.zoom_meeting_id, role=0),
            "status": meeting.status
        }
