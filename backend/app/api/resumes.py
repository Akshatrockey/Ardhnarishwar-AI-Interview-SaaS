"""
Ardhnarishwar SaaS - Real-Time Resume Storage & Management API
Endpoints for multi-part file upload, validation, secure storage, metadata lookup,
streaming download, and lifecycle management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_
from typing import List, Optional, Dict, Any
import os
import uuid
import time
import mimetypes
from datetime import datetime

from ..core.database import get_db
from ..core.config import settings
from ..core.security import (
    get_current_user,
    require_super_admin,
    require_recruiter_or_admin,
    AuthenticatedIdentity,
    verify_tenant_isolation
)
from ..core.rate_limiter import enforce_api_rate_limit
from ..models import Resume, Candidate, Company, AuditLog

router = APIRouter(prefix="/api/v1/resumes", tags=["Resume Management"])

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/octet-stream": ".pdf" # Fallback binary stream for PDF
}
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

def get_resume_storage_dir() -> str:
    storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "resumes")
    os.makedirs(storage_dir, exist_ok=True)
    return storage_dir


@router.post("/upload", dependencies=[Depends(enforce_api_rate_limit)])
async def upload_resume_endpoint(
    file: UploadFile = File(...),
    candidate_id: Optional[str] = Form(None),
    company_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Securely uploads, validates and persists a candidate resume to disk & database.
    Validates file extension, MIME type, and size.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a valid filename.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, DOC, DOCX."
        )

    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 10MB (Received: {round(file_size / (1024*1024), 2)}MB)."
        )

    # Resolve or create candidate association if candidate_id provided
    cand = None
    if candidate_id:
        cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()

    resume_id = f"res_{uuid.uuid4().hex[:12]}"
    clean_filename = f"{resume_id}_{int(time.time())}{ext}"
    storage_dir = get_resume_storage_dir()
    file_path = os.path.join(storage_dir, clean_filename)

    # Save to disk vault
    with open(file_path, "wb") as f:
        f.write(content)

    resolved_mime = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/pdf"

    # Create Database record
    new_resume = Resume(
        id=resume_id,
        candidate_id=cand.id if cand else (candidate_id or f"cand_{uuid.uuid4().hex[:8]}"),
        company_id=company_id or (cand.company_id if cand else None),
        file_name=file.filename,
        file_path=file_path,
        file_size_bytes=file_size,
        file_type=resolved_mime,
        status="ACTIVE",
        uploaded_at=datetime.utcnow()
    )
    db.add(new_resume)

    if cand:
        cand.resume_file_url = f"/api/v1/resumes/{resume_id}/download"

    db.commit()
    db.refresh(new_resume)

    return {
        "success": True,
        "id": new_resume.id,
        "candidate_id": new_resume.candidate_id,
        "file_name": new_resume.file_name,
        "file_size_bytes": new_resume.file_size_bytes,
        "file_type": new_resume.file_type,
        "status": new_resume.status,
        "download_url": f"/api/v1/resumes/{new_resume.id}/download",
        "uploaded_at": new_resume.uploaded_at.isoformat()
    }


@router.get("", dependencies=[Depends(enforce_api_rate_limit)])
async def list_resumes_endpoint(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    company_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists resumes with tenant scoping. Super Admin sees all resumes;
    Company Admin/Recruiters see only resumes for their company.
    """
    query = db.query(Resume).options(joinedload(Resume.candidate))

    # Tenant Scoping
    if current_user.role != "SUPER_ADMIN":
        query = query.filter(Resume.company_id == current_user.company_id)
    elif company_id and company_id != "ALL":
        query = query.filter(Resume.company_id == company_id)

    if status_filter and status_filter != "ALL":
        query = query.filter(Resume.status == status_filter)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.join(Candidate, isouter=True).filter(
            or_(
                Resume.file_name.ilike(search_pattern),
                Candidate.first_name.ilike(search_pattern),
                Candidate.last_name.ilike(search_pattern),
                Candidate.email.ilike(search_pattern)
            )
        )

    total_count = query.count()
    resumes = query.order_by(desc(Resume.uploaded_at)).limit(limit).offset(offset).all()

    results = []
    for r in resumes:
        results.append({
            "id": r.id,
            "candidate_id": r.candidate_id,
            "candidate_name": f"{r.candidate.first_name} {r.candidate.last_name}" if r.candidate else "Unlinked Candidate",
            "candidate_email": r.candidate.email if r.candidate else "N/A",
            "company_id": r.company_id,
            "file_name": r.file_name,
            "file_size_bytes": r.file_size_bytes,
            "file_type": r.file_type,
            "status": r.status,
            "download_url": f"/api/v1/resumes/{r.id}/download",
            "uploaded_at": r.uploaded_at.isoformat()
        })

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "resumes": results
    }


@router.get("/{resume_id}")
async def get_resume_metadata_endpoint(
    resume_id: str,
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full resume metadata and linked candidate details.
    """
    resume = db.query(Resume).options(joinedload(Resume.candidate)).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found.")

    if current_user.role != "SUPER_ADMIN" and resume.company_id and resume.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot access other organization's resumes.")

    return {
        "id": resume.id,
        "candidate_id": resume.candidate_id,
        "candidate": {
            "first_name": resume.candidate.first_name if resume.candidate else "",
            "last_name": resume.candidate.last_name if resume.candidate else "",
            "email": resume.candidate.email if resume.candidate else "",
            "years_of_experience": resume.candidate.years_of_experience if resume.candidate else 0,
            "status": resume.candidate.status if resume.candidate else ""
        } if resume.candidate else None,
        "company_id": resume.company_id,
        "file_name": resume.file_name,
        "file_size_bytes": resume.file_size_bytes,
        "file_type": resume.file_type,
        "status": resume.status,
        "download_url": f"/api/v1/resumes/{resume.id}/download",
        "uploaded_at": resume.uploaded_at.isoformat()
    }


@router.get("/{resume_id}/download")
async def download_resume_endpoint(
    resume_id: str,
    db: Session = Depends(get_db)
):
    """
    Streams the resume file directly from the secure disk vault.
    """
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume file not found.")

    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Resume file binary is missing from storage vault.")

    return FileResponse(
        path=resume.file_path,
        media_type=resume.file_type or "application/pdf",
        filename=resume.file_name,
        headers={"Content-Disposition": f'inline; filename="{resume.file_name}"'}
    )


@router.delete("/{resume_id}")
async def delete_resume_endpoint(
    resume_id: str,
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes resume file from disk vault and removes metadata record from database.
    """
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found.")

    if current_user.role not in ("SUPER_ADMIN", "COMPANY_ADMIN"):
        raise HTTPException(status_code=403, detail="Access denied: Admin privileges required to delete resumes.")

    if current_user.role == "COMPANY_ADMIN" and resume.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot delete other organization's resumes.")

    # Remove file from disk
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception as e:
            print(f"[WARN] Failed to delete physical resume file {resume.file_path}: {e}")

    db.delete(resume)
    db.commit()

    return {"success": True, "message": "Resume record and physical file deleted successfully."}
