-- ==============================================================================
-- ARDHNARISHWAR GLOBAL MULTI-TENANT ENTERPRISE SAAS DATABASE SCHEMA
-- Target Engine: MySQL 8.0+ / MariaDB 10.5+
-- Products: 1. AI Interview SaaS | 2. Smart Enterprise Attendance SaaS
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP SCHEMA IF EXISTS ardhnarishwar_saas;
CREATE SCHEMA ardhnarishwar_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ardhnarishwar_saas;
SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- 1. CORE PLATFORM & MULTI-TENANT INFRASTRUCTURE
-- ==============================================================================

-- Companies / Tenants Table
CREATE TABLE companies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    plan_tier ENUM('STARTER', 'GROWTH', 'ENTERPRISE_ROBOTICS') NOT NULL DEFAULT 'GROWTH',
    status ENUM('ACTIVE', 'INACTIVE', 'TRIAL', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    max_jobs INT UNSIGNED NOT NULL DEFAULT 20,
    max_candidates_per_month INT UNSIGNED NOT NULL DEFAULT 500,
    max_employees INT UNSIGNED NOT NULL DEFAULT 1000,
    contact_email VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    industry VARCHAR(150) NOT NULL,
    ai_custom_rules_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    recording_storage_used_mb INT UNSIGNED NOT NULL DEFAULT 0,
    recording_storage_quota_mb INT UNSIGNED NOT NULL DEFAULT 10000,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_company_status (status),
    INDEX idx_company_domain (domain)
) ENGINE=InnoDB;

-- Subscriptions Table
CREATE TABLE subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    plan_tier ENUM('STARTER', 'GROWTH', 'ENTERPRISE_ROBOTICS') NOT NULL,
    billing_cycle ENUM('MONTHLY', 'ANNUAL') NOT NULL DEFAULT 'MONTHLY',
    price_per_month DECIMAL(10, 2) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status ENUM('ACTIVE', 'PAST_DUE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    payment_method VARCHAR(50) DEFAULT 'STRIPE_INVOICE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_sub_company_status (company_id, status)
) ENGINE=InnoDB;

-- Global Platform Users Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NULL, -- NULL indicates Ardhnarishwar Super Admin
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'HR_MANAGER', 'CANDIDATE', 'EMPLOYEE') NOT NULL,
    avatar_url TEXT,
    designation VARCHAR(150),
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_user_company_role (company_id, role),
    INDEX idx_user_email_status (email, status)
) ENGINE=InnoDB;

-- Audit Logs Table (Immutable Security & Compliance Trail)
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NULL,
    company_name VARCHAR(255),
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) NOT NULL,
    severity ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'INFO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_audit_company_date (company_id, created_at),
    INDEX idx_audit_severity (severity),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB;

-- ==============================================================================
-- 2. PROJECT 1: AI ROBOTICS INTERVIEW SAAS MODULE
-- ==============================================================================

-- Job Positions Table
CREATE TABLE jobs (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(150) NOT NULL,
    location VARCHAR(255) NOT NULL,
    job_type ENUM('FULL_TIME', 'CONTRACT', 'REMOTE', 'HYBRID') NOT NULL DEFAULT 'FULL_TIME',
    experience_level ENUM('ENTRY', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL') NOT NULL DEFAULT 'SENIOR',
    skill_category ENUM('SKILLED', 'UNSKILLED', 'SEMI_SKILLED') NOT NULL DEFAULT 'SKILLED',
    description TEXT NOT NULL,
    required_skills JSON NOT NULL, -- Array of required skills
    status ENUM('OPEN', 'CLOSED', 'DRAFT') NOT NULL DEFAULT 'OPEN',
    total_applicants INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_jobs_company_status (company_id, status)
) ENGINE=InnoDB;

-- Interview Stages / Rounds Table
CREATE TABLE interview_rounds (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    job_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    round_number INT UNSIGNED NOT NULL DEFAULT 1,
    round_type ENUM('AI_SCREENING', 'TECHNICAL_ROBOTICS', 'SOFTWARE_SYSTEMS', 'PRACTICAL_OPERATIONS', 'GENERAL_APTITUDE', 'HR_BEHAVIORAL', 'LEADERSHIP_PROBLEM_SOLVING') NOT NULL,
    time_limit_minutes INT UNSIGNED NOT NULL DEFAULT 20,
    passing_score DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
    allow_retake BOOLEAN NOT NULL DEFAULT FALSE,
    proctoring_strictness ENUM('STANDARD', 'STRICT', 'MILITARY_GRADE') NOT NULL DEFAULT 'MILITARY_GRADE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    INDEX idx_rounds_job (job_id)
) ENGINE=InnoDB;

-- Question Bank & Curated AI Datasets
CREATE TABLE question_banks (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NULL, -- NULL indicates global bank maintained by Super Admin
    category ENUM('TECHNICAL', 'HR', 'BEHAVIORAL', 'PROBLEM_SOLVING', 'PRACTICAL_SAFETY', 'OPERATIONAL_WORKFLOW', 'ROBOTICS_HARDWARE', 'CONTROL_SYSTEMS', 'EMBEDDED_C_CPP') NOT NULL,
    role_category VARCHAR(150) NOT NULL,
    target_skill_level ENUM('SKILLED', 'UNSKILLED', 'ALL') NOT NULL DEFAULT 'ALL',
    difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    expected_duration_sec INT UNSIGNED NOT NULL DEFAULT 120,
    ideal_benchmark_answer TEXT NOT NULL,
    key_concepts JSON NOT NULL,     -- Array of required technical concepts
    anti_patterns JSON NOT NULL,    -- Array of penalized misconceptions
    rubric_weights JSON NOT NULL,   -- Relevance, Technical, Comm, ProblemSolving, Confidence weights
    is_global BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_qb_category (category),
    INDEX idx_qb_role (role_category)
) ENGINE=InnoDB;

-- Round Questions Mapping (Many-to-Many)
CREATE TABLE round_questions (
    round_id VARCHAR(64) NOT NULL,
    question_id VARCHAR(64) NOT NULL,
    sequence_order INT UNSIGNED NOT NULL DEFAULT 1,
    PRIMARY KEY (round_id, question_id),
    FOREIGN KEY (round_id) REFERENCES interview_rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question_banks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Candidates Table
CREATE TABLE candidates (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    job_id VARCHAR(64) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    skill_category ENUM('SKILLED', 'UNSKILLED', 'SEMI_SKILLED') NOT NULL DEFAULT 'SKILLED',
    current_title VARCHAR(150),
    years_of_experience INT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('INVITED', 'IN_PROGRESS', 'EVALUATED', 'SHORTLISTED', 'REJECTED', 'HIRED') NOT NULL DEFAULT 'INVITED',
    interview_token VARCHAR(128) NOT NULL UNIQUE,
    resume_file_url TEXT,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    INDEX idx_candidates_company_job (company_id, job_id),
    INDEX idx_candidates_status (status),
    INDEX idx_candidates_token (interview_token)
) ENGINE=InnoDB;

-- Resumes Table
CREATE TABLE resumes (
    id VARCHAR(64) PRIMARY KEY,
    candidate_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INT UNSIGNED NOT NULL DEFAULT 0,
    file_type VARCHAR(100) NOT NULL,
    status ENUM('PENDING', 'PARSED', 'VERIFIED', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    parsed_text TEXT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_resumes_candidate (candidate_id),
    INDEX idx_resumes_company (company_id),
    INDEX idx_resumes_status (status)
) ENGINE=InnoDB;

-- Interview Sessions Table
CREATE TABLE interview_sessions (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    candidate_id VARCHAR(64) NOT NULL,
    job_id VARCHAR(64) NOT NULL,
    round_id VARCHAR(64) NOT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    status ENUM('SCHEDULED', 'RECORDING', 'ANALYZING', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'SCHEDULED',
    overall_score DECIMAL(5, 2) NULL,
    recommendation ENUM('STRONG_HIRE', 'HIRE', 'LEANING_HIRE', 'LEANING_NO_HIRE', 'STRONG_NO_HIRE') NULL,
    video_storage_path TEXT NULL,
    audio_storage_path TEXT NULL,
    system_diagnostics JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (round_id) REFERENCES interview_rounds(id) ON DELETE CASCADE,
    INDEX idx_sessions_company_status (company_id, status)
) ENGINE=InnoDB;

-- Candidate Question-by-Question Answers Table
CREATE TABLE candidate_answers (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    question_id VARCHAR(64) NOT NULL,
    video_timestamp_start INT UNSIGNED NOT NULL DEFAULT 0,
    video_timestamp_end INT UNSIGNED NOT NULL DEFAULT 0,
    transcript TEXT NOT NULL,
    duration_sec INT UNSIGNED NOT NULL DEFAULT 0,
    score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    feedback TEXT NOT NULL,
    relevance_score DECIMAL(5, 2) NOT NULL,
    technical_score DECIMAL(5, 2) NOT NULL,
    communication_score DECIMAL(5, 2) NOT NULL,
    problem_solving_score DECIMAL(5, 2) NOT NULL,
    confidence_score DECIMAL(5, 2) NOT NULL,
    role_competency_score DECIMAL(5, 2) NOT NULL,
    identified_concepts JSON NOT NULL,
    missing_concepts JSON NOT NULL,
    filler_word_count INT UNSIGNED NOT NULL DEFAULT 0,
    wpm INT UNSIGNED NOT NULL DEFAULT 0,
    speech_hesitation_ratio DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question_banks(id) ON DELETE CASCADE,
    INDEX idx_answers_session (session_id)
) ENGINE=InnoDB;

-- AI Evaluation Reports Table
CREATE TABLE ai_evaluation_reports (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    candidate_id VARCHAR(64) NOT NULL,
    overall_score DECIMAL(5, 2) NOT NULL,
    recommendation ENUM('STRONG_HIRE', 'HIRE', 'LEANING_HIRE', 'LEANING_NO_HIRE', 'STRONG_NO_HIRE') NOT NULL,
    relevance_avg DECIMAL(5, 2) NOT NULL,
    technical_avg DECIMAL(5, 2) NOT NULL,
    communication_avg DECIMAL(5, 2) NOT NULL,
    problem_solving_avg DECIMAL(5, 2) NOT NULL,
    confidence_avg DECIMAL(5, 2) NOT NULL,
    role_competency_avg DECIMAL(5, 2) NOT NULL,
    strengths JSON NOT NULL,
    weaknesses JSON NOT NULL,
    red_flags JSON NOT NULL,
    executive_summary TEXT NOT NULL,
    star_analysis JSON NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================================================================
-- 3. PROJECT 2: SMART ENTERPRISE ATTENDANCE SAAS MODULE
-- ==============================================================================

-- Departments Table
CREATE TABLE departments (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    head_user_id VARCHAR(64) NULL,
    total_employees INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (head_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_dept_company_code (company_id, code),
    INDEX idx_dept_company (company_id)
) ENGINE=InnoDB;

-- Work Locations & Geofencing Parameters Table
CREATE TABLE locations (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    geofence_radius_meters INT UNSIGNED NOT NULL DEFAULT 150,
    authorized_wifi_ssids JSON NOT NULL,
    authorized_ip_ranges JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_loc_company (company_id)
) ENGINE=InnoDB;

-- Shifts & Work Hours Table
CREATE TABLE shifts (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    name VARCHAR(150) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_minutes INT UNSIGNED NOT NULL DEFAULT 15,
    half_day_threshold_hours DECIMAL(4, 2) NOT NULL DEFAULT 4.5,
    full_day_threshold_hours DECIMAL(4, 2) NOT NULL DEFAULT 8.0,
    is_flexible BOOLEAN NOT NULL DEFAULT FALSE,
    is_overnight BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_shift_company (company_id)
) ENGINE=InnoDB;

-- Employees Directory Table
CREATE TABLE employees (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NULL,
    department_id VARCHAR(64) NOT NULL,
    location_id VARCHAR(64) NOT NULL,
    shift_id VARCHAR(64) NOT NULL,
    employee_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    designation VARCHAR(150) NOT NULL,
    face_template_hash VARCHAR(255) NULL,
    joining_date DATE NOT NULL,
    status ENUM('ACTIVE', 'PROBATION', 'ON_LEAVE', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_emp_company_code (company_id, employee_code),
    INDEX idx_emp_company_dept (company_id, department_id),
    INDEX idx_emp_status (status)
) ENGINE=InnoDB;

-- Attendance Records Table
CREATE TABLE attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    employee_id VARCHAR(64) NOT NULL,
    department_id VARCHAR(64) NOT NULL,
    shift_id VARCHAR(64) NOT NULL,
    attendance_date DATE NOT NULL,
    punch_in_time TIMESTAMP NOT NULL,
    punch_in_method ENUM('CAMERA_FACIAL', 'GEOFENCE_WIFI', 'DYNAMIC_OTP', 'MANUAL_ADMIN') NOT NULL,
    punch_in_location_id VARCHAR(64) NOT NULL,
    punch_in_lat DECIMAL(10, 8) NULL,
    punch_in_lng DECIMAL(11, 8) NULL,
    punch_in_device_info VARCHAR(255) NULL,
    punch_out_time TIMESTAMP NULL,
    punch_out_method ENUM('CAMERA_FACIAL', 'GEOFENCE_WIFI', 'DYNAMIC_OTP', 'MANUAL_ADMIN') NULL,
    punch_out_lat DECIMAL(10, 8) NULL,
    punch_out_lng DECIMAL(11, 8) NULL,
    total_work_minutes INT UNSIGNED NULL DEFAULT 0,
    status ENUM('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_DUTY') NOT NULL DEFAULT 'PRESENT',
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    late_by_minutes INT UNSIGNED NOT NULL DEFAULT 0,
    is_early_leaving BOOLEAN NOT NULL DEFAULT FALSE,
    early_by_minutes INT UNSIGNED NOT NULL DEFAULT 0,
    overtime_minutes INT UNSIGNED NOT NULL DEFAULT 0,
    verified_snapshot_url TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_emp_attendance_day (employee_id, attendance_date),
    INDEX idx_att_company_date (company_id, attendance_date),
    INDEX idx_att_status (status)
) ENGINE=InnoDB;

-- Dynamic Rotating OTP Table
CREATE TABLE dynamic_otps (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    location_id VARCHAR(64) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    INDEX idx_otp_lookup (company_id, location_id, otp_code, expires_at)
) ENGINE=InnoDB;

-- ==============================================================================
-- 4. ROOT INITIALIZATION (Zero Mock Data)
-- ==============================================================================

-- Super Admin Organization
INSERT INTO companies (id, name, slug, domain, plan_tier, status, max_jobs, max_candidates_per_month, max_employees, contact_email, contact_person, industry, ai_custom_rules_enabled)
VALUES ('comp_ardhnarishwar', 'Ardhnarishwar HQ Global', 'ardhnarishwar', 'ardhnarishwar.ai', 'ENTERPRISE_ROBOTICS', 'ACTIVE', 999, 50000, 10000, 'hq@ardhnarishwar.ai', 'Platform Executive Director', 'Enterprise AI & SaaS Platforms', TRUE);

-- Primary Super Administrator Account
INSERT INTO users (id, company_id, email, password_hash, name, role, designation, status)
VALUES
('usr_super_admin', 'comp_ardhnarishwar', 'admin@ardhnarishwar.ai', 'pbkdf2:sha256:100000$c6543b593e8a4bb896894c25f46ef5ce$786720f4c2813158c56c221cfb77626359eaaeae427189a695191836dbf14fc2', 'Ardhnarishwar Super Admin', 'SUPER_ADMIN', 'Global Platform Architect', 'ACTIVE');

