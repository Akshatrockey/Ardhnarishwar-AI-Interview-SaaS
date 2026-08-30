"""
SQLAlchemy ORM Models: Company & Subscription
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum, ForeignKey, Numeric, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    domain = Column(String(255), nullable=False, unique=True)
    logo_url = Column(Text, nullable=True)
    plan_tier = Column(Enum('STARTER', 'GROWTH', 'ENTERPRISE_ROBOTICS', name='company_plan_enum'), nullable=False, default='GROWTH')
    status = Column(Enum('ACTIVE', 'INACTIVE', 'TRIAL', 'SUSPENDED', name='company_status_enum'), nullable=False, default='ACTIVE')
    max_jobs = Column(Integer, nullable=False, default=20)
    max_candidates_per_month = Column(Integer, nullable=False, default=500)
    max_employees = Column(Integer, nullable=False, default=1000)
    contact_email = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=False)
    industry = Column(String(150), nullable=False)
    ai_custom_rules_enabled = Column(Boolean, nullable=False, default=False)
    recording_storage_used_mb = Column(Integer, nullable=False, default=0)
    recording_storage_quota_mb = Column(Integer, nullable=False, default=10000)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships with cascade deletion
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="company", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")
    candidates = relationship("Candidate", back_populates="company", cascade="all, delete-orphan")
    sessions = relationship("InterviewSession", back_populates="company", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="company", cascade="all, delete-orphan")

    # Composite Indexes
    __table_args__ = (
        Index('idx_company_status', 'status'),
        Index('idx_company_domain', 'domain'),
    )


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(64), primary_key=True)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    plan_tier = Column(Enum('STARTER', 'GROWTH', 'ENTERPRISE_ROBOTICS', name='sub_plan_enum'), nullable=False)
    billing_cycle = Column(Enum('MONTHLY', 'ANNUAL', name='billing_cycle_enum'), nullable=False, default='MONTHLY')
    price_per_month = Column(Numeric(10, 2), nullable=False)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    status = Column(Enum('ACTIVE', 'PAST_DUE', 'CANCELLED', name='sub_status_enum'), nullable=False, default='ACTIVE')
    payment_method = Column(String(50), default='STRIPE_INVOICE')
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationship
    company = relationship("Company", back_populates="subscriptions")

    __table_args__ = (
        Index('idx_sub_company_status', 'company_id', 'status'),
    )
