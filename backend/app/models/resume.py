"""
SQLAlchemy ORM Model: Resume
Handles candidate resume metadata, storage path, file validation, and candidate/company linkage.
"""
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(64), primary_key=True)
    candidate_id = Column(String(64), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True) # Optional direct company tenant link
    file_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    file_type = Column(String(100), nullable=False) # e.g. application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
    status = Column(
        Enum('PENDING', 'PARSED', 'VERIFIED', 'ACTIVE', 'ARCHIVED', name='resume_status_enum'),
        nullable=False,
        default='ACTIVE'
    )
    parsed_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate = relationship("Candidate", back_populates="resumes")
    company = relationship("Company")

    __table_args__ = (
        Index('idx_resumes_candidate', 'candidate_id'),
        Index('idx_resumes_company', 'company_id'),
        Index('idx_resumes_status', 'status'),
    )
