"""
Ardhnarishwar SaaS - Cryptographic JWT Authentication & Anti-Spoofing Guard
Zero Trust Architecture:
- Client-supplied X-Actor-* headers are NEVER trusted for authorization.
- Identity, Role, and Tenant (Company ID) are strictly extracted from HMAC-SHA256 verified JWTs and server-side database records.
- Any conflicting X-Actor headers sent by the client are detected and rejected with HTTP 403.
"""

import jwt
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from ..models import User, AuditLog

security_bearer = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"

def create_access_token(
    user_id: str,
    role: str,
    company_id: Optional[str] = None,
    expires_minutes: int = 60
) -> str:
    """
    Creates a cryptographically signed HMAC-SHA256 JWT access token.
    """
    now = int(time.time())
    payload = {
        "sub": user_id,
        "role": role,
        "company_id": company_id,
        "iat": now,
        "exp": now + (expires_minutes * 60),
        "iss": "ardhnarishwar-saas-auth-engine"
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_and_verify_token(token: str) -> Dict[str, Any]:
    """
    Cryptographically verifies signature, expiration, and issuer.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
            issuer="ardhnarishwar-saas-auth-engine"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or forged cryptographic authentication token."
        )


class AuthenticatedIdentity:
    def __init__(self, user_id: str, role: str, company_id: Optional[str], email: str, name: str):
        self.id = user_id
        self.role = role
        self.company_id = company_id
        self.email = email
        self.name = name

    def __repr__(self):
        return f"<AuthenticatedIdentity id={self.id} role={self.role} company_id={self.company_id}>"


def get_current_user(
    request: Request,
    auth_creds: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> AuthenticatedIdentity:
    """
    MANDATORY ZERO-TRUST AUTHENTICATION DEPENDENCY:
    1. Extracts Bearer token from 'Authorization' header.
    2. Validates cryptographic HMAC signature.
    3. Re-verifies user existence and active status in database.
    4. Anti-Spoofing: If the client attempts to pass 'X-Actor-Role' or 'X-Actor-Company-Id'
       that contradicts the JWT, the request is IMMEDIATELY BLOCKED.
    """
    # 1. Require JWT
    if not auth_creds or not auth_creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided. Bearer JWT required."
        )

    token = auth_creds.credentials
    payload = decode_and_verify_token(token)

    user_id = payload.get("sub")
    jwt_role = payload.get("role")
    jwt_company_id = payload.get("company_id")

    if not user_id or not jwt_role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims: Missing user identity or role."
        )

    # 2. Verify against server-side database record
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account no longer exists in database."
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.status}. Access denied."
        )

    # Database is the single source of truth
    verified_role = user.role
    verified_company_id = user.company_id

    # 3. ANTI-SPOOFING HEADER ATTACK DEFENSE
    client_spoofed_role = request.headers.get("x-actor-role")
    client_spoofed_company = request.headers.get("x-actor-company-id")

    if client_spoofed_role and client_spoofed_role != verified_role:
        print(f"[SECURITY ALERT] Header Role Spoofing Attempt: Client {user_id} sent '{client_spoofed_role}' but JWT is '{verified_role}'")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Security Violation: Client-supplied X-Actor-Role '{client_spoofed_role}' contradicts verified token '{verified_role}'."
        )

    if client_spoofed_company and client_spoofed_company != verified_company_id and verified_role != "SUPER_ADMIN":
        print(f"[SECURITY ALERT] Header Tenant Spoofing Attempt: Client {user_id} sent '{client_spoofed_company}' but JWT belongs to '{verified_company_id}'")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Security Violation: Client-supplied X-Actor-Company-Id '{client_spoofed_company}' contradicts verified tenant '{verified_company_id}'."
        )

    return AuthenticatedIdentity(
        user_id=user.id,
        role=verified_role,
        company_id=verified_company_id,
        email=user.email,
        name=user.name
    )


def require_super_admin(
    current_user: AuthenticatedIdentity = Depends(get_current_user)
) -> AuthenticatedIdentity:
    """
    Restricts access ONLY to verified Super Admins.
    """
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Super Admin privileges are required to perform this action."
        )
    return current_user


def require_company_admin(
    current_user: AuthenticatedIdentity = Depends(get_current_user)
) -> AuthenticatedIdentity:
    """
    Restricts access to Super Admin or Company Admin.
    """
    if current_user.role not in ("SUPER_ADMIN", "COMPANY_ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Company Admin privileges required."
        )
    return current_user


def require_recruiter_or_admin(
    current_user: AuthenticatedIdentity = Depends(get_current_user)
) -> AuthenticatedIdentity:
    """
    Restricts access to Super Admin, Company Admin, or Recruiter / HR Manager.
    """
    if current_user.role not in ("SUPER_ADMIN", "COMPANY_ADMIN", "RECRUITER", "HR_MANAGER"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Recruiter or Company Admin privileges required."
        )
    return current_user


def require_staff_or_admin(
    current_user: AuthenticatedIdentity = Depends(get_current_user)
) -> AuthenticatedIdentity:
    """
    Restricts access to Staff (Employee), Recruiters, or Admins.
    """
    if current_user.role not in ("SUPER_ADMIN", "COMPANY_ADMIN", "RECRUITER", "HR_MANAGER", "EMPLOYEE"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Staff or Admin privileges required."
        )
    return current_user


def require_candidate(
    current_user: AuthenticatedIdentity = Depends(get_current_user)
) -> AuthenticatedIdentity:
    """
    Ensures candidate identity is authenticated.
    """
    if current_user.role not in ("CANDIDATE", "SUPER_ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Candidate privileges required."
        )
    return current_user


def verify_tenant_isolation(
    current_user: AuthenticatedIdentity,
    target_company_id: Optional[str]
):
    """
    Enforces strict multi-tenant boundary.
    Super Admins can access all tenants; Company Admins and Staff can only access their own company.
    """
    if current_user.role == "SUPER_ADMIN":
        return

    if not target_company_id or current_user.company_id != target_company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Tenant Isolation Policy prevents cross-organization resource access."
        )
