"""
Ardhnarishwar SaaS - Active Sliding Window Rate Limiter
Enforces active rate limiting per client IP on sensitive endpoints (e.g. login, impersonation, video streaming).
Designed with a pluggable adapter interface ready for Redis in distributed clusters.
"""
import time
from typing import Dict, List
from fastapi import Request, HTTPException, status
from .config import settings

class InMemoryRateLimiter:
    def __init__(self):
        # Maps "client_ip:endpoint" -> list of request timestamps
        self._requests: Dict[str, List[float]] = {}

    def is_allowed(self, client_ip: str, endpoint: str, max_requests: int, window_seconds: int = 60) -> bool:
        now = time.time()
        key = f"{client_ip}:{endpoint}"
        window_start = now - window_seconds

        # Get existing timestamps and filter expired ones
        timestamps = self._requests.get(key, [])
        valid_timestamps = [ts for ts in timestamps if ts > window_start]

        if len(valid_timestamps) >= max_requests:
            self._requests[key] = valid_timestamps
            return False

        valid_timestamps.append(now)
        self._requests[key] = valid_timestamps
        return True

rate_limiter = InMemoryRateLimiter()

def enforce_login_rate_limit(request: Request):
    """
    Dependency enforcing rate limits on login/auth endpoints.
    """
    client_ip = request.client.host if request.client else "unknown_ip"
    limit = settings.RATE_LIMIT_LOGIN_PER_MINUTE

    if not rate_limiter.is_allowed(client_ip, "auth_login", max_requests=limit, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too Many Requests: Rate limit exceeded ({limit} req/min). Please try again later.",
            headers={"Retry-After": "60"}
        )

def enforce_api_rate_limit(request: Request):
    """
    Dependency enforcing general API rate limits.
    """
    client_ip = request.client.host if request.client else "unknown_ip"
    limit = settings.RATE_LIMIT_API_PER_MINUTE

    if not rate_limiter.is_allowed(client_ip, "api_general", max_requests=limit, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too Many Requests: Rate limit exceeded ({limit} req/min).",
            headers={"Retry-After": "60"}
        )
