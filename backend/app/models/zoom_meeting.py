"""
SQLAlchemy ORM Model: InterviewMeeting (Live 1-on-1 Zoom Interview Integration)
Strictly maps live meetings between Enterprise HR and shortlisted candidates.
"""
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..core.database import Base

class InterviewMeeting(Base):
    __tablename__ = "interview_meetings"

    id = Column(String(64), primary_key=True)
    application_id = Column(String(64), nullable=False, index=True)
    candidate_id = Column(String(64), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(64), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    zoom_meeting_id = Column(String(64), nullable=False)
    zoom_passcode = Column(String(64), nullable=False)
    start_url = Column(Text, nullable=False)   # HR Host launch URL
    join_url = Column(Text, nullable=False)    # Candidate join URL
    host_user_id = Column(String(64), nullable=True) # HR who launched/owns meeting
    candidate_email = Column(String(255), nullable=False)
    status = Column(
        Enum('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', name='meeting_status_enum'),
        nullable=False,
        default='SCHEDULED'
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    launched_at = Column(DateTime, nullable=True)

    # Relationships
    candidate = relationship("Candidate", foreign_keys=[candidate_id])
    company = relationship("Company", foreign_keys=[company_id])
    job = relationship("Job", foreign_keys=[job_id])

    __table_args__ = (
        Index('idx_meeting_app_status', 'application_id', 'status'),
        Index('idx_meeting_candidate', 'candidate_id'),
    )
