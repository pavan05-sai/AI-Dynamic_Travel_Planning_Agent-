import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List
from fastapi import Request
from app.core.config import settings
from app.core.errors import RateLimitError


class InMemoryRateLimiter:
    def __init__(self):
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str, max_requests: int, window_seconds: int = 60):
        now = time.time()
        with self._lock:
            timestamps = self._requests[key]
            # Prune old timestamps
            self._requests[key] = [t for t in timestamps if now - t < window_seconds]
            if len(self._requests[key]) >= max_requests:
                raise RateLimitError(
                    message=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds}s.",
                    details={"limit": max_requests, "window_seconds": window_seconds}
                )
            self._requests[key].append(now)


rate_limiter = InMemoryRateLimiter()


def check_rate_limit(request: Request, limit: int = 60, window: int = 60, key_prefix: str = "general"):
    client_ip = request.client.host if request.client else "unknown"
    auth_header = request.headers.get("authorization", "")
    key = f"{key_prefix}:{auth_header if auth_header else client_ip}"
    rate_limiter.check(key, max_requests=limit, window_seconds=window)


def check_llm_rate_limit(request: Request):
    check_rate_limit(request, limit=settings.LLM_RATE_LIMIT_PER_MINUTE, window=60, key_prefix="llm")
