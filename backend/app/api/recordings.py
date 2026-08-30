"""
Ardhnarishwar SaaS - Secure Recording API Endpoints
Endpoints:
- POST /api/v1/recordings/upload (Upload video with candidate token)
- GET /api/v1/recordings/{session_id}/presigned-url (Generate time-limited signed URL with cryptographic JWT check)
- GET /api/v1/recordings/stream/{signed_token} (Stream video with HTTP 206 Partial Content range seeking)
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
import os
import re

from ..core.database import get_db
from ..core.security import get_current_user, AuthenticatedIdentity
from ..services.recording_service import RecordingSecurityService

router = APIRouter(prefix="/api/v1/recordings", tags=["Video Recording Lifecycle & Storage"])

@router.post("/upload")
async def upload_candidate_recording(
    session_id: str = Form(...),
    candidate_token: str = Form(...),
    duration_sec: int = Form(120),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Candidate uploads interview video blob upon completing interview questions.
    Validates candidate token, stores in isolated directory, writes MySQL metadata.
    """
    video_bytes = await file.read()
    if len(video_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty video file provided.")

    result = RecordingSecurityService.save_candidate_recording(
        db=db,
        session_id=session_id,
        video_bytes=video_bytes,
        candidate_token=candidate_token,
        duration_sec=duration_sec
    )
    return {
        "success": True,
        "message": "Recording uploaded and permanently archived to isolated storage vault.",
        "data": result
    }


@router.get("/{session_id}/presigned-url")
def get_recording_presigned_playback_url(
    session_id: str,
    current_user: AuthenticatedIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a 15-minute cryptographically signed playback token.
    Enforces ZERO-TRUST authorization: Identity and tenant are extracted from verified JWT,
    NEVER from untrusted client headers.
    """
    session, signed_token = RecordingSecurityService.authorize_recording_access(
        db=db,
        session_id=session_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_company_id=current_user.company_id
    )

    return {
        "success": True,
        "session_id": session_id,
        "company_id": session.company_id,
        "playback_url": f"/api/v1/recordings/stream/{signed_token}",
        "expires_in_seconds": 900,
        "authorized_role": current_user.role,
        "authenticated_user_id": current_user.id
    }


@router.get("/stream/{signed_token}")
def stream_recording_chunked(
    signed_token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Streams video with HTTP 206 Partial Content range header support.
    Allows recruiter to jump to specific question timestamps instantly.
    Direct file access without valid signed token is rejected with HTTP 403.
    """
    session_id, company_id, actor_id = RecordingSecurityService.verify_signed_streaming_token(signed_token)

    from ..models import InterviewSession
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session or not session.video_storage_path or not os.path.exists(session.video_storage_path):
        raise HTTPException(status_code=404, detail="Video file not found.")

    file_path = session.video_storage_path
    file_size = os.path.getsize(file_path)
    range_header = request.headers.get('range')

    if range_header:
        byte1, byte2 = 0, None
        match = re.search(r'(\d+)-(\d*)', range_header)
        if match:
            groups = match.groups()
            byte1 = int(groups[0])
            if groups[1]:
                byte2 = int(groups[1])

        if byte2 is None:
            byte2 = file_size - 1

        length = byte2 - byte1 + 1

        def iterfile():
            with open(file_path, 'rb') as f:
                f.seek(byte1)
                remaining = length
                while remaining > 0:
                    chunk_size = min(64 * 1024, remaining)
                    data = f.read(chunk_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        headers = {
            'Content-Range': f'bytes {byte1}-{byte2}/{file_size}',
            'Accept-Ranges': 'bytes',
            'Content-Length': str(length),
            'Content-Type': 'video/webm',
        }
        return StreamingResponse(iterfile(), status_code=206, headers=headers)

    def iterfile_full():
        with open(file_path, 'rb') as f:
            while chunk := f.read(64 * 1024):
                yield chunk

    return StreamingResponse(
        iterfile_full(),
        media_type='video/webm',
        headers={
            'Accept-Ranges': 'bytes',
            'Content-Length': str(file_size),
            'Content-Type': 'video/webm'
        }
    )
