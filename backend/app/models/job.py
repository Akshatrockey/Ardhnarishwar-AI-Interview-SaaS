"""
SQLAlchemy ORM Models: Job, InterviewRound, QuestionBank, RoundQuestion
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum, ForeignKey, Numeric, Text, JSON, Index, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

# Association Table for Many-to-Many between InterviewRound and QuestionBank
round_questions = Table(
    'round_questions',
    Base.metadata,
    Column('round_id', String(64), ForeignKey('interview_rounds.id', ondelete='CASCADE'), primary_key=True),
    Column('question_id', String(64), ForeignKey('question_banks.id', ondelete='CASCADE'), primary_key=True),
    Column('sequence_order', Integer, nullable=False, default=1)
)

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(64), primary_key=True)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    department = Column(String(150), nullable=False)
    location = Column(String(255), nullable=False)
    job_type = Column(Enum('FULL_TIME', 'CONTRACT', 'REMOTE', 'HYBRID', name='job_type_enum'), nullable=False, default='FULL_TIME')
    experience_level = Column(Enum('ENTRY', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL', name='exp_level_enum'), nullable=False, default='SENIOR')
    skill_category = Column(String(32), nullable=False, default='SKILLED') # 'SKILLED', 'UNSKILLED', 'SEMI_SKILLED'
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, nullable=False, default=list) # JSON Array of strings
    status = Column(Enum('OPEN', 'CLOSED', 'DRAFT', name='job_status_enum'), nullable=False, default='OPEN')
    total_applicants = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="jobs")
    rounds = relationship("InterviewRound", back_populates="job", cascade="all, delete-orphan")
    candidates = relationship("Candidate", back_populates="job", cascade="all, delete-orphan")
    sessions = relationship("InterviewSession", back_populates="job", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_jobs_company_status', 'company_id', 'status'),
    )


class InterviewRound(Base):
    __tablename__ = "interview_rounds"

    id = Column(String(64), primary_key=True)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(64), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    round_number = Column(Integer, nullable=False, default=1)
    round_type = Column(
        Enum('AI_SCREENING', 'TECHNICAL_ROBOTICS', 'SOFTWARE_SYSTEMS', 'PRACTICAL_OPERATIONS', 'GENERAL_APTITUDE', 'HR_BEHAVIORAL', 'LEADERSHIP_PROBLEM_SOLVING', name='round_type_enum'),
        nullable=False
    )
    time_limit_minutes = Column(Integer, nullable=False, default=20)
    passing_score = Column(Numeric(5, 2), nullable=False, default=70.00)
    allow_retake = Column(Boolean, nullable=False, default=False)
    proctoring_strictness = Column(Enum('STANDARD', 'STRICT', 'MILITARY_GRADE', name='strictness_enum'), nullable=False, default='MILITARY_GRADE')
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="rounds")
    questions = relationship("QuestionBank", secondary=round_questions, back_populates="rounds")
    sessions = relationship("InterviewSession", back_populates="round", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_rounds_job', 'job_id'),
    )


class QuestionBank(Base):
    __tablename__ = "question_banks"

    id = Column(String(64), primary_key=True)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True) # Null for Super Admin global
    category = Column(
        Enum('TECHNICAL', 'HR', 'BEHAVIORAL', 'PROBLEM_SOLVING', 'PRACTICAL_SAFETY', 'OPERATIONAL_WORKFLOW', 'ROBOTICS_HARDWARE', 'CONTROL_SYSTEMS', 'EMBEDDED_C_CPP', name='question_cat_enum'),
        nullable=False
    )
    role_category = Column(String(150), nullable=False, default='GENERAL')
    target_skill_level = Column(String(32), nullable=False, default='ALL') # 'SKILLED', 'UNSKILLED', 'ALL'
    difficulty = Column(Enum('EASY', 'MEDIUM', 'HARD', name='difficulty_enum'), nullable=False, default='MEDIUM')
    title = Column(String(255), nullable=False)
    prompt = Column(Text, nullable=False)
    expected_duration_sec = Column(Integer, nullable=False, default=120)
    ideal_benchmark_answer = Column(Text, nullable=False)
    key_concepts = Column(JSON, nullable=False, default=list)   # Array of required concept strings
    anti_patterns = Column(JSON, nullable=False, default=list)  # Array of penalized misconceptions
    rubric_weights = Column(JSON, nullable=False, default=lambda: {"technical": 0.45, "relevance": 0.30, "communication": 0.25}) # Object with dimension weight multipliers
    is_global = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    rounds = relationship("InterviewRound", secondary=round_questions, back_populates="questions")
    candidate_answers = relationship("CandidateAnswer", back_populates="question")

    __table_args__ = (
        Index('idx_qb_category', 'category'),
        Index('idx_qb_role', 'role_category'),
    )
