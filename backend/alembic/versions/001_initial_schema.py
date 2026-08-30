"""initial_enterprise_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-28 10:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Companies
    op.create_table(
        'companies',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False, unique=True),
        sa.Column('domain', sa.String(255), nullable=False, unique=True),
        sa.Column('logo_url', sa.Text(), nullable=True),
        sa.Column('plan_tier', sa.Enum('STARTER', 'GROWTH', 'ENTERPRISE_ROBOTICS', name='company_plan_enum'), nullable=False, server_default='GROWTH'),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'TRIAL', 'SUSPENDED', name='company_status_enum'), nullable=False, server_default='ACTIVE'),
        sa.Column('max_jobs', sa.Integer(), nullable=False, server_default='20'),
        sa.Column('max_candidates_per_month', sa.Integer(), nullable=False, server_default='500'),
        sa.Column('max_employees', sa.Integer(), nullable=False, server_default='1000'),
        sa.Column('contact_email', sa.String(255), nullable=False),
        sa.Column('contact_person', sa.String(255), nullable=False),
        sa.Column('industry', sa.String(150), nullable=False),
        sa.Column('ai_custom_rules_enabled', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('recording_storage_used_mb', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('recording_storage_quota_mb', sa.Integer(), nullable=False, server_default='10000'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_company_status', 'companies', ['status'])
    op.create_index('idx_company_domain', 'companies', ['domain'])

    # 2. Jobs
    op.create_table(
        'jobs',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('company_id', sa.String(64), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('department', sa.String(150), nullable=False),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('job_type', sa.Enum('FULL_TIME', 'CONTRACT', 'REMOTE', 'HYBRID', name='job_type_enum'), nullable=False, server_default='FULL_TIME'),
        sa.Column('experience_level', sa.Enum('ENTRY', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL', name='exp_level_enum'), nullable=False, server_default='SENIOR'),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('required_skills', sa.JSON(), nullable=False),
        sa.Column('status', sa.Enum('OPEN', 'CLOSED', 'DRAFT', name='job_status_enum'), nullable=False, server_default='OPEN'),
        sa.Column('total_applicants', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_jobs_company_status', 'jobs', ['company_id', 'status'])

    # 3. Candidates
    op.create_table(
        'candidates',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('company_id', sa.String(64), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('job_id', sa.String(64), sa.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('current_title', sa.String(150), nullable=True),
        sa.Column('years_of_experience', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.Enum('INVITED', 'IN_PROGRESS', 'EVALUATED', 'SHORTLISTED', 'REJECTED', 'HIRED', name='candidate_status_enum'), nullable=False, server_default='INVITED'),
        sa.Column('interview_token', sa.String(128), nullable=False, unique=True),
        sa.Column('resume_file_url', sa.Text(), nullable=True),
        sa.Column('applied_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_candidates_company_job', 'candidates', ['company_id', 'job_id'])
    op.create_index('idx_candidates_status', 'candidates', ['status'])
    op.create_index('idx_candidates_token', 'candidates', ['interview_token'])

def downgrade() -> None:
    op.drop_table('candidates')
    op.drop_table('jobs')
    op.drop_table('companies')
