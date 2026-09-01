"""
SQLAlchemy ORM Models: Candidate, InterviewSession, CandidateAnswer, AIEvaluationReport
"""
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, Numeric, Text, JSON, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(64), primary_key=True)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(64), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    skill_category = Column(String(32), nullable=False, default='SKILLED')
    current_title = Column(String(150), nullable=True)
    years_of_experience = Column(Integer, nullable=False, default=0)
    status = Column(
        Enum('INVITED', 'IN_PROGRESS', 'EVALUATED', 'SHORTLISTED', 'REJECTED', 'HIRED', name='candidate_status_enum'),
        nullable=False,
        default='INVITED'
    )
    interview_token = Column(String(128), nullable=False, unique=True)
    resume_file_url = Column(Text, nullable=True)
    applied_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="candidates")
    job = relationship("Job", back_populates="candidates")
    sessions = relationship("InterviewSession", back_populates="candidate", cascade="all, delete-orphan")
    ai_reports = relationship("AIEvaluationReport", back_populates="candidate", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="candidate", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_candidates_company_job', 'company_id', 'job_id'),
        Index('idx_candidates_status', 'status'),
        Index('idx_candidates_token', 'interview_token'),
    )


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(64), primary_key=True)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(String(64), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(64), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    round_id = Column(String(64), ForeignKey("interview_rounds.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(
        Enum('SCHEDULED', 'RECORDING', 'ANALYZING', 'COMPLETED', 'ABANDONED', name='session_status_enum'),
        nullable=False,
        default='SCHEDULED'
    )
    overall_score = Column(Numeric(5, 2), nullable=True)
    recommendation = Column(
        Enum('STRONG_HIRE', 'HIRE', 'LEANING_HIRE', 'LEANING_NO_HIRE', 'STRONG_NO_HIRE', name='rec_enum'),
        nullable=True
    )
    video_storage_path = Column(Text, nullable=True)
    audio_storage_path = Column(Text, nullable=True)
    system_diagnostics = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="sessions")
    candidate = relationship("Candidate", back_populates="sessions")
    job = relationship("Job", back_populates="sessions")
    round = relationship("InterviewRound", back_populates="sessions")
    answers = relationship("CandidateAnswer", back_populates="session", cascade="all, delete-orphan")
    ai_report = relationship("AIEvaluationReport", back_populates="session", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_sessions_company_status', 'company_id', 'status'),
    )


class CandidateAnswer(Base):
    __tablename__ = "candidate_answers"

    id = Column(String(64), primary_key=True)
    session_id = Column(String(64), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(64), ForeignKey("question_banks.id", ondelete="CASCADE"), nullable=False)
    video_timestamp_start = Column(Integer, nullable=False, default=0) # Seconds
    video_timestamp_end = Column(Integer, nullable=False, default=0)   # Seconds
    transcript = Column(Text, nullable=False)
    duration_sec = Column(Integer, nullable=False, default=0)
    score = Column(Numeric(5, 2), nullable=False, default=0.00)
    feedback = Column(Text, nullable=False)
    relevance_score = Column(Numeric(5, 2), nullable=False)
    technical_score = Column(Numeric(5, 2), nullable=False)
    communication_score = Column(Numeric(5, 2), nullable=False)
    problem_solving_score = Column(Numeric(5, 2), nullable=False)
    confidence_score = Column(Numeric(5, 2), nullable=False)
    role_competency_score = Column(Numeric(5, 2), nullable=False)
    identified_concepts = Column(JSON, nullable=False)
    missing_concepts = Column(JSON, nullable=False)
    filler_word_count = Column(Integer, nullable=False, default=0)
    wpm = Column(Integer, nullable=False, default=0)
    speech_hesitation_ratio = Column(Numeric(4, 2), nullable=False, default=0.00)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("QuestionBank", back_populates="candidate_answers")

    __table_args__ = (
        Index('idx_answers_session', 'session_id'),
    )


class AIEvaluationReport(Base):
    __tablename__ = "ai_evaluation_reports"

    id = Column(String(64), primary_key=True)
    session_id = Column(String(64), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    candidate_id = Column(String(64), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    ai_model_version_id = Column(String(64), ForeignKey("ai_model_versions.id", ondelete="SET NULL"), nullable=True)
    overall_score = Column(Numeric(5, 2), nullable=False)
    recommendation = Column(
        Enum('STRONG_HIRE', 'HIRE', 'LEANING_HIRE', 'LEANING_NO_HIRE', 'STRONG_NO_HIRE', name='ai_rec_enum'),
        nullable=False
    )
    relevance_avg = Column(Numeric(5, 2), nullable=False)
    technical_avg = Column(Numeric(5, 2), nullable=False)
    communication_avg = Column(Numeric(5, 2), nullable=False)
    problem_solving_avg = Column(Numeric(5, 2), nullable=False)
    confidence_avg = Column(Numeric(5, 2), nullable=False)
    role_competency_avg = Column(Numeric(5, 2), nullable=False)
    strengths = Column(JSON, nullable=False)
    weaknesses = Column(JSON, nullable=False)
    red_flags = Column(JSON, nullable=False)
    executive_summary = Column(Text, nullable=False)
    star_analysis = Column(JSON, nullable=True)
    
    # Complete Auditable Snapshot for Deterministic Reproducibility
    model_version_snapshot = Column(JSON, nullable=False) # Complete frozen scoring, feature & rule configs
    reproducibility_hash = Column(String(64), nullable=False) # SHA-256 (transcript + rubric + version_config)
    
    generated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    session = relationship("InterviewSession", back_populates="ai_report")
    candidate = relationship("Candidate", back_populates="ai_reports")
    model_version = relationship("AIModelVersion")
