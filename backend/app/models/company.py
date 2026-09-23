"""
SQLAlchemy ORM Models: Company & Subscription
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum, ForeignKey, Numeric, Text, Index, JSON
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
    legal_name = Column(String(255), nullable=True)
    display_name = Column(String(255), nullable=True)
    favicon_url = Column(Text, nullable=True)
    brand_accent_color = Column(String(32), nullable=True, default='#06B6D4')
    website = Column(String(255), nullable=True)
    tax_id = Column(String(100), nullable=True)  # CIN / GSTIN / Tax ID
    company_size = Column(String(50), nullable=True, default='51-200 employees')
    description = Column(Text, nullable=True)
    hq_street = Column(String(255), nullable=True)
    hq_city = Column(String(100), nullable=True)
    hq_state = Column(String(100), nullable=True)
    hq_country = Column(String(100), nullable=True)
    hq_postal_code = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    support_email = Column(String(255), nullable=True)
    timezone = Column(String(100), nullable=True, default='UTC')
    currency = Column(String(20), nullable=True, default='USD')
    date_format = Column(String(50), nullable=True, default='YYYY-MM-DD')
    work_week = Column(String(100), nullable=True, default='Monday - Friday')
    social_links = Column(JSON, nullable=True)
    data_retention_days = Column(Integer, nullable=True, default=365)
    default_permissions = Column(JSON, nullable=True)
    security_contact_email = Column(String(255), nullable=True)
    settings_metadata = Column(JSON, nullable=True)
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
