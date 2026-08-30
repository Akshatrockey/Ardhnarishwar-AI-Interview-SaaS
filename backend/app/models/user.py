"""
SQLAlchemy ORM Models: User & AuditLog
"""
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True) # Null for Super Admin
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(
        Enum('SUPER_ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'HR_MANAGER', 'CANDIDATE', 'EMPLOYEE', name='user_role_enum'),
        nullable=False
    )
    avatar_url = Column(Text, nullable=True)
    designation = Column(String(150), nullable=True)
    status = Column(Enum('ACTIVE', 'INACTIVE', 'SUSPENDED', name='user_status_enum'), nullable=False, default='ACTIVE')
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    company = relationship("Company", back_populates="users")

    __table_args__ = (
        Index('idx_user_company_role', 'company_id', 'role'),
        Index('idx_user_email_status', 'email', 'status'),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    company_name = Column(String(255), nullable=True)
    actor_id = Column(String(64), nullable=False)
    actor_name = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    resource = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=False)
    severity = Column(Enum('INFO', 'WARNING', 'CRITICAL', name='audit_severity_enum'), nullable=False, default='INFO')
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationship
    company = relationship("Company", back_populates="audit_logs")

    __table_args__ = (
        Index('idx_audit_company_date', 'company_id', 'created_at'),
        Index('idx_audit_severity', 'severity'),
        Index('idx_audit_action', 'action'),
    )
