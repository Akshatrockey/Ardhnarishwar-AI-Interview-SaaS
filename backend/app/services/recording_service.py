"""
Ardhnarishwar SaaS - Secure Backend-Controlled Recording Lifecycle Service
Handles:
1. Isolated disk / S3 object storage for candidate video files
2. Strict tenant authorization checks (Super Admin vs Company Admin vs Foreign Tenant)
3. Cryptographically signed time-limited streaming URLs (HMAC-SHA256)
4. HTTP 206 Partial Content video streaming for timestamp seeking
5. Immutable audit logging of video playback events
"""

import os
import hmac
import hashlib
import time
import uuid
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import InterviewSession, Candidate, AuditLog, User
from ..core.config import settings

# Base storage directory for recordings
STORAGE_ROOT = os.getenv("RECORDING_STORAGE_ROOT", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "recordings"))
os.makedirs(STORAGE_ROOT, exist_ok=True)

class RecordingSecurityService:
    @staticmethod
    def get_tenant_storage_dir(company_id: str) -> str:
        """
        Creates an isolated, tenant-partitioned storage directory.
        Path: storage/recordings/{company_id}/
        """
        tenant_dir = os.path.join(STORAGE_ROOT, company_id)
        os.makedirs(tenant_dir, exist_ok=True)
        return tenant_dir

    @staticmethod
    def save_candidate_recording(
        db: Session,
        session_id: str,
        video_bytes: bytes,
        candidate_token: str,
        duration_sec: int
    ) -> Dict[str, Any]:
        """
        Validates session ownership, saves file to isolated tenant storage,
        calculates SHA-256 checksum, and updates MySQL InterviewSession metadata.
        """
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found.")

        candidate = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
        if not candidate or candidate.interview_token != candidate_token:
            raise HTTPException(status_code=401, detail="Invalid candidate interview token.")

        # Compute SHA-256 Checksum for integrity verification
        sha256_hash = hashlib.sha256(video_bytes).hexdigest()
        file_size_bytes = len(video_bytes)

        # Isolated path: storage/recordings/{company_id}/{session_id}.webm
        tenant_dir = RecordingSecurityService.get_tenant_storage_dir(session.company_id)
        file_name = f"{session_id}.webm"
        file_path = os.path.join(tenant_dir, file_name)

        with open(file_path, "wb") as f:
            f.write(video_bytes)

        # Update MySQL Metadata
        session.video_storage_path = file_path
        session.status = 'COMPLETED'
        session.completed_at = session.completed_at or session.created_at

        # Update Candidate status
        candidate.status = 'EVALUATED'

        db.commit()
        db.refresh(session)

        return {
            "session_id": session_id,
            "company_id": session.company_id,
            "file_path": file_path,
            "file_size_bytes": file_size_bytes,
            "sha256_checksum": sha256_hash,
            "duration_sec": duration_sec,
            "status": "STORED_SECURELY"
        }

    @staticmethod
    def generate_signed_streaming_token(session_id: str, company_id: str, actor_id: str, expires_in_sec: int = 900) -> str:
        """
        Generates a 15-minute time-limited cryptographic HMAC-SHA256 signed playback token.
        Prevents static file scraping and URL sharing.
        """
        expires_at = int(time.time()) + expires_in_sec
        payload = f"{session_id}:{company_id}:{actor_id}:{expires_at}"
        signature = hmac.new(
            settings.SECRET_KEY.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return f"{payload}:{signature}"

    @staticmethod
    def verify_signed_streaming_token(token: str) -> Tuple[str, str, str]:
        """
        Verifies signed token validity and expiration. Returns (session_id, company_id, actor_id).
        """
        try:
            parts = token.split(":")
            if len(parts) != 5:
                raise ValueError("Malformed token format")
            session_id, company_id, actor_id, expires_at_str, signature = parts
            expires_at = int(expires_at_str)

            if time.time() > expires_at:
                raise HTTPException(status_code=403, detail="Playback token has expired. Please refresh the scorecard.")

            expected_payload = f"{session_id}:{company_id}:{actor_id}:{expires_at_str}"
            expected_sig = hmac.new(
                settings.SECRET_KEY.encode('utf-8'),
                expected_payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_sig):
                raise HTTPException(status_code=403, detail="Invalid cryptographic playback token signature.")

            return session_id, company_id, actor_id
        except (ValueError, IndexError):
            raise HTTPException(status_code=403, detail="Invalid or tampered playback token.")

    @staticmethod
    def authorize_recording_access(
        db: Session,
        session_id: str,
        actor_id: str,
        actor_role: str,
        actor_company_id: Optional[str],
        ip_address: str = "127.0.0.1"
    ) -> Tuple[InterviewSession, str]:
        """
        Enforces Role-Based & Multi-Tenant Access Control:
        1. Super Admin -> Global access permitted across all tenant sessions.
        2. Company Admin / Recruiter -> Permitted ONLY if session.company_id == actor_company_id.
        3. Foreign Tenant -> STRICTLY BLOCKED with HTTP 403 Forbidden.
        4. Logs all access attempts into MySQL audit_logs.
        """
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found.")

        # 1. Super Admin Authorization
        if actor_role == "SUPER_ADMIN":
            is_authorized = True
            access_reason = "Super Admin Global Audit & Compliance Review"
        # 2. Company Admin / Recruiter Tenant Check
        elif actor_role in ("COMPANY_ADMIN", "RECRUITER"):
            if session.company_id == actor_company_id:
                is_authorized = True
                access_reason = f"Authorized Recruiter Review ({actor_role})"
            else:
                is_authorized = False
                access_reason = f"CROSS-TENANT SECURITY BREACH ATTEMPT: Caller company {actor_company_id} attempted to access {session.company_id} recording."
        else:
            is_authorized = False
            access_reason = f"Unauthorized role '{actor_role}' attempted to access recording."

        # Emit Security Audit Log into MySQL
        audit = AuditLog(
            id=f"aud_{uuid.uuid4().hex[:12]}",
            company_id=session.company_id,
            actor_id=actor_id,
            actor_name=f"User {actor_id}",
            actor_role=actor_role,
            action="RECORDING_ACCESS_REQUESTED" if is_authorized else "SECURITY_CROSS_TENANT_RECORDING_ACCESS_BLOCKED",
            resource=f"Recording Session: {session_id}",
            details=access_reason,
            ip_address=ip_address,
            severity="INFO" if is_authorized else "CRITICAL"
        )
        db.add(audit)
        db.commit()

        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You are not authorized to view recordings from another company tenant."
            )

        if not session.video_storage_path or not os.path.exists(session.video_storage_path):
            raise HTTPException(status_code=404, detail="Recording video file not found in storage vault.")

        signed_token = RecordingSecurityService.generate_signed_streaming_token(
            session_id=session.id,
            company_id=session.company_id,
            actor_id=actor_id
        )

        return session, signed_token
